/**
 * @module validate.middleware
 * @description Zod validation middleware factory.
 *
 * ARCHITECTURE NOTE:
 * A single factory function creates middleware for validating any part of the request.
 * This eliminates code duplication across 50+ endpoints.
 *
 * Usage:
 *   router.post('/login', validate({ body: loginSchema }), authController.login)
 *
 * Validates body, params, query, and headers independently.
 * On failure, throws a ValidationError with structured field-level error details.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../exceptions';
import type { ApiErrorDetail } from '../types/api-response.types';

// ─── Validation target schema map ─────────────────────────────────────────────

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
  headers?: ZodSchema;
}

// ─── Zod error formatter ──────────────────────────────────────────────────────

function formatZodErrors(error: ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
  }));
}

// ─── Middleware factory ───────────────────────────────────────────────────────

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: ApiErrorDetail[] = [];

    // Validate request body
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(...formatZodErrors(result.error));
      } else {
        req.body = result.data as Record<string, unknown>;
      }
    }

    // Validate route params
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(...formatZodErrors(result.error));
      } else {
        req.params = result.data as Record<string, string>;
      }
    }

    // Validate query string
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(...formatZodErrors(result.error));
      }
    }

    // Validate headers
    if (schemas.headers) {
      const result = schemas.headers.safeParse(req.headers);
      if (!result.success) {
        errors.push(...formatZodErrors(result.error));
      }
    }

    if (errors.length > 0) {
      next(new ValidationError(errors));
      return;
    }

    next();
  };
}

// ─── UUID param validator ─────────────────────────────────────────────────────

import { z } from 'zod';

const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format. Must be a valid UUID.' }),
});

/** Pre-built middleware for validating :id route parameters */
export const validateIdParam = validate({ params: uuidParamSchema });
