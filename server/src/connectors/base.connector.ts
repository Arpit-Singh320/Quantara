/**
 * Base Connector Interface
 * All connectors must implement this interface for consistent behavior
 */

export interface ConnectorConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

export interface ConnectorAccount {
  id: string;
  name: string;
  email?: string;
  company?: string;
}

export interface ConnectorContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  accountId?: string;
}

export interface ConnectorActivity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  date: Date;
  accountId?: string;
  contactId?: string;
}

export interface ConnectorEmail {
  id: string;
  subject: string;
  from: string;
  to: string[];
  body: string;
  date: Date;
  isRead: boolean;
}

export interface ConnectorCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected tokens: TokenData | null = null;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  abstract get type(): string;
  abstract get name(): string;

  /**
   * Generate OAuth authorization URL
   */
  abstract getAuthUrl(state?: string): string;

  /**
   * Exchange authorization code for tokens
   */
  abstract exchangeCode(code: string): Promise<TokenData>;

  /**
   * Refresh access token using refresh token
   */
  abstract refreshAccessToken(refreshToken: string): Promise<TokenData>;

  /**
   * Revoke tokens and disconnect
   */
  abstract disconnect(): Promise<void>;

  /**
   * Test if connection is valid
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Set tokens for authenticated requests
   */
  setTokens(tokens: TokenData): void {
    this.tokens = tokens;
  }

  /**
   * Check if tokens are expired
   */
  isTokenExpired(): boolean {
    if (!this.tokens?.expiresAt) return true;
    return new Date() >= this.tokens.expiresAt;
  }

  /**
   * Fetch accounts/companies from CRM
   */
  async fetchAccounts(): Promise<ConnectorAccount[]> {
    throw new Error('fetchAccounts not implemented for this connector');
  }

  /**
   * Fetch contacts from CRM
   */
  async fetchContacts(accountId?: string): Promise<ConnectorContact[]> {
    throw new Error('fetchContacts not implemented for this connector');
  }

  /**
   * Fetch activities from CRM
   */
  async fetchActivities(accountId?: string): Promise<ConnectorActivity[]> {
    throw new Error('fetchActivities not implemented for this connector');
  }

  /**
   * Fetch emails from email provider
   */
  async fetchEmails(query?: string, limit?: number): Promise<ConnectorEmail[]> {
    throw new Error('fetchEmails not implemented for this connector');
  }

  /**
   * Fetch calendar events
   */
  async fetchCalendarEvents(startDate: Date, endDate: Date): Promise<ConnectorCalendarEvent[]> {
    throw new Error('fetchCalendarEvents not implemented for this connector');
  }
}
