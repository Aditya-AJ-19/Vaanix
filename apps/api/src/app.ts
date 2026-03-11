import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFoundHandler } from './core/error.middleware';
import { requestLogger } from './core/logger';
import { healthRouter } from './modules/health/health.routes';
import { agentRouter } from './modules/agents/agent.routes';
import { knowledgeRouter } from './modules/knowledge/knowledge.routes';

const app = express();

// ===========================
// Global Middleware
// ===========================

// Security headers
app.use(helmet());

// CORS
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    }),
);

// Rate limiting
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
    }),
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// ===========================
// Routes
// ===========================

app.use('/api', healthRouter);
app.use('/api/agents', agentRouter);
app.use('/api/knowledge-bases', knowledgeRouter);

// ===========================
// Error Handling
// ===========================

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
