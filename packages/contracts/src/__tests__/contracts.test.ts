import { describe, it, expect } from 'vitest';
import {
  // State machines
  AssessmentRequestStatus,
  AssessmentRequestStatusSchema,
  ExamSessionStatus,
  ExamSessionStatusSchema,
  PaymentRequirement,
  PaymentRequirementSchema,
  BillingMode,
  BillingModeSchema,
  AccountStatusSchema,
  canTransitionRequest,
  canTransitionSession,
  canTransitionReport,
  canTransitionPayment,
  isSessionActivatable,
  // Identity
  UserRoleSchema,
  UserSchema,
  PatientProfileSchema,
  UpsertPatientProfileSchema,
  UpsertDoctorProfileSchema,
  SessionUserSchema,
  // Assessment request
  AssessmentRequestSchema,
  CreateAssessmentRequestSchema,
  AssignDoctorSchema,
  ReviewRequestSchema,
  WaivePaymentSchema,
  // Exam session
  ExamSessionSchema,
  SaveAnswerSchema,
  SaveAnswersBatchSchema,
  SessionProgressSchema,
  ScoreResultSetSchema,
  ScaleResultSchema,
  ValidityFlagSchema,
  // Payment
  PaymentSchema,
  PaymentEventSchema,
  PaymentWebhookPayloadSchema,
  AppBillingSettingsSchema,
  // Clinical report
  ClinicalReportSchema,
  ReportSignatureSchema,
  CertificateSchema,
  SaveDraftReportSchema,
  PublishReportSchema,
  SignReportSchema,
  AmendReportSchema,
  SupplementalObservationsSchema,
  // API responses
  ApiErrorSchema,
  PaginatedSchema,
  ApiSuccessSchema,
} from '../index.js';

// ---------------------------------------------------------------------------
// State machine enum exhaustiveness
// ---------------------------------------------------------------------------

describe('state-machines', () => {
  describe('AssessmentRequestStatus', () => {
    it('contains all blueprint 7.2 status values', () => {
      const expected = [
        'draft',
        'awaiting_payment',
        'payment_pending',
        'payment_confirmed',
        'payment_waived',
        'ready_for_admin_review',
        'approved',
        'rejected',
        'cancelled',
      ];
      const actual = Object.values(AssessmentRequestStatus);
      expect(actual).toEqual(expect.arrayContaining(expected));
      expect(actual).toHaveLength(expected.length);
    });

    it('schema validates correct values', () => {
      expect(AssessmentRequestStatusSchema.safeParse('draft').success).toBe(true);
      expect(AssessmentRequestStatusSchema.safeParse('approved').success).toBe(true);
      expect(AssessmentRequestStatusSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('ExamSessionStatus', () => {
    it('contains all blueprint 7.3 status values', () => {
      const expected = [
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
      ];
      const actual = Object.values(ExamSessionStatus);
      expect(actual).toEqual(expect.arrayContaining(expected));
      expect(actual).toHaveLength(expected.length);
    });

    it('schema validates correct values', () => {
      expect(ExamSessionStatusSchema.safeParse('in_progress').success).toBe(true);
      expect(ExamSessionStatusSchema.safeParse('nope').success).toBe(false);
    });
  });

  describe('PaymentRequirement', () => {
    it('contains blueprint 7.2 payment requirement values', () => {
      expect(Object.values(PaymentRequirement)).toEqual(
        expect.arrayContaining(['free', 'gateway_required', 'waived']),
      );
    });

    it('schema validates', () => {
      expect(PaymentRequirementSchema.safeParse('free').success).toBe(true);
      expect(PaymentRequirementSchema.safeParse('manual').success).toBe(false);
    });
  });

  describe('BillingMode', () => {
    it('contains blueprint 7.4 billing modes', () => {
      expect(Object.values(BillingMode)).toEqual(
        expect.arrayContaining(['disabled', 'midtrans', 'xendit']),
      );
    });

    it('schema validates', () => {
      expect(BillingModeSchema.safeParse('disabled').success).toBe(true);
      expect(BillingModeSchema.safeParse('enabled').success).toBe(false);
    });
  });

  describe('canTransitionRequest', () => {
    it('allows draft -> awaiting_payment', () => {
      expect(canTransitionRequest('draft', 'awaiting_payment')).toBe(true);
    });

    it('allows draft -> ready_for_admin_review (free mode)', () => {
      expect(canTransitionRequest('draft', 'ready_for_admin_review')).toBe(true);
    });

    it('blocks draft -> approved (must go through review)', () => {
      expect(canTransitionRequest('draft', 'approved')).toBe(false);
    });

    it('blocks cancelled -> any', () => {
      expect(canTransitionRequest('cancelled', 'draft')).toBe(false);
    });
  });

  describe('canTransitionSession', () => {
    it('allows approved -> ready_to_start', () => {
      expect(canTransitionSession('approved', 'ready_to_start')).toBe(true);
    });

    it('allows in_progress -> submitted', () => {
      expect(canTransitionSession('in_progress', 'submitted')).toBe(true);
    });

    it('allows scoring -> needs_clinical_review', () => {
      expect(canTransitionSession('scoring', 'needs_clinical_review')).toBe(true);
    });

    it('blocks submitted -> in_progress (no going back)', () => {
      expect(canTransitionSession('submitted', 'in_progress')).toBe(false);
    });
  });

  describe('canTransitionReport', () => {
    it('allows draft -> pending_review', () => {
      expect(canTransitionReport('draft', 'pending_review')).toBe(true);
    });

    it('allows pending_review -> published', () => {
      expect(canTransitionReport('pending_review', 'published')).toBe(true);
    });

    it('allows published -> amended', () => {
      expect(canTransitionReport('published', 'amended')).toBe(true);
    });

    it('blocks draft -> published (must go through review)', () => {
      expect(canTransitionReport('draft', 'published')).toBe(false);
    });
  });

  describe('canTransitionPayment', () => {
    it('allows pending -> processing', () => {
      expect(canTransitionPayment('pending', 'processing')).toBe(true);
    });

    it('allows processing -> paid', () => {
      expect(canTransitionPayment('processing', 'paid')).toBe(true);
    });

    it('allows pending -> waived', () => {
      expect(canTransitionPayment('pending', 'waived')).toBe(true);
    });

    it('blocks paid -> pending', () => {
      expect(canTransitionPayment('paid', 'pending')).toBe(false);
    });
  });

  describe('isSessionActivatable', () => {
    it('returns true when all conditions met', () => {
      expect(
        isSessionActivatable({
          requestApproved: true,
          paymentCleared: true,
          doctorAssigned: true,
        }),
      ).toBe(true);
    });

    it('returns false when payment not cleared', () => {
      expect(
        isSessionActivatable({
          requestApproved: true,
          paymentCleared: false,
          doctorAssigned: true,
        }),
      ).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Identity schemas
// ---------------------------------------------------------------------------

describe('identity schemas', () => {
  const validUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    fullName: 'Test User',
    accountStatus: 'active',
    roles: ['patient'],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('UserSchema accepts valid data', () => {
    expect(UserSchema.safeParse(validUser).success).toBe(true);
  });

  it('UserSchema rejects invalid email', () => {
    expect(UserSchema.safeParse({ ...validUser, email: 'bad' }).success).toBe(false);
  });

  it('PatientProfileSchema accepts valid profile', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      fullName: 'Test Patient',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      demographics: { education: 'S1', occupation: 'Engineer' },
      isProfileComplete: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    expect(PatientProfileSchema.safeParse(profile).success).toBe(true);
  });

  it('PatientProfileSchema accepts null demographics', () => {
    const profile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      fullName: 'Test Patient',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      demographics: null,
      isProfileComplete: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    expect(PatientProfileSchema.safeParse(profile).success).toBe(true);
  });

  it('UpsertPatientProfileSchema validates correctly', () => {
    const dto = {
      fullName: 'Patient Name',
      dateOfBirth: '1990-05-15',
      gender: 'female',
    };
    expect(UpsertPatientProfileSchema.safeParse(dto).success).toBe(true);
  });

  it('UpsertDoctorProfileSchema validates correctly', () => {
    const dto = {
      fullName: 'Dr. Test',
      licenseNumber: 'PSY-12345',
      specialty: 'Clinical Psychology',
    };
    expect(UpsertDoctorProfileSchema.safeParse(dto).success).toBe(true);
  });

  it('SessionUserSchema accepts valid session', () => {
    const session = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      roles: ['patient'],
    };
    expect(SessionUserSchema.safeParse(session).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Assessment Request schemas
// ---------------------------------------------------------------------------

describe('assessment-request schemas', () => {
  const validRequest = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    patientUserId: '550e8400-e29b-41d4-a716-446655440001',
    assessmentTypeId: '550e8400-e29b-41d4-a716-446655440002',
    status: 'draft',
    paymentRequirement: 'free',
    paymentSatisfied: true,
    activePaymentId: null,
    doctorUserId: null,
    purpose: 'Employment screening',
    adminNote: null,
    requestedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('AssessmentRequestSchema accepts valid data', () => {
    expect(AssessmentRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it('CreateAssessmentRequestSchema accepts empty object', () => {
    expect(CreateAssessmentRequestSchema.safeParse({}).success).toBe(true);
  });

  it('ReviewRequestSchema requires decision', () => {
    expect(ReviewRequestSchema.safeParse({}).success).toBe(false);
    expect(
      ReviewRequestSchema.safeParse({ decision: 'approved' }).success,
    ).toBe(true);
  });

  it('AssignDoctorSchema requires valid UUID', () => {
    expect(AssignDoctorSchema.safeParse({ doctorUserId: 'not-uuid' }).success).toBe(false);
    expect(
      AssignDoctorSchema.safeParse({
        doctorUserId: '550e8400-e29b-41d4-a716-446655440000',
      }).success,
    ).toBe(true);
  });

  it('WaivePaymentSchema accepts optional note', () => {
    expect(WaivePaymentSchema.safeParse({}).success).toBe(true);
    expect(WaivePaymentSchema.safeParse({ adminNote: 'Pro bono' }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Exam Session schemas
// ---------------------------------------------------------------------------

describe('exam-session schemas', () => {
  it('ExamSessionSchema accepts valid session', () => {
    const session = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      assessmentRequestId: '550e8400-e29b-41d4-a716-446655440001',
      patientUserId: '550e8400-e29b-41d4-a716-446655440002',
      doctorUserId: null,
      instrumentVersionId: '550e8400-e29b-41d4-a716-446655440003',
      questionBankVersionId: '550e8400-e29b-41d4-a716-446655440004',
      status: 'approved',
      approvedAt: '2026-01-01',
      startedAt: null,
      lastActivityAt: null,
      submittedAt: null,
      completionPercentage: 0,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    expect(ExamSessionSchema.safeParse(session).success).toBe(true);
  });

  it('SaveAnswerSchema validates question range', () => {
    expect(SaveAnswerSchema.safeParse({ questionNumber: 0, answer: 'true' }).success).toBe(
      false,
    );
    expect(SaveAnswerSchema.safeParse({ questionNumber: 568, answer: 'true' }).success).toBe(
      false,
    );
    expect(SaveAnswerSchema.safeParse({ questionNumber: 1, answer: 'true' }).success).toBe(
      true,
    );
    expect(SaveAnswerSchema.safeParse({ questionNumber: 567, answer: 'false' }).success).toBe(
      true,
    );
  });

  it('SaveAnswersBatchSchema enforces min/max', () => {
    expect(SaveAnswersBatchSchema.safeParse({ answers: [] }).success).toBe(false);
    const valid = {
      answers: [{ questionNumber: 1, answer: 'true' }],
    };
    expect(SaveAnswersBatchSchema.safeParse(valid).success).toBe(true);
  });

  it('SessionProgressSchema validates', () => {
    const progress = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      totalQuestions: 567,
      answeredCount: 100,
      unansweredCount: 467,
      percentComplete: 17.64,
      lastActivityAt: null,
    };
    expect(SessionProgressSchema.safeParse(progress).success).toBe(true);
  });

  it('ScoreResultSetSchema validates', () => {
    const result = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      examSessionId: '550e8400-e29b-41d4-a716-446655440001',
      scoringConfigVersionId: '550e8400-e29b-41d4-a716-446655440002',
      engineVersion: '1.0.0',
      status: 'completed',
      patientGender: 'male',
      scoredAt: '2026-01-01',
      createdAt: '2026-01-01',
    };
    expect(ScoreResultSetSchema.safeParse(result).success).toBe(true);
  });

  it('ScaleResultSchema validates', () => {
    const scale = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      scoreResultSetId: '550e8400-e29b-41d4-a716-446655440001',
      scaleDefinitionId: '550e8400-e29b-41d4-a716-446655440002',
      scaleCode: 'Hs',
      groupCode: 'clinical_scales',
      rawScore: 15,
      correctedScore: 18,
      tScore: 65,
      severityBand: 'moderate',
    };
    expect(ScaleResultSchema.safeParse(scale).success).toBe(true);
  });

  it('ValidityFlagSchema validates', () => {
    const flag = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      scoreResultSetId: '550e8400-e29b-41d4-a716-446655440001',
      flagCode: 'VRIN_HIGH',
      severity: 'warning',
      description: 'VRIN score >= 80 indicates random responding',
    };
    expect(ValidityFlagSchema.safeParse(flag).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Payment schemas
// ---------------------------------------------------------------------------

describe('payment schemas', () => {
  it('PaymentSchema accepts valid payment', () => {
    const payment = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      assessmentRequestId: '550e8400-e29b-41d4-a716-446655440001',
      providerCode: 'midtrans',
      providerReferenceId: 'MT-123456',
      currency: 'IDR',
      amount: 500000,
      paymentStatus: 'pending',
      checkoutUrl: 'https://pay.midtrans.com/abc',
      providerMetadata: { snap_token: 'abc123' },
      expiresAt: '2026-01-02',
      paidAt: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    expect(PaymentSchema.safeParse(payment).success).toBe(true);
  });

  it('PaymentEventSchema validates', () => {
    const event = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      paymentId: '550e8400-e29b-41d4-a716-446655440001',
      eventType: 'settlement',
      providerEventId: 'EVT-001',
      providerStatus: 'settlement',
      signatureVerified: true,
      idempotencyKey: 'idem-123',
      payload: { transaction_id: 'TX-001' },
      occurredAt: '2026-01-01',
      recordedAt: '2026-01-01',
    };
    expect(PaymentEventSchema.safeParse(event).success).toBe(true);
  });

  it('PaymentWebhookPayloadSchema validates', () => {
    const webhook = {
      providerCode: 'xendit',
      providerReferenceId: 'XEN-123',
      providerEventId: 'EVT-XEN-001',
      providerStatus: 'PAID',
      rawBody: '{"status":"PAID"}',
    };
    expect(PaymentWebhookPayloadSchema.safeParse(webhook).success).toBe(true);
  });

  it('AppBillingSettingsSchema validates with defaults', () => {
    const settings = { billingMode: 'disabled' };
    const result = AppBillingSettingsSchema.safeParse(settings);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defaultCurrency).toBe('IDR');
    }
  });
});

// ---------------------------------------------------------------------------
// Clinical Report schemas
// ---------------------------------------------------------------------------

describe('clinical-report schemas', () => {
  it('ClinicalReportSchema accepts valid report', () => {
    const report = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      examSessionId: '550e8400-e29b-41d4-a716-446655440001',
      authorUserId: '550e8400-e29b-41d4-a716-446655440002',
      scoreResultSetId: '550e8400-e29b-41d4-a716-446655440003',
      reportStatus: 'draft',
      interpretationSummary: null,
      narrative: null,
      supplementalObservations: null,
      publishedAt: null,
      amendedFromId: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    expect(ClinicalReportSchema.safeParse(report).success).toBe(true);
  });

  it('ReportSignatureSchema validates', () => {
    const sig = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      clinicalReportId: '550e8400-e29b-41d4-a716-446655440001',
      storagePath: 'signatures/report-001.png',
      signedAt: '2026-01-01',
    };
    expect(ReportSignatureSchema.safeParse(sig).success).toBe(true);
  });

  it('CertificateSchema validates', () => {
    const cert = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      clinicalReportId: '550e8400-e29b-41d4-a716-446655440001',
      certificateNumber: 'CERT-2026-0001',
      storagePath: 'certificates/cert-001.pdf',
      issuedAt: '2026-01-01',
    };
    expect(CertificateSchema.safeParse(cert).success).toBe(true);
  });

  it('SaveDraftReportSchema accepts partial data', () => {
    expect(SaveDraftReportSchema.safeParse({}).success).toBe(true);
    expect(
      SaveDraftReportSchema.safeParse({ interpretationSummary: 'Initial notes' }).success,
    ).toBe(true);
  });

  it('PublishReportSchema requires minimum length', () => {
    expect(PublishReportSchema.safeParse({}).success).toBe(false);
    expect(
      PublishReportSchema.safeParse({
        interpretationSummary: 'Short',
        narrative: 'Also short',
      }).success,
    ).toBe(false);
    expect(
      PublishReportSchema.safeParse({
        interpretationSummary: 'This is a detailed interpretation summary for the MMPI-2 report.',
        narrative: 'This is the clinical narrative with sufficient detail for publication.',
      }).success,
    ).toBe(true);
  });

  it('SupplementalObservationsSchema validates structured fields', () => {
    const obs = {
      responseToTest: 'Cooperative, attentive',
      conclusion: 'Normal range indicators',
      mentalCapacity: {
        workPerformance: 'Good',
        adaptability: 'Good',
      },
      personality: {
        openness: 'High',
        conscientiousness: 'Average',
      },
    };
    expect(SupplementalObservationsSchema.safeParse(obs).success).toBe(true);
  });

  it('SignReportSchema validates', () => {
    expect(SignReportSchema.safeParse({ signatureStoragePath: '' }).success).toBe(false);
    expect(
      SignReportSchema.safeParse({ signatureStoragePath: 'sig/doc.png' }).success,
    ).toBe(true);
  });

  it('AmendReportSchema requires reason', () => {
    const dto = {
      interpretationSummary: 'Revised interpretation summary with additional details.',
      narrative: 'Revised clinical narrative with corrections applied.',
      amendmentReason: 'Corrected scoring interpretation after review.',
    };
    expect(AmendReportSchema.safeParse(dto).success).toBe(true);
    expect(
      AmendReportSchema.safeParse({ ...dto, amendmentReason: '' }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// API response wrappers
// ---------------------------------------------------------------------------

describe('api-responses schemas', () => {
  it('ApiErrorSchema validates error shape', () => {
    const err = { statusCode: 400, message: 'Bad request' };
    expect(ApiErrorSchema.safeParse(err).success).toBe(true);
  });

  it('PaginatedSchema wraps item schema', () => {
    const schema = PaginatedSchema(UserRoleSchema);
    const valid = {
      data: ['patient', 'doctor'],
      meta: { total: 2, page: 1, perPage: 10, totalPages: 1 },
    };
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('ApiSuccessSchema wraps data schema', () => {
    const schema = ApiSuccessSchema(AccountStatusSchema);
    expect(schema.safeParse({ data: 'active' }).success).toBe(true);
    expect(schema.safeParse({ data: 'invalid' }).success).toBe(false);
  });
});
