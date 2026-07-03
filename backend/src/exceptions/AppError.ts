/**
 * @module AppError
 * @description Base operational error class.
 *
 * ARCHITECTURE NOTE:
 * "Operational errors" are expected errors that occur during normal operation:
 * - User sends invalid data (400)
 * - Resource not found (404)
 * - Authentication failure (401)
 *
 * "Programming errors" are bugs — unexpected errors not created with AppError.
 * The global error handler treats them differently:
 * - Operational: expose message to client
 * - Programming: log internally, send generic "Something went wrong" to client
 *
 * This is a TypeScript port of the original utils/appError.js.
 */

import { HttpStatusCode } from '../constants/http-status.constants';

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly status: 'fail' | 'error';
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: HttpStatusCode) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.isOperational = true;

    // Maintains proper stack trace (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }
}
