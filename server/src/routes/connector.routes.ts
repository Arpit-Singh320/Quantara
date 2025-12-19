/**
 * Connector Routes - OAuth integrations for external services
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { config } from '../config/index.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Supported connector types
type ConnectorType = 'salesforce' | 'microsoft' | 'google' | 'hubspot';

// Token store for OAuth tokens (in production, encrypt and store in DB)
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
}
const tokenStore: Map<string, TokenData> = new Map();

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

  // Check if tokens actually exist (not just connection record)
  const hasGoogleTokens = tokenStore.has(`${userId}-google`);
  const hasSalesforceTokens = tokenStore.has(`${userId}-salesforce`);
  const hasMicrosoftTokens = tokenStore.has(`${userId}-microsoft`);
  const hasHubspotTokens = tokenStore.has(`${userId}-hubspot`);

  const connectorStatus = {
    salesforce: {
      name: 'Salesforce',
      description: 'CRM data, accounts, opportunities',
      connected: hasSalesforceTokens,
      configured: !!config.salesforceClientId,
    },
    microsoft: {
      name: 'Microsoft 365',
      description: 'Outlook email, calendar, contacts',
      connected: hasMicrosoftTokens,
      configured: !!config.microsoftClientId,
    },
    google: {
      name: 'Google Workspace',
      description: 'Gmail, Google Calendar, Drive',
      connected: hasGoogleTokens,
      configured: !!config.googleClientId,
    },
    hubspot: {
      name: 'HubSpot',
      description: 'CRM, marketing, sales data',
      connected: hasHubspotTokens,
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
      // Include user ID in state parameter so callback can associate tokens with the user
      const userId = req.user?.id || '';
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${config.googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20email%20profile%20https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent&state=${encodeURIComponent(userId)}`;
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

// GET /api/connectors/google/callback - OAuth callback for Google
router.get('/google/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      res.redirect(`${config.corsOrigin}/integrations?error=no_code`);
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: config.googleClientId || '',
        client_secret: config.googleClientSecret || '',
        redirect_uri: `${config.apiUrl}/api/connectors/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Google token exchange failed:', error);
      res.redirect(`${config.corsOrigin}/integrations?error=token_exchange_failed`);
      return;
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };

    // Store tokens (using state as userId)
    const callbackUserId = (state as string) || '';

    if (!callbackUserId) {
      console.error('Google OAuth callback: No user ID in state parameter');
      res.redirect(`${config.corsOrigin}/integrations?error=no_user_state`);
      return;
    }

    const tokenKey = `${callbackUserId}-google`;

    console.log(`[Google OAuth] Storing tokens for user: ${callbackUserId}, key: ${tokenKey}`);

    tokenStore.set(tokenKey, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    });

    // Mark as connected
    connections.set(tokenKey, {
      userId: callbackUserId,
      type: 'google',
      connected: true,
      lastSync: new Date().toISOString(),
    });

    console.log(`[Google OAuth] Token stored successfully. TokenStore has key: ${tokenStore.has(tokenKey)}`);

    // Redirect to calendar page with success
    res.redirect(`${config.corsOrigin}/calendar?connected=google`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${config.corsOrigin}/integrations?error=callback_failed`);
  }
});

// GET /api/connectors/google/calendar/events - Fetch Google Calendar events
router.get('/google/calendar/events', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const tokenKey = `${userId}-google`;
    const tokens = tokenStore.get(tokenKey);

    console.log(`[Google Calendar] Fetching events for user: ${userId}, tokenKey: ${tokenKey}`);
    console.log(`[Google Calendar] TokenStore keys: ${Array.from(tokenStore.keys()).join(', ')}`);
    console.log(`[Google Calendar] Token exists: ${!!tokens}`);

    if (!tokens) {
      next(createError('Google not connected. Please connect your Google account first.', 401));
      return;
    }

    // Check if token is expired and refresh if needed
    if (tokens.expiresAt && tokens.expiresAt < new Date() && tokens.refreshToken) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: tokens.refreshToken,
          client_id: config.googleClientId || '',
          client_secret: config.googleClientSecret || '',
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json() as { access_token: string; expires_in: number };
        tokens.accessToken = newTokens.access_token;
        tokens.expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
        tokenStore.set(tokenKey, tokens);
      }
    }

    // Get date range from query params
    const { timeMin, timeMax } = req.query;
    const now = new Date();
    const defaultTimeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultTimeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    // Fetch events from Google Calendar API
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent((timeMin as string) || defaultTimeMin)}&` +
      `timeMax=${encodeURIComponent((timeMax as string) || defaultTimeMax)}&` +
      `singleEvents=true&orderBy=startTime&maxResults=100`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error('Google Calendar API error:', error);
      next(createError('Failed to fetch calendar events', 500));
      return;
    }

    const calendarData = await calendarResponse.json() as {
      items?: any[];
      nextPageToken?: string;
    };

    // Transform events to our format with full details
    const events = (calendarData.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      attendees: (event.attendees || []).map((a: any) => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: a.responseStatus,
        organizer: a.organizer || false,
      })),
      htmlLink: event.htmlLink,
      meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri,
      status: event.status,
      creator: event.creator?.email,
      organizer: event.organizer?.email,
      isAllDay: !event.start?.dateTime,
      colorId: event.colorId,
      recurringEventId: event.recurringEventId,
      source: 'google',
    }));

    res.json({
      events,
      nextPageToken: calendarData.nextPageToken,
      source: 'Google Calendar',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/connectors/google/calendar/events - Create event in Google Calendar
router.post('/google/calendar/events', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const tokenKey = `${userId}-google`;
    const tokens = tokenStore.get(tokenKey);

    if (!tokens) {
      next(createError('Google not connected', 401));
      return;
    }

    const { title, description, start, end, location, attendees } = req.body;

    if (!title || !start) {
      next(createError('Title and start time are required', 400));
      return;
    }

    const { addGoogleMeet } = req.body;

    // Create event in Google Calendar with optional Google Meet
    const eventData: any = {
      summary: title,
      description: description || '',
      location: location || '',
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: end ? new Date(end).toISOString() : new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendees ? attendees.map((email: string) => ({ email })) : [],
    };

    // Add Google Meet conference if requested
    if (addGoogleMeet) {
      eventData.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const apiUrl = addGoogleMeet
      ? 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1'
      : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create Google Calendar event:', error);
      next(createError('Failed to create event', 500));
      return;
    }

    const createdEvent = await response.json() as {
      id: string;
      summary: string;
      start?: { dateTime?: string };
      end?: { dateTime?: string };
      htmlLink?: string;
      hangoutLink?: string;
      conferenceData?: {
        entryPoints?: Array<{ uri: string; entryPointType: string }>;
      };
    };

    res.json({
      success: true,
      event: {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: createdEvent.start?.dateTime,
        end: createdEvent.end?.dateTime,
        htmlLink: createdEvent.htmlLink,
        meetLink: createdEvent.hangoutLink || createdEvent.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get tokens for a user
export function getGoogleTokens(userId: string): TokenData | undefined {
  return tokenStore.get(`${userId}-google`);
}

export default router;
