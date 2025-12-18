import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  totalPremium: number;
  policyCount: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  lastContact?: string;
  createdAt: string;
}

interface UseClientsOptions {
  search?: string;
  industry?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export function useClients(options: UseClientsOptions = {}) {
  const { isAuthenticated } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getClients({
        search: options.search,
        industry: options.industry,
        sortBy: options.sortBy,
        order: options.order,
      });

      if (response.data) {
        const transformedClients: Client[] = (response.data.clients || []).map((c: any) => ({
          id: c.id,
          name: c.name || 'Unknown',
          company: c.company || c.name || 'Unknown Company',
          email: c.email || '',
          phone: c.phone || '',
          industry: c.industry || 'Other',
          address: c.address,
          totalPremium: c.totalPremium || 0,
          policyCount: c.policyCount || 0,
          riskScore: (c.riskScore || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
          lastContact: c.lastContact,
          createdAt: c.createdAt,
        }));

        setClients(transformedClients);
        setTotal(response.data.total || transformedClients.length);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, options.search, options.industry, options.sortBy, options.order]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const refetch = useCallback(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    total,
    isLoading,
    error,
    refetch,
  };
}

export function useClient(id: string) {
  const { isAuthenticated } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setIsLoading(false);
      return;
    }

    const fetchClient = async () => {
      setIsLoading(true);
      try {
        const response = await api.getClient(id);
        if (response.data) {
          setClient(response.data as unknown as Client);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Failed to fetch client');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [isAuthenticated, id]);

  return { client, isLoading, error };
}

export function useClientPolicies(clientId: string) {
  const { isAuthenticated } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !clientId) {
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      try {
        const response = await api.getClientPolicies(clientId);
        if (response.data) {
          setPolicies(response.data.policies || []);
        }
      } catch (err) {
        console.error('Failed to fetch client policies', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [isAuthenticated, clientId]);

  return { policies, isLoading };
}
