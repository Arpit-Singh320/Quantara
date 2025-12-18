/**
 * Calendar Events Routes
 * CRUD operations for calendar events
 */

import { Router, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['MEETING', 'CALL', 'RENEWAL', 'DEADLINE']).default('MEETING'),
  date: z.string(), // ISO date string
  time: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm format
  duration: z.number().min(0).max(480).default(60),
  location: z.string().optional(),
  clientId: z.string().optional(),
  renewalId: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

// GET /api/calendar/events - Get all events for user
router.get('/events', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    const { start, end, clientId } = req.query;

    const where: any = { userId };

    // Filter by date range if provided
    if (start || end) {
      where.date = {};
      if (start) where.date.gte = new Date(start as string);
      if (end) where.date.lte = new Date(end as string);
    }

    // Filter by client if provided
    if (clientId) {
      where.clientId = clientId;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        renewal: {
          select: { id: true, status: true },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    // Transform to frontend format
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type.toLowerCase(),
      date: event.date.toISOString().split('T')[0],
      time: event.time,
      duration: event.duration,
      location: event.location,
      client: event.client?.company || event.client?.name || '',
      clientId: event.clientId,
      renewalId: event.renewalId,
    }));

    res.json({ events: transformedEvents });
  } catch (error) {
    next(error);
  }
});

// GET /api/calendar/events/:id - Get single event
router.get('/events/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    const event = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, userId },
      include: {
        client: true,
        renewal: true,
      },
    });

    if (!event) {
      return next(createError('Event not found', 404));
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// POST /api/calendar/events - Create new event
router.post('/events', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    const data = createEventSchema.parse(req.body);

    // Verify client exists if provided
    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: data.clientId, userId },
      });
      if (!client) {
        return next(createError('Client not found', 404));
      }
    }

    // Verify renewal exists if provided
    if (data.renewalId) {
      const renewal = await prisma.renewal.findFirst({
        where: { id: data.renewalId, userId },
      });
      if (!renewal) {
        return next(createError('Renewal not found', 404));
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        type: data.type as any,
        date: new Date(data.date),
        time: data.time,
        duration: data.duration,
        location: data.location,
        clientId: data.clientId,
        renewalId: data.renewalId,
      },
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
      },
    });

    res.status(201).json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type.toLowerCase(),
        date: event.date.toISOString().split('T')[0],
        time: event.time,
        duration: event.duration,
        location: event.location,
        client: event.client?.company || event.client?.name || '',
        clientId: event.clientId,
        renewalId: event.renewalId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
});

// PUT /api/calendar/events/:id - Update event
router.put('/events/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    const data = updateEventSchema.parse(req.body);

    // Verify event exists and belongs to user
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      return next(createError('Event not found', 404));
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.time !== undefined) updateData.time = data.time;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.renewalId !== undefined) updateData.renewalId = data.renewalId;

    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
      },
    });

    res.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type.toLowerCase(),
        date: event.date.toISOString().split('T')[0],
        time: event.time,
        duration: event.duration,
        location: event.location,
        client: event.client?.company || event.client?.name || '',
        clientId: event.clientId,
        renewalId: event.renewalId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
});

// DELETE /api/calendar/events/:id - Delete event
router.delete('/events/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createError('Unauthorized', 401));
    }

    // Verify event exists and belongs to user
    const existing = await prisma.calendarEvent.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      return next(createError('Event not found', 404));
    }

    await prisma.calendarEvent.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
