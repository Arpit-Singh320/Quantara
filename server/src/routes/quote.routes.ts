/**
 * Quote Management Routes
 * Handles quote creation, comparison, and selection
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/quotes - Get all quotes for user's renewals
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { renewalId, status, carrier } = req.query;

    const quotes = await prisma.quote.findMany({
      where: {
        renewal: { userId },
        ...(renewalId && { renewalId: renewalId as string }),
        ...(status && { status: status as any }),
        ...(carrier && { carrier: { contains: carrier as string, mode: 'insensitive' } }),
      },
      include: {
        renewal: {
          include: {
            client: { select: { name: true, company: true } },
            policy: { select: { type: true, policyNumber: true, premium: true, carrier: true } },
          },
        },
        documents: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });

    res.json({ quotes });
  } catch (error) {
    next(error);
  }
});

// GET /api/quotes/renewal/:renewalId - Get quotes for a specific renewal (for comparison)
router.get('/renewal/:renewalId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { renewalId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Verify renewal belongs to user
    const renewal = await prisma.renewal.findFirst({
      where: { id: renewalId, userId },
      include: {
        policy: true,
        client: true,
      },
    });

    if (!renewal) {
      next(createError('Renewal not found', 404));
      return;
    }

    const quotes = await prisma.quote.findMany({
      where: { renewalId },
      include: {
        documents: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: [
        { isSelected: 'desc' },
        { premium: 'asc' },
      ],
    });

    // Calculate comparison metrics
    const expiringPremium = Number(renewal.policy.premium);
    const quotesWithMetrics = quotes.map(q => {
      const premium = Number(q.premium);
      const priceChange = expiringPremium > 0
        ? ((premium - expiringPremium) / expiringPremium) * 100
        : 0;

      return {
        ...q,
        premium,
        coverageLimit: Number(q.coverageLimit),
        deductible: q.deductible ? Number(q.deductible) : null,
        perOccurrence: q.perOccurrence ? Number(q.perOccurrence) : null,
        aggregate: q.aggregate ? Number(q.aggregate) : null,
        calculatedPriceChange: priceChange,
      };
    });

    // Summary statistics
    const summary = {
      totalQuotes: quotes.length,
      lowestPremium: quotes.length > 0 ? Math.min(...quotes.map(q => Number(q.premium))) : null,
      highestPremium: quotes.length > 0 ? Math.max(...quotes.map(q => Number(q.premium))) : null,
      averagePremium: quotes.length > 0
        ? quotes.reduce((sum, q) => sum + Number(q.premium), 0) / quotes.length
        : null,
      expiringPremium,
      selectedQuote: quotes.find(q => q.isSelected)?.id || null,
    };

    res.json({
      renewal: {
        id: renewal.id,
        clientName: renewal.client.company,
        policyType: renewal.policy.type,
        policyNumber: renewal.policy.policyNumber,
        currentCarrier: renewal.policy.carrier,
        expiringPremium,
        dueDate: renewal.dueDate,
      },
      quotes: quotesWithMetrics,
      summary,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/quotes/:quoteId - Get a specific quote
router.get('/:quoteId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { quoteId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, renewal: { userId } },
      include: {
        renewal: {
          include: {
            client: true,
            policy: true,
          },
        },
        documents: true,
      },
    });

    if (!quote) {
      next(createError('Quote not found', 404));
      return;
    }

    res.json({ quote });
  } catch (error) {
    next(error);
  }
});

// POST /api/quotes - Create a new quote
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const {
      renewalId,
      carrier,
      premium,
      coverageLimit,
      deductible,
      perOccurrence,
      aggregate,
      coinsurance,
      waitingPeriod,
      retroactiveDate,
      coverages,
      exclusions,
      endorsements,
      terms,
      notes,
      expiresAt,
    } = req.body;

    if (!renewalId || !carrier || !premium || !coverageLimit) {
      next(createError('renewalId, carrier, premium, and coverageLimit are required', 400));
      return;
    }

    // Verify renewal belongs to user
    const renewal = await prisma.renewal.findFirst({
      where: { id: renewalId, userId },
      include: { policy: true },
    });

    if (!renewal) {
      next(createError('Renewal not found', 404));
      return;
    }

    // Calculate price change from expiring policy
    const expiringPremium = Number(renewal.policy.premium);
    const newPremium = Number(premium);
    const priceChange = expiringPremium > 0
      ? ((newPremium - expiringPremium) / expiringPremium) * 100
      : null;

    const quote = await prisma.quote.create({
      data: {
        renewalId,
        carrier,
        premium,
        coverageLimit,
        deductible,
        perOccurrence,
        aggregate,
        coinsurance,
        waitingPeriod,
        retroactiveDate: retroactiveDate ? new Date(retroactiveDate) : null,
        coverages,
        exclusions: exclusions || [],
        endorsements: endorsements || [],
        priceChange,
        terms,
        notes,
        status: 'RECEIVED',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Update renewal metrics
    await prisma.renewal.update({
      where: { id: renewalId },
      data: {
        quotesReceived: { increment: 1 },
        status: 'QUOTED',
        lastTouchedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        clientId: renewal.clientId,
        renewalId,
        type: 'QUOTE_RECEIVED',
        title: 'Quote Received',
        description: `Received quote from ${carrier} for $${Number(premium).toLocaleString()}`,
        metadata: { quoteId: quote.id, carrier, premium },
      },
    });

    res.status(201).json({ quote });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/quotes/:quoteId - Update a quote
router.patch('/:quoteId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { quoteId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.quote.findFirst({
      where: { id: quoteId, renewal: { userId } },
    });

    if (!existing) {
      next(createError('Quote not found', 404));
      return;
    }

    const {
      carrier,
      premium,
      coverageLimit,
      deductible,
      perOccurrence,
      aggregate,
      coinsurance,
      waitingPeriod,
      retroactiveDate,
      coverages,
      exclusions,
      endorsements,
      coverageScore,
      recommendation,
      terms,
      notes,
      status,
      expiresAt,
    } = req.body;

    const quote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        ...(carrier !== undefined && { carrier }),
        ...(premium !== undefined && { premium }),
        ...(coverageLimit !== undefined && { coverageLimit }),
        ...(deductible !== undefined && { deductible }),
        ...(perOccurrence !== undefined && { perOccurrence }),
        ...(aggregate !== undefined && { aggregate }),
        ...(coinsurance !== undefined && { coinsurance }),
        ...(waitingPeriod !== undefined && { waitingPeriod }),
        ...(retroactiveDate !== undefined && { retroactiveDate: retroactiveDate ? new Date(retroactiveDate) : null }),
        ...(coverages !== undefined && { coverages }),
        ...(exclusions !== undefined && { exclusions }),
        ...(endorsements !== undefined && { endorsements }),
        ...(coverageScore !== undefined && { coverageScore }),
        ...(recommendation !== undefined && { recommendation }),
        ...(terms !== undefined && { terms }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });

    res.json({ quote });
  } catch (error) {
    next(error);
  }
});

// POST /api/quotes/:quoteId/select - Select a quote for binding
router.post('/:quoteId/select', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { quoteId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.quote.findFirst({
      where: { id: quoteId, renewal: { userId } },
      include: { renewal: true },
    });

    if (!existing) {
      next(createError('Quote not found', 404));
      return;
    }

    // Deselect all other quotes for this renewal
    await prisma.quote.updateMany({
      where: { renewalId: existing.renewalId },
      data: { isSelected: false, status: 'RECEIVED' },
    });

    // Select this quote
    const quote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        isSelected: true,
        status: 'SELECTED',
      },
    });

    // Update renewal status
    await prisma.renewal.update({
      where: { id: existing.renewalId },
      data: {
        status: 'QUOTED',
        lastTouchedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        clientId: existing.renewal.clientId,
        renewalId: existing.renewalId,
        type: 'STATUS_CHANGED',
        title: 'Quote Selected',
        description: `Selected ${existing.carrier} quote for $${Number(existing.premium).toLocaleString()}`,
        metadata: { quoteId, carrier: existing.carrier, premium: existing.premium },
      },
    });

    res.json({ quote, message: 'Quote selected successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/quotes/:quoteId - Delete a quote
router.delete('/:quoteId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { quoteId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.quote.findFirst({
      where: { id: quoteId, renewal: { userId } },
    });

    if (!existing) {
      next(createError('Quote not found', 404));
      return;
    }

    await prisma.quote.delete({
      where: { id: quoteId },
    });

    // Update renewal quote count
    await prisma.renewal.update({
      where: { id: existing.renewalId },
      data: { quotesReceived: { decrement: 1 } },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/quotes/compare - Compare multiple quotes side by side
router.post('/compare', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { quoteIds } = req.body;

    if (!Array.isArray(quoteIds) || quoteIds.length < 2) {
      next(createError('At least 2 quoteIds are required for comparison', 400));
      return;
    }

    const quotes = await prisma.quote.findMany({
      where: {
        id: { in: quoteIds },
        renewal: { userId },
      },
      include: {
        renewal: {
          include: {
            policy: true,
          },
        },
      },
    });

    if (quotes.length !== quoteIds.length) {
      next(createError('Some quotes not found or unauthorized', 404));
      return;
    }

    // Build comparison matrix
    const expiringPremium = Number(quotes[0].renewal.policy.premium);

    const comparison = {
      quotes: quotes.map(q => ({
        id: q.id,
        carrier: q.carrier,
        premium: Number(q.premium),
        priceChange: expiringPremium > 0
          ? ((Number(q.premium) - expiringPremium) / expiringPremium) * 100
          : null,
        coverageLimit: Number(q.coverageLimit),
        deductible: q.deductible ? Number(q.deductible) : null,
        perOccurrence: q.perOccurrence ? Number(q.perOccurrence) : null,
        aggregate: q.aggregate ? Number(q.aggregate) : null,
        coinsurance: q.coinsurance,
        exclusions: q.exclusions,
        endorsements: q.endorsements,
        coverageScore: q.coverageScore,
        recommendation: q.recommendation,
        isSelected: q.isSelected,
      })),
      expiringPolicy: {
        carrier: quotes[0].renewal.policy.carrier,
        premium: expiringPremium,
        coverageLimit: Number(quotes[0].renewal.policy.coverageLimit),
      },
      metrics: {
        lowestPremium: Math.min(...quotes.map(q => Number(q.premium))),
        highestPremium: Math.max(...quotes.map(q => Number(q.premium))),
        bestValue: quotes.reduce((best, q) =>
          Number(q.premium) < Number(best.premium) ? q : best
        ).id,
      },
    };

    res.json({ comparison });
  } catch (error) {
    next(error);
  }
});

export default router;
