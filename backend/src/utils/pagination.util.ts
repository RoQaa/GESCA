/**
 * @module pagination.util
 * @description Offset-based and cursor-based pagination helpers.
 *
 * ARCHITECTURE NOTE:
 * Two pagination strategies are provided:
 *
 * 1. OFFSET PAGINATION — for small datasets or admin panels where jumping
 *    to a specific page is needed. Degrades at scale (page 500 = 5000 row scan).
 *
 * 2. CURSOR PAGINATION — for high-traffic endpoints (activity feeds, lists).
 *    O(log n) performance — seeks directly to the cursor position via index.
 *    Uses opaque Base64-encoded cursors to hide implementation details.
 */

import type { PaginationMeta } from '../types/api-response.types';

// ─── Offset pagination ────────────────────────────────────────────────────────

export interface OffsetPaginationParams {
  page: number;
  pageSize: number;
}

export interface OffsetPaginationResult {
  skip: number;
  take: number;
}

export function buildOffsetPagination(params: OffsetPaginationParams): OffsetPaginationResult {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(Math.max(1, params.pageSize), 100); // Max 100 per page

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildOffsetMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const safePage = Math.max(1, page);
  const totalPages = Math.ceil(total / safePageSize);

  return {
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

// ─── Cursor pagination ────────────────────────────────────────────────────────

export interface CursorPaginationParams {
  cursor?: string;
  pageSize: number;
  direction?: 'forward' | 'backward';
}

export interface DecodedCursor {
  id: string;
  createdAt: string;
}

/** Encode a cursor from id + createdAt into an opaque Base64 string */
export function encodeCursor(id: string, createdAt: Date): string {
  const payload: DecodedCursor = { id, createdAt: createdAt.toISOString() };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/** Decode a Base64 cursor back to id + createdAt. Returns null on invalid cursor. */
export function decodeCursor(cursor: string): DecodedCursor | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as DecodedCursor;
    if (!parsed.id || !parsed.createdAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildCursorMeta(
  items: Array<{ id: string; createdAt: Date }>,
  pageSize: number,
  hasMore: boolean,
): Pick<PaginationMeta, 'hasNextPage' | 'hasPreviousPage' | 'nextCursor' | 'total' | 'page' | 'pageSize' | 'totalPages'> {
  const lastItem = items[items.length - 1];
  const nextCursor =
    hasMore && lastItem ? encodeCursor(lastItem.id, lastItem.createdAt) : null;

  return {
    total: -1, // Not available with cursor pagination
    page: -1,  // Not meaningful for cursor pagination
    pageSize,
    totalPages: -1,
    hasNextPage: hasMore,
    hasPreviousPage: false, // Simplified: forward-only cursor
    nextCursor,
  };
}

// ─── Query parameter normalization ────────────────────────────────────────────

export function normalizePaginationQuery(query: {
  page?: unknown;
  pageSize?: unknown;
  limit?: unknown;
}): OffsetPaginationParams {
  return {
    page: Math.max(1, Number(query.page) || 1),
    pageSize: Math.min(Math.max(1, Number(query.pageSize ?? query.limit) || 20), 100),
  };
}
