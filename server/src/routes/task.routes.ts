/**
 * Task/Workflow Routes
 * Manages renewal tasks, checklists, and workflow automation
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { PrismaClient } from '@prisma/client';
import { createRenewalsForExpiringPolicies, updateOverdueTasks, getEscalations, seedTaskTemplates } from '../jobs/renewal.job.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/tasks - Get all tasks for the user's renewals
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { renewalId, status, priority } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        renewal: { userId },
        ...(renewalId && { renewalId: renewalId as string }),
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
      },
      include: {
        renewal: {
          include: {
            client: { select: { name: true, company: true } },
            policy: { select: { type: true, policyNumber: true } },
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { order: 'asc' },
      ],
    });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/renewal/:renewalId - Get tasks for a specific renewal
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
    });

    if (!renewal) {
      next(createError('Renewal not found', 404));
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { renewalId },
      orderBy: [{ order: 'asc' }, { dueDate: 'asc' }],
    });

    // Calculate progress
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = tasks.filter(t => t.status === 'OVERDUE').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;

    res.json({
      tasks,
      progress: {
        total,
        completed,
        overdue,
        inProgress,
        pending: total - completed - overdue - inProgress,
        percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Create a new task
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { renewalId, name, description, dueDate, priority, category } = req.body;

    if (!renewalId || !name || !dueDate) {
      next(createError('renewalId, name, and dueDate are required', 400));
      return;
    }

    // Verify renewal belongs to user
    const renewal = await prisma.renewal.findFirst({
      where: { id: renewalId, userId },
    });

    if (!renewal) {
      next(createError('Renewal not found', 404));
      return;
    }

    // Get the highest order for this renewal
    const maxOrder = await prisma.task.aggregate({
      where: { renewalId },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        renewalId,
        name,
        description,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        category: category || 'OTHER',
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:taskId - Update a task
router.patch('/:taskId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Verify task belongs to user's renewal
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, renewal: { userId } },
    });

    if (!existingTask) {
      next(createError('Task not found', 404));
      return;
    }

    const { name, description, dueDate, status, priority, category, assignedToId } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    // If marking as completed, set completedAt and completedById
    if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.completedById = userId;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    // Update renewal's lastTouchedAt
    await prisma.renewal.update({
      where: { id: existingTask.renewalId },
      data: { lastTouchedAt: new Date() },
    });

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:taskId - Delete a task
router.delete('/:taskId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Verify task belongs to user's renewal
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, renewal: { userId } },
    });

    if (!existingTask) {
      next(createError('Task not found', 404));
      return;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/reorder - Reorder tasks
router.post('/reorder', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { renewalId, taskIds } = req.body;

    if (!renewalId || !Array.isArray(taskIds)) {
      next(createError('renewalId and taskIds array are required', 400));
      return;
    }

    // Verify renewal belongs to user
    const renewal = await prisma.renewal.findFirst({
      where: { id: renewalId, userId },
    });

    if (!renewal) {
      next(createError('Renewal not found', 404));
      return;
    }

    // Update order for each task
    await Promise.all(
      taskIds.map((taskId: string, index: number) =>
        prisma.task.update({
          where: { id: taskId },
          data: { order: index },
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/run-renewal-job - Manually trigger renewal creation job
router.post('/run-renewal-job', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { daysAhead = 90 } = req.body;

    const result = await createRenewalsForExpiringPolicies(daysAhead);

    // Also update overdue tasks
    const overdueCount = await updateOverdueTasks();

    res.json({
      success: true,
      renewalsCreated: result.created,
      renewalsSkipped: result.skipped,
      tasksMarkedOverdue: overdueCount,
      errors: result.errors,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/escalations - Get renewals that need attention
router.get('/escalations', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const escalations = await getEscalations();

    // Filter to only user's renewals
    const userEscalations = escalations.filter(async e => {
      const renewal = await prisma.renewal.findFirst({
        where: { id: e.renewalId, userId },
      });
      return renewal !== null;
    });

    res.json({ escalations: userEscalations });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/templates - Get task templates
router.get('/templates', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { policyType } = req.query;

    const templates = await prisma.taskTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { userId: null }, // System templates
          { userId }, // User's custom templates
        ],
        ...(policyType && { policyType: policyType as any }),
      },
      orderBy: { order: 'asc' },
    });

    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/templates - Create a custom task template
router.post('/templates', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { name, description, policyType, daysBeforeDue, priority, category, order } = req.body;

    if (!name || daysBeforeDue === undefined) {
      next(createError('name and daysBeforeDue are required', 400));
      return;
    }

    const template = await prisma.taskTemplate.create({
      data: {
        userId,
        name,
        description,
        policyType,
        daysBeforeDue,
        priority: priority || 'MEDIUM',
        category: category || 'OTHER',
        order: order || 0,
      },
    });

    res.status(201).json({ template });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks/seed-templates - Seed default templates
router.post('/seed-templates', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await seedTaskTemplates();
    res.json({ success: true, message: 'Task templates seeded' });
  } catch (error) {
    next(error);
  }
});

export default router;
