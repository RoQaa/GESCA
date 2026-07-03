/**
 * @module logger.config
 * @description Winston logger factory with daily log rotation.
 *
 * ARCHITECTURE NOTE:
 * Four separate transports are created:
 *  - Console:  Development only, with colorized output
 *  - Combined: All logs at or above the configured level (info/debug)
 *  - Error:    Only error-level logs — for fast alerting/monitoring
 *  - Access:   HTTP request logs (written by requestLogger middleware)
 *  - Audit:    Security-sensitive actions (login, password change, role change)
 *
 * Log files rotate daily and are kept for 30 days.
 * Each log entry is a JSON object — machine-parseable for log aggregators (Datadog, ELK).
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env, isDevelopment } from './env.config';

// ─── Log directory ────────────────────────────────────────────────────────────

const LOG_DIR = path.resolve(process.cwd(), env.LOG_DIR);

// ─── Custom log format ────────────────────────────────────────────────────────

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const rid = requestId ? ` [${String(requestId)}]` : '';
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${String(timestamp)}${rid} ${level}: ${String(message)}${metaStr}`;
  }),
);

// ─── Rotation transport factory ───────────────────────────────────────────────

function createRotatingTransport(
  subDir: string,
  level: string,
): DailyRotateFile {
  return new DailyRotateFile({
    dirname: path.join(LOG_DIR, subDir),
    filename: '%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level,
    format: jsonFormat,
  });
}

// ─── Transport definitions ────────────────────────────────────────────────────

const transports: winston.transport[] = [
  createRotatingTransport('combined', env.LOG_LEVEL),
  createRotatingTransport('error', 'error'),
];

if (isDevelopment()) {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    }),
  );
}

// ─── Main application logger ──────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports,
  exitOnError: false,
  silent: env.NODE_ENV === 'test',
});

// ─── Access logger (HTTP requests) ────────────────────────────────────────────

export const accessLogger = winston.createLogger({
  level: 'http',
  transports: [createRotatingTransport('access', 'http')],
  exitOnError: false,
  silent: env.NODE_ENV === 'test',
});

// ─── Audit logger (security-sensitive actions) ────────────────────────────────

export const auditLogger = winston.createLogger({
  level: 'info',
  transports: [createRotatingTransport('audit', 'info')],
  exitOnError: false,
  silent: env.NODE_ENV === 'test',
});

// ─── Type-safe log helpers ────────────────────────────────────────────────────

interface LogMeta {
  requestId?: string;
  userId?: string;
  module?: string;
  [key: string]: unknown;
}

export const log = {
  error: (message: string, meta?: LogMeta): void => { logger.error(message, meta); },
  warn: (message: string, meta?: LogMeta): void => { logger.warn(message, meta); },
  info: (message: string, meta?: LogMeta): void => { logger.info(message, meta); },
  debug: (message: string, meta?: LogMeta): void => { logger.debug(message, meta); },
  http: (message: string, meta?: LogMeta): void => { logger.http(message, meta); },
  audit: (action: string, meta: LogMeta): void => {
    auditLogger.info(action, { ...meta, type: 'AUDIT' });
  },
};
