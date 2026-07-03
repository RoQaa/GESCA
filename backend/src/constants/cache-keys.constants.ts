/**
 * @module cache-keys.constants
 * @description Cache key factory functions for Redis (future use).
 *
 * Using functions instead of raw strings ensures:
 * 1. Type safety — you can't pass wrong argument types
 * 2. Consistent key format throughout the codebase
 * 3. Easy cache invalidation by pattern (e.g., "employees:*")
 */

export const CacheKeys = {
  // ── Employees ──────────────────────────────────────────────────────────────
  employee: (id: string): string => `employee:${id}`,
  employeeList: (page: string): string => `employees:list:${page}`,
  employeeByEmail: (email: string): string => `employee:email:${email}`,

  // ── Customers ──────────────────────────────────────────────────────────────
  customer: (id: string): string => `customer:${id}`,
  customerList: (page: string): string => `customers:list:${page}`,

  // ── Tasks ──────────────────────────────────────────────────────────────────
  task: (id: string): string => `task:${id}`,
  taskListByEmployee: (employeeId: string, date: string): string =>
    `tasks:employee:${employeeId}:date:${date}`,

  // ── Visits ─────────────────────────────────────────────────────────────────
  visit: (id: string): string => `visit:${id}`,
  visitsByEmployee: (employeeId: string): string => `visits:employee:${employeeId}`,

  // ── Analytics ──────────────────────────────────────────────────────────────
  dashboard: (managerId: string): string => `analytics:dashboard:${managerId}`,
  attendanceRate: (date: string): string => `analytics:attendance-rate:${date}`,

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: (): string => 'settings:all',
  setting: (key: string): string => `settings:${key}`,

  // ── Auth ───────────────────────────────────────────────────────────────────
  tokenBlacklist: (jti: string): string => `auth:blacklist:${jti}`,
  rateLimit: (identifier: string): string => `rate-limit:${identifier}`,
} as const;

/** TTL values in seconds for consistent cache expiration */
export const CacheTTL = {
  SHORT: 60,          // 1 minute — frequently changing data
  MEDIUM: 300,        // 5 minutes — moderately dynamic data
  LONG: 1800,         // 30 minutes — relatively static data
  VERY_LONG: 86400,   // 24 hours — near-static data (settings)
  SESSION: 604800,    // 7 days — refresh token lifetime
} as const;
