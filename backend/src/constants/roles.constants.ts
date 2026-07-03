/**
 * @module roles.constants
 * @description System role definitions.
 * Roles are stored in the database but referenced as constants here
 * to avoid magic strings throughout the codebase.
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  SALES_EMPLOYEE: 'SALES_EMPLOYEE',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = Object.values(ROLES);
