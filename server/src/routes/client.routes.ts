/**
 * Client Routes
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/clients
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { search, industry, sortBy, order } = req.query;

    const where: any = { userId };

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (industry && typeof industry === 'string') {
      where.industry = industry;
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        policies: true,
        activities: { orderBy: { occurredAt: 'desc' }, take: 1 },
      },
      orderBy: sortBy === 'name'
        ? { name: order === 'desc' ? 'desc' : 'asc' }
        : sortBy === 'company'
        ? { company: order === 'desc' ? 'desc' : 'asc' }
        : { createdAt: 'desc' },
    });

    const transformed = clients.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      email: c.email || '',
      phone: c.phone || '',
      industry: c.industry || 'Other',
      totalPremium: c.policies.reduce((sum, p) => sum + Number(p.premium), 0),
      policyCount: c.policies.length,
      riskScore: 'MEDIUM',
      lastContact: c.activities[0]?.occurredAt?.toISOString() || c.updatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
    }));

    res.json({
      clients: transformed,
      total: transformed.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId },
      include: {
        policies: true,
        activities: { orderBy: { occurredAt: 'desc' }, take: 1 },
      },
    });

    if (!client) {
      next(createError('Client not found', 404));
      return;
    }

    res.json({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email || '',
      phone: client.phone || '',
      industry: client.industry || 'Other',
      address: client.address,
      totalPremium: client.policies.reduce((sum, p) => sum + Number(p.premium), 0),
      policyCount: client.policies.length,
      riskScore: 'MEDIUM',
      lastContact: client.activities[0]?.occurredAt?.toISOString() || client.updatedAt.toISOString(),
      createdAt: client.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:id/policies
router.get('/:id/policies', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const client = await prisma.client.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!client) {
      next(createError('Client not found', 404));
      return;
    }

    const policies = await prisma.policy.findMany({
      where: { clientId: client.id },
    });

    const transformed = policies.map(p => ({
      id: p.id,
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

    res.json({ policies: transformed });
  } catch (error) {
    next(error);
  }
});

// POST /api/clients - Create new client
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { name, company, email, phone, industry, address } = req.body;

    if (!name || !company) {
      next(createError('Name and company are required', 400));
      return;
    }

    const client = await prisma.client.create({
      data: {
        userId,
        name,
        company,
        email: email || null,
        phone: phone || null,
        industry: industry || null,
        address: address || null,
      },
    });

    res.status(201).json({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email || '',
      phone: client.phone || '',
      industry: client.industry || 'Other',
      totalPremium: 0,
      policyCount: 0,
      riskScore: 'MEDIUM',
      lastContact: client.createdAt.toISOString(),
      createdAt: client.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      next(createError('Client not found', 404));
      return;
    }

    const { name, company, email, phone, industry, address } = req.body;

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        name: name ?? existing.name,
        company: company ?? existing.company,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        industry: industry !== undefined ? industry : existing.industry,
        address: address !== undefined ? address : existing.address,
      },
      include: { policies: true },
    });

    res.json({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email || '',
      phone: client.phone || '',
      industry: client.industry || 'Other',
      totalPremium: client.policies.reduce((sum, p) => sum + Number(p.premium), 0),
      policyCount: client.policies.length,
      riskScore: 'MEDIUM',
      lastContact: client.updatedAt.toISOString(),
      createdAt: client.createdAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      next(createError('Client not found', 404));
      return;
    }

    await prisma.client.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
