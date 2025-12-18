/**
 * RenewalDetail Page
 * Complete renewal management view with tasks, quotes, and documents
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Building, FileText, DollarSign,
  AlertTriangle, Clock, Mail, MessageSquare, MoreHorizontal,
  CheckCircle, XCircle, Loader2, Download, Sparkles, Send, CalendarClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from '@/components/renewals/TaskList';
import { QuoteComparison } from '@/components/renewals/QuoteComparison';
import { DocumentUpload } from '@/components/renewals/DocumentUpload';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface RenewalData {
  id: string;
  clientId: string;
  policyId: string;
  clientName: string;
  clientCompany: string;
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
  status: string;
  emailsSent: number;
  quotesReceived: number;
  lastTouchedAt?: string;
}

const riskConfig = {
  HIGH: { color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-950', border: 'border-red-500', label: 'High Risk' },
  MEDIUM: { color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-950', border: 'border-orange-500', label: 'Medium Risk' },
  LOW: { color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-950', border: 'border-green-500', label: 'Low Risk' },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  PENDING: { color: 'text-slate-500', bg: 'bg-slate-100', label: 'Pending' },
  IN_PROGRESS: { color: 'text-blue-500', bg: 'bg-blue-100', label: 'In Progress' },
  QUOTED: { color: 'text-purple-500', bg: 'bg-purple-100', label: 'Quoted' },
  BOUND: { color: 'text-green-500', bg: 'bg-green-100', label: 'Bound' },
  LOST: { color: 'text-red-500', bg: 'bg-red-100', label: 'Lost' },
  CANCELLED: { color: 'text-gray-500', bg: 'bg-gray-100', label: 'Cancelled' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function RenewalDetail() {
  const { renewalId } = useParams<{ renewalId: string }>();
  const navigate = useNavigate();
  const [renewal, setRenewal] = useState<RenewalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [brief, setBrief] = useState<any>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [documentAnalyses, setDocumentAnalyses] = useState<any[]>([]);
  const [showScheduleEmail, setShowScheduleEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  useEffect(() => {
    if (renewalId) {
      fetchRenewal();
    }
  }, [renewalId]);

  const fetchRenewal = async () => {
    try {
      setIsLoading(true);
      // Fetch renewal data from the renewals API
      const response = await api.getRenewals();
      if (response.data?.renewals) {
        const found: any = response.data.renewals.find((r: any) => r.id === renewalId);
        if (found) {
          setRenewal({
            id: found.id,
            clientId: found.clientId,
            policyId: found.policyId || found.id,
            clientName: found.clientName || 'Unknown',
            clientCompany: found.clientCompany || found.clientName || 'Unknown',
            policyType: found.policyType || 'General Liability',
            policyNumber: found.policyNumber || `POL-${found.id?.slice(0, 8)}`,
            carrier: found.carrier || 'Unknown Carrier',
            premium: found.premium || 0,
            coverageLimit: found.coverageLimit || 0,
            dueDate: found.expirationDate || found.dueDate,
            daysUntilRenewal: found.daysUntilRenewal || 0,
            riskScore: (found.riskScore?.toUpperCase() || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
            riskFactors: found.riskFactors || [],
            aiSummary: found.aiSummary,
            aiInsights: found.aiInsights || [],
            status: found.status || 'PENDING',
            emailsSent: found.emailsSent || 0,
            quotesReceived: found.quotesReceived || 0,
            lastTouchedAt: found.lastTouchedAt,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch renewal:', error);
      toast.error('Failed to load renewal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!renewalId) return;

    try {
      setIsSendingEmail(true);
      const response = await api.sendRenewalReminder(renewalId);
      if (response.data?.success) {
        toast.success('Renewal reminder sent!');
        await fetchRenewal();
      } else {
        toast.error(response.error || 'Failed to send email');
      }
    } catch (error) {
      toast.error('Failed to send reminder');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleGenerateBrief = async () => {
    if (!renewal) return;

    try {
      setIsGeneratingBrief(true);
      const response = await api.generateBrief({
        clientId: renewal.clientId,
        clientName: renewal.clientName,
        industry: 'Insurance',
        policyType: renewal.policyType,
        premium: renewal.premium,
        daysUntilRenewal: renewal.daysUntilRenewal,
        riskFactors: renewal.riskFactors,
        documentAnalyses: documentAnalyses.length > 0 ? documentAnalyses : undefined,
      });

      if (response.data?.brief) {
        setBrief(response.data.brief);
        setShowBrief(true);
        toast.success('Brief generated with document insights!');
      } else {
        toast.error('Failed to generate brief');
      }
    } catch (error) {
      toast.error('Failed to generate brief');
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Callback to receive document analyses from DocumentUpload component
  const handleDocumentAnalyzed = (docId: string, analysis: any) => {
    setDocumentAnalyses(prev => {
      const existing = prev.findIndex(a => a.documentId === docId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { documentId: docId, ...analysis };
        return updated;
      }
      return [...prev, { documentId: docId, ...analysis }];
    });
  };

  // Generate AI email draft
  const handleGenerateEmailDraft = async () => {
    if (!renewal) return;

    try {
      setIsGeneratingEmail(true);
      const response = await api.generateEmail({
        clientName: renewal.clientName,
        policyType: renewal.policyType,
        purpose: 'renewal_reminder',
        tone: 'friendly',
      });

      if (response.data?.email) {
        setEmailSubject(response.data.email.subject);
        setEmailBody(response.data.email.body);
      }
    } catch (error) {
      toast.error('Failed to generate email');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Schedule email
  const handleScheduleEmail = async () => {
    if (!renewal || !emailSubject || !emailBody || !scheduleDate) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsScheduling(true);
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${apiUrl}/api/email/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: `client@${renewal.clientCompany.toLowerCase().replace(/\s+/g, '')}.com`,
          subject: emailSubject,
          body: emailBody,
          scheduledFor: scheduledFor.toISOString(),
          clientId: renewal.clientId,
          renewalId: renewal.id,
        }),
      });

      if (response.ok) {
        toast.success(`Email scheduled for ${scheduledFor.toLocaleString()}`);
        setShowScheduleEmail(false);
        setEmailSubject('');
        setEmailBody('');
        setScheduleDate('');
      } else {
        toast.error('Failed to schedule email');
      }
    } catch (error) {
      toast.error('Failed to schedule email');
    } finally {
      setIsScheduling(false);
    }
  };

  // Open schedule dialog with pre-generated email
  const openScheduleEmailDialog = () => {
    if (!renewal) return;

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);

    // Pre-populate with a default subject
    setEmailSubject(`Renewal Reminder: ${renewal.policyType} Policy`);
    setEmailBody(`Dear ${renewal.clientName},\n\nThis is a friendly reminder about your upcoming ${renewal.policyType} policy renewal with ${renewal.carrier}.\n\nYour policy is due for renewal on ${formatDate(renewal.dueDate)}.\n\nPlease let me know if you have any questions or would like to discuss your coverage options.\n\nBest regards`);

    setShowScheduleEmail(true);
  };

  const handleExportPDF = () => {
    if (!renewal || !brief) {
      toast.error('Generate a brief first');
      return;
    }

    // Create printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Renewal Brief - ${renewal.clientName}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 24px; }
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; }
          .badge { background: #e5e7eb; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
          .badge.high { background: #fee2e2; color: #dc2626; }
          .badge.medium { background: #fef3c7; color: #d97706; }
          .badge.low { background: #d1fae5; color: #059669; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
          .stat { background: #f9fafb; padding: 16px; border-radius: 8px; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .stat-value { font-size: 20px; font-weight: bold; margin-top: 4px; }
          .section { margin: 24px 0; }
          .list { margin: 0; padding-left: 20px; }
          .list li { margin: 8px 0; }
          .risk-item { padding: 8px 12px; margin: 8px 0; border-left: 3px solid #dc2626; background: #fef2f2; }
          .insight-item { padding: 8px 12px; margin: 8px 0; border-left: 3px solid #4f46e5; background: #eef2ff; }
          .sources { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
          .source { font-size: 12px; color: #6b7280; margin: 4px 0; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${renewal.clientName}</h1>
            <p>${renewal.policyType} • ${renewal.carrier}</p>
          </div>
          <span class="badge ${renewal.riskScore.toLowerCase()}">${renewal.riskScore} Risk</span>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-label">Premium</div>
            <div class="stat-value">${formatCurrency(renewal.premium)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Coverage</div>
            <div class="stat-value">${formatCurrency(renewal.coverageLimit)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Days Left</div>
            <div class="stat-value">${renewal.daysUntilRenewal}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Due Date</div>
            <div class="stat-value">${formatDate(renewal.dueDate)}</div>
          </div>
        </div>

        <div class="section">
          <h2>Executive Summary</h2>
          <p>${brief.summary || 'No summary available.'}</p>
          ${documentAnalyses.length > 0 ? `
          <p style="margin-top: 12px; font-style: italic; color: #6b7280;">
            Based on analysis of ${documentAnalyses.length} document(s):
            ${documentAnalyses.map((d: any) => d.documentName || d.documentType).join(', ')}
          </p>
          ` : ''}
        </div>

        ${brief.riskFactors?.length > 0 ? `
        <div class="section">
          <h2>Risk Factors</h2>
          ${brief.riskFactors.map((r: string) => `<div class="risk-item">${r}</div>`).join('')}
        </div>
        ` : ''}

        ${documentAnalyses.some((d: any) => d.riskFactors?.length > 0) ? `
        <div class="section">
          <h2>Document-Identified Risks</h2>
          ${documentAnalyses.flatMap((d: any) =>
            (d.riskFactors || []).map((rf: any) =>
              `<div class="risk-item"><strong>[${rf.level}]</strong> ${rf.description} <em style="color:#6b7280;">[Source: ${d.documentName || d.documentType}]</em></div>`
            )
          ).join('')}
        </div>
        ` : ''}

        ${brief.insights?.length > 0 ? `
        <div class="section">
          <h2>Key Insights</h2>
          ${brief.insights.map((i: string) => `<div class="insight-item">${i}</div>`).join('')}
        </div>
        ` : ''}

        ${documentAnalyses.some((d: any) => d.summaryPoints?.length > 0) ? `
        <div class="section">
          <h2>Document Insights</h2>
          ${documentAnalyses.flatMap((d: any) =>
            (d.summaryPoints || []).map((sp: string) =>
              `<div class="insight-item">${sp} <em style="color:#6b7280;">[Source: ${d.documentName || d.documentType}]</em></div>`
            )
          ).join('')}
        </div>
        ` : ''}

        ${brief.actionItems?.length > 0 ? `
        <div class="section">
          <h2>Recommended Actions</h2>
          <ul class="list">
            ${brief.actionItems.map((a: string) => `<li>${a}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${brief.talkingPoints?.length > 0 ? `
        <div class="section">
          <h2>Talking Points</h2>
          <ul class="list">
            ${brief.talkingPoints.map((t: any) => `<li><strong>${t.type}:</strong> ${t.content}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div class="sources">
          <h3>Data Sources</h3>
          <div class="source">[Source: Quantara CRM - Client #${renewal.clientId.slice(0, 8)}]</div>
          <div class="source">[Source: Policy Management - Policy #${renewal.policyId.slice(0, 8)}]</div>
          <div class="source">[Source: Renewal Tracker - Renewal #${renewal.id.slice(0, 8)}]</div>
          ${documentAnalyses.map((d: any) =>
            `<div class="source">[Source: Document Analysis - ${d.documentName || d.documentType}]</div>`
          ).join('')}
        </div>

        <div class="footer">
          Generated by Quantara Broker Copilot • ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      toast.error('Please allow popups to export PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!renewal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Renewal not found</h2>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  const risk = riskConfig[renewal.riskScore];
  const status = statusConfig[renewal.status] || statusConfig.PENDING;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Back Button & Title */}
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>

          {/* Main Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{renewal.clientCompany}</h1>
                <Badge className={cn(risk.bg, risk.color, 'border', risk.border)}>
                  {risk.label}
                </Badge>
                <Badge className={cn(status.bg, status.color)}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {renewal.policyType}
                </span>
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {renewal.carrier}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due {formatDate(renewal.dueDate)}
                </span>
                <span className={cn(
                  'flex items-center gap-1 font-medium',
                  renewal.daysUntilRenewal <= 14 ? 'text-red-500' :
                  renewal.daysUntilRenewal <= 30 ? 'text-orange-500' : 'text-muted-foreground'
                )}>
                  <Clock className="h-4 w-4" />
                  {renewal.daysUntilRenewal} days left
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSendReminder}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Now
              </Button>
              <Button
                variant="outline"
                onClick={openScheduleEmailDialog}
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                Schedule Email
              </Button>
              <Button
                onClick={handleGenerateBrief}
                disabled={isGeneratingBrief}
              >
                {isGeneratingBrief ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                AI Brief
              </Button>
              {brief && (
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Brief Modal/Panel */}
      {showBrief && brief && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Generated Brief
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-1" />
                    Export PDF
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowBrief(false)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-2">Executive Summary</h3>
                <p className="text-muted-foreground">{brief.summary}</p>
              </div>

              {/* Risk Factors */}
              {brief.riskFactors?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Risk Factors
                  </h3>
                  <div className="space-y-2">
                    {brief.riskFactors.map((risk: string, i: number) => (
                      <div key={i} className="p-3 bg-red-50 dark:bg-red-950 border-l-4 border-red-500 rounded">
                        <p className="text-sm">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Insights */}
              {brief.insights?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Key Insights</h3>
                  <div className="space-y-2">
                    {brief.insights.map((insight: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {brief.actionItems?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Recommended Actions</h3>
                  <ul className="space-y-2">
                    {brief.actionItems.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 p-2 bg-muted rounded">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">{i + 1}</span>
                        <span className="text-sm">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data Sources */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-sm mb-2 text-muted-foreground">Data Sources</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    CRM - Client #{renewal.clientId.slice(0, 8)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Policy - #{renewal.policyId.slice(0, 8)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Renewal - #{renewal.id.slice(0, 8)}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Email Scheduling Modal */}
      {showScheduleEmail && renewal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" />
                  Schedule Email
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowScheduleEmail(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* AI Generate Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateEmailDraft}
                  disabled={isGeneratingEmail}
                >
                  {isGeneratingEmail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate with AI
                </Button>

                {/* Subject */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Email subject..."
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Message</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background min-h-[150px]"
                    placeholder="Email body..."
                  />
                </div>

                {/* Schedule Date/Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={handleScheduleEmail}
                    disabled={isScheduling || !emailSubject || !emailBody || !scheduleDate}
                  >
                    {isScheduling ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Schedule Email
                  </Button>
                  <Button variant="outline" onClick={() => setShowScheduleEmail(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Stats & Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Premium</p>
                    <p className="text-xl font-bold">{formatCurrency(renewal.premium)}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Coverage</p>
                    <p className="text-xl font-bold">{formatCurrency(renewal.coverageLimit)}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Emails Sent</p>
                    <p className="text-xl font-bold">{renewal.emailsSent}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Quotes</p>
                    <p className="text-xl font-bold">{renewal.quotesReceived}</p>
                  </Card>
                </div>

                {/* AI Summary */}
                {renewal.aiSummary && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      AI Summary
                    </h3>
                    <p className="text-sm text-muted-foreground">{renewal.aiSummary}</p>
                  </Card>
                )}

                {/* AI Insights */}
                {renewal.aiInsights.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Key Insights</h3>
                    <ul className="space-y-2">
                      {renewal.aiInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Risk Factors */}
                {renewal.riskFactors.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className={cn('h-4 w-4', risk.color)} />
                      Risk Factors
                    </h3>
                    <ul className="space-y-2">
                      {renewal.riskFactors.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={cn('h-1.5 w-1.5 rounded-full mt-2 shrink-0', risk.color.replace('text-', 'bg-'))} />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>

              {/* Right Column - Tasks Preview */}
              <div>
                <TaskList renewalId={renewal.id} onTaskUpdate={fetchRenewal} />
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <TaskList renewalId={renewal.id} onTaskUpdate={fetchRenewal} />
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes">
            <QuoteComparison
              renewalId={renewal.id}
              onQuoteSelect={() => {
                fetchRenewal();
                toast.success('Quote selected!');
              }}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <DocumentUpload
              renewalId={renewal.id}
              clientId={renewal.clientId}
              policyId={renewal.policyId}
              renewalContext={{
                clientName: renewal.clientName,
                policyType: renewal.policyType,
                premium: renewal.premium,
              }}
              onDocumentAnalyzed={handleDocumentAnalyzed}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
