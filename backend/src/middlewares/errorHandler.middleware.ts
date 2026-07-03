/**
 * @module errorHandler.middleware
 * @description Global Express error handler.
 *
 * ARCHITECTURE NOTE:
 * This is the TypeScript replacement for the original errorController.js.
 * It handles ALL thrown errors from route handlers, services, and repositories.
 *
 * Error flow:
 * 1. Prisma known errors (P2xxx) → mapped to operational AppErrors
 * 2. Prisma validation errors → mapped to BadRequestError
 * 3. JWT errors → mapped to AuthError
 * 4. Zod/ValidationError → structured 422 response
 * 5. AppError (operational) → expose message to client
 * 6. Unknown errors (programming bugs) → log internally, return generic 500
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../exceptions/AppError';
import { ValidationError } from '../exceptions';
import { HttpStatus } from '../constants/http-status.constants';
import { log } from '../config/logger.config';
import { isDevelopment } from '../config/env.config';
import type { ApiErrorResponse } from '../types/api-response.types';

// ─── Prisma error mappers ─────────────────────────────────────────────────────

function handlePrismaKnownError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint violation
      const fields = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(', ')
        : String(err.meta?.target ?? 'field');
      return new AppError(
        `A record with this ${fields} already exists.`,
        HttpStatus.CONFLICT,
      );
    }
    case 'P2025': {
      // Record not found
      const cause = String(err.meta?.cause ?? 'Record not found');
      return new AppError(cause, HttpStatus.NOT_FOUND);
    }
    case 'P2003': {
      // Foreign key constraint
      const field = String(err.meta?.field_name ?? 'related record');
      return new AppError(
        `The referenced ${field} does not exist.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    case 'P2000': {
      // Value too long
      const column = String(err.meta?.column_name ?? 'field');
      return new AppError(`The value for '${column}' is too long.`, HttpStatus.BAD_REQUEST);
    }
    case 'P2006': {
      // Invalid value
      const field = String(err.meta?.field_name ?? 'field');
      return new AppError(`Invalid value for field '${field}'.`, HttpStatus.BAD_REQUEST);
    }
    case 'P2011': {
      // Null constraint violation
      const column = String(err.meta?.constraint ?? 'a required field');
      return new AppError(`'${column}' cannot be null.`, HttpStatus.BAD_REQUEST);
    }
    default:
      return new AppError('A database error occurred.', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// ─── Response builders ────────────────────────────────────────────────────────

function sendErrorResponse(
  err: AppError | ValidationError,
  _req: Request,
  res: Response,
): void {
  const payload: ApiErrorResponse = {
    success: false,
    message: err.message,
    data: null,
    timestamp: new Date().toISOString(),
  };

  if (err instanceof ValidationError) {
    payload.errors = err.errors;
  }

  if (isDevelopment()) {
    payload.stack = err.stack;
  }

  res.status(err.statusCode).json(payload);
}

function sendUnknownError(_req: Request, res: Response): void {
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
    data: null,
    timestamp: new Date().toISOString(),
  } satisfies ApiErrorResponse);
}

// ─── Global error handler ─────────────────────────────────────────────────────

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Always log the raw error internally
  log.error('Unhandled error', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    module: 'errorHandler',
  });

  // 1. Already an operational AppError
  if (err instanceof AppError) {
    sendErrorResponse(err, req, res);
    return;
  }

  // 2. Prisma known request errors (P2xxx)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = handlePrismaKnownError(err);
    sendErrorResponse(mapped, req, res);
    return;
  }

  // 3. Prisma validation error (wrong types passed to Prisma)
  if (err instanceof Prisma.PrismaClientValidationError) {
    const mapped = new AppError(
      'Invalid data provided to the database.',
      HttpStatus.BAD_REQUEST,
    );
    sendErrorResponse(mapped, req, res);
    return;
  }

  // 4. JWT errors
  if (err instanceof Error) {
    if (err.name === 'JsonWebTokenError') {
      sendErrorResponse(
        new AppError('Invalid token. Please log in again.', HttpStatus.UNAUTHORIZED),
        req,
        res,
      );
      return;
    }

    if (err.name === 'TokenExpiredError') {
      sendErrorResponse(
        new AppError('Your session has expired. Please log in again.', HttpStatus.UNAUTHORIZED),
        req,
        res,
      );
      return;
    }

    // 5. In development — expose unknown errors for debugging
    if (isDevelopment()) {
      const devError = new AppError(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
      sendErrorResponse(devError, req, res);
      return;
    }
  }

  // 6. Production — unknown programming error. Never expose internals.
  sendUnknownError(req, res);
}
