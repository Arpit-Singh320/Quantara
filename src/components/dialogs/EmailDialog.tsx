/**
 * EmailDialog Component
 * Dialog for composing and sending emails with AI-generated content
 */

import { useState } from 'react';
import { Loader2, Mail, Sparkles, Send, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientEmail?: string;
  policyType: string;
  renewalId?: string;
  onSuccess?: () => void;
  // Enhanced data for personalization
  broker?: {
    name: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
  };
  client?: {
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    companyName?: string;
    industry?: string;
  };
  policy?: {
    id?: string;
    carrier?: string;
    premium?: number;
    coverage?: number;
    expiryDate?: string;
    daysUntilRenewal?: number;
  };
  activity?: {
    emailsSent?: number;
    quotes?: number;
    lastTouch?: string;
    riskLevel?: string;
  };
}

const emailPurposes = [
  { value: 'renewal_reminder', label: 'Renewal Reminder', description: 'Remind about upcoming policy renewal' },
  { value: 'follow_up', label: 'Follow Up', description: 'Follow up on previous conversation' },
  { value: 'quote_request', label: 'Quote Request', description: 'Request information for quotes' },
  { value: 'meeting_request', label: 'Meeting Request', description: 'Request a meeting to discuss renewal' },
];

const emailTones = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'urgent', label: 'Urgent' },
];

export function EmailDialog({
  open,
  onOpenChange,
  clientName,
  clientEmail,
  policyType,
  renewalId,
  onSuccess,
  broker,
  client,
  policy,
  activity,
}: EmailDialogProps) {
  const [step, setStep] = useState<'select' | 'compose' | 'preview'>('select');
  const [purpose, setPurpose] = useState<string>('');
  const [tone, setTone] = useState<string>('friendly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const [emailData, setEmailData] = useState({
    to: clientEmail || '',
    subject: '',
    body: '',
  });

  const handleGenerateEmail = async () => {
    if (!purpose) {
      toast.error('Please select an email purpose');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.generateEmail({
        clientName,
        policyType,
        purpose: purpose as 'renewal_reminder' | 'follow_up' | 'quote_request' | 'meeting_request' | 'final_reminder' | 'welcome' | 'thank_you',
        tone: tone as 'formal' | 'friendly' | 'urgent',
        broker,
        client,
        policy,
        activity,
      });

      if (response.data?.email) {
        setEmailData(prev => ({
          ...prev,
          subject: response.data!.email.subject,
          body: response.data!.email.body,
        }));
        setStep('compose');
        toast.success('Email draft generated!');
      } else {
        toast.error(response.error || 'Failed to generate email');
      }
    } catch (error) {
      console.error('Failed to generate email:', error);
      toast.error('Failed to generate email draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSending(true);
    try {
      const response = await api.sendCustomEmail({
        to: emailData.to,
        toName: clientName,
        subject: emailData.subject,
        body: emailData.body,
        clientId: renewalId,
      });

      if (response.data?.success) {
        toast.success('Email sent successfully!');
        onSuccess?.();
        handleClose();
      } else {
        toast.error(response.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyToClipboard = async () => {
    const text = `Subject: ${emailData.subject}\n\n${emailData.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep('select');
    setPurpose('');
    setTone('friendly');
    setEmailData({ to: clientEmail || '', subject: '', body: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {step === 'select' ? 'Compose Email' : step === 'compose' ? 'Edit Email' : 'Preview Email'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? `Send an email to ${clientName}. Choose the type of email and let AI draft it for you.`
              : step === 'compose'
              ? 'Review and edit the AI-generated email before sending.'
              : 'Final preview before sending.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6 py-4">
            {/* Email Purpose Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">What would you like to email about?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {emailPurposes.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPurpose(p.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      purpose === p.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {emailTones.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="to">Recipient Email</Label>
              <Input
                id="to"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerateEmail} disabled={!purpose || isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'compose' && (
          <div className="space-y-4 py-4">
            {/* To Field */}
            <div className="space-y-2">
              <Label htmlFor="compose-to">To</Label>
              <Input
                id="compose-to"
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                placeholder="client@example.com"
              />
            </div>

            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>

            {/* Body Field */}
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Email body"
                rows={12}
                className="resize-none font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">AI-generated draft. Feel free to edit before sending.</span>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button variant="outline" onClick={handleCopyToClipboard}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="outline" onClick={handleGenerateEmail} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Regenerate
              </Button>
              <Button onClick={handleSendEmail} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EmailDialog;
