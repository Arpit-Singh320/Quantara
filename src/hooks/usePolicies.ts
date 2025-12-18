import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export interface Policy {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  carrier: string;
  policyNumber: string;
  premium: number;
  coverageLimit: number;
  deductible: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  effectiveDate: string;
  expirationDate: string;
}

export interface PolicySummary {
  totalPremium: number;
  totalCoverage: number;
  byType: Array<{ type: string; count: number }>;
}

interface UsePoliciesOptions {
  type?: string;
  carrier?: string;
  status?: string;
  clientId?: string;
}

export function usePolicies(options: UsePoliciesOptions = {}) {
  const { isAuthenticated } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<PolicySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getPolicies({
        type: options.type,
        carrier: options.carrier,
        status: options.status,
        clientId: options.clientId,
      });

      if (response.data) {
        const transformedPolicies: Policy[] = (response.data.policies || []).map((p: any) => ({
          id: p.id,
          clientId: p.clientId,
          clientName: p.clientName || 'Unknown Client',
          type: p.type || 'General Liability',
          carrier: p.carrier || 'Unknown Carrier',
          policyNumber: p.policyNumber || `POL-${p.id.slice(0, 8)}`,
          premium: p.premium || 0,
          coverageLimit: p.coverageLimit || 0,
          deductible: p.deductible || 0,
          status: (p.status || 'ACTIVE').toUpperCase() as Policy['status'],
          effectiveDate: p.effectiveDate,
          expirationDate: p.expirationDate,
        }));

        setPolicies(transformedPolicies);
        setTotal(response.data.total || transformedPolicies.length);
        setSummary(response.data.summary || null);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch policies');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, options.type, options.carrier, options.status, options.clientId]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const refetch = useCallback(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return {
    policies,
    total,
    summary,
    isLoading,
    error,
    refetch,
  };
}

export function usePolicy(id: string) {
  const { isAuthenticated } = useAuth();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setIsLoading(false);
      return;
    }

    const fetchPolicy = async () => {
      setIsLoading(true);
      try {
        const response = await api.getPolicy(id);
        if (response.data) {
          setPolicy(response.data as unknown as Policy);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Failed to fetch policy');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, [isAuthenticated, id]);

  return { policy, isLoading, error };
}

export function useExpiringPolicies() {
  const { isAuthenticated } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      setIsLoading(true);
      try {
        const response = await api.getExpiringPolicies();
        if (response.data) {
          setPolicies(response.data.policies as unknown as Policy[]);
          setCount(response.data.count);
        }
      } catch (err) {
        console.error('Failed to fetch expiring policies', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [isAuthenticated]);

  return { policies, count, isLoading };
}
