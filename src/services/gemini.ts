/**
 * Gemini 2.0 Flash AI Service
 * Handles all AI-powered features: chat, briefs, insights, email generation
 */

import { Renewal, ChatMessage, Source } from '@/types/broker';

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface AIResponse {
  content: string;
  sources?: Source[];
  confidence?: number;
}

interface BriefResponse {
  summary: string;
  riskFactors: string[];
  insights: string[];
  actionItems: string[];
  talkingPoints: { type: 'risk' | 'opportunity' | 'info'; content: string }[];
}

interface EmailResponse {
  subject: string;
  body: string;
  tone: 'formal' | 'friendly' | 'urgent';
}

class GeminiService {
  private apiKey: string | null = null;

  /**
   * Initialize the service with an API key
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get API key from environment or localStorage
   */
  private getApiKey(): string {
    if (this.apiKey) return this.apiKey;

    // Try to get from environment (for backend use)
    if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
    }

    // Try to get from localStorage (for frontend demo)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gemini-api-key');
      if (stored) return stored;
    }

    throw new Error('Gemini API key not configured. Please set your API key.');
  }

  /**
   * Make a request to Gemini API
   */
  private async callGemini(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: GeminiMessage[] = []
  ): Promise<string> {
    const apiKey = this.getApiKey();

    const contents = [
      // System instruction as first user message
      {
        role: 'user' as const,
        parts: [{ text: `System Instructions: ${systemPrompt}\n\nNow respond to the following:` }]
      },
      {
        role: 'model' as const,
        parts: [{ text: 'I understand. I will follow these instructions carefully.' }]
      },
      // Conversation history
      ...conversationHistory,
      // Current user message
      {
        role: 'user' as const,
        parts: [{ text: userMessage }]
      }
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Stream a response from Gemini API
   */
  async *streamChat(
    query: string,
    context: { renewals?: Renewal[]; clientName?: string },
    history: ChatMessage[] = []
  ): AsyncGenerator<string, void, unknown> {
    const systemPrompt = `You are Quantara AI, an intelligent assistant for insurance brokers. You help with:
- Answering questions about client renewals and policies
- Providing insights about risk factors and opportunities
- Suggesting actions to improve renewal rates
- Drafting professional communications

Current context:
${context.clientName ? `Client: ${context.clientName}` : ''}
${context.renewals ? `Active renewals: ${context.renewals.length}` : ''}

Always be professional, concise, and actionable. When providing insights, cite specific data points.
Format your responses with clear structure using markdown when helpful.`;

    const conversationHistory: GeminiMessage[] = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    try {
      const response = await this.callGemini(systemPrompt, query, conversationHistory);

      // Simulate streaming by yielding chunks
      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield words[i] + (i < words.length - 1 ? ' ' : '');
        // Small delay for streaming effect
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    } catch (error) {
      yield `Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}`;
    }
  }

  /**
   * Generate a client brief using AI
   */
  async generateBrief(renewal: Renewal): Promise<BriefResponse> {
    const systemPrompt = `You are an AI assistant that generates comprehensive client briefs for insurance brokers.
Generate a structured brief with the following sections:
1. Executive Summary (2-3 sentences)
2. Risk Factors (list of specific risks)
3. Key Insights (actionable observations)
4. Recommended Actions (prioritized list)
5. Talking Points (categorized as risk, opportunity, or info)

Respond in valid JSON format matching this structure:
{
  "summary": "string",
  "riskFactors": ["string"],
  "insights": ["string"],
  "actionItems": ["string"],
  "talkingPoints": [{"type": "risk|opportunity|info", "content": "string"}]
}`;

    const userMessage = `Generate a brief for this renewal:
Client: ${renewal.client.company} (${renewal.client.name})
Industry: ${renewal.client.industry}
Policy Type: ${renewal.policy.type}
Carrier: ${renewal.policy.carrier}
Premium: $${renewal.policy.premium.toLocaleString()}
Coverage Limit: $${renewal.policy.coverageLimit.toLocaleString()}
Days Until Renewal: ${renewal.daysUntilRenewal}
Current Risk Score: ${renewal.riskScore}
Risk Factors: ${renewal.riskFactors.join(', ')}
Previous AI Insights: ${renewal.aiInsights.join(', ')}`;

    try {
      const response = await this.callGemini(systemPrompt, userMessage);

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      return JSON.parse(jsonMatch[0]) as BriefResponse;
    } catch (error) {
      // Return fallback brief on error
      return {
        summary: renewal.aiSummary || 'Unable to generate AI summary at this time.',
        riskFactors: renewal.riskFactors,
        insights: renewal.aiInsights,
        actionItems: [
          'Review current policy terms',
          'Schedule client meeting',
          'Prepare competitive quotes'
        ],
        talkingPoints: [
          { type: 'risk', content: 'Policy expiring soon - prioritize renewal discussion' },
          { type: 'opportunity', content: 'Consider coverage optimization based on client growth' },
          { type: 'info', content: 'Market conditions favor competitive pricing' }
        ]
      };
    }
  }

  /**
   * Generate an email draft using AI
   */
  async generateEmail(
    renewal: Renewal,
    purpose: 'renewal_reminder' | 'follow_up' | 'quote_request' | 'meeting_request',
    tone: 'formal' | 'friendly' | 'urgent' = 'friendly'
  ): Promise<EmailResponse> {
    const systemPrompt = `You are an AI assistant that drafts professional insurance broker emails.
Generate emails that are:
- Professional and appropriate for business communication
- Personalized with client details
- Clear about the purpose and any required actions
- Appropriately ${tone} in tone

Respond in valid JSON format:
{
  "subject": "string",
  "body": "string",
  "tone": "formal|friendly|urgent"
}`;

    const purposeDescriptions = {
      renewal_reminder: 'Remind the client about their upcoming policy renewal',
      follow_up: 'Follow up on a previous conversation or quote',
      quote_request: 'Request information needed to prepare renewal quotes',
      meeting_request: 'Request a meeting to discuss the renewal'
    };

    const userMessage = `Draft a ${tone} email for: ${purposeDescriptions[purpose]}

Client Details:
- Name: ${renewal.client.name}
- Company: ${renewal.client.company}
- Policy Type: ${renewal.policy.type}
- Days Until Renewal: ${renewal.daysUntilRenewal}
- Premium: $${renewal.policy.premium.toLocaleString()}`;

    try {
      const response = await this.callGemini(systemPrompt, userMessage);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      return JSON.parse(jsonMatch[0]) as EmailResponse;
    } catch (error) {
      // Return fallback email on error
      return {
        subject: `${renewal.policy.type} Renewal - ${renewal.client.company}`,
        body: `Dear ${renewal.client.name},\n\nI hope this message finds you well. I wanted to reach out regarding your upcoming ${renewal.policy.type} policy renewal.\n\nYour current policy is set to expire in ${renewal.daysUntilRenewal} days. I'd like to schedule some time to discuss your coverage needs and ensure we have the best options prepared for you.\n\nPlease let me know your availability for a brief call this week.\n\nBest regards`,
        tone
      };
    }
  }

  /**
   * Predict renewal risk using AI analysis
   */
  async predictRisk(renewal: Renewal): Promise<{ score: number; factors: string[]; recommendation: string }> {
    const systemPrompt = `You are an AI risk analyst for insurance renewals.
Analyze the provided renewal data and predict the risk of losing this client.

Respond in valid JSON format:
{
  "score": number (0-100, where 100 is highest risk),
  "factors": ["string"] (list of risk factors),
  "recommendation": "string" (single actionable recommendation)
}`;

    const userMessage = `Analyze renewal risk:
Client: ${renewal.client.company}
Industry: ${renewal.client.industry}
Days Until Renewal: ${renewal.daysUntilRenewal}
Current Risk Score: ${renewal.riskScore}
Premium: $${renewal.policy.premium.toLocaleString()}
Emails Sent: ${renewal.metrics.emailsSent}
Quotes Received: ${renewal.metrics.quotesReceived}
Last Touched: ${renewal.metrics.lastTouchedDays} days ago
Existing Risk Factors: ${renewal.riskFactors.join(', ')}`;

    try {
      const response = await this.callGemini(systemPrompt, userMessage);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Return fallback risk assessment
      const baseScore = renewal.riskScore === 'high' ? 75 : renewal.riskScore === 'medium' ? 50 : 25;
      return {
        score: baseScore,
        factors: renewal.riskFactors,
        recommendation: 'Schedule a client touchpoint within the next 48 hours.'
      };
    }
  }

  /**
   * Answer a question about renewals/clients
   */
  async answerQuestion(
    query: string,
    context: { renewals: Renewal[] }
  ): Promise<AIResponse> {
    const systemPrompt = `You are Quantara AI, helping insurance brokers with their renewal pipeline.
Answer questions based on the provided renewal data. Be specific and cite data when possible.
If asked about specific clients or policies, reference the exact data provided.`;

    const renewalSummary = context.renewals.map(r =>
      `- ${r.client.company}: ${r.policy.type}, $${r.policy.premium.toLocaleString()}, ${r.daysUntilRenewal} days, ${r.riskScore} risk`
    ).join('\n');

    const userMessage = `Renewal Data:\n${renewalSummary}\n\nQuestion: ${query}`;

    try {
      const content = await this.callGemini(systemPrompt, userMessage);
      return { content, confidence: 0.85 };
    } catch (error) {
      return {
        content: `I apologize, but I couldn't process your question. ${error instanceof Error ? error.message : 'Please try again.'}`,
        confidence: 0
      };
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export type { AIResponse, BriefResponse, EmailResponse };
