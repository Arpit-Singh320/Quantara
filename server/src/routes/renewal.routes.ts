/**
 * Renewal Routes
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient, RiskLevel, RenewalStatus } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Helper to calculate days until renewal
function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// GET /api/renewals
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { status, riskScore, sortBy, order } = req.query;

    const where: any = { userId };

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase() as RenewalStatus;
    }

    if (riskScore && typeof riskScore === 'string') {
      where.riskScore = riskScore.toUpperCase() as RiskLevel;
    }

    const renewals = await prisma.renewal.findMany({
      where,
      include: {
        client: true,
        policy: true,
      },
      orderBy: sortBy === 'dueDate'
        ? { dueDate: order === 'desc' ? 'desc' : 'asc' }
        : sortBy === 'premium'
        ? { policy: { premium: order === 'desc' ? 'desc' : 'asc' } }
        : { dueDate: 'asc' },
    });

    const transformed = renewals.map(r => ({
      id: r.id,
      clientId: r.clientId,
      clientName: r.client.name,
      clientCompany: r.client.company,
      policyId: r.policyId,
      policyType: r.policy.type,
      policyNumber: r.policy.policyNumber,
      carrier: r.policy.carrier,
      premium: Number(r.policy.premium),
      coverageLimit: Number(r.policy.coverageLimit),
      expirationDate: r.dueDate.toISOString(),
      daysUntilRenewal: getDaysUntil(r.dueDate),
      riskScore: r.riskScore,
      riskFactors: r.riskFactors,
      aiSummary: r.aiSummary,
      aiInsights: r.aiInsights,
      status: r.status,
      lastTouchedAt: r.lastTouchedAt?.toISOString(),
      emailsSent: r.emailsSent,
      quotesReceived: r.quotesReceived,
    }));

    const summary = {
      totalPremium: transformed.reduce((sum, r) => sum + r.premium, 0),
      highRisk: transformed.filter(r => r.riskScore === 'HIGH').length,
      mediumRisk: transformed.filter(r => r.riskScore === 'MEDIUM').length,
      lowRisk: transformed.filter(r => r.riskScore === 'LOW').length,
    };

    res.json({
      renewals: transformed,
      total: transformed.length,
      summary,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/renewals/upcoming/list - Must be before /:id
router.get('/upcoming/list', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const renewals = await prisma.renewal.findMany({
      where: {
        userId,
        dueDate: { lte: thirtyDaysFromNow },
        status: { notIn: ['BOUND', 'LOST', 'CANCELLED'] },
      },
      include: { client: true, policy: true },
      orderBy: { dueDate: 'asc' },
    });

    const transformed = renewals.map(r => ({
      id: r.id,
      clientName: r.client.name,
      policyType: r.policy.type,
      daysUntilRenewal: getDaysUntil(r.dueDate),
      riskScore: r.riskScore,
    }));

    res.json({
      renewals: transformed,
      count: transformed.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/renewals/at-risk/list - Must be before /:id
router.get('/at-risk/list', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const renewals = await prisma.renewal.findMany({
      where: {
        userId,
        riskScore: 'HIGH',
        status: { notIn: ['BOUND', 'LOST', 'CANCELLED'] },
      },
      include: { client: true, policy: true },
      orderBy: { dueDate: 'asc' },
    });

    const transformed = renewals.map(r => ({
      id: r.id,
      clientName: r.client.name,
      policyType: r.policy.type,
      daysUntilRenewal: getDaysUntil(r.dueDate),
      riskScore: r.riskScore,
    }));

    res.json({
      renewals: transformed,
      count: transformed.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/renewals/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const renewal = await prisma.renewal.findFirst({
      where: { id: req.params.id, userId },
      include: { client: true, policy: true },
    });

    if (!renewal) {
      next(createError('Renewal not found', 404));
      return;
    }

    res.json({
      id: renewal.id,
      clientId: renewal.clientId,
      clientName: renewal.client.name,
      clientCompany: renewal.client.company,
      policyId: renewal.policyId,
      policyType: renewal.policy.type,
      policyNumber: renewal.policy.policyNumber,
      carrier: renewal.policy.carrier,
      premium: Number(renewal.policy.premium),
      coverageLimit: Number(renewal.policy.coverageLimit),
      expirationDate: renewal.dueDate.toISOString(),
      daysUntilRenewal: getDaysUntil(renewal.dueDate),
      riskScore: renewal.riskScore,
      riskFactors: renewal.riskFactors,
      aiSummary: renewal.aiSummary,
      aiInsights: renewal.aiInsights,
      status: renewal.status,
      lastTouchedAt: renewal.lastTouchedAt?.toISOString(),
      emailsSent: renewal.emailsSent,
      quotesReceived: renewal.quotesReceived,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/renewals - Create a renewal for a policy
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { policyId } = req.body;

    if (!policyId) {
      next(createError('Policy ID is required', 400));
      return;
    }

    // Verify policy belongs to user
    const policy = await prisma.policy.findFirst({
      where: { id: policyId, userId },
      include: { client: true },
    });

    if (!policy) {
      next(createError('Policy not found', 404));
      return;
    }

    // Check if renewal already exists for this policy
    const existingRenewal = await prisma.renewal.findFirst({
      where: { policyId, status: { in: ['PENDING', 'IN_PROGRESS', 'QUOTED'] } },
    });

    if (existingRenewal) {
      next(createError('An active renewal already exists for this policy', 400));
      return;
    }

    const renewal = await prisma.renewal.create({
      data: {
        userId,
        clientId: policy.clientId,
        policyId,
        dueDate: policy.expirationDate,
        status: 'PENDING',
        riskScore: 'MEDIUM',
        riskFactors: [],
        aiInsights: [],
      },
      include: { client: true, policy: true },
    });

    res.status(201).json({
      id: renewal.id,
      clientId: renewal.clientId,
      clientName: renewal.client.name,
      clientCompany: renewal.client.company,
      policyId: renewal.policyId,
      policyType: renewal.policy.type,
      policyNumber: renewal.policy.policyNumber,
      carrier: renewal.policy.carrier,
      premium: Number(renewal.policy.premium),
      expirationDate: renewal.dueDate.toISOString(),
      daysUntilRenewal: getDaysUntil(renewal.dueDate),
      riskScore: renewal.riskScore,
      status: renewal.status,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/renewals/:id - Update renewal status
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.renewal.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      next(createError('Renewal not found', 404));
      return;
    }

    const { status, riskScore } = req.body;

    const renewal = await prisma.renewal.update({
      where: { id: req.params.id },
      data: {
        status: status ? status.toUpperCase() as RenewalStatus : existing.status,
        riskScore: riskScore ? riskScore.toUpperCase() as RiskLevel : existing.riskScore,
        lastTouchedAt: new Date(),
        completedAt: status === 'BOUND' ? new Date() : existing.completedAt,
      },
      include: { client: true, policy: true },
    });

    res.json({
      id: renewal.id,
      clientName: renewal.client.name,
      policyType: renewal.policy.type,
      status: renewal.status,
      riskScore: renewal.riskScore,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/renewals/import-csv - Import renewals from CSV data
router.post('/import-csv', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { data } = req.body; // Array of CSV row objects

    if (!Array.isArray(data) || data.length === 0) {
      next(createError('No data provided', 400));
      return;
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const row of data) {
      try {
        // Find or create client
        let client = await prisma.client.findFirst({
          where: { userId, name: row.clientName || row.client_name },
        });

        if (!client) {
          client = await prisma.client.create({
            data: {
              userId,
              name: row.clientName || row.client_name || 'Unknown Client',
              company: row.company || row.clientName || row.client_name || 'Unknown Company',
              industry: row.industry || 'Other',
              email: row.email || row.client_email || '',
              phone: row.phone || '',
            },
          });
        }

        // Find or create policy
        let policy = await prisma.policy.findFirst({
          where: {
            clientId: client.id,
            type: row.policyType || row.policy_type || 'GENERAL_LIABILITY',
          },
        });

        if (!policy) {
          const expirationDate = row.expiryDate || row.expiry_date || row.expirationDate
            ? new Date(row.expiryDate || row.expiry_date || row.expirationDate)
            : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

          policy = await prisma.policy.create({
            data: {
              userId,
              clientId: client.id,
              type: row.policyType || row.policy_type || 'GENERAL_LIABILITY',
              carrier: row.carrier || 'Unknown Carrier',
              policyNumber: row.policyNumber || row.policy_number || `POL-${Date.now()}`,
              premium: parseFloat(row.premium) || 10000,
              coverageLimit: parseFloat(row.coverageLimit) || 1000000,
              effectiveDate: new Date(),
              expirationDate,
              status: 'ACTIVE',
            },
          });
        }

        // Check if renewal already exists
        const existingRenewal = await prisma.renewal.findFirst({
          where: { policyId: policy.id, status: { not: 'BOUND' } },
        });

        if (existingRenewal) {
          results.skipped++;
          continue;
        }

        // Determine risk score
        const premium = parseFloat(row.premium) || 10000;
        const daysUntil = getDaysUntil(policy.expirationDate);
        let riskScore: RiskLevel = 'LOW';
        if (premium > 100000 || daysUntil < 30) riskScore = 'HIGH';
        else if (premium > 50000 || daysUntil < 60) riskScore = 'MEDIUM';

        // Create renewal
        await prisma.renewal.create({
          data: {
            userId,
            clientId: client.id,
            policyId: policy.id,
            dueDate: policy.expirationDate,
            status: 'PENDING',
            riskScore,
            priority: riskScore === 'HIGH' ? 1 : riskScore === 'MEDIUM' ? 2 : 3,
          },
        });

        results.imported++;
      } catch (rowError: any) {
        results.errors.push(`Row ${results.imported + results.skipped + 1}: ${rowError.message}`);
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.imported} renewals, skipped ${results.skipped}`,
      results,
      sourceMetadata: {
        system: 'CSV Import',
        recordType: 'Bulk Import',
        recordId: `IMPORT-${Date.now()}`,
        importedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
