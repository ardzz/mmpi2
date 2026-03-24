import {
  ClinicalReportSchema,
  ClinicalReportStatus,
  DoctorProfileSchema,
  PatientProfileSchema,
  ReportSignatureSchema,
  ScaleResultSchema,
  ScoreResultSetSchema,
  ScoreResultSetStatus,
  ValidityFlagSchema,
} from '@mmpi2/contracts';
import { z } from 'zod';

const PublishedClinicalReportSchema = ClinicalReportSchema.superRefine((report, context) => {
  if (report.reportStatus !== ClinicalReportStatus.PUBLISHED) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Report artifact generation requires a published report.',
    });
  }

  if (report.publishedAt === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Published report must include publishedAt.',
    });
  }
});

const CompletedScoreResultSetSchema = ScoreResultSetSchema.refine(
  (resultSet) => resultSet.status === ScoreResultSetStatus.COMPLETED,
  {
    message: 'Report artifact generation requires a completed score result set.',
  },
);

export const ReportArtifactJobPayloadSchema = z.object({
  jobId: z.string().uuid(),
  requestedAt: z.coerce.date(),
  artifactType: z.literal('clinical_report_pdf'),
  source: z.object({
    report: PublishedClinicalReportSchema,
    scoreResultSet: CompletedScoreResultSetSchema,
    scaleResults: z.array(ScaleResultSchema),
    validityFlags: z.array(ValidityFlagSchema),
    patientProfile: PatientProfileSchema,
    doctorProfile: DoctorProfileSchema,
    signature: ReportSignatureSchema.nullable(),
    scoringSummary: z.object({
      isValid: z.boolean(),
      cannotSayCount: z.number().int().min(0),
      notes: z.array(z.string().min(1)).max(100),
    }),
  }),
  output: z.object({
    storageKey: z.string().min(1).max(500),
    fileName: z.string().min(1).max(255),
    contentType: z.literal('application/pdf'),
  }),
});

export type ReportArtifactJobPayload = z.infer<typeof ReportArtifactJobPayloadSchema>;

export const ReportArtifactJobResultSchema = z.object({
  jobId: z.string().uuid(),
  reportId: z.string().uuid(),
  scoreResultSetId: z.string().uuid(),
  storageKey: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  contentType: z.literal('application/pdf'),
  artifactByteLength: z.number().int().min(1),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  generatedAt: z.coerce.date(),
});

export type ReportArtifactJobResult = z.infer<typeof ReportArtifactJobResultSchema>;
