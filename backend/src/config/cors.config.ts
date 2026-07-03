/**
 * @module cors.config
 * @description CORS options built from environment configuration.
 *
 * ARCHITECTURE NOTE:
 * Origins are read from CORS_ORIGINS env var as a comma-separated list.
 * In production, wildcard '*' is never used — only explicit allowlist.
 * Preflight requests (OPTIONS) are cached for 600 seconds to reduce network overhead.
 */

import { CorsOptions } from 'cors';
import { corsOrigins, isProduction } from './env.config';
import { log } from './logger.config';

// ─── Allowed origin check ─────────────────────────────────────────────────────

function buildOriginChecker(): CorsOptions['origin'] {
  const allowedOrigins = corsOrigins();

  if (!isProduction()) {
    // In development — log every request origin for debugging
    return (origin, callback) => {
      log.debug(`CORS origin check: ${origin ?? 'no-origin'}`);
      callback(null, true); // Allow all in dev
    };
  }

  return (origin, callback) => {
    // Allow server-to-server requests (no origin header) — e.g., mobile apps, curl
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log.warn(`CORS blocked origin: ${origin}`, { module: 'cors' });
      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    }
  };
}

// ─── CORS options object ──────────────────────────────────────────────────────

export const corsOptions: CorsOptions = {
  origin: buildOriginChecker(),
  credentials: true,               // Allow cookies & Authorization headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Refresh-Token',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Total-Count',
    'X-Page-Size',
  ],
  maxAge: 600,                     // Cache preflight for 600 seconds
  optionsSuccessStatus: 204,
};
