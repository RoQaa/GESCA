/**
 * @module requestLogger.middleware
 * @description HTTP request/response logging middleware using Winston.
 *
 * ARCHITECTURE NOTE:
 * Logs two events per request:
 * 1. REQUEST_IN  — when the request arrives (method, URL, IP, user agent)
 * 2. REQUEST_OUT — when the response is sent (status code, duration in ms)
 *
 * The response event is captured by hooking into res.on('finish').
 * This approach is non-blocking and works correctly even with streaming responses.
 *
 * Sensitive routes are filtered to avoid logging passwords/tokens.
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../config/logger.config';

/** Routes where request bodies should NOT be logged (contain credentials) */
const SENSITIVE_PATHS = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/reset-password'];

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.startTime = Date.now();

  const isSensitive = SENSITIVE_PATHS.some((path) => req.path.startsWith(path));

  // Log incoming request
  log.http(`→ ${req.method} ${req.originalUrl}`, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip ?? req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.sub,
    ...(isSensitive ? {} : { body: req.body as unknown }),
  });

  // Log outgoing response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime ?? Date.now());
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

    log[level](`← ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.sub,
    });
  });

  next();
}
