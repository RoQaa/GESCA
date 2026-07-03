/**
 * @module env.config
 * @description Environment variable validation using Zod.
 *
 * ARCHITECTURE NOTE:
 * All env vars are validated at startup. If any required variable is missing
 * or has an invalid type/format, the application crashes immediately with a
 * descriptive error — this is intentional (fail-fast principle).
 * This prevents the app from running in a broken state.
 *
 * All env vars are accessed ONLY through this module — never process.env directly
 * in business code. This gives us type-safety and a single source of truth.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (f:/GESCA/backend/.env)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─── Schema Definition ─────────────────────────────────────────────────────────

const envSchema = z.object({
  // ── Application ───────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform(Number)
    .refine((n) => n > 0 && n < 65536, { message: 'PORT must be between 1 and 65535' })
    .default('3000'),
  APP_URL: z.string().url({ message: 'APP_URL must be a valid URL' }),
  CLIENT_URL: z.string().url({ message: 'CLIENT_URL must be a valid URL' }),

  // ── Database ──────────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .min(1, { message: 'DATABASE_URL is required' })
    .startsWith('postgresql://', { message: 'DATABASE_URL must be a PostgreSQL connection string' }),

  // ── JWT ───────────────────────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters for security' }),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters for security' }),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ── SMTP ──────────────────────────────────────────────────────────────────────
  SMTP_HOST: z.string().min(1, { message: 'SMTP_HOST is required' }),
  SMTP_PORT: z
    .string()
    .transform(Number)
    .refine((n) => n > 0 && n < 65536)
    .default('587'),
  SMTP_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  SMTP_USER: z.string().email({ message: 'SMTP_USER must be a valid email' }),
  SMTP_PASS: z.string().min(1, { message: 'SMTP_PASS is required' }),
  SMTP_FROM_NAME: z.string().default('GESCA System'),
  SMTP_FROM_EMAIL: z.string().email(),

  // ── File Uploads ──────────────────────────────────────────────────────────────
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('10'),
  THUMB_WIDTH: z.string().transform(Number).default('200'),
  THUMB_HEIGHT: z.string().transform(Number).default('200'),
  IMAGE_MAX_WIDTH: z.string().transform(Number).default('1920'),
  IMAGE_MAX_HEIGHT: z.string().transform(Number).default('1920'),
  IMAGE_QUALITY: z.string().transform(Number).default('85'),

  // ── CORS ──────────────────────────────────────────────────────────────────────
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // ── Rate Limiting ─────────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AUTH_RATE_LIMIT_MAX: z.string().transform(Number).default('10'),

  // ── Logging ───────────────────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_DIR: z.string().default('./logs'),

  // ── GPS ───────────────────────────────────────────────────────────────────────
  GPS_GEOFENCE_RADIUS_METERS: z.string().transform(Number).default('200'),
  GPS_MOCK_ACCURACY_THRESHOLD: z.string().transform(Number).default('5'),
  GPS_MAX_SPEED_KMH: z.string().transform(Number).default('5'),

  // ── Bcrypt ────────────────────────────────────────────────────────────────────
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),

  // ── Password Reset ────────────────────────────────────────────────────────────
  PASSWORD_RESET_EXPIRES_MINUTES: z.string().transform(Number).default('15'),
  EMAIL_VERIFY_EXPIRES_HOURS: z.string().transform(Number).default('24'),
});

// ─── Inferred TypeScript Type ─────────────────────────────────────────────────

export type EnvConfig = z.infer<typeof envSchema>;

// ─── Validation & Export ──────────────────────────────────────────────────────

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  const formatted = parseResult.error.format();
  console.error('❌ Invalid environment variables:\n');
  Object.entries(formatted).forEach(([key, value]) => {
    if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value) {
      const errors = (value as { _errors: string[] })._errors;
      if (errors.length > 0) {
        console.error(`  ${key}: ${errors.join(', ')}`);
      }
    }
  });
  console.error('\nFix the above environment variables and restart the server.');
  process.exit(1);
}

/**
 * Validated, typed environment configuration.
 * Import this anywhere in the app instead of accessing process.env directly.
 *
 * @example
 * import { env } from '@config/env.config';
 * const port = env.PORT; // typed as number
 */
export const env = parseResult.data;

/** Convenience helpers */
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isTest = (): boolean => env.NODE_ENV === 'test';

/** Parsed CORS origins as an array */
export const corsOrigins = (): string[] =>
  env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
