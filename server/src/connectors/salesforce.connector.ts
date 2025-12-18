/**
 * Salesforce Connector
 * Implements OAuth 2.0 flow and API calls for Salesforce CRM
 */

import {
  BaseConnector,
  ConnectorConfig,
  TokenData,
  ConnectorAccount,
  ConnectorContact,
  ConnectorActivity,
} from './base.connector.js';

export class SalesforceConnector extends BaseConnector {
  private instanceUrl: string = '';

  constructor(config: ConnectorConfig) {
    super(config);
  }

  get type(): string {
    return 'salesforce';
  }

  get name(): string {
    return 'Salesforce';
  }

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      ...(state && { state }),
    });

    return `https://login.salesforce.com/services/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<TokenData> {
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
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
      instance_url: string;
    };
    this.instanceUrl = data.instance_url;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000),
      scopes: this.config.scopes,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
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
      instance_url?: string;
    };
    if (data.instance_url) {
      this.instanceUrl = data.instance_url;
    }

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + (data.expires_in || 7200) * 1000),
      scopes: this.config.scopes,
    };
  }

  async disconnect(): Promise<void> {
    if (!this.tokens?.accessToken) return;

    await fetch(`${this.instanceUrl}/services/oauth2/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: this.tokens.accessToken,
      }),
    });

    this.tokens = null;
    this.instanceUrl = '';
  }

  async testConnection(): Promise<boolean> {
    if (!this.tokens?.accessToken || !this.instanceUrl) return false;

    try {
      const response = await fetch(`${this.instanceUrl}/services/data/v58.0/`, {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchAccounts(): Promise<ConnectorAccount[]> {
    if (!this.tokens?.accessToken || !this.instanceUrl) {
      throw new Error('Not authenticated');
    }

    const query = encodeURIComponent(
      'SELECT Id, Name, Industry, Website, Phone FROM Account ORDER BY LastModifiedDate DESC LIMIT 100'
    );

    const response = await fetch(
      `${this.instanceUrl}/services/data/v58.0/query?q=${query}`,
      {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const data = await response.json() as { records?: any[] };
    return (data.records || []).map((record: any) => ({
      id: record.Id,
      name: record.Name,
      company: record.Name,
    }));
  }

  async fetchContacts(accountId?: string): Promise<ConnectorContact[]> {
    if (!this.tokens?.accessToken || !this.instanceUrl) {
      throw new Error('Not authenticated');
    }

    let query = 'SELECT Id, Name, Email, Phone, Title, AccountId FROM Contact';
    if (accountId) {
      query += ` WHERE AccountId = '${accountId}'`;
    }
    query += ' ORDER BY LastModifiedDate DESC LIMIT 100';

    const response = await fetch(
      `${this.instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    const data = await response.json() as { records?: any[] };
    return (data.records || []).map((record: any) => ({
      id: record.Id,
      name: record.Name,
      email: record.Email,
      phone: record.Phone,
      title: record.Title,
      accountId: record.AccountId,
    }));
  }

  async fetchActivities(accountId?: string): Promise<ConnectorActivity[]> {
    if (!this.tokens?.accessToken || !this.instanceUrl) {
      throw new Error('Not authenticated');
    }

    let query = 'SELECT Id, Subject, Description, ActivityDate, WhatId, WhoId FROM Task';
    if (accountId) {
      query += ` WHERE WhatId = '${accountId}'`;
    }
    query += ' ORDER BY ActivityDate DESC LIMIT 50';

    const response = await fetch(
      `${this.instanceUrl}/services/data/v58.0/query?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${this.tokens.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const data = await response.json() as { records?: any[] };
    return (data.records || []).map((record: any) => ({
      id: record.Id,
      type: 'task' as const,
      subject: record.Subject || 'No Subject',
      description: record.Description,
      date: new Date(record.ActivityDate),
      accountId: record.WhatId,
      contactId: record.WhoId,
    }));
  }
}
