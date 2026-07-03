/**
 * @module permissions.constants
 * @description Granular permission strings for RBAC.
 *
 * Permission naming convention: RESOURCE:ACTION
 * e.g., "employees:create", "visits:read:own", "reports:read:all"
 *
 * :own   → user can only access their own resources
 * :all   → user can access all resources in the system
 */

export const PERMISSIONS = {
  // ── Employees ──────────────────────────────────────────────────────────────
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_READ_ALL: 'employees:read:all',
  EMPLOYEES_READ_OWN: 'employees:read:own',
  EMPLOYEES_UPDATE_ALL: 'employees:update:all',
  EMPLOYEES_UPDATE_OWN: 'employees:update:own',
  EMPLOYEES_DELETE: 'employees:delete',

  // ── Customers ──────────────────────────────────────────────────────────────
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_READ_ALL: 'customers:read:all',
  CUSTOMERS_READ_ASSIGNED: 'customers:read:assigned',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',

  // ── Tasks ──────────────────────────────────────────────────────────────────
  TASKS_CREATE: 'tasks:create',
  TASKS_READ_ALL: 'tasks:read:all',
  TASKS_READ_OWN: 'tasks:read:own',
  TASKS_UPDATE: 'tasks:update',
  TASKS_DELETE: 'tasks:delete',

  // ── Visits ─────────────────────────────────────────────────────────────────
  VISITS_READ_ALL: 'visits:read:all',
  VISITS_READ_OWN: 'visits:read:own',
  VISITS_UPDATE_OWN: 'visits:update:own',

  // ── Attendance ─────────────────────────────────────────────────────────────
  ATTENDANCE_CHECK_IN: 'attendance:check-in',
  ATTENDANCE_CHECK_OUT: 'attendance:check-out',
  ATTENDANCE_READ_ALL: 'attendance:read:all',
  ATTENDANCE_READ_OWN: 'attendance:read:own',

  // ── Reports ────────────────────────────────────────────────────────────────
  REPORTS_CREATE: 'reports:create',
  REPORTS_READ_ALL: 'reports:read:all',
  REPORTS_READ_OWN: 'reports:read:own',
  REPORTS_UPDATE_OWN: 'reports:update:own',

  // ── Images ─────────────────────────────────────────────────────────────────
  IMAGES_UPLOAD: 'images:upload',
  IMAGES_READ: 'images:read',
  IMAGES_DELETE_OWN: 'images:delete:own',
  IMAGES_DELETE_ALL: 'images:delete:all',

  // ── Analytics ──────────────────────────────────────────────────────────────
  ANALYTICS_READ: 'analytics:read',

  // ── Notifications ──────────────────────────────────────────────────────────
  NOTIFICATIONS_READ_OWN: 'notifications:read:own',
  NOTIFICATIONS_SEND: 'notifications:send',

  // ── Settings ───────────────────────────────────────────────────────────────
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // ── Users / Admin ──────────────────────────────────────────────────────────
  USERS_MANAGE: 'users:manage',
  ROLES_MANAGE: 'roles:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Default role → permissions map ──────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS) as Permission[],

  MANAGER: [
    PERMISSIONS.EMPLOYEES_READ_ALL,
    PERMISSIONS.EMPLOYEES_UPDATE_ALL,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_READ_ALL,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_READ_ALL,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.VISITS_READ_ALL,
    PERMISSIONS.ATTENDANCE_READ_ALL,
    PERMISSIONS.REPORTS_READ_ALL,
    PERMISSIONS.IMAGES_READ,
    PERMISSIONS.IMAGES_DELETE_ALL,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.NOTIFICATIONS_READ_OWN,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.SETTINGS_READ,
  ],

  SALES_EMPLOYEE: [
    PERMISSIONS.EMPLOYEES_READ_OWN,
    PERMISSIONS.EMPLOYEES_UPDATE_OWN,
    PERMISSIONS.CUSTOMERS_READ_ASSIGNED,
    PERMISSIONS.TASKS_READ_OWN,
    PERMISSIONS.VISITS_READ_OWN,
    PERMISSIONS.VISITS_UPDATE_OWN,
    PERMISSIONS.ATTENDANCE_CHECK_IN,
    PERMISSIONS.ATTENDANCE_CHECK_OUT,
    PERMISSIONS.ATTENDANCE_READ_OWN,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_READ_OWN,
    PERMISSIONS.REPORTS_UPDATE_OWN,
    PERMISSIONS.IMAGES_UPLOAD,
    PERMISSIONS.IMAGES_READ,
    PERMISSIONS.IMAGES_DELETE_OWN,
    PERMISSIONS.NOTIFICATIONS_READ_OWN,
  ],
};
