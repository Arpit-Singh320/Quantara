/**
 * Client Routes
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();

// Mock client data
const mockClients = [
  {
    id: 'c1',
    name: 'John Smith',
    company: 'Acme Corp',
    email: 'john@acmecorp.com',
    phone: '(555) 123-4567',
    industry: 'Manufacturing',
    totalPremium: 125000,
    policyCount: 4,
    riskScore: 'medium',
    lastContact: '2024-01-28',
  },
  {
    id: 'c2',
    name: 'Sarah Johnson',
    company: 'TechStart Inc',
    email: 'sarah@techstart.io',
    phone: '(555) 234-5678',
    industry: 'Technology',
    totalPremium: 85000,
    policyCount: 3,
    riskScore: 'low',
    lastContact: '2024-01-30',
  },
  {
    id: 'c3',
    name: 'Mike Davis',
    company: 'BuildRight LLC',
    email: 'mike@buildright.com',
    phone: '(555) 345-6789',
    industry: 'Construction',
    totalPremium: 210000,
    policyCount: 6,
    riskScore: 'high',
    lastContact: '2024-01-15',
  },
];

// GET /api/clients
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { search, industry, sortBy, order } = req.query;

  let filtered = [...mockClients];

  // Search
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.company.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower)
    );
  }

  // Filter by industry
  if (industry && typeof industry === 'string') {
    filtered = filtered.filter(c => c.industry === industry);
  }

  // Sort
  if (sortBy && typeof sortBy === 'string') {
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return order === 'desc' ? bVal - aVal : aVal - bVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return 0;
    });
  }

  res.json({
    clients: filtered,
    total: filtered.length,
  });
});

// GET /api/clients/:id
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const client = mockClients.find(c => c.id === req.params.id);

  if (!client) {
    next(createError('Client not found', 404));
    return;
  }

  res.json(client);
});

// GET /api/clients/:id/policies
router.get('/:id/policies', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const client = mockClients.find(c => c.id === req.params.id);

  if (!client) {
    next(createError('Client not found', 404));
    return;
  }

  // Mock policies for this client
  const policies = [
    {
      id: 'p1',
      type: 'General Liability',
      carrier: 'Hartford',
      premium: 45000,
      status: 'active',
      expirationDate: '2024-02-15',
    },
    {
      id: 'p2',
      type: 'Property',
      carrier: 'Travelers',
      premium: 32000,
      status: 'active',
      expirationDate: '2024-06-30',
    },
  ];

  res.json({ policies });
});

export default router;
