export type RiskLevel = 'high' | 'medium' | 'low';

export type SourceType = 'salesforce' | 'outlook' | 'gmail' | 'hubspot' | 'applied' | 'ams360' | 'calendar' | 'quotesys';

export interface Source {
  id: string;
  type: SourceType;
  label: string;
  timestamp: string;
  relativeTime: string;
  preview: string;
  fullContent?: string;
}

export interface RenewalClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  avatar?: string;
}

export interface RenewalPolicy {
  id: string;
  type: string;
  carrier: string;
  premium: number;
  coverageLimit: number;
  effectiveDate: string;
  expirationDate: string;
}

export interface RenewalMetrics {
  emailsSent: number;
  quotesReceived: number;
  lastTouchedDays: number;
  meetingsScheduled: number;
}

export interface Renewal {
  id: string;
  client: RenewalClient;
  policy: RenewalPolicy;
  daysUntilRenewal: number;
  renewalDate: string;
  riskScore: RiskLevel;
  riskFactors: string[];
  lastContact: string;
  assignedBroker: string;
  sources: Source[];
  aiInsights: string[];
  aiSummary: string;
  metrics: RenewalMetrics;
  status: 'pending' | 'in_progress' | 'at_risk' | 'secured';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: string;
  isStreaming?: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'renewal_reminder' | 'policy_update' | 'claims_followup' | 'quote_request';
  subject: string;
  body: string;
}

export interface MeetingAgendaItem {
  id: string;
  topic: string;
  duration: number;
  notes: string;
  isAISuggested: boolean;
}

export interface TalkingPoint {
  id: string;
  title: string;
  content: string;
  type: 'risk' | 'opportunity' | 'info';
  priority: 'high' | 'medium' | 'low';
}
