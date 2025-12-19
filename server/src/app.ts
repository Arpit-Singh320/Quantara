/**
 * Express Application Setup
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { rateLimiter } from './middleware/rateLimit.middleware.js';
import { requestLogger } from './middleware/logging.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import renewalRoutes from './routes/renewal.routes.js';
import clientRoutes from './routes/client.routes.js';
import policyRoutes from './routes/policy.routes.js';
import aiRoutes from './routes/ai.routes.js';
import connectorRoutes from './routes/connector.routes.js';
import emailRoutes from './routes/email.routes.js';
import taskRoutes from './routes/task.routes.js';
import documentRoutes from './routes/document.routes.js';
import quoteRoutes from './routes/quote.routes.js';
import calendarRoutes from './routes/calendar.routes.js';

const app = express();

// Trust proxy for Railway (behind load balancer)
app.set('trust proxy', 1);

// CORS - MUST be before all other middleware
// Handle preflight OPTIONS requests explicitly
app.options('*', cors({
  origin: [config.corsOrigin, 'https://quantara-three.vercel.app', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(cors({
  origin: [config.corsOrigin, 'https://quantara-three.vercel.app', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Security middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'Quantara Broker Copilot API',
    version: '1.0.0',
    description: 'AI-powered insurance broker renewal management platform',
    documentation: '/docs',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      renewals: '/api/renewals',
      clients: '/api/clients',
      policies: '/api/policies',
      ai: '/api/ai',
      connectors: '/api/connectors',
      email: '/api/email',
      tasks: '/api/tasks',
      documents: '/api/documents',
      quotes: '/api/quotes',
      calendar: '/api/calendar',
    },
    compliance: 'No document ingestion, RAG, or embeddings/vector DB used — connector-first in-context synthesis only.',
    timestamp: new Date().toISOString(),
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Documentation
app.get('/docs', (req, res) => {
  res.json({
    title: 'Quantara API Documentation',
    version: '1.0.0',
    baseUrl: '/api',
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      obtainToken: 'POST /api/auth/login',
    },
    endpoints: [
      {
        group: 'Authentication',
        routes: [
          { method: 'POST', path: '/api/auth/register', description: 'Register new user', auth: false },
          { method: 'POST', path: '/api/auth/login', description: 'Login and get JWT token', auth: false },
          { method: 'GET', path: '/api/auth/me', description: 'Get current user profile', auth: true },
        ],
      },
      {
        group: 'Renewals',
        routes: [
          { method: 'GET', path: '/api/renewals', description: 'List all renewals with filters', auth: true },
          { method: 'GET', path: '/api/renewals/:id', description: 'Get renewal by ID', auth: true },
          { method: 'GET', path: '/api/renewals/:id/brief', description: 'Get AI-generated brief for renewal', auth: true },
          { method: 'PUT', path: '/api/renewals/:id', description: 'Update renewal status', auth: true },
          { method: 'POST', path: '/api/renewals/import-csv', description: 'Import renewals from CSV data', auth: true },
        ],
      },
      {
        group: 'Clients',
        routes: [
          { method: 'GET', path: '/api/clients', description: 'List all clients', auth: true },
          { method: 'GET', path: '/api/clients/:id', description: 'Get client by ID', auth: true },
          { method: 'POST', path: '/api/clients', description: 'Create new client', auth: true },
        ],
      },
      {
        group: 'Policies',
        routes: [
          { method: 'GET', path: '/api/policies', description: 'List all policies', auth: true },
          { method: 'GET', path: '/api/policies/:id', description: 'Get policy by ID', auth: true },
        ],
      },
      {
        group: 'AI',
        routes: [
          { method: 'POST', path: '/api/ai/chat', description: 'AI chat with source citations and confidence', auth: false },
          { method: 'POST', path: '/api/ai/brief', description: 'Generate AI brief for renewal', auth: false },
          { method: 'POST', path: '/api/ai/email', description: 'Generate AI email draft', auth: false },
          { method: 'POST', path: '/api/ai/analyze-document', description: 'Analyze uploaded document', auth: true },
          { method: 'GET', path: '/api/ai/status', description: 'Check AI configuration status', auth: false },
        ],
      },
      {
        group: 'Documents',
        routes: [
          { method: 'GET', path: '/api/documents/renewal/:renewalId', description: 'Get documents for renewal', auth: true },
          { method: 'POST', path: '/api/documents/upload', description: 'Upload document for renewal', auth: true },
          { method: 'GET', path: '/api/documents/:id/analysis', description: 'Get AI analysis of document', auth: true },
        ],
      },
      {
        group: 'Email',
        routes: [
          { method: 'POST', path: '/api/email/send-renewal-reminder', description: 'Send renewal reminder email', auth: true },
          { method: 'POST', path: '/api/email/send-custom', description: 'Send custom email', auth: true },
          { method: 'POST', path: '/api/email/schedule', description: 'Schedule email for later', auth: true },
          { method: 'GET', path: '/api/email/scheduled', description: 'Get scheduled emails', auth: true },
        ],
      },
      {
        group: 'Connectors',
        routes: [
          { method: 'GET', path: '/api/connectors', description: 'List all connector statuses', auth: true },
          { method: 'POST', path: '/api/connectors/:type/connect', description: 'Initiate OAuth connection', auth: true },
          { method: 'POST', path: '/api/connectors/:type/disconnect', description: 'Disconnect connector', auth: true },
        ],
      },
      {
        group: 'Tasks',
        routes: [
          { method: 'GET', path: '/api/tasks/renewal/:renewalId', description: 'Get tasks for renewal', auth: true },
          { method: 'POST', path: '/api/tasks', description: 'Create new task', auth: true },
          { method: 'PUT', path: '/api/tasks/:id', description: 'Update task', auth: true },
        ],
      },
      {
        group: 'Quotes',
        routes: [
          { method: 'GET', path: '/api/quotes/renewal/:renewalId', description: 'Get quotes for renewal', auth: true },
          { method: 'POST', path: '/api/quotes/compare', description: 'Compare multiple quotes', auth: true },
        ],
      },
      {
        group: 'Calendar',
        routes: [
          { method: 'GET', path: '/api/calendar', description: 'Get calendar events', auth: true },
          { method: 'POST', path: '/api/calendar', description: 'Create calendar event', auth: true },
          { method: 'PUT', path: '/api/calendar/:id', description: 'Update calendar event', auth: true },
          { method: 'DELETE', path: '/api/calendar/:id', description: 'Delete calendar event', auth: true },
        ],
      },
    ],
    sourceAttribution: {
      description: 'All AI responses include source citations in format [Source: SystemName - Record #ID]',
      confidenceLevels: ['High (85%+)', 'Medium (70-84%)', 'Low (<70%)'],
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/connectors', connectorRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/calendar', calendarRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use(errorHandler);

export { app };
