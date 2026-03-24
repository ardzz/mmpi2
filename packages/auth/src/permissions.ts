import type { UserRole } from './roles.js';

// ---------------------------------------------------------------------------
// Permission constants — resource:action granularity
// ---------------------------------------------------------------------------

export const Permission = {
  // Assessment requests
  REQUEST_CREATE: 'request:create',
  REQUEST_READ_OWN: 'request:read:own',
  REQUEST_READ_ALL: 'request:read:all',
  REQUEST_APPROVE: 'request:approve',
  REQUEST_REJECT: 'request:reject',
  REQUEST_ASSIGN_DOCTOR: 'request:assign_doctor',

  // Exam sessions
  SESSION_START: 'session:start',
  SESSION_SAVE_ANSWERS: 'session:save_answers',
  SESSION_SUBMIT: 'session:submit',
  SESSION_READ_OWN: 'session:read:own',
  SESSION_READ_ASSIGNED: 'session:read:assigned',
  SESSION_READ_ALL: 'session:read:all',

  // Scoring
  SCORE_TRIGGER: 'score:trigger',
  SCORE_READ_OWN: 'score:read:own',
  SCORE_READ_ASSIGNED: 'score:read:assigned',
  SCORE_READ_ALL: 'score:read:all',

  // Clinical reports
  REPORT_DRAFT: 'report:draft',
  REPORT_PUBLISH: 'report:publish',
  REPORT_READ_OWN: 'report:read:own',
  REPORT_READ_ASSIGNED: 'report:read:assigned',
  REPORT_READ_ALL: 'report:read:all',

  // Payment / billing
  PAYMENT_READ_OWN: 'payment:read:own',
  PAYMENT_READ_ALL: 'payment:read:all',
  PAYMENT_MANAGE: 'payment:manage',

  // Clinic settings (singleton)
  SETTINGS_READ: 'settings:read',
  SETTINGS_MANAGE: 'settings:manage',

  // Audit log
  AUDIT_READ: 'audit:read',

  // User management
  USER_READ_ALL: 'user:read:all',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DEACTIVATE: 'user:deactivate',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ---------------------------------------------------------------------------
// Deny-by-default RBAC matrix
// ---------------------------------------------------------------------------

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  patient: new Set<Permission>([
    Permission.REQUEST_CREATE,
    Permission.REQUEST_READ_OWN,
    Permission.SESSION_START,
    Permission.SESSION_SAVE_ANSWERS,
    Permission.SESSION_SUBMIT,
    Permission.SESSION_READ_OWN,
    Permission.SCORE_READ_OWN,
    Permission.REPORT_READ_OWN,
    Permission.PAYMENT_READ_OWN,
  ]),

  doctor: new Set<Permission>([
    Permission.SESSION_READ_ASSIGNED,
    Permission.SCORE_READ_ASSIGNED,
    Permission.REPORT_DRAFT,
    Permission.REPORT_PUBLISH,
    Permission.REPORT_READ_ASSIGNED,
  ]),

  admin: new Set<Permission>([
    Permission.REQUEST_READ_ALL,
    Permission.REQUEST_APPROVE,
    Permission.REQUEST_REJECT,
    Permission.REQUEST_ASSIGN_DOCTOR,
    Permission.SESSION_READ_ALL,
    Permission.SCORE_TRIGGER,
    Permission.SCORE_READ_ALL,
    Permission.REPORT_READ_ALL,
    Permission.PAYMENT_READ_ALL,
    Permission.PAYMENT_MANAGE,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_MANAGE,
    Permission.AUDIT_READ,
    Permission.USER_READ_ALL,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,
    Permission.USER_DEACTIVATE,
  ]),

  // super_admin inherits every permission automatically
  super_admin: new Set<Permission>(Object.values(Permission)),
};
