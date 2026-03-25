import { z } from 'zod';
import {
  AssessmentRequestStatusSchema,
  ExamSessionStatusSchema,
  ScoreResultSetStatusSchema,
  GenderSchema,
} from './state-machines.js';

// ---------------------------------------------------------------------------
// Answer state — blueprint 5.3
// ---------------------------------------------------------------------------

export const AnswerState = {
  TRUE: 'true',
  FALSE: 'false',
  UNANSWERED: 'unanswered',
} as const;

export type AnswerState = (typeof AnswerState)[keyof typeof AnswerState];

export const AnswerStateSchema = z.enum(['true', 'false', 'unanswered']);

// ---------------------------------------------------------------------------
// Exam Session record — blueprint ERD: EXAM_SESSIONS
// ---------------------------------------------------------------------------

export const ExamSessionSchema = z.object({
  id: z.string().uuid(),
  assessmentRequestId: z.string().uuid(),
  patientUserId: z.string().uuid(),
  doctorUserId: z.string().uuid().nullable(),
  instrumentVersionId: z.string().uuid(),
  questionBankVersionId: z.string().uuid(),
  status: ExamSessionStatusSchema,
  approvedAt: z.coerce.date().nullable(),
  startedAt: z.coerce.date().nullable(),
  lastActivityAt: z.coerce.date().nullable(),
  submittedAt: z.coerce.date().nullable(),
  completionPercentage: z.number().int().min(0).max(100),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ExamSession = z.infer<typeof ExamSessionSchema>;

// ---------------------------------------------------------------------------
// Session Answer record — blueprint ERD: SESSION_ANSWERS
// ---------------------------------------------------------------------------

export const SessionAnswerSchema = z.object({
  id: z.string().uuid(),
  examSessionId: z.string().uuid(),
  questionNumber: z.number().int().min(1).max(567),
  answerState: AnswerStateSchema,
  answeredAt: z.coerce.date(),
});

export type SessionAnswer = z.infer<typeof SessionAnswerSchema>;

// ---------------------------------------------------------------------------
// Mutation DTOs — saving answers
// ---------------------------------------------------------------------------

/** Save a single answer during the session. */
export const SaveAnswerSchema = z.object({
  questionNumber: z.number().int().min(1).max(567),
  answer: z.enum(['true', 'false']),
});

export type SaveAnswerDto = z.infer<typeof SaveAnswerSchema>;

/** Save a batch of answers (autosave). Blueprint 7.5: answers saved incrementally. */
export const SaveAnswersBatchSchema = z.object({
  answers: z.array(SaveAnswerSchema).min(1).max(50),
});

export type SaveAnswersBatchDto = z.infer<typeof SaveAnswersBatchSchema>;

// ---------------------------------------------------------------------------
// Session Progress — read model for patient UI
// ---------------------------------------------------------------------------

export const SessionProgressSchema = z.object({
  sessionId: z.string().uuid(),
  totalQuestions: z.literal(567),
  answeredCount: z.number().int().min(0).max(567),
  unansweredCount: z.number().int().min(0).max(567),
  percentComplete: z.number().min(0).max(100),
  lastActivityAt: z.coerce.date().nullable(),
});

export type SessionProgress = z.infer<typeof SessionProgressSchema>;

// ---------------------------------------------------------------------------
// Doctor queue read model — API/web shared response shape
// ---------------------------------------------------------------------------

export const DoctorCaseValidityLabel = {
  PENDING: 'pending',
  VALID: 'valid',
  REVIEW_RECOMMENDED: 'review_recommended',
} as const;

export type DoctorCaseValidityLabel =
  (typeof DoctorCaseValidityLabel)[keyof typeof DoctorCaseValidityLabel];

export const DoctorCaseValidityLabelSchema = z.enum([
  'pending',
  'valid',
  'review_recommended',
]);

export const DoctorCaseQueueItemSchema = z.object({
  sessionId: z.string().uuid(),
  assessmentRequestId: z.string().uuid(),
  patientUserId: z.string().uuid(),
  patientFullName: z.string().min(1),
  requestStatus: AssessmentRequestStatusSchema,
  sessionStatus: ExamSessionStatusSchema,
  purpose: z.string().nullable(),
  submittedAt: z.coerce.date().nullable(),
  latestScoreStatus: ScoreResultSetStatusSchema.nullable(),
  validityLabel: DoctorCaseValidityLabelSchema,
  validitySummary: z.string().nullable(),
});

export type DoctorCaseQueueItem = z.infer<typeof DoctorCaseQueueItemSchema>;

// ---------------------------------------------------------------------------
// Session Event record — blueprint 7.3: transitions logged in session-event table
// ---------------------------------------------------------------------------

export const SessionEventSchema = z.object({
  id: z.string().uuid(),
  examSessionId: z.string().uuid(),
  eventType: z.string().min(1).max(100),
  payload: z.record(z.unknown()).nullable(),
  occurredAt: z.coerce.date(),
});

export type SessionEvent = z.infer<typeof SessionEventSchema>;

// ---------------------------------------------------------------------------
// Score Result Set — blueprint ERD: SCORE_RESULT_SETS
// ---------------------------------------------------------------------------

export const ScoreResultSetSchema = z.object({
  id: z.string().uuid(),
  examSessionId: z.string().uuid(),
  scoringConfigVersionId: z.string().uuid(),
  engineVersion: z.string().min(1).max(50),
  status: ScoreResultSetStatusSchema,
  patientGender: GenderSchema,
  scoredAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export type ScoreResultSet = z.infer<typeof ScoreResultSetSchema>;

// ---------------------------------------------------------------------------
// Scale Result — blueprint ERD: SCALE_RESULTS
// ---------------------------------------------------------------------------

export const SeverityBand = {
  NORMAL: 'normal',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'very_high',
} as const;

export type SeverityBand = (typeof SeverityBand)[keyof typeof SeverityBand];

export const SeverityBandSchema = z.enum(['normal', 'moderate', 'high', 'very_high']);

export const ScaleResultSchema = z.object({
  id: z.string().uuid(),
  scoreResultSetId: z.string().uuid(),
  scaleDefinitionId: z.string().uuid(),
  scaleCode: z.string().min(1).max(20),
  groupCode: z.string().min(1).max(60),
  rawScore: z.number(),
  correctedScore: z.number().nullable(),
  tScore: z.number().nullable(),
  severityBand: SeverityBandSchema.nullable(),
});

export type ScaleResult = z.infer<typeof ScaleResultSchema>;

// ---------------------------------------------------------------------------
// Validity Flag — blueprint ERD: VALIDITY_FLAGS
// ---------------------------------------------------------------------------

export const ValidityFlagSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

export type ValidityFlagSeverity =
  (typeof ValidityFlagSeverity)[keyof typeof ValidityFlagSeverity];

export const ValidityFlagSeveritySchema = z.enum(['info', 'warning', 'critical']);

export const ValidityFlagSchema = z.object({
  id: z.string().uuid(),
  scoreResultSetId: z.string().uuid(),
  flagCode: z.string().min(1).max(30),
  severity: ValidityFlagSeveritySchema,
  description: z.string().max(500),
});

export type ValidityFlag = z.infer<typeof ValidityFlagSchema>;

// ---------------------------------------------------------------------------
// Critical Item Flag — blueprint ERD: CRITICAL_ITEM_FLAGS
// ---------------------------------------------------------------------------

export const CriticalItemFlagSchema = z.object({
  id: z.string().uuid(),
  scoreResultSetId: z.string().uuid(),
  flagCode: z.string().min(1).max(30),
  sourceGroup: z.string().min(1).max(60),
  description: z.string().max(500),
});

export type CriticalItemFlag = z.infer<typeof CriticalItemFlagSchema>;
