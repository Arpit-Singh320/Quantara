/**
 * Policy Routes
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient, PolicyType, PolicyStatus } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/policies/expiring/list - Must be before /:id
router.get('/expiring/list', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const policies = await prisma.policy.findMany({
      where: {
        userId,
        expirationDate: { gte: now, lte: thirtyDaysFromNow },
        status: 'ACTIVE',
      },
      include: { client: true },
      orderBy: { expirationDate: 'asc' },
    });

    const transformed = policies.map(p => ({
      id: p.id,
      clientName: p.client.company,
      type: p.type,
      expirationDate: p.expirationDate.toISOString(),
    }));

    res.json({
      policies: transformed,
      count: transformed.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/policies
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { type, carrier, status, clientId } = req.query;

    const where: any = { userId };

    if (type && typeof type === 'string') {
      where.type = type.toUpperCase() as PolicyType;
    }

    if (carrier && typeof carrier === 'string') {
      where.carrier = carrier;
    }

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase() as PolicyStatus;
    }

    if (clientId && typeof clientId === 'string') {
      where.clientId = clientId;
    }

    const policies = await prisma.policy.findMany({
      where,
      include: { client: true },
      orderBy: { expirationDate: 'asc' },
    });

    const transformed = policies.map(p => ({
      id: p.id,
      clientId: p.clientId,
      clientName: p.client.company,
      type: p.type,
      carrier: p.carrier,
      policyNumber: p.policyNumber,
      premium: Number(p.premium),
      coverageLimit: Number(p.coverageLimit),
      deductible: Number(p.deductible || 0),
      status: p.status,
      effectiveDate: p.effectiveDate.toISOString(),
      expirationDate: p.expirationDate.toISOString(),
    }));

    const byType = transformed.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      policies: transformed,
      total: transformed.length,
      summary: {
        totalPremium: transformed.reduce((sum, p) => sum + p.premium, 0),
        totalCoverage: transformed.reduce((sum, p) => sum + p.coverageLimit, 0),
        byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/policies/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const policy = await prisma.policy.findFirst({
      where: { id: req.params.id, userId },
      include: { client: true },
    });

    if (!policy) {
      next(createError('Policy not found', 404));
      return;
    }

    res.json({
      id: policy.id,
      clientId: policy.clientId,
      clientName: policy.client.company,
      type: policy.type,
      carrier: policy.carrier,
      policyNumber: policy.policyNumber,
      premium: Number(policy.premium),
      coverageLimit: Number(policy.coverageLimit),
      deductible: Number(policy.deductible || 0),
      status: policy.status,
      effectiveDate: policy.effectiveDate.toISOString(),
      expirationDate: policy.expirationDate.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/policies - Create new policy
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { clientId, policyNumber, type, carrier, premium, coverageLimit, deductible, effectiveDate, expirationDate } = req.body;

    if (!clientId || !policyNumber || !type || !carrier || !premium || !coverageLimit || !effectiveDate || !expirationDate) {
      next(createError('Missing required fields', 400));
      return;
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      next(createError('Client not found', 404));
      return;
    }

    const policy = await prisma.policy.create({
      data: {
        userId,
        clientId,
        policyNumber,
        type: type.toUpperCase().replace(/\s+/g, '_') as PolicyType,
        carrier,
        premium,
        coverageLimit,
        deductible: deductible || 0,
        effectiveDate: new Date(effectiveDate),
        expirationDate: new Date(expirationDate),
        status: 'ACTIVE',
      },
      include: { client: true },
    });

    res.status(201).json({
      id: policy.id,
      clientId: policy.clientId,
      clientName: policy.client.company,
      type: policy.type,
      carrier: policy.carrier,
      policyNumber: policy.policyNumber,
      premium: Number(policy.premium),
      coverageLimit: Number(policy.coverageLimit),
      deductible: Number(policy.deductible || 0),
      status: policy.status,
      effectiveDate: policy.effectiveDate.toISOString(),
      expirationDate: policy.expirationDate.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/policies/:id - Update policy
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.policy.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      next(createError('Policy not found', 404));
      return;
    }

    const { carrier, premium, coverageLimit, deductible, effectiveDate, expirationDate, status } = req.body;

    const policy = await prisma.policy.update({
      where: { id: req.params.id },
      data: {
        carrier: carrier ?? existing.carrier,
        premium: premium ?? existing.premium,
        coverageLimit: coverageLimit ?? existing.coverageLimit,
        deductible: deductible !== undefined ? deductible : existing.deductible,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : existing.effectiveDate,
        expirationDate: expirationDate ? new Date(expirationDate) : existing.expirationDate,
        status: status ? status.toUpperCase() as PolicyStatus : existing.status,
      },
      include: { client: true },
    });

    res.json({
      id: policy.id,
      clientId: policy.clientId,
      clientName: policy.client.company,
      type: policy.type,
      carrier: policy.carrier,
      policyNumber: policy.policyNumber,
      premium: Number(policy.premium),
      coverageLimit: Number(policy.coverageLimit),
      deductible: Number(policy.deductible || 0),
      status: policy.status,
      effectiveDate: policy.effectiveDate.toISOString(),
      expirationDate: policy.expirationDate.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/policies/:id - Delete policy
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.policy.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      next(createError('Policy not found', 404));
      return;
    }

    await prisma.policy.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Policy deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
