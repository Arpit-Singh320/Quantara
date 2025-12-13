/**
 * Policy Routes
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();

// Mock policy data
const mockPolicies = [
  {
    id: 'p1',
    clientId: 'c1',
    clientName: 'Acme Corp',
    type: 'General Liability',
    carrier: 'Hartford',
    policyNumber: 'GL-2024-001234',
    premium: 45000,
    coverageLimit: 2000000,
    deductible: 5000,
    status: 'active',
    effectiveDate: '2023-02-15',
    expirationDate: '2024-02-15',
  },
  {
    id: 'p2',
    clientId: 'c1',
    clientName: 'Acme Corp',
    type: 'Property',
    carrier: 'Travelers',
    policyNumber: 'PR-2024-005678',
    premium: 32000,
    coverageLimit: 5000000,
    deductible: 10000,
    status: 'active',
    effectiveDate: '2023-06-30',
    expirationDate: '2024-06-30',
  },
  {
    id: 'p3',
    clientId: 'c2',
    clientName: 'TechStart Inc',
    type: 'Cyber Liability',
    carrier: 'Chubb',
    policyNumber: 'CY-2024-009012',
    premium: 28000,
    coverageLimit: 3000000,
    deductible: 25000,
    status: 'active',
    effectiveDate: '2023-02-28',
    expirationDate: '2024-02-28',
  },
];

// GET /api/policies
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { type, carrier, status, clientId } = req.query;

  let filtered = [...mockPolicies];

  if (type && typeof type === 'string') {
    filtered = filtered.filter(p => p.type === type);
  }

  if (carrier && typeof carrier === 'string') {
    filtered = filtered.filter(p => p.carrier === carrier);
  }

  if (status && typeof status === 'string') {
    filtered = filtered.filter(p => p.status === status);
  }

  if (clientId && typeof clientId === 'string') {
    filtered = filtered.filter(p => p.clientId === clientId);
  }

  res.json({
    policies: filtered,
    total: filtered.length,
    summary: {
      totalPremium: filtered.reduce((sum, p) => sum + p.premium, 0),
      totalCoverage: filtered.reduce((sum, p) => sum + p.coverageLimit, 0),
      byType: Object.entries(
        filtered.reduce((acc, p) => {
          acc[p.type] = (acc[p.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, count]) => ({ type, count })),
    },
  });
});

// GET /api/policies/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const policy = mockPolicies.find(p => p.id === req.params.id);

  if (!policy) {
    next(createError('Policy not found', 404));
    return;
  }

  res.json(policy);
});

// GET /api/policies/expiring
router.get('/expiring/list', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiring = mockPolicies.filter(p => {
    const expDate = new Date(p.expirationDate);
    return expDate >= now && expDate <= thirtyDaysFromNow;
  });

  res.json({
    policies: expiring,
    count: expiring.length,
  });
});

export default router;
