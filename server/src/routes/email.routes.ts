/**
 * Email Routes
 * Handles email sending endpoints
 */

import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { sendRenewalReminder, sendCustomEmail, EMAIL_TEMPLATES } from '../services/email.service.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/email/templates - Get available email templates
router.get('/templates', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const templates = Object.entries(EMAIL_TEMPLATES).map(([key, template]) => ({
    id: template.id,
    name: template.name,
    key,
  }));

  res.json({ templates });
});

// POST /api/email/send-renewal-reminder - Send renewal reminder email
router.post('/send-renewal-reminder', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { renewalId } = req.body;

    if (!renewalId) {
      next(createError('Renewal ID is required', 400));
      return;
    }

    // Get renewal with client and policy details
    const renewal = await prisma.renewal.findFirst({
      where: { id: renewalId, userId },
      include: {
        client: true,
        policy: true,
      },
    });

    if (!renewal) {
      next(createError('Renewal not found', 404));
      return;
    }

    if (!renewal.client.email) {
      next(createError('Client does not have an email address', 400));
      return;
    }

    const result = await sendRenewalReminder({
      to: renewal.client.email,
      toName: renewal.client.name,
      clientName: renewal.client.name,
      policyType: renewal.policy.type,
      carrier: renewal.policy.carrier,
      policyNumber: renewal.policy.policyNumber,
      premium: `$${Number(renewal.policy.premium).toLocaleString()}`,
      coverageLimit: `$${Number(renewal.policy.coverageLimit).toLocaleString()}`,
      daysUntilRenewal: Math.ceil((renewal.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      expirationDate: renewal.dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    });

    if (result.success) {
      // Update renewal emailsSent count
      await prisma.renewal.update({
        where: { id: renewalId },
        data: {
          emailsSent: { increment: 1 },
          lastTouchedAt: new Date(),
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          clientId: renewal.clientId,
          renewalId: renewal.id,
          type: 'EMAIL_SENT',
          title: 'Renewal Reminder Sent',
          description: `Sent renewal reminder for ${renewal.policy.type} policy`,
          metadata: {
            policyId: renewal.policyId,
            messageId: result.messageId,
          },
        },
      });

      res.json({
        success: true,
        message: 'Renewal reminder sent successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send email',
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/email/send-custom - Send a custom email
router.post('/send-custom', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const { to, toName, subject, body, clientId } = req.body;

    if (!to || !subject || !body) {
      next(createError('to, subject, and body are required', 400));
      return;
    }

    const result = await sendCustomEmail({
      to,
      toName: toName || to,
      subject,
      body,
    });

    if (result.success) {
      // Log activity if clientId provided and client exists
      if (clientId) {
        try {
          // Verify client exists before creating activity
          const clientExists = await prisma.client.findUnique({
            where: { id: clientId },
            select: { id: true },
          });

          if (clientExists) {
            await prisma.activity.create({
              data: {
                clientId,
                type: 'EMAIL_SENT',
                title: 'Email Sent',
                description: `Sent email: ${subject}`,
                metadata: {
                  messageId: result.messageId,
                  subject,
                },
              },
            });
          }
        } catch (activityError) {
          // Log error but don't fail the request - email was already sent
          console.error('Failed to log email activity:', activityError);
        }
      }

      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send email',
      });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/email/generate - Generate email content with AI (placeholder for now)
router.post('/generate', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { context, tone, purpose } = req.body;

    // This is a placeholder - in production this would call the AI service
    const generatedContent = {
      subject: `Following up on your insurance renewal`,
      body: `Dear Client,\n\nI hope this email finds you well. I wanted to reach out regarding your upcoming policy renewal.\n\nPlease let me know if you have any questions or would like to discuss your coverage options.\n\nBest regards,\nYour Insurance Broker`,
    };

    res.json({
      success: true,
      content: generatedContent,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/email/schedule - Schedule an email for later
router.post('/schedule', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const {
      to,
      subject,
      body,
      scheduledFor,
      clientId,
      renewalId,
      templateId
    } = req.body;

    if (!to || !subject || !body || !scheduledFor) {
      next(createError('to, subject, body, and scheduledFor are required', 400));
      return;
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      next(createError('Scheduled time must be in the future', 400));
      return;
    }

    // Store scheduled email in database
    const scheduledEmail = await prisma.activity.create({
      data: {
        clientId,
        renewalId,
        type: 'EMAIL_SCHEDULED',
        title: `Scheduled: ${subject}`,
        description: `Email scheduled for ${scheduledDate.toLocaleString()}`,
        metadata: {
          to,
          subject,
          body,
          scheduledFor: scheduledDate.toISOString(),
          templateId,
          status: 'pending',
          createdBy: userId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Email scheduled successfully',
      scheduledEmail: {
        id: scheduledEmail.id,
        to,
        subject,
        scheduledFor: scheduledDate.toISOString(),
        status: 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/email/scheduled - Get all scheduled emails
router.get('/scheduled', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const scheduledEmails = await prisma.activity.findMany({
      where: {
        type: 'EMAIL_SCHEDULED',
      },
      orderBy: { createdAt: 'desc' },
    });

    const emails = scheduledEmails.map((email: any) => ({
      id: email.id,
      to: email.metadata?.to,
      subject: email.metadata?.subject,
      scheduledFor: email.metadata?.scheduledFor,
      status: email.metadata?.status || 'pending',
      clientId: email.clientId,
      renewalId: email.renewalId,
      createdAt: email.createdAt,
    }));

    res.json({ scheduledEmails: emails });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/email/scheduled/:id - Cancel a scheduled email
router.delete('/scheduled/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const scheduledEmail = await prisma.activity.findFirst({
      where: { id, type: 'EMAIL_SCHEDULED' },
    });

    if (!scheduledEmail) {
      next(createError('Scheduled email not found', 404));
      return;
    }

    // Update status to cancelled
    await prisma.activity.update({
      where: { id },
      data: {
        metadata: {
          ...(scheduledEmail.metadata as any),
          status: 'cancelled',
        },
      },
    });

    res.json({ success: true, message: 'Scheduled email cancelled' });
  } catch (error) {
    next(error);
  }
});

export default router;
