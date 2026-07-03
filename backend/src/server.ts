/**
 * @module server
 * @description HTTP server entry point and process lifecycle management.
 *
 * ARCHITECTURE NOTE:
 * Responsibilities:
 * 1. Load environment variables FIRST (before any other import)
 * 2. Connect to the database
 * 3. Create the Express application
 * 4. Start the HTTP server
 * 5. Handle graceful shutdown on SIGTERM/SIGINT
 * 6. Handle uncaught exceptions and unhandled rejections
 *
 * Graceful shutdown:
 * - Stop accepting new connections
 * - Wait for in-flight requests to complete (30s timeout)
 * - Disconnect Prisma
 * - Exit cleanly
 *
 * This pattern ensures zero-downtime deployments with process managers
 * like PM2, Kubernetes, or Docker Compose.
 */

import 'dotenv/config'; // Must be absolute first import

import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database.config';
import { env } from './config/env.config';
import { log } from './config/logger.config';

// ─── Uncaught exception handler ───────────────────────────────────────────────
// Handles synchronous exceptions that escape all try/catch blocks.
// These are almost always programming bugs — log and exit immediately.

process.on('uncaughtException', (err: Error) => {
  log.error('UNCAUGHT EXCEPTION — shutting down', {
    error: err.message,
    stack: err.stack,
    module: 'server',
  });
  process.exit(1);
});

// ─── Application bootstrap ────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to the database (fails fast if DB is unreachable)
    await connectDatabase();

    // 2. Create the Express app
    const app = createApp();

    // 3. Create and start the HTTP server
    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      log.info(`🚀 GESCA API Server started`, {
        port: env.PORT,
        environment: env.NODE_ENV,
        module: 'server',
      });
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────

    const gracefulShutdown = async (signal: string): Promise<void> => {
      log.info(`${signal} received — initiating graceful shutdown`, { module: 'server' });

      // 1. Stop accepting new connections
      server.close(async () => {
        log.info('HTTP server closed — no new connections accepted', { module: 'server' });

        try {
          // 2. Disconnect Prisma
          await disconnectDatabase();
          log.info('✅ Graceful shutdown complete', { module: 'server' });
          process.exit(0);
        } catch (err) {
          log.error('Error during graceful shutdown', {
            error: err instanceof Error ? err.message : String(err),
            module: 'server',
          });
          process.exit(1);
        }
      });

      // 3. Force-exit if graceful shutdown takes too long
      setTimeout(() => {
        log.error('Graceful shutdown timed out — forcing exit', { module: 'server' });
        process.exit(1);
      }, 30_000);
    };

    process.on('SIGTERM', () => { void gracefulShutdown('SIGTERM'); });
    process.on('SIGINT', () => { void gracefulShutdown('SIGINT'); });

    // ── Unhandled promise rejection handler ────────────────────────────────
    // Handles async errors that escape all try/catch and catchAsync wrappers.

    process.on('unhandledRejection', (reason: unknown) => {
      log.error('UNHANDLED REJECTION — shutting down', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        module: 'server',
      });

      server.close(() => {
        process.exit(1);
      });
    });
  } catch (err) {
    log.error('Failed to start server', {
      error: err instanceof Error ? err.message : String(err),
      module: 'server',
    });
    process.exit(1);
  }
}

void bootstrap();
