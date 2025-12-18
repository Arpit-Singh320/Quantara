/**
 * Google Workspace Connector
 * Implements OAuth 2.0 flow for Gmail, Calendar, and Contacts
 */

import {
  BaseConnector,
  ConnectorConfig,
  TokenData,
  ConnectorEmail,
  ConnectorCalendarEvent,
  ConnectorContact,
} from './base.connector.js';

export class GoogleConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super(config);
  }

  get type(): string {
    return 'google';
  }

  get name(): string {
    return 'Google Workspace';
  }

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<TokenData> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
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
      }),
    });

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
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json() as {
      access_token: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      scopes: this.config.scopes,
    };
  }

  async disconnect(): Promise<void> {
    if (!this.tokens?.accessToken) return;

    await fetch(`https://oauth2.googleapis.com/revoke?token=${this.tokens.accessToken}`, {
      method: 'POST',
    });

    this.tokens = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.tokens?.accessToken) return false;

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
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

    // First get message IDs
    let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}`;
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }

    const listResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.tokens.accessToken}`,
      },
    });

    if (!listResponse.ok) {
      throw new Error('Failed to fetch email list');
    }

    const listData = await listResponse.json() as { messages?: { id: string }[] };
    const messageIds = (listData.messages || []).slice(0, limit);

    // Fetch each message details
    const emails: ConnectorEmail[] = [];
    for (const msg of messageIds) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To`,
        {
          headers: {
            Authorization: `Bearer ${this.tokens.accessToken}`,
          },
        }
      );

      if (msgResponse.ok) {
        const msgData = await msgResponse.json() as {
          id: string;
          snippet: string;
          internalDate: string;
          labelIds?: string[];
          payload?: { headers?: { name: string; value: string }[] };
        };
        const headers = msgData.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h) => h.name === name)?.value || '';

        emails.push({
          id: msgData.id,
          subject: getHeader('Subject') || 'No Subject',
          from: getHeader('From'),
          to: getHeader('To').split(',').map((e) => e.trim()),
          body: msgData.snippet || '',
          date: new Date(parseInt(msgData.internalDate)),
          isRead: !(msgData.labelIds || []).includes('UNREAD'),
        });
      }
    }

    return emails;
  }

  async fetchCalendarEvents(startDate: Date, endDate: Date): Promise<ConnectorCalendarEvent[]> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json() as { items?: any[] };
    return (data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'No Title',
      description: event.description,
      start: new Date(event.start?.dateTime || event.start?.date),
      end: new Date(event.end?.dateTime || event.end?.date),
      attendees: (event.attendees || []).map((a: any) => a.email),
      location: event.location,
    }));
  }

  async fetchContacts(): Promise<ConnectorContact[]> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=100',
      {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const data = await response.json() as { connections?: any[] };
    return (data.connections || []).map((contact: any) => ({
      id: contact.resourceName,
      name: contact.names?.[0]?.displayName || '',
      email: contact.emailAddresses?.[0]?.value,
      phone: contact.phoneNumbers?.[0]?.value,
      title: contact.organizations?.[0]?.title,
      accountId: contact.organizations?.[0]?.name,
    }));
  }
}
