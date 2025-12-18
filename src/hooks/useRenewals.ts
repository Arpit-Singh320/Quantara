import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export interface Renewal {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  policyId: string;
  policyType: string;
  policyNumber: string;
  carrier: string;
  premium: number;
  coverageLimit: number;
  dueDate: string;
  daysUntilRenewal: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  riskFactors: string[];
  aiSummary?: string;
  aiInsights: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'QUOTED' | 'BOUND' | 'LOST' | 'CANCELLED';
  lastTouchedAt?: string;
  emailsSent: number;
  quotesReceived: number;
}

export interface RenewalSummary {
  totalPremium: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  totalCount: number;
}

interface UseRenewalsOptions {
  status?: string;
  riskScore?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export function useRenewals(options: UseRenewalsOptions = {}) {
  const { isAuthenticated } = useAuth();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [summary, setSummary] = useState<RenewalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRenewals = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getRenewals({
        status: options.status,
        riskScore: options.riskScore,
        sortBy: options.sortBy,
        order: options.order,
      });

      if (response.data) {
        // Transform API response to match our interface
        const transformedRenewals: Renewal[] = (response.data.renewals || []).map((r: any) => ({
          id: r.id,
          clientId: r.clientId,
          clientName: r.clientName || 'Unknown Client',
          clientCompany: r.clientCompany || r.clientName || 'Unknown',
          policyId: r.policyId || r.id,
          policyType: r.policyType || 'General Liability',
          policyNumber: r.policyNumber || `POL-${r.id.slice(0, 8)}`,
          carrier: r.carrier || 'Unknown Carrier',
          premium: r.premium || 0,
          coverageLimit: r.coverageLimit || 0,
          dueDate: r.expirationDate || r.dueDate,
          daysUntilRenewal: r.daysUntilRenewal || 0,
          riskScore: (r.riskScore || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
          riskFactors: r.riskFactors || [],
          aiSummary: r.aiSummary,
          aiInsights: r.aiInsights || [],
          status: (r.status || 'PENDING').toUpperCase() as Renewal['status'],
          lastTouchedAt: r.lastTouchedAt,
          emailsSent: r.emailsSent || 0,
          quotesReceived: r.quotesReceived || 0,
        }));

        setRenewals(transformedRenewals);
        setSummary(response.data.summary ? {
          totalPremium: response.data.summary.totalPremium || 0,
          highRisk: response.data.summary.highRisk || 0,
          mediumRisk: response.data.summary.mediumRisk || 0,
          lowRisk: response.data.summary.lowRisk || 0,
          totalCount: response.data.total || transformedRenewals.length,
        } : null);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to fetch renewals');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, options.status, options.riskScore, options.sortBy, options.order]);

  useEffect(() => {
    fetchRenewals();
  }, [fetchRenewals]);

  const refetch = useCallback(() => {
    fetchRenewals();
  }, [fetchRenewals]);

  return {
    renewals,
    summary,
    isLoading,
    error,
    refetch,
  };
}

export function useRenewal(id: string) {
  const { isAuthenticated } = useAuth();
  const [renewal, setRenewal] = useState<Renewal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setIsLoading(false);
      return;
    }

    const fetchRenewal = async () => {
      setIsLoading(true);
      try {
        const response = await api.getRenewal(id);
        if (response.data) {
          setRenewal(response.data as unknown as Renewal);
        } else if (response.error) {
          setError(response.error);
        }
      } catch (err) {
        setError('Failed to fetch renewal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRenewal();
  }, [isAuthenticated, id]);

  return { renewal, isLoading, error };
}

export function useUpcomingRenewals() {
  const { isAuthenticated } = useAuth();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
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
        const response = await api.getUpcomingRenewals();
        if (response.data) {
          setRenewals(response.data.renewals as unknown as Renewal[]);
          setCount(response.data.count);
        }
      } catch (err) {
        console.error('Failed to fetch upcoming renewals', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [isAuthenticated]);

  return { renewals, count, isLoading };
}

export function useAtRiskRenewals() {
  const { isAuthenticated } = useAuth();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
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
        const response = await api.getAtRiskRenewals();
        if (response.data) {
          setRenewals(response.data.renewals as unknown as Renewal[]);
          setCount(response.data.count);
        }
      } catch (err) {
        console.error('Failed to fetch at-risk renewals', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [isAuthenticated]);

  return { renewals, count, isLoading };
}
