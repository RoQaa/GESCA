/**
 * @module api-response.types
 * @description Standardized API response shapes.
 *
 * Every endpoint in the system returns one of these shapes.
 * This enforces consistency across all 50+ endpoints.
 */

// ─── Base response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

// ─── Paginated response ───────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  /** Cursor for next page (cursor-based pagination) */
  nextCursor?: string | null;
  /** Cursor for previous page */
  prevCursor?: string | null;
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// ─── Error response ───────────────────────────────────────────────────────────

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  errors?: ApiErrorDetail[];
  timestamp: string;
  /** Only included in development mode */
  stack?: string;
}

// ─── Common DTOs ──────────────────────────────────────────────────────────────

export interface IdParam {
  id: string;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
