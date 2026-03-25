import { z } from 'zod';
import { ClinicalReportStatusSchema } from './state-machines.js';

// ---------------------------------------------------------------------------
// Clinical Report record — blueprint ERD: CLINICAL_REPORTS
// ---------------------------------------------------------------------------

export const ClinicalReportSchema = z.object({
  id: z.string().uuid(),
  examSessionId: z.string().uuid(),
  authorUserId: z.string().uuid(),
  scoreResultSetId: z.string().uuid(),
  reportStatus: ClinicalReportStatusSchema,
  interpretationSummary: z.string().nullable(),
  narrative: z.string().nullable(),
  supplementalObservations: z.record(z.unknown()).nullable(),
  publishedAt: z.coerce.date().nullable(),
  amendedFromId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ClinicalReport = z.infer<typeof ClinicalReportSchema>;

// ---------------------------------------------------------------------------
// Report Signature — blueprint ERD: REPORT_SIGNATURES
// ---------------------------------------------------------------------------

export const ReportSignatureSchema = z.object({
  id: z.string().uuid(),
  clinicalReportId: z.string().uuid(),
  storagePath: z.string().min(1).max(500),
  signedAt: z.coerce.date(),
});

export type ReportSignature = z.infer<typeof ReportSignatureSchema>;

// ---------------------------------------------------------------------------
// Certificate — blueprint ERD: CERTIFICATES
// ---------------------------------------------------------------------------

export const CertificateSchema = z.object({
  id: z.string().uuid(),
  clinicalReportId: z.string().uuid(),
  certificateNumber: z.string().min(1).max(100),
  storagePath: z.string().min(1).max(500),
  issuedAt: z.coerce.date(),
});

export type Certificate = z.infer<typeof CertificateSchema>;

// ---------------------------------------------------------------------------
// Supplemental observations — structured doctor-authored fields
// Based on legacy narrative fields (blueprint 14.7)
// ---------------------------------------------------------------------------

export const MentalCapacityAssessmentSchema = z.object({
  workPerformance: z.string().max(2000).optional(),
  adaptability: z.string().max(2000).optional(),
  psychologicalIssue: z.string().max(2000).optional(),
  destructiveAction: z.string().max(2000).optional(),
  moralIntegrity: z.string().max(2000).optional(),
});

export type MentalCapacityAssessment = z.infer<typeof MentalCapacityAssessmentSchema>;

export const PersonalityAssessmentSchema = z.object({
  openness: z.string().max(2000).optional(),
  conscientiousness: z.string().max(2000).optional(),
  extraversion: z.string().max(2000).optional(),
  agreeableness: z.string().max(2000).optional(),
  neuroticism: z.string().max(2000).optional(),
});

export type PersonalityAssessment = z.infer<typeof PersonalityAssessmentSchema>;

export const SupplementalObservationsSchema = z.object({
  responseToTest: z.string().max(5000).optional(),
  validityScore: z.string().max(2000).optional(),
  clinicalProfile: z.string().max(5000).optional(),
  conclusion: z.string().max(5000).optional(),
  mentalCapacity: MentalCapacityAssessmentSchema.optional(),
  personality: PersonalityAssessmentSchema.optional(),
});

export type SupplementalObservations = z.infer<typeof SupplementalObservationsSchema>;

// ---------------------------------------------------------------------------
// Mutation DTOs
// ---------------------------------------------------------------------------

/** Save draft report — partial fields allowed. */
export const SaveDraftReportSchema = z.object({
  interpretationSummary: z.string().max(10000).optional(),
  narrative: z.string().max(20000).optional(),
  supplementalObservations: SupplementalObservationsSchema.optional(),
});

export type SaveDraftReportDto = z.infer<typeof SaveDraftReportSchema>;

/**
 * Publish report — requires mandatory fields completed.
 * Blueprint 7.7: publishing requires scored result set + doctor sign-off + required fields.
 */
export const PublishReportSchema = z.object({
  interpretationSummary: z.string().min(10).max(10000),
  narrative: z.string().min(10).max(20000),
  supplementalObservations: SupplementalObservationsSchema.optional(),
});

export type PublishReportDto = z.infer<typeof PublishReportSchema>;

/** Sign the report — doctor provides or references a signature asset. */
export const SignReportSchema = z.object({
  signatureStoragePath: z.string().min(1).max(500),
});

export type SignReportDto = z.infer<typeof SignReportSchema>;

/** Amend a published report — creates a new version. */
export const AmendReportSchema = z.object({
  interpretationSummary: z.string().min(10).max(10000),
  narrative: z.string().min(10).max(20000),
  supplementalObservations: SupplementalObservationsSchema.optional(),
  amendmentReason: z.string().min(5).max(2000),
});

export type AmendReportDto = z.infer<typeof AmendReportSchema>;

// ---------------------------------------------------------------------------
// Patient-facing report read models
// ---------------------------------------------------------------------------

export const PatientDocumentSummarySchema = z.object({
  id: z.string().uuid(),
  examSessionId: z.string().uuid(),
  title: z.string().min(1).max(200),
  documentType: z.literal('clinical_report'),
  reportStatus: ClinicalReportStatusSchema,
  publishedAt: z.coerce.date().nullable(),
  authorUserId: z.string().uuid(),
  authorName: z.string().min(1),
  hasDownload: z.boolean(),
});

export type PatientDocumentSummary = z.infer<typeof PatientDocumentSummarySchema>;

export const PatientDocumentDetailSchema = z.object({
  id: z.string().uuid(),
  examSessionId: z.string().uuid(),
  title: z.string().min(1).max(200),
  documentType: z.literal('clinical_report'),
  reportStatus: ClinicalReportStatusSchema,
  publishedAt: z.coerce.date().nullable(),
  authorUserId: z.string().uuid(),
  authorName: z.string().min(1),
  interpretationSummary: z.string().nullable(),
  narrative: z.string().nullable(),
  supplementalObservations: z.record(z.unknown()).nullable(),
  amendedFromId: z.string().uuid().nullable(),
  hasDownload: z.boolean(),
});

export type PatientDocumentDetail = z.infer<typeof PatientDocumentDetailSchema>;

export const PatientDocumentDownloadSchema = z.object({
  reportId: z.string().uuid(),
  documentId: z.string().uuid(),
  documentType: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  byteLength: z.number().int().nonnegative(),
  checksumSha256: z.string().min(1),
  generatedAt: z.coerce.date(),
  storageKey: z.string().min(1),
  bodyBase64: z.string().min(1),
});

export type PatientDocumentDownload = z.infer<typeof PatientDocumentDownloadSchema>;
