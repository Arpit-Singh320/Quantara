/**
 * HubSpot Connector
 * Implements OAuth 2.0 flow for HubSpot CRM
 */

import {
  BaseConnector,
  ConnectorConfig,
  TokenData,
  ConnectorAccount,
  ConnectorContact,
  ConnectorActivity,
} from './base.connector.js';

export class HubSpotConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super(config);
  }

  get type(): string {
    return 'hubspot';
  }

  get name(): string {
    return 'HubSpot';
  }

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      ...(state && { state }),
    });

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<TokenData> {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
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
      expiresAt: new Date(Date.now() + (data.expires_in || 21600) * 1000),
      scopes: this.config.scopes,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
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
      refresh_token?: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 21600) * 1000),
      scopes: this.config.scopes,
    };
  }

  async disconnect(): Promise<void> {
    this.tokens = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.tokens?.accessToken) return false;

    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + this.tokens.accessToken);
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchAccounts(): Promise<ConnectorAccount[]> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/companies?limit=100&properties=name,domain,industry',
      {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }

    const data = await response.json() as { results?: any[] };
    return (data.results || []).map((company: any) => ({
      id: company.id,
      name: company.properties?.name || 'Unknown',
      company: company.properties?.name,
    }));
  }

  async fetchContacts(accountId?: string): Promise<ConnectorContact[]> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    let url = 'https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=firstname,lastname,email,phone,jobtitle';

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.tokens.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const data = await response.json() as { results?: any[] };
    return (data.results || []).map((contact: any) => ({
      id: contact.id,
      name: `${contact.properties?.firstname || ''} ${contact.properties?.lastname || ''}`.trim() || 'Unknown',
      email: contact.properties?.email,
      phone: contact.properties?.phone,
      title: contact.properties?.jobtitle,
      accountId: accountId,
    }));
  }

  async fetchActivities(accountId?: string): Promise<ConnectorActivity[]> {
    if (!this.tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/tasks?limit=50&properties=hs_task_subject,hs_task_body,hs_timestamp',
      {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const data = await response.json() as { results?: any[] };
    return (data.results || []).map((task: any) => ({
      id: task.id,
      type: 'task' as const,
      subject: task.properties?.hs_task_subject || 'No Subject',
      description: task.properties?.hs_task_body,
      date: new Date(task.properties?.hs_timestamp || Date.now()),
      accountId: accountId,
    }));
  }
}
