/**
 * Microsoft 365 Connector
 * Implements OAuth 2.0 flow via Microsoft Graph API
 */

import {
  BaseConnector,
  ConnectorConfig,
  TokenData,
  ConnectorEmail,
  ConnectorCalendarEvent,
  ConnectorContact,
} from './base.connector.js';

interface MicrosoftConfig extends ConnectorConfig {
  tenantId?: string;
}

export class MicrosoftConnector extends BaseConnector {
  private tenantId: string;

  constructor(config: MicrosoftConfig) {
    super(config);
    this.tenantId = config.tenantId || 'common';
  }

  get type(): string {
    return 'microsoft';
  }

  get name(): string {
    return 'Microsoft 365';
  }

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_mode: 'query',
      ...(state && { state }),
    });

    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<TokenData> {
    const response = await fetch(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          scope: this.config.scopes.join(' '),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scopes: this.config.scopes,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const response = await fetch(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: this.config.scopes.join(' '),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scopes: this.config.scopes,
    };
  }

  async disconnect(): Promise<void> {
    this.tokens = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.tokens?.accessToken) return false;

    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchEmails(query?: string, limit: number = 50): Promise<ConnectorEmail[]> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    let url = `https://graph.microsoft.com/v1.0/me/messages?$top=${limit}&$orderby=receivedDateTime desc`;
    if (query) {
      url += `&$search="${encodeURIComponent(query)}"`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }

    const data = await response.json() as { value: any[] };
    return (data.value || []).map((email: any) => ({
      id: email.id,
      subject: email.subject || 'No Subject',
      from: email.from?.emailAddress?.address || '',
      to: (email.toRecipients || []).map((r: any) => r.emailAddress?.address),
      body: email.bodyPreview || '',
      date: new Date(email.receivedDateTime),
      isRead: email.isRead || false,
    }));
  }

  async fetchCalendarEvents(startDate: Date, endDate: Date): Promise<ConnectorCalendarEvent[]> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    const url = `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}&$orderby=start/dateTime`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.tokens.accessToken}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json() as { value: any[] };
    return (data.value || []).map((event: any) => ({
      id: event.id,
      title: event.subject || 'No Title',
      description: event.bodyPreview,
      start: new Date(event.start?.dateTime),
      end: new Date(event.end?.dateTime),
      attendees: (event.attendees || []).map((a: any) => a.emailAddress?.address),
      location: event.location?.displayName,
    }));
  }

  async fetchContacts(): Promise<ConnectorContact[]> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/contacts?$top=100',
      {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const data = await response.json() as { value: any[] };
    return (data.value || []).map((contact: any) => ({
      id: contact.id,
      name: contact.displayName || '',
      email: contact.emailAddresses?.[0]?.address,
      phone: contact.mobilePhone || contact.businessPhones?.[0],
      title: contact.jobTitle,
      accountId: contact.companyName,
    }));
  }
}
