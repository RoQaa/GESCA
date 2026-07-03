/**
 * @module response.util
 * @description Standardized API response builder.
 *
 * All controllers use these functions to build responses.
 * This enforces the consistent response format across every endpoint:
 * { success, message, data, timestamp }
 */

import { Response } from 'express';
import type {
  ApiResponse,
  PaginatedApiResponse,
  PaginationMeta,
} from '../types/api-response.types';
import { HttpStatus, HttpStatusCode } from '../constants/http-status.constants';

// ─── Success response ─────────────────────────────────────────────────────────

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: HttpStatusCode = HttpStatus.OK,
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
}

// ─── Created response ─────────────────────────────────────────────────────────

export function sendCreated<T>(
  res: Response,
  data: T,
  message = 'Created successfully',
): Response {
  return sendSuccess(res, data, message, HttpStatus.CREATED);
}

// ─── No content response (204) ────────────────────────────────────────────────

export function sendNoContent(res: Response): Response {
  return res.status(HttpStatus.NO_CONTENT).send();
}

// ─── Paginated response ───────────────────────────────────────────────────────

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message = 'Fetched successfully',
): Response {
  const response: PaginatedApiResponse<T> = {
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  };
  return res.status(HttpStatus.OK).json(response);
}
