/**
 * Audit event type definitions — used by the API audit module
 * to produce structured, queryable audit logs.
 */

export const AuditEventType = {
  // Auth
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PASSWORD_CHANGED: 'user.password_changed',

  // Assessment requests
  REQUEST_CREATED: 'request.created',
  REQUEST_APPROVED: 'request.approved',
  REQUEST_REJECTED: 'request.rejected',
  REQUEST_DOCTOR_ASSIGNED: 'request.doctor_assigned',

  // Sessions
  SESSION_STARTED: 'session.started',
  SESSION_ANSWER_SAVED: 'session.answer_saved',
  SESSION_SUBMITTED: 'session.submitted',

  // Scoring
  SCORING_TRIGGERED: 'scoring.triggered',
  SCORING_COMPLETED: 'scoring.completed',

  // Reports
  REPORT_DRAFTED: 'report.drafted',
  REPORT_PUBLISHED: 'report.published',
  REPORT_AMENDED: 'report.amended',

  // Payment
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',

  // Admin
  SETTINGS_CHANGED: 'settings.changed',
  USER_ROLE_CHANGED: 'user.role_changed',
} as const;

export type AuditEventType = (typeof AuditEventType)[keyof typeof AuditEventType];
