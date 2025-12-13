/**
 * Connector Routes - OAuth integrations for external services
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { config } from '../config/index.js';

const router = Router();

// Supported connector types
type ConnectorType = 'salesforce' | 'microsoft' | 'google' | 'hubspot';

// In-memory connection store (replace with database in production)
const connections: Map<string, { userId: string; type: ConnectorType; connected: boolean; lastSync?: string }> = new Map();

// Validation schemas
const connectSchema = z.object({
  type: z.enum(['salesforce', 'microsoft', 'google', 'hubspot']),
  authCode: z.string().optional(),
});

// GET /api/connectors
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  const userConnections = Array.from(connections.values())
    .filter(c => c.userId === userId);

  const connectorStatus = {
    salesforce: {
      name: 'Salesforce',
      description: 'CRM data, accounts, opportunities',
      connected: userConnections.some(c => c.type === 'salesforce' && c.connected),
      configured: !!config.salesforceClientId,
    },
    microsoft: {
      name: 'Microsoft 365',
      description: 'Outlook email, calendar, contacts',
      connected: userConnections.some(c => c.type === 'microsoft' && c.connected),
      configured: !!config.microsoftClientId,
    },
    google: {
      name: 'Google Workspace',
      description: 'Gmail, Google Calendar, Drive',
      connected: userConnections.some(c => c.type === 'google' && c.connected),
      configured: !!config.googleClientId,
    },
    hubspot: {
      name: 'HubSpot',
      description: 'CRM, marketing, sales data',
      connected: userConnections.some(c => c.type === 'hubspot' && c.connected),
      configured: !!config.hubspotClientId,
    },
  };

  res.json({ connectors: connectorStatus });
});

// GET /api/connectors/:type/auth-url
router.get('/:type/auth-url', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const type = req.params.type as ConnectorType;
  const redirectUri = `${config.apiUrl}/api/connectors/${type}/callback`;

  let authUrl: string;

  switch (type) {
    case 'salesforce':
      if (!config.salesforceClientId) {
        next(createError('Salesforce not configured', 500));
        return;
      }
      authUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${config.salesforceClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api%20refresh_token`;
      break;

    case 'microsoft':
      if (!config.microsoftClientId) {
        next(createError('Microsoft not configured', 500));
        return;
      }
      authUrl = `https://login.microsoftonline.com/${config.microsoftTenantId || 'common'}/oauth2/v2.0/authorize?response_type=code&client_id=${config.microsoftClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email%20Mail.Read%20Calendars.Read%20offline_access`;
      break;

    case 'google':
      if (!config.googleClientId) {
        next(createError('Google not configured', 500));
        return;
      }
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${config.googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/calendar.readonly&access_type=offline`;
      break;

    case 'hubspot':
      if (!config.hubspotClientId) {
        next(createError('HubSpot not configured', 500));
        return;
      }
      authUrl = `https://app.hubspot.com/oauth/authorize?response_type=code&client_id=${config.hubspotClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=crm.objects.contacts.read%20crm.objects.companies.read`;
      break;

    default:
      next(createError('Invalid connector type', 400));
      return;
  }

  res.json({ authUrl });
});

// POST /api/connectors/:type/connect
router.post('/:type/connect', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const type = req.params.type as ConnectorType;
    const data = connectSchema.parse({ ...req.body, type });
    const userId = req.user?.id;

    if (!userId) {
      next(createError('User not authenticated', 401));
      return;
    }

    // In production, exchange authCode for tokens here
    // For now, simulate a successful connection
    const connectionId = `${userId}-${type}`;
    connections.set(connectionId, {
      userId,
      type: data.type,
      connected: true,
      lastSync: new Date().toISOString(),
    });

    res.json({
      message: `${type} connected successfully`,
      connected: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
});

// DELETE /api/connectors/:type
router.delete('/:type', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const type = req.params.type as ConnectorType;
  const userId = req.user?.id;

  if (!userId) {
    next(createError('User not authenticated', 401));
    return;
  }

  const connectionId = `${userId}-${type}`;
  const connection = connections.get(connectionId);

  if (!connection) {
    next(createError('Connection not found', 404));
    return;
  }

  connections.delete(connectionId);

  res.json({
    message: `${type} disconnected successfully`,
    connected: false,
  });
});

// POST /api/connectors/:type/sync
router.post('/:type/sync', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const type = req.params.type as ConnectorType;
  const userId = req.user?.id;

  if (!userId) {
    next(createError('User not authenticated', 401));
    return;
  }

  const connectionId = `${userId}-${type}`;
  const connection = connections.get(connectionId);

  if (!connection || !connection.connected) {
    next(createError('Connector not connected', 400));
    return;
  }

  // Simulate sync
  connection.lastSync = new Date().toISOString();
  connections.set(connectionId, connection);

  res.json({
    message: `${type} sync completed`,
    lastSync: connection.lastSync,
  });
});

export default router;
