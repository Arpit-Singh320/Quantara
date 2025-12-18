/**
 * Email Service using Brevo (Sendinblue)
 * Handles transactional email sending for renewals, notifications, etc.
 */

import * as Brevo from '@getbrevo/brevo';

// Initialize Brevo API with API key
function getApiInstance(): Brevo.TransactionalEmailsApi {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');
  return apiInstance;
}

export interface SendEmailOptions {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: string;
  tags?: string[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
}

// Pre-defined email templates
export const EMAIL_TEMPLATES = {
  RENEWAL_REMINDER: {
    id: 'renewal_reminder',
    name: 'Renewal Reminder',
    subject: 'Your {{policy_type}} Policy Renewal - Action Required',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00263A; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Quantara</h1>
          <p style="color: #8B9EB3; margin: 5px 0 0;">Insurance Intelligence Platform</p>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #00263A;">Hello {{client_name}},</h2>
          <p>Your <strong>{{policy_type}}</strong> policy with {{carrier}} is due for renewal in <strong>{{days_until_renewal}} days</strong>.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #00263A;">Policy Details</h3>
            <p><strong>Policy Number:</strong> {{policy_number}}</p>
            <p><strong>Current Premium:</strong> {{premium}}</p>
            <p><strong>Coverage Limit:</strong> {{coverage_limit}}</p>
            <p><strong>Expiration Date:</strong> {{expiration_date}}</p>
          </div>
          <p>Please review your coverage needs and let us know if you'd like to discuss any changes or get quotes from other carriers.</p>
          <a href="{{action_url}}" style="display: inline-block; background: #00263A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Review Renewal</a>
        </div>
        <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This email was sent by Quantara on behalf of your insurance broker.</p>
        </div>
      </div>
    `,
  },
  QUOTE_REQUEST: {
    id: 'quote_request',
    name: 'Quote Request',
    subject: 'Quote Request for {{client_company}} - {{policy_type}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00263A; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Quote Request</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>New Quote Request</h2>
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <p><strong>Client:</strong> {{client_company}}</p>
            <p><strong>Contact:</strong> {{client_name}} ({{client_email}})</p>
            <p><strong>Policy Type:</strong> {{policy_type}}</p>
            <p><strong>Current Premium:</strong> {{premium}}</p>
            <p><strong>Coverage Limit:</strong> {{coverage_limit}}</p>
            <p><strong>Effective Date Needed:</strong> {{effective_date}}</p>
          </div>
          <h3>Notes:</h3>
          <p>{{notes}}</p>
        </div>
      </div>
    `,
  },
  MEETING_CONFIRMATION: {
    id: 'meeting_confirmation',
    name: 'Meeting Confirmation',
    subject: 'Meeting Confirmed: {{meeting_title}}',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00263A; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Meeting Confirmed</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>{{meeting_title}}</h2>
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <p><strong>Date:</strong> {{meeting_date}}</p>
            <p><strong>Time:</strong> {{meeting_time}}</p>
            <p><strong>Location:</strong> {{meeting_location}}</p>
            <p><strong>Attendees:</strong> {{attendees}}</p>
          </div>
          <p>{{meeting_description}}</p>
          <a href="{{calendar_link}}" style="display: inline-block; background: #00263A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px;">Add to Calendar</a>
        </div>
      </div>
    `,
  },
};

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

/**
 * Send a transactional email
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[Email Service] BREVO_API_KEY not set - email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.to = [{ email: options.to, name: options.toName }];
    sendSmtpEmail.sender = {
      email: process.env.SENDER_EMAIL || 'noreply@quantara.io',
      name: process.env.SENDER_NAME || 'Quantara'
    };
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.htmlContent;

    if (options.textContent) {
      sendSmtpEmail.textContent = options.textContent;
    }

    if (options.replyTo) {
      sendSmtpEmail.replyTo = { email: options.replyTo };
    }

    if (options.tags) {
      sendSmtpEmail.tags = options.tags;
    }

    const apiInstance = getApiInstance();
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log(`[Email Service] Email sent to ${options.to}, messageId: ${response.body.messageId}`);

    return {
      success: true,
      messageId: response.body.messageId
    };
  } catch (error: any) {
    console.error('[Email Service] Failed to send email:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

/**
 * Send a renewal reminder email
 */
export async function sendRenewalReminder(params: {
  to: string;
  toName: string;
  clientName: string;
  policyType: string;
  carrier: string;
  policyNumber: string;
  premium: string;
  coverageLimit: string;
  daysUntilRenewal: number;
  expirationDate: string;
  actionUrl?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = EMAIL_TEMPLATES.RENEWAL_REMINDER;

  const htmlContent = replaceTemplateVariables(template.htmlContent, {
    client_name: params.clientName,
    policy_type: params.policyType,
    carrier: params.carrier,
    policy_number: params.policyNumber,
    premium: params.premium,
    coverage_limit: params.coverageLimit,
    days_until_renewal: params.daysUntilRenewal.toString(),
    expiration_date: params.expirationDate,
    action_url: params.actionUrl || 'https://app.quantara.io/renewals',
  });

  const subject = replaceTemplateVariables(template.subject, {
    policy_type: params.policyType,
  });

  return sendEmail({
    to: params.to,
    toName: params.toName,
    subject,
    htmlContent,
    tags: ['renewal', 'reminder'],
  });
}

/**
 * Send a custom email with AI-generated content
 */
export async function sendCustomEmail(params: {
  to: string;
  toName: string;
  subject: string;
  body: string;
  senderName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding: 30px;">
        ${params.body.split('\n').map(p => `<p>${p}</p>`).join('')}
      </div>
      <div style="padding: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>Sent via Quantara</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: params.to,
    toName: params.toName,
    subject: params.subject,
    htmlContent,
    tags: ['custom', 'ai-generated'],
  });
}
