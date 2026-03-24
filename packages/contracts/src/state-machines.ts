/**
 * State machine definitions for all lifecycle entities.
 *
 * These are the canonical transition rules used by both
 * the API layer and the shared contracts package.
 * No route handler should define inline transition logic.
 *
 * Status values are aligned to the project blueprint sections 7.2–7.4.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Assessment Request lifecycle (blueprint 7.2)
// ---------------------------------------------------------------------------

export const AssessmentRequestStatus = {
  DRAFT: 'draft',
  AWAITING_PAYMENT: 'awaiting_payment',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_WAIVED: 'payment_waived',
  READY_FOR_ADMIN_REVIEW: 'ready_for_admin_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type AssessmentRequestStatus =
  (typeof AssessmentRequestStatus)[keyof typeof AssessmentRequestStatus];

export const AssessmentRequestStatusSchema = z.enum([
  'draft',
  'awaiting_payment',
  'payment_pending',
  'payment_confirmed',
  'payment_waived',
  'ready_for_admin_review',
  'approved',
  'rejected',
  'cancelled',
]);

/**
 * Payment requirement snapshotted at request creation time.
 * Controls whether the request needs a real payment, was free, or was waived.
 * Blueprint 7.2: "request rows should snapshot billing requirements at creation time"
 */
export const PaymentRequirement = {
  FREE: 'free',
  GATEWAY_REQUIRED: 'gateway_required',
  WAIVED: 'waived',
} as const;

export type PaymentRequirement =
  (typeof PaymentRequirement)[keyof typeof PaymentRequirement];

export const PaymentRequirementSchema = z.enum([
  'free',
  'gateway_required',
  'waived',
]);

const REQUEST_TRANSITIONS: Record<AssessmentRequestStatus, readonly AssessmentRequestStatus[]> = {
  draft: ['awaiting_payment', 'ready_for_admin_review'],
  awaiting_payment: ['payment_pending', 'cancelled'],
  payment_pending: ['payment_confirmed', 'cancelled'],
  payment_confirmed: ['ready_for_admin_review'],
  payment_waived: ['ready_for_admin_review'],
  ready_for_admin_review: ['approved', 'rejected'],
  approved: ['cancelled'],
  rejected: [],
  cancelled: [],
};

export function canTransitionRequest(
  from: AssessmentRequestStatus,
  to: AssessmentRequestStatus,
): boolean {
  return (REQUEST_TRANSITIONS[from] as readonly string[])?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Exam Session lifecycle (blueprint 7.3)
// ---------------------------------------------------------------------------

export const ExamSessionStatus = {
  APPROVED: 'approved',
  READY_TO_START: 'ready_to_start',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  SCORING: 'scoring',
  SCORED: 'scored',
  NEEDS_CLINICAL_REVIEW: 'needs_clinical_review',
  REPORT_IN_PROGRESS: 'report_in_progress',
  REPORT_PUBLISHED: 'report_published',
  CERTIFICATE_ISSUED: 'certificate_issued',
  CANCELLED: 'cancelled',
} as const;

export type ExamSessionStatus = (typeof ExamSessionStatus)[keyof typeof ExamSessionStatus];

export const ExamSessionStatusSchema = z.enum([
  'approved',
  'ready_to_start',
  'in_progress',
  'submitted',
  'scoring',
  'scored',
  'needs_clinical_review',
  'report_in_progress',
  'report_published',
  'certificate_issued',
  'cancelled',
]);

const SESSION_TRANSITIONS: Record<ExamSessionStatus, readonly ExamSessionStatus[]> = {
  approved: ['ready_to_start', 'cancelled'],
  ready_to_start: ['in_progress', 'cancelled'],
  in_progress: ['submitted', 'cancelled'],
  submitted: ['scoring'],
  scoring: ['scored', 'needs_clinical_review'],
  scored: ['needs_clinical_review', 'report_in_progress'],
  needs_clinical_review: ['report_in_progress'],
  report_in_progress: ['report_published'],
  report_published: ['certificate_issued'],
  certificate_issued: [],
  cancelled: [],
};

export function canTransitionSession(from: ExamSessionStatus, to: ExamSessionStatus): boolean {
  return (SESSION_TRANSITIONS[from] as readonly string[])?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Clinical Report lifecycle (blueprint 7.7)
// ---------------------------------------------------------------------------

export const ClinicalReportStatus = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  AMENDED: 'amended',
} as const;

export type ClinicalReportStatus =
  (typeof ClinicalReportStatus)[keyof typeof ClinicalReportStatus];

export const ClinicalReportStatusSchema = z.enum([
  'draft',
  'pending_review',
  'published',
  'amended',
]);

const REPORT_TRANSITIONS: Record<ClinicalReportStatus, readonly ClinicalReportStatus[]> = {
  draft: ['pending_review'],
  pending_review: ['published', 'draft'],
  published: ['amended'],
  amended: [],
};

export function canTransitionReport(
  from: ClinicalReportStatus,
  to: ClinicalReportStatus,
): boolean {
  return (REPORT_TRANSITIONS[from] as readonly string[])?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Payment lifecycle (blueprint 7.4)
// ---------------------------------------------------------------------------

export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  EXPIRED: 'expired',
  WAIVED: 'waived',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
  'expired',
  'waived',
]);

const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ['processing', 'failed', 'expired', 'waived'],
  processing: ['paid', 'failed', 'expired'],
  paid: ['refunded'],
  failed: ['pending'],
  refunded: [],
  expired: ['pending'],
  waived: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return (PAYMENT_TRANSITIONS[from] as readonly string[])?.includes(to) ?? false;
}

// ---------------------------------------------------------------------------
// Score Result Set lifecycle
// ---------------------------------------------------------------------------

export const ScoreResultSetStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ScoreResultSetStatus =
  (typeof ScoreResultSetStatus)[keyof typeof ScoreResultSetStatus];

export const ScoreResultSetStatusSchema = z.enum([
  'pending',
  'completed',
  'failed',
]);

// ---------------------------------------------------------------------------
// Billing Mode (blueprint 7.4 — product-level setting)
// ---------------------------------------------------------------------------

export const BillingMode = {
  DISABLED: 'disabled',
  MIDTRANS: 'midtrans',
  XENDIT: 'xendit',
} as const;

export type BillingMode = (typeof BillingMode)[keyof typeof BillingMode];

export const BillingModeSchema = z.enum(['disabled', 'midtrans', 'xendit']);

// ---------------------------------------------------------------------------
// Account status
// ---------------------------------------------------------------------------

export const AccountStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const AccountStatusSchema = z.enum(['active', 'suspended', 'deactivated']);

// ---------------------------------------------------------------------------
// Gender — clinically significant for MMPI-2 scoring
// ---------------------------------------------------------------------------

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const GenderSchema = z.enum(['male', 'female']);

// ---------------------------------------------------------------------------
// Activation readiness (session can only be started when all conditions met)
// Blueprint: session becomes available after billing + admin approval
// ---------------------------------------------------------------------------

export interface SessionActivationConditions {
  requestApproved: boolean;
  paymentCleared: boolean;
  doctorAssigned: boolean;
}

export function isSessionActivatable(conditions: SessionActivationConditions): boolean {
  return conditions.requestApproved && conditions.paymentCleared && conditions.doctorAssigned;
}

// ---------------------------------------------------------------------------
// Domain event types (blueprint 7.8)
// ---------------------------------------------------------------------------

export const DomainEventType = {
  ASSESSMENT_REQUESTED: 'assessment_requested',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_WAIVED: 'payment_waived',
  SESSION_APPROVED: 'session_approved',
  SESSION_STARTED: 'session_started',
  SESSION_SUBMITTED: 'session_submitted',
  SCORING_COMPLETED: 'scoring_completed',
  REPORT_PUBLISHED: 'report_published',
  CERTIFICATE_ISSUED: 'certificate_issued',
} as const;

export type DomainEventType = (typeof DomainEventType)[keyof typeof DomainEventType];

export const DomainEventTypeSchema = z.enum([
  'assessment_requested',
  'payment_confirmed',
  'payment_waived',
  'session_approved',
  'session_started',
  'session_submitted',
  'scoring_completed',
  'report_published',
  'certificate_issued',
]);
