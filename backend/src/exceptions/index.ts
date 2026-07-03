/**
 * @module exceptions/index
 * @description Typed exception classes for every error scenario.
 * Each extends AppError with a pre-set status code.
 * Import from this single file: import { NotFoundError, AuthError } from '../exceptions';
 */

import { AppError } from './AppError';
import { HttpStatus } from '../constants/http-status.constants';
import type { ApiErrorDetail } from '../types/api-response.types';

// ─── 400 Bad Request ──────────────────────────────────────────────────────────

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

// ─── 401 Unauthorized ─────────────────────────────────────────────────────────

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

// ─── 403 Forbidden ────────────────────────────────────────────────────────────

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

// ─── 404 Not Found ────────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

// ─── 409 Conflict ─────────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT);
  }
}

// ─── 422 Unprocessable Entity (Validation errors) ────────────────────────────

export class ValidationError extends AppError {
  public readonly errors: ApiErrorDetail[];

  constructor(errors: ApiErrorDetail[]) {
    super('Validation failed', HttpStatus.UNPROCESSABLE_ENTITY);
    this.errors = errors;
  }
}

// ─── 429 Too Many Requests ────────────────────────────────────────────────────

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

// ─── 500 Internal Server Error ────────────────────────────────────────────────

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// ─── Re-export base ───────────────────────────────────────────────────────────
export { AppError };
