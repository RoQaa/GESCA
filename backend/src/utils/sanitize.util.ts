/**
 * @module sanitize.util
 * @description XSS sanitization middleware.
 * TypeScript port of the existing utils/sanitize.js.
 *
 * NOTE: This escapes HTML entities in string values.
 * It does NOT prevent SQL injection — Prisma's parameterized queries handle that.
 * It does NOT sanitize file uploads — Multer and Sharp handle that.
 */

import { Request, Response, NextFunction } from 'express';

type Sanitizable = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

/**
 * Recursively escapes HTML special characters in a value.
 * Works on strings, objects, and arrays.
 */
function escapeHtml(value: Sanitizable): Sanitizable {
  if (typeof value === 'string') {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  if (Array.isArray(value)) {
    return value.map((v) => escapeHtml(v as Sanitizable));
  }

  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = escapeHtml((value as Record<string, unknown>)[key] as Sanitizable);
    }
    return sanitized;
  }

  return value;
}

/**
 * Express middleware that sanitizes req.body and req.params against XSS.
 * req.query is read-only in Express 5 — a sanitized copy is placed in req.sanitizedQuery.
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = escapeHtml(req.body as Sanitizable) as Record<string, unknown>;
  }

  if (req.params) {
    req.params = escapeHtml(req.params as Sanitizable) as Record<string, string>;
  }

  if (req.query) {
    req.sanitizedQuery = escapeHtml({ ...req.query } as Sanitizable) as Record<string, unknown>;
  }

  next();
}
