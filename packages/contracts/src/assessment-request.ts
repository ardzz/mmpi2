import { z } from 'zod';
import {
  AssessmentRequestStatusSchema,
  PaymentRequirementSchema,
} from './state-machines.js';

// ---------------------------------------------------------------------------
// Assessment Request record — blueprint ERD: ASSESSMENT_REQUESTS
// ---------------------------------------------------------------------------

export const AssessmentRequestSchema = z.object({
  id: z.string().uuid(),
  patientUserId: z.string().uuid(),
  assessmentTypeId: z.string().uuid(),
  status: AssessmentRequestStatusSchema,
  paymentRequirement: PaymentRequirementSchema,
  paymentSatisfied: z.boolean(),
  activePaymentId: z.string().uuid().nullable(),
  doctorUserId: z.string().uuid().nullable(),
  purpose: z.string().nullable(),
  adminNote: z.string().nullable(),
  requestedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AssessmentRequest = z.infer<typeof AssessmentRequestSchema>;

// ---------------------------------------------------------------------------
// Mutation DTOs
// ---------------------------------------------------------------------------

/** Patient creates a new assessment request. */
export const CreateAssessmentRequestSchema = z.object({
  purpose: z.string().max(2000).optional(),
});

export type CreateAssessmentRequestDto = z.infer<typeof CreateAssessmentRequestSchema>;

/** Admin assigns a doctor to the request. */
export const AssignDoctorSchema = z.object({
  doctorUserId: z.string().uuid(),
});

export type AssignDoctorDto = z.infer<typeof AssignDoctorSchema>;

/**
 * Admin reviews and decides on a request.
 * Blueprint: admin approves and optionally assigns doctor (7.1 step 8).
 */
export const ReviewRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  adminNote: z.string().max(2000).optional(),
  doctorUserId: z.string().uuid().optional(),
});

export type ReviewRequestDto = z.infer<typeof ReviewRequestSchema>;

/** Admin explicitly waives payment for a request. */
export const WaivePaymentSchema = z.object({
  adminNote: z.string().max(2000).optional(),
});

export type WaivePaymentDto = z.infer<typeof WaivePaymentSchema>;

/** Admin confirms payment manually (non-webhook path). */
export const ConfirmPaymentManuallySchema = z.object({
  adminNote: z.string().max(2000).optional(),
});

export type ConfirmPaymentManuallyDto = z.infer<typeof ConfirmPaymentManuallySchema>;

// ---------------------------------------------------------------------------
// Admin request read models
// ---------------------------------------------------------------------------

export const AdminRequestQueueItemSchema = z.object({
  id: z.string().uuid(),
  patientUserId: z.string().uuid(),
  patientFullName: z.string().min(1),
  requestStatus: AssessmentRequestStatusSchema,
  paymentRequirement: PaymentRequirementSchema,
  paymentSatisfied: z.boolean(),
  activePaymentId: z.string().uuid().nullable(),
  doctorUserId: z.string().uuid().nullable(),
  doctorName: z.string().nullable(),
  purpose: z.string().nullable(),
  adminNote: z.string().nullable(),
  requestedAt: z.coerce.date(),
  sessionId: z.string().uuid().nullable(),
  sessionStatus: z.string().nullable(),
});

export type AdminRequestQueueItem = z.infer<typeof AdminRequestQueueItemSchema>;

export const AdminRequestDetailSchema = AdminRequestQueueItemSchema.extend({
  paymentStatus: z.string().nullable(),
  paymentAmount: z.number().nonnegative().nullable(),
  paymentCurrency: z.string().length(3).nullable(),
  latestPaymentEventType: z.string().nullable(),
  latestPaymentEventAt: z.coerce.date().nullable(),
});

export type AdminRequestDetail = z.infer<typeof AdminRequestDetailSchema>;

export const AssignmentCandidateSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(1),
  licenseNumber: z.string().nullable(),
  specialty: z.string().nullable(),
  isActive: z.boolean(),
});

export type AssignmentCandidate = z.infer<typeof AssignmentCandidateSchema>;

export const AdminAssignmentDetailSchema = AdminRequestDetailSchema.extend({
  candidates: z.array(AssignmentCandidateSchema),
});

export type AdminAssignmentDetail = z.infer<typeof AdminAssignmentDetailSchema>;
