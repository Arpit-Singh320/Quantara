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

const app = express();

// Trust proxy for Railway (behind load balancer)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/connectors', connectorRoutes);

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
