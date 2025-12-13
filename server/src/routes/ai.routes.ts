/**
 * AI Routes - Gemini 2.0 Flash Integration
 */

import { Router, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { config } from '../config/index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { strictRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Initialize Gemini client
const getGeminiClient = () => {
  if (!config.geminiApiKey) {
    throw createError('Gemini API key not configured', 500);
  }
  return new GoogleGenerativeAI(config.geminiApiKey);
};

// Validation schemas
const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  context: z.object({
    clientName: z.string().optional(),
    renewalId: z.string().optional(),
  }).optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
});

const briefSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  industry: z.string(),
  policyType: z.string(),
  premium: z.number(),
  daysUntilRenewal: z.number(),
  riskFactors: z.array(z.string()).optional(),
});

const emailSchema = z.object({
  clientName: z.string(),
  policyType: z.string(),
  purpose: z.enum(['renewal_reminder', 'follow_up', 'quote_request', 'meeting_request']),
  tone: z.enum(['formal', 'friendly', 'urgent']).optional(),
});

// System prompts
const SYSTEM_PROMPTS = {
  chat: `You are Quantara AI, an intelligent assistant for insurance brokers. You help with:
- Answering questions about client renewals and policies
- Providing insights about risk factors and opportunities
- Suggesting actions to improve renewal rates
- Drafting professional communications

Always be professional, concise, and actionable. When providing insights, cite specific data points.
Format your responses with clear structure using markdown when helpful.`,

  brief: `You are an AI assistant that generates comprehensive client briefs for insurance brokers.
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
}`,

  email: `You are an AI assistant that drafts professional insurance broker emails.
Generate emails that are:
- Professional and appropriate for business communication
- Personalized with client details
- Clear about the purpose and any required actions

Respond in valid JSON format:
{
  "subject": "string",
  "body": "string"
}`,
};

// POST /api/ai/chat - Public endpoint (no auth required for MVP)
router.post('/chat', strictRateLimiter, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = chatSchema.parse(req.body);
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: `System: ${SYSTEM_PROMPTS.chat}` }] },
        { role: 'model', parts: [{ text: 'I understand. I will help you with insurance-related questions.' }] },
        ...(data.history || []).map(h => ({
          role: h.role as 'user' | 'model',
          parts: [{ text: h.content }],
        })),
      ],
    });

    const contextPrefix = data.context?.clientName
      ? `[Context: Client ${data.context.clientName}] `
      : '';

    const result = await chat.sendMessage(contextPrefix + data.message);
    const response = result.response.text();

    res.json({
      message: response,
      model: 'gemini-2.0-flash',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
});

// POST /api/ai/brief - Public endpoint for MVP
router.post('/brief', strictRateLimiter, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = briefSchema.parse(req.body);
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Generate a brief for this renewal:
Client: ${data.clientName}
Industry: ${data.industry}
Policy Type: ${data.policyType}
Premium: $${data.premium.toLocaleString()}
Days Until Renewal: ${data.daysUntilRenewal}
${data.riskFactors ? `Risk Factors: ${data.riskFactors.join(', ')}` : ''}`;

    const result = await model.generateContent([
      { text: SYSTEM_PROMPTS.brief },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw createError('Invalid AI response format', 500);
    }

    const brief = JSON.parse(jsonMatch[0]);

    res.json({
      brief,
      model: 'gemini-2.0-flash',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else if (error instanceof SyntaxError) {
      next(createError('Failed to parse AI response', 500));
    } else {
      next(error);
    }
  }
});

// POST /api/ai/email - Public endpoint for MVP
router.post('/email', strictRateLimiter, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = emailSchema.parse(req.body);
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const purposeDescriptions = {
      renewal_reminder: 'Remind the client about their upcoming policy renewal',
      follow_up: 'Follow up on a previous conversation or quote',
      quote_request: 'Request information needed to prepare renewal quotes',
      meeting_request: 'Request a meeting to discuss the renewal',
    };

    const prompt = `Draft a ${data.tone || 'friendly'} email for: ${purposeDescriptions[data.purpose]}

Client: ${data.clientName}
Policy Type: ${data.policyType}`;

    const result = await model.generateContent([
      { text: SYSTEM_PROMPTS.email },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw createError('Invalid AI response format', 500);
    }

    const email = JSON.parse(jsonMatch[0]);

    res.json({
      email,
      model: 'gemini-2.0-flash',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else if (error instanceof SyntaxError) {
      next(createError('Failed to parse AI response', 500));
    } else {
      next(error);
    }
  }
});

// GET /api/ai/status - Public endpoint
router.get('/status', (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    configured: !!config.geminiApiKey,
    model: 'gemini-2.0-flash',
  });
});

export default router;
