import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export type ConnectorType = 'salesforce' | 'microsoft' | 'google' | 'hubspot';

export interface Connector {
  type: ConnectorType;
  name: string;
  description: string;
  connected: boolean;
  configured: boolean;
  lastSync?: string;
  icon: string;
}

const connectorMeta: Record<ConnectorType, { name: string; description: string; icon: string }> = {
  salesforce: {
    name: 'Salesforce',
    description: 'CRM data, accounts, opportunities, contacts',
    icon: '☁️',
  },
  microsoft: {
    name: 'Microsoft 365',
    description: 'Outlook email, calendar, Teams, contacts',
    icon: '📧',
  },
  google: {
    name: 'Google Workspace',
    description: 'Gmail, Google Calendar, Drive, contacts',
    icon: '📅',
  },
  hubspot: {
    name: 'HubSpot',
    description: 'CRM, marketing automation, sales data',
    icon: '🎯',
  },
};

export function useConnectors() {
  const { isAuthenticated } = useAuth();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectors = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getConnectors();
      if (response.data?.connectors) {
        const connectorList: Connector[] = Object.entries(response.data.connectors).map(
          ([type, data]: [string, any]) => ({
            type: type as ConnectorType,
            name: data.name || connectorMeta[type as ConnectorType]?.name || type,
            description: data.description || connectorMeta[type as ConnectorType]?.description || '',
            connected: data.connected || false,
            configured: data.configured || false,
            lastSync: data.lastSync,
            icon: connectorMeta[type as ConnectorType]?.icon || '🔌',
          })
        );
        setConnectors(connectorList);
      }
    } catch (err) {
      setError('Failed to fetch connectors');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const connect = useCallback(async (type: ConnectorType) => {
    try {
      // Get OAuth URL
      const urlResponse = await api.getConnectorAuthUrl(type);
      if (urlResponse.error) {
        return { success: false, error: urlResponse.error };
      }

      // In production, this would open OAuth popup and handle callback
      // For now, simulate connection
      const connectResponse = await api.connectConnector(type);
      if (connectResponse.data?.connected) {
        await fetchConnectors();
        return { success: true };
      }
      return { success: false, error: connectResponse.error || 'Connection failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }, [fetchConnectors]);

  const disconnect = useCallback(async (type: ConnectorType) => {
    try {
      const response = await api.disconnectConnector(type);
      if (response.data) {
        await fetchConnectors();
        return { success: true };
      }
      return { success: false, error: response.error || 'Disconnection failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }, [fetchConnectors]);

  const sync = useCallback(async (type: ConnectorType) => {
    try {
      const response = await api.syncConnector(type);
      if (response.data) {
        await fetchConnectors();
        return { success: true, lastSync: response.data.lastSync };
      }
      return { success: false, error: response.error || 'Sync failed' };
    } catch (err) {
      return { success: false, error: 'Network error' };
    }
  }, [fetchConnectors]);

  return {
    connectors,
    isLoading,
    error,
    connect,
    disconnect,
    sync,
    refetch: fetchConnectors,
  };
}
