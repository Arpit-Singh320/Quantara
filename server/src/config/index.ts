/**
 * Application Configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Configuration schema
const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(3001),
  apiUrl: z.string().default('http://localhost:3001'),

  // Database
  databaseUrl: z.string().optional(),

  // JWT
  jwtSecret: z.string().min(32).default('development-secret-key-change-me-in-production'),
  jwtExpiry: z.string().default('24h'),

  // Gemini AI
  geminiApiKey: z.string().optional(),

  // OAuth - Microsoft
  microsoftClientId: z.string().optional(),
  microsoftClientSecret: z.string().optional(),
  microsoftTenantId: z.string().optional(),

  // OAuth - Salesforce
  salesforceClientId: z.string().optional(),
  salesforceClientSecret: z.string().optional(),

  // OAuth - Google
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),

  // OAuth - HubSpot
  hubspotClientId: z.string().optional(),
  hubspotClientSecret: z.string().optional(),

  // Encryption
  encryptionKey: z.string().min(32).optional(),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().default(100),

  // CORS
  corsOrigin: z.string().default('http://localhost:8080'),

  // Logging
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Parse and validate configuration
const parseConfig = () => {
  const result = configSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    apiUrl: process.env.API_URL,
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    microsoftClientId: process.env.MICROSOFT_CLIENT_ID,
    microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    microsoftTenantId: process.env.MICROSOFT_TENANT_ID,
    salesforceClientId: process.env.SALESFORCE_CLIENT_ID,
    salesforceClientSecret: process.env.SALESFORCE_CLIENT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    hubspotClientId: process.env.HUBSPOT_CLIENT_ID,
    hubspotClientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
    corsOrigin: process.env.CORS_ORIGIN,
    logLevel: process.env.LOG_LEVEL,
  });

  if (!result.success) {
    console.error('❌ Invalid configuration:', result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
};

export const config = parseConfig();
export type Config = z.infer<typeof configSchema>;
