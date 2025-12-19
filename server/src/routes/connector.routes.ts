/**
 * Connector Routes - OAuth integrations for external services
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { config } from '../config/index.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Supported connector types
type ConnectorType = 'salesforce' | 'microsoft' | 'google' | 'hubspot';

// Token store for OAuth tokens - use database for persistence
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
  instanceUrl?: string; // For Salesforce
  userEmail?: string; // For Microsoft
}

// Database-backed token storage helpers
async function saveTokenToDb(userId: string, type: ConnectorType, tokenData: TokenData): Promise<void> {
  const connectionType = type.toUpperCase() as 'SALESFORCE' | 'MICROSOFT' | 'GOOGLE' | 'HUBSPOT';
  try {
    await prisma.connection.upsert({
      where: { userId_type: { userId, type: connectionType } },
      update: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || null,
        expiresAt: tokenData.expiresAt || null,
        scopes: tokenData.scope ? [tokenData.scope] : [],
        metadata: { instanceUrl: tokenData.instanceUrl, userEmail: tokenData.userEmail },
        status: 'ACTIVE',
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        type: connectionType,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || null,
        expiresAt: tokenData.expiresAt || null,
        scopes: tokenData.scope ? [tokenData.scope] : [],
        metadata: { instanceUrl: tokenData.instanceUrl, userEmail: tokenData.userEmail },
        status: 'ACTIVE',
      },
    });
    console.log(`[TokenDB] Saved ${type} token for user ${userId}`);
  } catch (error) {
    console.error(`[TokenDB] Failed to save ${type} token:`, error);
  }
}

async function getTokenFromDb(userId: string, type: ConnectorType): Promise<TokenData | null> {
  const connectionType = type.toUpperCase() as 'SALESFORCE' | 'MICROSOFT' | 'GOOGLE' | 'HUBSPOT';
  try {
    const connection = await prisma.connection.findUnique({
      where: { userId_type: { userId, type: connectionType } },
    });
    if (connection && connection.status === 'ACTIVE') {
      const metadata = connection.metadata as any;
      return {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken || undefined,
        expiresAt: connection.expiresAt || undefined,
        scope: connection.scopes?.join(' '),
        instanceUrl: metadata?.instanceUrl,
        userEmail: metadata?.userEmail,
      };
    }
    return null;
  } catch (error) {
    console.error(`[TokenDB] Failed to get ${type} token:`, error);
    return null;
  }
}

async function deleteTokenFromDb(userId: string, type: ConnectorType): Promise<void> {
  const connectionType = type.toUpperCase() as 'SALESFORCE' | 'MICROSOFT' | 'GOOGLE' | 'HUBSPOT';
  try {
    await prisma.connection.updateMany({
      where: { userId, type: connectionType },
      data: { status: 'REVOKED' },
    });
    console.log(`[TokenDB] Revoked ${type} token for user ${userId}`);
  } catch (error) {
    console.error(`[TokenDB] Failed to revoke ${type} token:`, error);
  }
}

async function isConnectedInDb(userId: string, type: ConnectorType): Promise<boolean> {
  const connectionType = type.toUpperCase() as 'SALESFORCE' | 'MICROSOFT' | 'GOOGLE' | 'HUBSPOT';
  try {
    const connection = await prisma.connection.findUnique({
      where: { userId_type: { userId, type: connectionType } },
    });
    return connection?.status === 'ACTIVE';
  } catch {
    return false;
  }
}

// In-memory stores for backward compatibility during transition
const tokenStore: Map<string, TokenData> = new Map();
const connections: Map<string, { userId: string; type: ConnectorType; connected: boolean; lastSync?: string }> = new Map();

// PKCE code verifier store (keyed by state/userId)
const pkceStore: Map<string, string> = new Map();

// Generate PKCE code verifier (43-128 characters)
function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Generate PKCE code challenge from verifier (SHA-256 + base64url)
function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// Validation schemas
const connectSchema = z.object({
  type: z.enum(['salesforce', 'microsoft', 'google', 'hubspot']),
  authCode: z.string().optional(),
});

// GET /api/connectors
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.json({ connectors: {} });
    return;
  }

  // Check if tokens exist in database (persistent storage)
  const [hasGoogleTokens, hasSalesforceTokens, hasMicrosoftTokens, hasHubspotTokens] = await Promise.all([
    isConnectedInDb(userId, 'google'),
    isConnectedInDb(userId, 'salesforce'),
    isConnectedInDb(userId, 'microsoft'),
    isConnectedInDb(userId, 'hubspot'),
  ]);

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
      // Include user ID in state parameter so callback can associate tokens with the user
      const sfUserId = req.user?.id || '';

      // Generate PKCE code verifier and challenge (required by Salesforce)
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // Store code verifier for later use in token exchange (keyed by user ID)
      pkceStore.set(sfUserId, codeVerifier);
      console.log(`[Salesforce Auth] Generated PKCE for user ${sfUserId}, challenge: ${codeChallenge.substring(0, 10)}...`);

      authUrl = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${config.salesforceClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=api%20refresh_token&state=${encodeURIComponent(sfUserId)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
      break;

    case 'microsoft':
      if (!config.microsoftClientId) {
        next(createError('Microsoft not configured', 500));
        return;
      }
      // Include user ID in state parameter so callback can associate tokens with the user
      const msUserId = req.user?.id || '';
      console.log(`[Microsoft Auth] Generating auth URL for user ${msUserId}`);
      authUrl = `https://login.microsoftonline.com/${config.microsoftTenantId || 'common'}/oauth2/v2.0/authorize?response_type=code&client_id=${config.microsoftClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email%20Mail.Read%20Mail.Send%20Calendars.Read%20Calendars.ReadWrite%20User.Read%20offline_access&state=${encodeURIComponent(msUserId)}&prompt=consent`;
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

  // Delete from all stores (idempotent - don't error if not found)
  connections.delete(connectionId);
  tokenStore.delete(connectionId);

  // Also delete from salesforce-specific store if applicable
  if (type === 'salesforce') {
    salesforceTokenStore.delete(connectionId);
  }

  // Always return success - idempotent disconnect
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

    console.log(`[Google OAuth] Storing tokens for user: ${callbackUserId}`);

    // Save to database for persistence
    await saveTokenToDb(callbackUserId, 'google', {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    });

    console.log(`[Google OAuth] Token saved to database successfully`);

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

    // Get tokens from database
    const tokens = await getTokenFromDb(userId, 'google');

    console.log(`[Google Calendar] Fetching events for user: ${userId}`);
    console.log(`[Google Calendar] Token exists in DB: ${!!tokens}`);

    if (!tokens) {
      next(createError('Google not connected. Please connect your Google account first.', 401));
      return;
    }

    // Check if token is expired and refresh if needed
    if (tokens.expiresAt && tokens.expiresAt < new Date() && tokens.refreshToken) {
      console.log(`[Google Calendar] Token expired, refreshing...`);
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
        // Update database with refreshed token
        await saveTokenToDb(userId, 'google', tokens);
        console.log(`[Google Calendar] Token refreshed and saved`);
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

// =====================================================
// SALESFORCE INTEGRATION
// =====================================================

// Salesforce token store with instance URL
interface SalesforceTokenData extends TokenData {
  instanceUrl: string;
}
const salesforceTokenStore: Map<string, SalesforceTokenData> = new Map();

// GET /api/connectors/salesforce/callback - OAuth callback for Salesforce
router.get('/salesforce/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('[Salesforce Callback] Query params:', {
      code: code ? 'present' : 'missing',
      state,
      error,
      error_description
    });

    // Check for Salesforce errors first
    if (error) {
      console.error('[Salesforce Callback] OAuth error from Salesforce:', error, error_description);
      res.redirect(`${config.corsOrigin}/integrations?error=${encodeURIComponent(error as string)}&error_description=${encodeURIComponent((error_description as string) || '')}`);
      return;
    }

    if (!code) {
      console.error('[Salesforce Callback] No code received');
      res.redirect(`${config.corsOrigin}/integrations?error=no_code`);
      return;
    }

    const redirectUri = `${config.apiUrl}/api/connectors/salesforce/callback`;
    const callbackUserId = (state as string) || '';

    // Retrieve PKCE code verifier
    const codeVerifier = pkceStore.get(callbackUserId);
    console.log(`[Salesforce Callback] Retrieved code_verifier for user ${callbackUserId}: ${codeVerifier ? 'present' : 'missing'}`);

    if (!codeVerifier) {
      console.error('[Salesforce Callback] No PKCE code verifier found for user');
      res.redirect(`${config.corsOrigin}/integrations?error=pkce_verifier_missing`);
      return;
    }

    // Exchange code for tokens (with PKCE code_verifier)
    const tokenResponse = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: config.salesforceClientId || '',
        client_secret: config.salesforceClientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    // Clean up PKCE store
    pkceStore.delete(callbackUserId);

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Salesforce token exchange failed:', error);
      res.redirect(`${config.corsOrigin}/integrations?error=token_exchange_failed`);
      return;
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      instance_url: string;
      issued_at: string;
      token_type: string;
      id: string;
    };

    console.log(`[Salesforce OAuth] Storing tokens for user: ${callbackUserId}`);
    console.log(`[Salesforce OAuth] Instance URL: ${tokens.instance_url}`);

    // Save to database for persistence
    await saveTokenToDb(callbackUserId, 'salesforce', {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours default
      instanceUrl: tokens.instance_url,
    });

    console.log(`[Salesforce OAuth] Token saved to database successfully`);

    // Redirect to integrations page with success
    res.redirect(`${config.corsOrigin}/integrations?connected=salesforce`);
  } catch (error) {
    console.error('Salesforce OAuth callback error:', error);
    res.redirect(`${config.corsOrigin}/integrations?error=callback_failed`);
  }
});

// GET /api/connectors/salesforce/accounts - Fetch Salesforce Accounts
router.get('/salesforce/accounts', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Get tokens from database
    const tokens = await getTokenFromDb(userId, 'salesforce');

    console.log(`[Salesforce] Fetching accounts for user: ${userId}`);
    console.log(`[Salesforce] Token exists in DB: ${!!tokens}`);

    if (!tokens) {
      next(createError('Salesforce not connected. Please connect your Salesforce account first.', 401));
      return;
    }

    if (!tokens.instanceUrl) {
      next(createError('Salesforce instance URL not found. Please reconnect.', 401));
      return;
    }

    // Fetch accounts from Salesforce
    const accountsResponse = await fetch(
      `${tokens.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent('SELECT Id, Name, Industry, Type, Phone, Website, BillingCity, BillingState, AnnualRevenue, Description, CreatedDate FROM Account ORDER BY Name LIMIT 100')}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!accountsResponse.ok) {
      const error = await accountsResponse.text();
      console.error('Salesforce Accounts API error:', error);

      // Check if token expired
      if (accountsResponse.status === 401) {
        await deleteTokenFromDb(userId, 'salesforce');
        next(createError('Salesforce session expired. Please reconnect.', 401));
        return;
      }

      next(createError('Failed to fetch Salesforce accounts', 500));
      return;
    }

    const accountsData = await accountsResponse.json() as {
      records: any[];
      totalSize: number;
    };

    // Transform to our format
    const accounts = accountsData.records.map((acc: any) => ({
      id: acc.Id,
      name: acc.Name,
      industry: acc.Industry,
      type: acc.Type,
      phone: acc.Phone,
      website: acc.Website,
      city: acc.BillingCity,
      state: acc.BillingState,
      annualRevenue: acc.AnnualRevenue,
      description: acc.Description,
      createdDate: acc.CreatedDate,
      source: 'salesforce',
    }));

    res.json({
      accounts,
      totalSize: accountsData.totalSize,
      source: 'Salesforce',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/connectors/salesforce/opportunities - Fetch Salesforce Opportunities
router.get('/salesforce/opportunities', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Get tokens from database
    const tokens = await getTokenFromDb(userId, 'salesforce');

    if (!tokens || !tokens.instanceUrl) {
      next(createError('Salesforce not connected', 401));
      return;
    }

    // Fetch opportunities from Salesforce
    const oppsResponse = await fetch(
      `${tokens.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent('SELECT Id, Name, AccountId, Account.Name, Amount, StageName, Probability, CloseDate, Type, Description, CreatedDate FROM Opportunity ORDER BY CloseDate DESC LIMIT 100')}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!oppsResponse.ok) {
      const error = await oppsResponse.text();
      console.error('Salesforce Opportunities API error:', error);
      next(createError('Failed to fetch Salesforce opportunities', 500));
      return;
    }

    const oppsData = await oppsResponse.json() as {
      records: any[];
      totalSize: number;
    };

    // Transform to our format - map to renewals concept
    const opportunities = oppsData.records.map((opp: any) => ({
      id: opp.Id,
      name: opp.Name,
      accountId: opp.AccountId,
      accountName: opp.Account?.Name,
      amount: opp.Amount, // Maps to premium
      stage: opp.StageName, // Maps to renewal status
      probability: opp.Probability,
      closeDate: opp.CloseDate, // Maps to renewal date
      type: opp.Type,
      description: opp.Description,
      createdDate: opp.CreatedDate,
      source: 'salesforce',
    }));

    res.json({
      opportunities,
      totalSize: oppsData.totalSize,
      source: 'Salesforce',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/connectors/salesforce/contacts - Fetch Salesforce Contacts
router.get('/salesforce/contacts', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Get tokens from database
    const tokens = await getTokenFromDb(userId, 'salesforce');

    if (!tokens || !tokens.instanceUrl) {
      next(createError('Salesforce not connected', 401));
      return;
    }

    // Fetch contacts from Salesforce
    const contactsResponse = await fetch(
      `${tokens.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent('SELECT Id, Name, Email, Phone, Title, AccountId, Account.Name, Department, MailingCity, MailingState FROM Contact ORDER BY Name LIMIT 100')}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!contactsResponse.ok) {
      const error = await contactsResponse.text();
      console.error('Salesforce Contacts API error:', error);
      next(createError('Failed to fetch Salesforce contacts', 500));
      return;
    }

    const contactsData = await contactsResponse.json() as {
      records: any[];
      totalSize: number;
    };

    // Transform to our format
    const contacts = contactsData.records.map((contact: any) => ({
      id: contact.Id,
      name: contact.Name,
      email: contact.Email,
      phone: contact.Phone,
      title: contact.Title,
      accountId: contact.AccountId,
      accountName: contact.Account?.Name,
      department: contact.Department,
      city: contact.MailingCity,
      state: contact.MailingState,
      source: 'salesforce',
    }));

    res.json({
      contacts,
      totalSize: contactsData.totalSize,
      source: 'Salesforce',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/connectors/salesforce/activities - Fetch Salesforce Activities (Tasks & Events)
router.get('/salesforce/activities', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Get tokens from database
    const tokens = await getTokenFromDb(userId, 'salesforce');

    if (!tokens || !tokens.instanceUrl) {
      next(createError('Salesforce not connected', 401));
      return;
    }

    // Fetch tasks from Salesforce
    const tasksResponse = await fetch(
      `${tokens.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent('SELECT Id, Subject, Status, Priority, ActivityDate, WhoId, WhatId, Description FROM Task ORDER BY ActivityDate DESC LIMIT 50')}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Fetch events from Salesforce
    const eventsResponse = await fetch(
      `${tokens.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent('SELECT Id, Subject, StartDateTime, EndDateTime, WhoId, WhatId, Description, Location FROM Event ORDER BY StartDateTime DESC LIMIT 50')}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let tasks: any[] = [];
    let events: any[] = [];

    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json() as { records: any[] };
      tasks = tasksData.records.map((task: any) => ({
        id: task.Id,
        type: 'task',
        subject: task.Subject,
        status: task.Status,
        priority: task.Priority,
        date: task.ActivityDate,
        description: task.Description,
        source: 'salesforce',
      }));
    }

    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json() as { records: any[] };
      events = eventsData.records.map((event: any) => ({
        id: event.Id,
        type: 'event',
        subject: event.Subject,
        startDateTime: event.StartDateTime,
        endDateTime: event.EndDateTime,
        location: event.Location,
        description: event.Description,
        source: 'salesforce',
      }));
    }

    res.json({
      activities: [...tasks, ...events],
      tasks,
      events,
      source: 'Salesforce',
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get Salesforce tokens
export function getSalesforceTokens(userId: string): SalesforceTokenData | undefined {
  return salesforceTokenStore.get(`${userId}-salesforce`);
}

// =====================================================
// MICROSOFT 365 INTEGRATION
// =====================================================

// Microsoft token store
interface MicrosoftTokenData extends TokenData {
  idToken?: string;
  userEmail?: string;
}
const microsoftTokenStore: Map<string, MicrosoftTokenData> = new Map();

// GET /api/connectors/microsoft/callback - OAuth callback for Microsoft
router.get('/microsoft/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;

    console.log('[Microsoft Callback] Query params:', {
      code: code ? 'present' : 'missing',
      state,
      error,
      error_description
    });

    // Check for Microsoft errors first
    if (error) {
      console.error('[Microsoft Callback] OAuth error from Microsoft:', error, error_description);
      res.redirect(`${config.corsOrigin}/integrations?error=${encodeURIComponent(error as string)}&error_description=${encodeURIComponent((error_description as string) || '')}`);
      return;
    }

    if (!code) {
      console.error('[Microsoft Callback] No code received');
      res.redirect(`${config.corsOrigin}/integrations?error=no_code`);
      return;
    }

    const redirectUri = `${config.apiUrl}/api/connectors/microsoft/callback`;
    const callbackUserId = (state as string) || '';

    if (!callbackUserId) {
      console.error('[Microsoft Callback] No user ID in state parameter');
      res.redirect(`${config.corsOrigin}/integrations?error=no_user_state`);
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${config.microsoftTenantId || 'common'}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: config.microsoftClientId || '',
        client_secret: config.microsoftClientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid profile email Mail.Read Mail.Send Calendars.Read Calendars.ReadWrite User.Read offline_access',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Microsoft Callback] Token exchange failed. Status:', tokenResponse.status);
      console.error('[Microsoft Callback] Error response:', errorText);
      console.error('[Microsoft Callback] Redirect URI used:', redirectUri);
      console.error('[Microsoft Callback] Tenant ID:', config.microsoftTenantId || 'common');

      // Try to parse the error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('[Microsoft Callback] Error code:', errorJson.error);
        console.error('[Microsoft Callback] Error description:', errorJson.error_description);
        res.redirect(`${config.corsOrigin}/integrations?error=${encodeURIComponent(errorJson.error || 'token_exchange_failed')}&error_description=${encodeURIComponent(errorJson.error_description || '')}`);
      } catch {
        res.redirect(`${config.corsOrigin}/integrations?error=token_exchange_failed`);
      }
      return;
    }

    const tokens = await tokenResponse.json() as {
      access_token: string;
      refresh_token?: string;
      id_token?: string;
      expires_in: number;
      token_type: string;
      scope: string;
    };

    console.log(`[Microsoft OAuth] Token exchange successful`);
    console.log(`[Microsoft OAuth] Granted scopes: ${tokens.scope}`);
    console.log(`[Microsoft OAuth] Token type: ${tokens.token_type}`);
    console.log(`[Microsoft OAuth] Expires in: ${tokens.expires_in}s`);
    console.log(`[Microsoft OAuth] Access token length: ${tokens.access_token?.length}`);
    console.log(`[Microsoft OAuth] Access token prefix: ${tokens.access_token?.substring(0, 30)}...`);

    const tokenKey = `${callbackUserId}-microsoft`;

    console.log(`[Microsoft OAuth] Storing tokens for user: ${callbackUserId}, key: ${tokenKey}`);

    // Get user info to store email
    let userEmail = '';
    try {
      const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json() as { mail?: string; userPrincipalName?: string };
        userEmail = userData.mail || userData.userPrincipalName || '';
        console.log(`[Microsoft OAuth] User email: ${userEmail}`);
      }
    } catch (e) {
      console.error('[Microsoft OAuth] Failed to fetch user info:', e);
    }

    // Save to database for persistence
    await saveTokenToDb(callbackUserId, 'microsoft', {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
      userEmail,
    });

    console.log(`[Microsoft OAuth] Token saved to database successfully`);

    // Redirect to calendar page with success (like Google does)
    res.redirect(`${config.corsOrigin}/calendar?connected=microsoft`);
  } catch (error) {
    console.error('[Microsoft Callback] OAuth callback error:', error);
    res.redirect(`${config.corsOrigin}/integrations?error=callback_failed`);
  }
});

// GET /api/connectors/microsoft/emails - Fetch recent emails from Outlook
router.get('/microsoft/emails', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Get tokens from database
    const tokens = await getTokenFromDb(userId, 'microsoft');

    console.log(`[Microsoft Mail] Fetching emails for user: ${userId}`);
    console.log(`[Microsoft Mail] Token exists in DB: ${!!tokens}`);

    if (!tokens) {
      next(createError('Microsoft not connected. Please connect your Microsoft account first.', 401));
      return;
    }

    // Fetch recent emails from Microsoft Graph
    const response = await fetch('https://graph.microsoft.com/v1.0/me/messages?$top=20&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead,hasAttachments', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Microsoft Mail] Failed to fetch emails:', error);

      if (response.status === 401) {
        // Token expired, clear it from database
        await deleteTokenFromDb(userId, 'microsoft');
        next(createError('Microsoft session expired. Please reconnect.', 401));
        return;
      }

      next(createError('Failed to fetch emails', 500));
      return;
    }

    const data = await response.json() as { value: any[] };

    const emails = data.value.map((email: any) => ({
      id: email.id,
      subject: email.subject,
      from: email.from?.emailAddress?.address || 'Unknown',
      fromName: email.from?.emailAddress?.name || 'Unknown',
      receivedAt: email.receivedDateTime,
      preview: email.bodyPreview,
      isRead: email.isRead,
      hasAttachments: email.hasAttachments,
      source: 'microsoft',
      deepLink: `https://outlook.office.com/mail/inbox/id/${email.id}`,
    }));

    res.json({
      emails,
      count: emails.length,
      source: 'Microsoft 365',
      sourceSystem: 'Outlook',
      recordType: 'Email',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/connectors/microsoft/calendar/events - Fetch calendar events
router.get('/microsoft/calendar/events', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    // Get tokens from database
    const tokens = await getTokenFromDb(userId, 'microsoft');

    console.log(`[Microsoft Calendar] Fetching events for user: ${userId}`);
    console.log(`[Microsoft Calendar] Token exists in DB: ${!!tokens}`);

    if (!tokens) {
      next(createError('Microsoft not connected. Please connect your Microsoft account first.', 401));
      return;
    }

    // Get events for next 30 days
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${now.toISOString()}&endDateTime=${futureDate.toISOString()}&$top=50&$orderby=start/dateTime&$select=id,subject,start,end,location,organizer,attendees,isOnlineMeeting,onlineMeetingUrl`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'outlook.timezone="UTC"',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Microsoft Calendar] Failed to fetch events. Status:', response.status);
      console.error('[Microsoft Calendar] Error body:', errorText || '(empty)');
      console.error('[Microsoft Calendar] Token prefix:', tokens.accessToken.substring(0, 50) + '...');
      console.error('[Microsoft Calendar] WWW-Authenticate:', response.headers.get('www-authenticate') || '(none)');
      console.error('[Microsoft Calendar] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('[Microsoft Calendar] Error code:', errorJson.error?.code);
        console.error('[Microsoft Calendar] Error message:', errorJson.error?.message);
      } catch (e) {
        // Not JSON - maybe check if it's HTML error page
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          console.error('[Microsoft Calendar] Received HTML error page');
        }
      }

      // Only revoke on actual 401, not on other errors
      if (response.status === 401) {
        await deleteTokenFromDb(userId, 'microsoft');
        next(createError('Microsoft session expired. Please reconnect.', 401));
        return;
      }

      next(createError(`Failed to fetch calendar events: ${response.status}`, 500));
      return;
    }

    const data = await response.json() as { value: any[] };

    const events = data.value.map((event: any) => ({
      id: event.id,
      title: event.subject,
      start: event.start?.dateTime,
      end: event.end?.dateTime,
      location: event.location?.displayName,
      organizer: event.organizer?.emailAddress?.name,
      attendees: event.attendees?.map((a: any) => a.emailAddress?.name).filter(Boolean),
      isOnlineMeeting: event.isOnlineMeeting,
      meetingUrl: event.onlineMeetingUrl,
      source: 'microsoft',
      deepLink: `https://outlook.office.com/calendar/item/${event.id}`,
    }));

    res.json({
      events,
      count: events.length,
      source: 'Microsoft 365',
      sourceSystem: 'Outlook Calendar',
      recordType: 'CalendarEvent',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/connectors/microsoft/me - Get current user info
router.get('/microsoft/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      next(createError('Unauthorized', 401));
      return;
    }

    const tokenKey = `${userId}-microsoft`;
    const tokens = microsoftTokenStore.get(tokenKey);

    if (!tokens) {
      next(createError('Microsoft not connected', 401));
      return;
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      next(createError('Failed to fetch user info', 500));
      return;
    }

    const userData = await response.json() as {
      id: string;
      displayName: string;
      mail: string;
      userPrincipalName: string;
      jobTitle?: string;
    };

    res.json({
      user: {
        id: userData.id,
        name: userData.displayName,
        email: userData.mail || userData.userPrincipalName,
        jobTitle: userData.jobTitle,
      },
      source: 'Microsoft 365',
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get Microsoft tokens
export function getMicrosoftTokens(userId: string): MicrosoftTokenData | undefined {
  return microsoftTokenStore.get(`${userId}-microsoft`);
}

export default router;
