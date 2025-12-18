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
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
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
      user: { id: string; email: string; name: string; company?: string; role: 'ADMIN' | 'BROKER' | 'VIEWER' };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async register(email: string, password: string, name: string, company?: string) {
    const result = await this.request<{
      token: string;
      user: { id: string; email: string; name: string; company?: string; role: 'ADMIN' | 'BROKER' | 'VIEWER' };
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, company }),
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
    return this.request<{ user: { id: string; email: string; name: string; company?: string; role: 'ADMIN' | 'BROKER' | 'VIEWER' } }>('/api/auth/me');
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

  async createRenewal(policyId: string) {
    return this.request<{
      id: string;
      clientName: string;
      policyType: string;
      status: string;
      riskScore: string;
      expirationDate: string;
      daysUntilRenewal: number;
    }>('/api/renewals', {
      method: 'POST',
      body: JSON.stringify({ policyId }),
    });
  }

  async updateRenewal(id: string, data: { status?: string; riskScore?: string }) {
    return this.request<{
      id: string;
      clientName: string;
      policyType: string;
      status: string;
      riskScore: string;
    }>(`/api/renewals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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

  async createClient(data: {
    name: string;
    company: string;
    email?: string;
    phone?: string;
    industry?: string;
    address?: { street?: string; city?: string; state?: string; zip?: string };
  }) {
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
      createdAt: string;
    }>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    industry?: string;
    address?: { street?: string; city?: string; state?: string; zip?: string };
  }) {
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
      createdAt: string;
    }>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/clients/${id}`, {
      method: 'DELETE',
    });
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

  async createPolicy(data: {
    clientId: string;
    policyNumber: string;
    type: string;
    carrier: string;
    premium: number;
    coverageLimit: number;
    deductible?: number;
    effectiveDate: string;
    expirationDate: string;
  }) {
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
    }>('/api/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePolicy(id: string, data: {
    carrier?: string;
    premium?: number;
    coverageLimit?: number;
    deductible?: number;
    effectiveDate?: string;
    expirationDate?: string;
    status?: string;
  }) {
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
    }>(`/api/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePolicy(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/policies/${id}`, {
      method: 'DELETE',
    });
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
    documentAnalyses?: Array<{
      documentName: string;
      documentType: string;
      overview?: string;
      keyInformation?: Array<{ label: string; value: string }>;
      summaryPoints?: string[];
      riskFactors?: Array<{ level: string; description: string }>;
      actionItems?: Array<{ priority: string; action: string }>;
    }>;
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

  // ============ CALENDAR ============

  async getCalendarEvents(params?: { start?: string; end?: string; clientId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.append('start', params.start);
    if (params?.end) searchParams.append('end', params.end);
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    const query = searchParams.toString();
    return this.request<{
      events: CalendarEvent[];
    }>(`/api/calendar/events${query ? `?${query}` : ''}`);
  }

  async createCalendarEvent(data: {
    title: string;
    description?: string;
    type: 'meeting' | 'call' | 'renewal' | 'deadline';
    date: string;
    time: string;
    duration?: number;
    location?: string;
    clientId?: string;
    renewalId?: string;
  }) {
    return this.request<{ event: CalendarEvent }>('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        type: data.type.toUpperCase(),
      }),
    });
  }

  async updateCalendarEvent(eventId: string, data: Partial<{
    title: string;
    description: string;
    type: 'meeting' | 'call' | 'renewal' | 'deadline';
    date: string;
    time: string;
    duration: number;
    location: string;
    clientId: string;
    renewalId: string;
  }>) {
    return this.request<{ event: CalendarEvent }>(`/api/calendar/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        type: data.type?.toUpperCase(),
      }),
    });
  }

  async deleteCalendarEvent(eventId: string) {
    return this.request<{ success: boolean; message: string }>(`/api/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  // ============ TASKS ============

  async getTasks(params?: { renewalId?: string; status?: string; priority?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.renewalId) searchParams.append('renewalId', params.renewalId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    const query = searchParams.toString();
    return this.request<{ tasks: Task[] }>(`/api/tasks${query ? `?${query}` : ''}`);
  }

  async getRenewalTasks(renewalId: string) {
    return this.request<{
      tasks: Task[];
      progress: {
        total: number;
        completed: number;
        overdue: number;
        inProgress: number;
        pending: number;
        percentComplete: number;
      };
    }>(`/api/tasks/renewal/${renewalId}`);
  }

  async createTask(data: {
    renewalId: string;
    name: string;
    description?: string;
    dueDate: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category?: string;
  }) {
    return this.request<{ task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(taskId: string, data: Partial<{
    name: string;
    description: string;
    dueDate: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'SKIPPED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category: string;
  }>) {
    return this.request<{ task: Task }>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(taskId: string) {
    return this.request<{ success: boolean }>(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async runRenewalJob(daysAhead?: number) {
    return this.request<{
      success: boolean;
      renewalsCreated: number;
      renewalsSkipped: number;
      tasksMarkedOverdue: number;
      errors: string[];
    }>('/api/tasks/run-renewal-job', {
      method: 'POST',
      body: JSON.stringify({ daysAhead }),
    });
  }

  async getEscalations() {
    return this.request<{
      escalations: Array<{
        renewalId: string;
        clientName: string;
        policyType: string;
        daysUntilDue: number;
        riskScore: string;
        reason: string;
        overdueTasks: number;
      }>;
    }>('/api/tasks/escalations');
  }

  // ============ DOCUMENTS ============

  async getDocuments(params?: { clientId?: string; policyId?: string; renewalId?: string; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    if (params?.policyId) searchParams.append('policyId', params.policyId);
    if (params?.renewalId) searchParams.append('renewalId', params.renewalId);
    if (params?.type) searchParams.append('type', params.type);
    const query = searchParams.toString();
    return this.request<{ documents: Document[] }>(`/api/documents${query ? `?${query}` : ''}`);
  }

  async getRenewalDocuments(renewalId: string) {
    return this.request<{
      documents: Document[];
      grouped: Record<string, Document[]>;
    }>(`/api/documents/renewal/${renewalId}`);
  }

  async uploadDocument(data: {
    name: string;
    originalName: string;
    type: string;
    mimeType: string;
    size: number;
    content?: string; // Base64
    clientId?: string;
    policyId?: string;
    renewalId?: string;
    quoteId?: string;
  }) {
    return this.request<{ document: Document }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(documentId: string) {
    return this.request<{ success: boolean }>(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // ============ QUOTES ============

  async getQuotes(params?: { renewalId?: string; status?: string; carrier?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.renewalId) searchParams.append('renewalId', params.renewalId);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.carrier) searchParams.append('carrier', params.carrier);
    const query = searchParams.toString();
    return this.request<{ quotes: Quote[] }>(`/api/quotes${query ? `?${query}` : ''}`);
  }

  async getRenewalQuotes(renewalId: string) {
    return this.request<{
      renewal: {
        id: string;
        clientName: string;
        policyType: string;
        policyNumber: string;
        currentCarrier: string;
        expiringPremium: number;
        dueDate: string;
      };
      quotes: Quote[];
      summary: {
        totalQuotes: number;
        lowestPremium: number | null;
        highestPremium: number | null;
        averagePremium: number | null;
        expiringPremium: number;
        selectedQuote: string | null;
      };
    }>(`/api/quotes/renewal/${renewalId}`);
  }

  async createQuote(data: {
    renewalId: string;
    carrier: string;
    premium: number;
    coverageLimit: number;
    deductible?: number;
    perOccurrence?: number;
    aggregate?: number;
    coinsurance?: number;
    exclusions?: string[];
    endorsements?: string[];
    terms?: Record<string, any>;
    notes?: string;
    expiresAt?: string;
  }) {
    return this.request<{ quote: Quote }>('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuote(quoteId: string, data: Partial<{
    carrier: string;
    premium: number;
    coverageLimit: number;
    deductible: number;
    status: string;
    notes: string;
  }>) {
    return this.request<{ quote: Quote }>(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async selectQuote(quoteId: string) {
    return this.request<{ quote: Quote; message: string }>(`/api/quotes/${quoteId}/select`, {
      method: 'POST',
    });
  }

  async deleteQuote(quoteId: string) {
    return this.request<{ success: boolean }>(`/api/quotes/${quoteId}`, {
      method: 'DELETE',
    });
  }

  async compareQuotes(quoteIds: string[]) {
    return this.request<{
      comparison: {
        quotes: Array<{
          id: string;
          carrier: string;
          premium: number;
          priceChange: number | null;
          coverageLimit: number;
          deductible: number | null;
          isSelected: boolean;
        }>;
        expiringPolicy: {
          carrier: string;
          premium: number;
          coverageLimit: number;
        };
        metrics: {
          lowestPremium: number;
          highestPremium: number;
          bestValue: string;
        };
      };
    }>('/api/quotes/compare', {
      method: 'POST',
      body: JSON.stringify({ quoteIds }),
    });
  }

  // ============ EMAIL ============

  async sendRenewalReminder(renewalId: string) {
    return this.request<{
      success: boolean;
      message: string;
      messageId?: string;
    }>('/api/email/send-renewal-reminder', {
      method: 'POST',
      body: JSON.stringify({ renewalId }),
    });
  }

  async sendCustomEmail(data: {
    to: string;
    toName?: string;
    subject: string;
    body: string;
    clientId?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      messageId?: string;
    }>('/api/email/send-custom', {
      method: 'POST',
      body: JSON.stringify(data),
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

// Types for new entities
export interface Task {
  id: string;
  renewalId: string;
  name: string;
  description?: string;
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'SKIPPED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  order: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  mimeType: string;
  size: number;
  version: number;
  uploadedAt: string;
  clientId?: string;
  policyId?: string;
  renewalId?: string;
  quoteId?: string;
}

export interface Quote {
  id: string;
  renewalId: string;
  carrier: string;
  premium: number;
  coverageLimit: number;
  deductible?: number;
  perOccurrence?: number;
  aggregate?: number;
  coinsurance?: number;
  exclusions?: string[];
  endorsements?: string[];
  coverageScore?: number;
  recommendation?: string;
  priceChange?: number;
  notes?: string;
  status: string;
  isSelected: boolean;
  receivedAt: string;
  expiresAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'call' | 'renewal' | 'deadline';
  date: string;
  time: string;
  duration: number;
  location?: string;
  client?: string;
  clientId?: string;
  renewalId?: string;
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
