/**
 * API Client for Quantara Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://backend-production-ceb3.up.railway.app' : 'http://localhost:3001');

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth-token');
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth-token', token);
      } else {
        localStorage.removeItem('auth-token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.message || 'Request failed',
          message: data.message,
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ============ AUTH ============

  async login(email: string, password: string) {
    const result = await this.request<{
      token: string;
      user: { id: string; email: string; name: string; company?: string };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async register(data: { email: string; password: string; name: string; company?: string }) {
    const result = await this.request<{
      token: string;
      user: { id: string; email: string; name: string; company?: string };
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getMe() {
    return this.request<{ id: string; email: string; name: string; company?: string }>('/api/auth/me');
  }

  // ============ RENEWALS ============

  async getRenewals(params?: { status?: string; riskScore?: string; sortBy?: string; order?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<{
      renewals: Array<{
        id: string;
        clientId: string;
        clientName: string;
        policyType: string;
        carrier: string;
        premium: number;
        expirationDate: string;
        daysUntilRenewal: number;
        riskScore: string;
        status: string;
      }>;
      total: number;
      summary: {
        totalPremium: number;
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
      };
    }>(`/api/renewals${query}`);
  }

  async getRenewal(id: string) {
    return this.request<{
      id: string;
      clientId: string;
      clientName: string;
      policyType: string;
      carrier: string;
      premium: number;
      expirationDate: string;
      daysUntilRenewal: number;
      riskScore: string;
      status: string;
    }>(`/api/renewals/${id}`);
  }

  async getUpcomingRenewals() {
    return this.request<{
      renewals: Array<{
        id: string;
        clientName: string;
        policyType: string;
        daysUntilRenewal: number;
        riskScore: string;
      }>;
      count: number;
    }>('/api/renewals/upcoming/list');
  }

  async getAtRiskRenewals() {
    return this.request<{
      renewals: Array<{
        id: string;
        clientName: string;
        policyType: string;
        daysUntilRenewal: number;
        riskScore: string;
      }>;
      count: number;
    }>('/api/renewals/at-risk/list');
  }

  // ============ CLIENTS ============

  async getClients(params?: { search?: string; industry?: string; sortBy?: string; order?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<{
      clients: Array<{
        id: string;
        name: string;
        company: string;
        email: string;
        phone: string;
        industry: string;
        totalPremium: number;
        policyCount: number;
        riskScore: string;
        lastContact: string;
      }>;
      total: number;
    }>(`/api/clients${query}`);
  }

  async getClient(id: string) {
    return this.request<{
      id: string;
      name: string;
      company: string;
      email: string;
      phone: string;
      industry: string;
      totalPremium: number;
      policyCount: number;
      riskScore: string;
      lastContact: string;
    }>(`/api/clients/${id}`);
  }

  async getClientPolicies(clientId: string) {
    return this.request<{
      policies: Array<{
        id: string;
        type: string;
        carrier: string;
        premium: number;
        status: string;
        expirationDate: string;
      }>;
    }>(`/api/clients/${clientId}/policies`);
  }

  // ============ POLICIES ============

  async getPolicies(params?: { type?: string; carrier?: string; status?: string; clientId?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<{
      policies: Array<{
        id: string;
        clientId: string;
        clientName: string;
        type: string;
        carrier: string;
        policyNumber: string;
        premium: number;
        coverageLimit: number;
        deductible: number;
        status: string;
        effectiveDate: string;
        expirationDate: string;
      }>;
      total: number;
      summary: {
        totalPremium: number;
        totalCoverage: number;
        byType: Array<{ type: string; count: number }>;
      };
    }>(`/api/policies${query}`);
  }

  async getPolicy(id: string) {
    return this.request<{
      id: string;
      clientId: string;
      clientName: string;
      type: string;
      carrier: string;
      policyNumber: string;
      premium: number;
      coverageLimit: number;
      deductible: number;
      status: string;
      effectiveDate: string;
      expirationDate: string;
    }>(`/api/policies/${id}`);
  }

  async getExpiringPolicies() {
    return this.request<{
      policies: Array<{
        id: string;
        clientName: string;
        type: string;
        expirationDate: string;
      }>;
      count: number;
    }>('/api/policies/expiring/list');
  }

  // ============ AI ============

  async chat(message: string, context?: { clientName?: string; renewalId?: string }, history?: Array<{ role: 'user' | 'model'; content: string }>) {
    return this.request<{
      message: string;
      model: string;
    }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, history }),
    });
  }

  async generateBrief(data: {
    clientId: string;
    clientName: string;
    industry: string;
    policyType: string;
    premium: number;
    daysUntilRenewal: number;
    riskFactors?: string[];
  }) {
    return this.request<{
      brief: {
        summary: string;
        riskFactors: string[];
        insights: string[];
        actionItems: string[];
        talkingPoints: Array<{ type: 'risk' | 'opportunity' | 'info'; content: string }>;
      };
      model: string;
    }>('/api/ai/brief', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateEmail(data: {
    clientName: string;
    policyType: string;
    purpose: 'renewal_reminder' | 'follow_up' | 'quote_request' | 'meeting_request';
    tone?: 'formal' | 'friendly' | 'urgent';
  }) {
    return this.request<{
      email: {
        subject: string;
        body: string;
      };
      model: string;
    }>('/api/ai/email', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAIStatus() {
    return this.request<{
      configured: boolean;
      model: string;
    }>('/api/ai/status');
  }

  // ============ CONNECTORS ============

  async getConnectors() {
    return this.request<{
      connectors: Record<string, {
        name: string;
        description: string;
        connected: boolean;
        configured: boolean;
      }>;
    }>('/api/connectors');
  }

  async getConnectorAuthUrl(type: 'salesforce' | 'microsoft' | 'google' | 'hubspot') {
    return this.request<{ authUrl: string }>(`/api/connectors/${type}/auth-url`);
  }

  async connectConnector(type: 'salesforce' | 'microsoft' | 'google' | 'hubspot', authCode?: string) {
    return this.request<{
      message: string;
      connected: boolean;
    }>(`/api/connectors/${type}/connect`, {
      method: 'POST',
      body: JSON.stringify({ authCode }),
    });
  }

  async disconnectConnector(type: 'salesforce' | 'microsoft' | 'google' | 'hubspot') {
    return this.request<{
      message: string;
      connected: boolean;
    }>(`/api/connectors/${type}`, {
      method: 'DELETE',
    });
  }

  async syncConnector(type: 'salesforce' | 'microsoft' | 'google' | 'hubspot') {
    return this.request<{
      message: string;
      lastSync: string;
    }>(`/api/connectors/${type}/sync`, {
      method: 'POST',
    });
  }

  // ============ HEALTH ============

  async healthCheck() {
    return this.request<{
      status: string;
      timestamp: string;
      version: string;
    }>('/health');
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
