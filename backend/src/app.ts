/**
 * @module app
 * @description Express application factory.
 *
 * ARCHITECTURE NOTE:
 * app.ts creates and configures the Express application.
 * server.ts creates the HTTP server and handles process lifecycle.
 * Separation allows app.ts to be imported in integration tests without
 * starting a real HTTP server.
 *
 * Middleware order is critical in Express — this is the exact order:
 * 1. Security headers (Helmet)
 * 2. CORS
 * 3. Request ID (must be first for log correlation)
 * 4. Compression
 * 5. Request logging
 * 6. Rate limiting
 * 7. Body parsing
 * 8. Sanitization
 * 9. Static files
 * 10. Routes
 * 11. 404 handler
 * 12. Global error handler (must be last)
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import path from 'path';

import { corsOptions } from './config/cors.config';
import { requestIdMiddleware } from './middlewares/requestId.middleware';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { globalLimiter } from './middlewares/rateLimiter.middleware';
import { sanitizeRequest } from './utils/sanitize.util';
import { globalErrorHandler } from './middlewares/errorHandler.middleware';
import { NotFoundError } from './exceptions';

// ─── Import route modules (to be added as each module is built) ───────────────
import { apiRoutes } from './routes';


// ─── Application factory ──────────────────────────────────────────────────────

export function createApp(): Application {
  const app = express();

  // ── 1. Security HTTP headers ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow image embedding
    }),
  );

  // ── 2. CORS ───────────────────────────────────────────────────────────────
  app.use(cors(corsOptions));

  // Set Cross-Origin-Resource-Policy for public assets
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });

  // ── 3. Request ID (must be early for log correlation) ────────────────────
  app.use(requestIdMiddleware);

  // ── 4. Response compression ───────────────────────────────────────────────
  app.use(
    compression({
      level: 6,       // Balanced CPU vs compression ratio
      threshold: 1024, // Only compress responses > 1kb
    }),
  );

  // ── 5. Request logging ────────────────────────────────────────────────────
  app.use(requestLoggerMiddleware);

  // ── 6. Global rate limiting ───────────────────────────────────────────────
  app.use('/api', globalLimiter);

  // ── 7. Body parsing ───────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── 8. XSS sanitization ───────────────────────────────────────────────────
  app.use(sanitizeRequest);

  // ── 9. Static file serving ────────────────────────────────────────────────
  app.use('/api/public', express.static(path.join(__dirname, '../uploads')));

  // ── 10. API health check ──────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'GESCA API is running',
      data: {
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  });

  // ── 11. API Routes (mounted incrementally per module) ─────────────────────
  app.use('/api/v1', apiRoutes);

  // ── 12. 404 handler (catch-all for undefined routes) ──────────────────────
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.originalUrl}`));
  });

  // ── 13. Global error handler (MUST be last middleware) ────────────────────
  app.use(globalErrorHandler);

  return app;
}
