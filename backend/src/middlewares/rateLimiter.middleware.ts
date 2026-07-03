/**
 * @module rateLimiter.middleware
 * @description Express rate limiter configurations.
 *
 * ARCHITECTURE NOTE:
 * Different rate limits for different endpoint categories:
 *
 * - globalLimiter:  Applied to ALL /api routes (broad protection)
 * - authLimiter:    Tighter limit on auth routes (prevent brute force)
 * - uploadLimiter:  Stricter limit for image upload endpoints (expensive operations)
 *
 * In production with Redis, switch the store to RedisStore for distributed
 * rate limiting across multiple Node.js instances. Currently uses in-memory store
 * which works correctly for a single server instance.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler, Options } from 'express-rate-limit';
import { env } from '../config/env.config';
import { HttpStatus } from '../constants/http-status.constants';

// ─── Shared handler for rate limit exceeded ───────────────────────────────────

const rateLimitExceededHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction,
  _options: Options
): void => {
  res.status(HttpStatus.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
    data: null,
    timestamp: new Date().toISOString(),
  });
};

// ─── Global API limiter ───────────────────────────────────────────────────────

export const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-7', // Return RateLimit-* headers per RFC 6585
  legacyHeaders: false,
  handler: rateLimitExceededHandler,
  keyGenerator: (req) => {
    // Use user ID if authenticated, fall back to IP
    return req.user?.sub ?? req.ip ?? 'unknown';
  },
});

// ─── Auth limiter (stricter — prevent brute force) ────────────────────────────

export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitExceededHandler,
  skipSuccessfulRequests: true, // Only count failed attempts
  keyGenerator: (req) => req.ip ?? 'unknown',
});

// ─── Upload limiter (expensive operations) ────────────────────────────────────

export const uploadLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 uploads per minute per user
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitExceededHandler,
  keyGenerator: (req) => req.user?.sub ?? req.ip ?? 'unknown',
});
