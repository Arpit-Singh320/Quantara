/**
 * Renewal Routes
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();

// Mock renewal data (replace with database queries in production)
const mockRenewals = [
  {
    id: 'r1',
    clientId: 'c1',
    clientName: 'Acme Corp',
    policyType: 'General Liability',
    carrier: 'Hartford',
    premium: 45000,
    expirationDate: '2024-02-15',
    daysUntilRenewal: 12,
    riskScore: 'high',
    status: 'pending',
  },
  {
    id: 'r2',
    clientId: 'c2',
    clientName: 'TechStart Inc',
    policyType: 'Cyber Liability',
    carrier: 'Chubb',
    premium: 28000,
    expirationDate: '2024-02-28',
    daysUntilRenewal: 25,
    riskScore: 'medium',
    status: 'in_progress',
  },
  {
    id: 'r3',
    clientId: 'c3',
    clientName: 'BuildRight LLC',
    policyType: 'Workers Compensation',
    carrier: 'Travelers',
    premium: 62000,
    expirationDate: '2024-03-10',
    daysUntilRenewal: 36,
    riskScore: 'low',
    status: 'pending',
  },
];

// GET /api/renewals
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { status, riskScore, sortBy, order } = req.query;

  let filtered = [...mockRenewals];

  // Filter by status
  if (status && typeof status === 'string') {
    filtered = filtered.filter(r => r.status === status);
  }

  // Filter by risk score
  if (riskScore && typeof riskScore === 'string') {
    filtered = filtered.filter(r => r.riskScore === riskScore);
  }

  // Sort
  if (sortBy && typeof sortBy === 'string') {
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }

  res.json({
    renewals: filtered,
    total: filtered.length,
    summary: {
      totalPremium: filtered.reduce((sum, r) => sum + r.premium, 0),
      highRisk: filtered.filter(r => r.riskScore === 'high').length,
      mediumRisk: filtered.filter(r => r.riskScore === 'medium').length,
      lowRisk: filtered.filter(r => r.riskScore === 'low').length,
    },
  });
});

// GET /api/renewals/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const renewal = mockRenewals.find(r => r.id === req.params.id);

  if (!renewal) {
    next(createError('Renewal not found', 404));
    return;
  }

  res.json(renewal);
});

// GET /api/renewals/upcoming
router.get('/upcoming/list', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const upcoming = mockRenewals
    .filter(r => r.daysUntilRenewal <= 30)
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);

  res.json({
    renewals: upcoming,
    count: upcoming.length,
  });
});

// GET /api/renewals/at-risk
router.get('/at-risk/list', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const atRisk = mockRenewals.filter(r => r.riskScore === 'high');

  res.json({
    renewals: atRisk,
    count: atRisk.length,
  });
});

export default router;
