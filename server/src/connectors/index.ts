/**
 * Connector Index
 * Exports all connector classes and factory function
 */

export { BaseConnector, type ConnectorConfig, type TokenData } from './base.connector.js';
export { SalesforceConnector } from './salesforce.connector.js';
export { MicrosoftConnector } from './microsoft.connector.js';
export { GoogleConnector } from './google.connector.js';
export { HubSpotConnector } from './hubspot.connector.js';

import { BaseConnector, ConnectorConfig } from './base.connector.js';
import { SalesforceConnector } from './salesforce.connector.js';
import { MicrosoftConnector } from './microsoft.connector.js';
import { GoogleConnector } from './google.connector.js';
import { HubSpotConnector } from './hubspot.connector.js';

export type ConnectorType = 'salesforce' | 'microsoft' | 'google' | 'hubspot';

/**
 * Factory function to create connector instances
 */
export function createConnector(type: ConnectorType, config: ConnectorConfig): BaseConnector {
  switch (type) {
    case 'salesforce':
      return new SalesforceConnector(config);
    case 'microsoft':
      return new MicrosoftConnector(config);
    case 'google':
      return new GoogleConnector(config);
    case 'hubspot':
      return new HubSpotConnector(config);
    default:
      throw new Error(`Unknown connector type: ${type}`);
  }
}

/**
 * Get default scopes for each connector type
 */
export function getDefaultScopes(type: ConnectorType): string[] {
  switch (type) {
    case 'salesforce':
      return ['api', 'refresh_token', 'openid'];
    case 'microsoft':
      return [
        'openid',
        'profile',
        'email',
        'offline_access',
        'Mail.Read',
        'Calendars.Read',
        'Contacts.Read',
      ];
    case 'google':
      return [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/contacts.readonly',
      ];
    case 'hubspot':
      return [
        'crm.objects.contacts.read',
        'crm.objects.companies.read',
        'crm.objects.deals.read',
      ];
    default:
      return [];
  }
}
