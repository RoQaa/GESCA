/**
 * @module database.config
 * @description Prisma Client singleton.
 *
 * ARCHITECTURE NOTE:
 * A single PrismaClient instance is shared across the entire application.
 * Creating multiple instances causes connection pool exhaustion.
 *
 * In development with hot-reload (tsx watch), module caching via globalThis
 * prevents a new PrismaClient from being instantiated on every file change.
 * In production, the module is loaded once and cached by Node.js module system.
 */

import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from './env.config';

// ─── Extend globalThis to prevent multiple instances in dev hot-reload ─────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// ─── Log levels per environment ───────────────────────────────────────────────

const logLevels: Array<'query' | 'info' | 'warn' | 'error'> = isDevelopment()
  ? ['query', 'info', 'warn', 'error']
  : ['warn', 'error'];

// ─── Create or reuse the Prisma singleton ─────────────────────────────────────

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: logLevels,
    errorFormat: isDevelopment() ? 'pretty' : 'minimal',
  });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (isDevelopment()) {
  globalThis.__prisma = prisma;
}

// ─── Connection health check ──────────────────────────────────────────────────

/**
 * Verifies the database connection is alive.
 * Called once during server startup.
 * Throws if the database is unreachable so the server fails fast.
 */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.info(`✅ Database connected [${env.NODE_ENV}]`);
}

/**
 * Gracefully disconnects Prisma.
 * Called during server shutdown (SIGTERM/SIGINT).
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.info('🔌 Database disconnected');
}
