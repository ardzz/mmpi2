import {
  AssessmentRequestStatus,
  BillingMode,
  ClinicalReportStatus,
  ExamSessionStatus,
  ScoreResultSetStatus,
} from '@mmpi2/contracts';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ConflictException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { AppModule } from '../../app.module';
import { InMemoryProfileRepository } from '../../profile/in-memory-profile.repository';
import { ProfileRepository } from '../../profile/profile.repository';
import { PaymentService } from '../../payment/payment.service';
import { InMemoryPaymentRepository } from '../../payment/in-memory-payment.repository';
import { PaymentRepository } from '../../payment/payment.repository';
import { ProfileService } from '../../profile/profile.service';
import { InMemoryReportRepository } from '../../report/in-memory-report.repository';
import { ReportRepository } from '../../report/report.repository';
import { ReportService } from '../../report/report.service';
import { InMemoryRequestSessionRepository } from '../../request-session/in-memory-request-session.repository';
import {
  RequestSessionRepository,
  type FrozenVersionRefs,
} from '../../request-session/request-session.repository';
import { RequestSessionService } from '../../request-session/request-session.service';
import { InMemoryScoringRepository } from '../../scoring/in-memory-scoring.repository';
import { ScoringRepository } from '../../scoring/scoring.repository';
import { ScoringService } from '../../scoring/scoring.service';

const PATIENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_USER_ID = '22222222-2222-4222-8222-222222222222';

interface IntegrationContext {
  profileService: ProfileService;
  paymentService: PaymentService;
  requestSessionService: RequestSessionService;
  requestSessionRepository: RequestSessionRepository;
  scoringService: ScoringService;
  reportService: ReportService;
  reportRepository: ReportRepository;
}

async function withIntegrationContext(
  run: (context: IntegrationContext) => Promise<void>,
): Promise<void> {
  const testingModule: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ProfileRepository)
    .useClass(InMemoryProfileRepository)
    .overrideProvider(PaymentRepository)
    .useClass(InMemoryPaymentRepository)
    .overrideProvider(RequestSessionRepository)
    .useClass(InMemoryRequestSessionRepository)
    .overrideProvider(ScoringRepository)
    .useClass(InMemoryScoringRepository)
    .overrideProvider(ReportRepository)
    .useClass(InMemoryReportRepository)
    .compile();

  try {
    await run({
      profileService: testingModule.get(ProfileService),
      paymentService: testingModule.get(PaymentService),
      requestSessionService: testingModule.get(RequestSessionService),
      requestSessionRepository: testingModule.get(RequestSessionRepository),
      scoringService: testingModule.get(ScoringService),
      reportService: testingModule.get(ReportService),
      reportRepository: testingModule.get(ReportRepository, {
        strict: false,
      }),
    });
  } finally {
    await testingModule.close();
  }
}

async function seedProfiles(profileService: ProfileService): Promise<void> {
  await profileService.upsertPatientProfile(PATIENT_USER_ID, {
    fullName: 'Patient One',
    governmentId: 'ID-12345',
    dateOfBirth: new Date('1990-05-10'),
    gender: 'female',
    demographics: {
      education: 'Bachelor',
      occupation: 'Designer',
      phoneNumber: '0812-0000-0000',
      address: 'Bandung',
    },
  });

  await profileService.upsertDoctorProfile(DOCTOR_USER_ID, {
    fullName: 'Dr. Tester',
    licenseNumber: 'PSY-9001',
    specialty: 'Clinical Psychology',
  });
}

function createAnswerInputs(
  totalQuestions: number,
): Array<{ questionNumber: number; answer: 'true' | 'false' }> {
  return Array.from({ length: totalQuestions }, (_, index) => ({
    questionNumber: index + 1,
    answer: (index + 1) % 3 === 0 ? 'true' : 'false',
  }));
}

async function createApprovedRequest(context: IntegrationContext): Promise<{ requestId: string }> {
  const createdRequest = await context.requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
    purpose: 'Negative-path hardening request',
  });

  await context.requestSessionService.assignDoctor(createdRequest.id, {
    doctorUserId: DOCTOR_USER_ID,
  });

  await context.requestSessionService.reviewRequest(createdRequest.id, {
    decision: 'approved',
  });

  return {
    requestId: createdRequest.id,
  };
}

async function createSubmittedSession(context: IntegrationContext): Promise<{
  requestId: string;
  sessionId: string;
  frozenVersions: FrozenVersionRefs;
}> {
  const { requestId } = await createApprovedRequest(context);

  await context.requestSessionService.startSessionForPatient(PATIENT_USER_ID, requestId);

  const answerInputs = createAnswerInputs(220);
  for (let index = 0; index < answerInputs.length; index += 55) {
    await context.requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, requestId, {
      answers: answerInputs.slice(index, index + 55),
    });
  }

  const submittedState = await context.requestSessionService.submitSessionForPatient(PATIENT_USER_ID, requestId);

  return {
    requestId,
    sessionId: submittedState.session.id,
    frozenVersions: submittedState.frozenVersions,
  };
}

describe('MMPI-2 integration negative path hardening', () => {
  it('rejects illegal lifecycle transitions and keeps workflow state intact', async () => {
    await withIntegrationContext(async (context) => {
      await seedProfiles(context.profileService);

      const { requestId } = await createApprovedRequest(context);

      const readyState = await context.requestSessionService.getSessionStateForPatient(PATIENT_USER_ID, requestId);
      expect(readyState.request.status).toBe(AssessmentRequestStatus.APPROVED);
      expect(readyState.session.status).toBe(ExamSessionStatus.READY_TO_START);

      await expect(
        context.requestSessionService.submitSessionForPatient(PATIENT_USER_ID, requestId),
      ).rejects.toThrow(ConflictException);

      const stateAfterIllegalSubmit = await context.requestSessionService.getSessionStateForPatient(
        PATIENT_USER_ID,
        requestId,
      );
      expect(stateAfterIllegalSubmit.session.status).toBe(ExamSessionStatus.READY_TO_START);

      await expect(
        context.requestSessionService.reviewRequest(requestId, {
          decision: 'rejected',
        }),
      ).rejects.toThrow(ConflictException);

      const stateAfterIllegalReview = await context.requestSessionService.getSessionStateForPatient(
        PATIENT_USER_ID,
        requestId,
      );
      expect(stateAfterIllegalReview.request.status).toBe(AssessmentRequestStatus.APPROVED);

      const startedState = await context.requestSessionService.startSessionForPatient(PATIENT_USER_ID, requestId);
      expect(startedState.session.status).toBe(ExamSessionStatus.IN_PROGRESS);

      await expect(
        context.scoringService.runScoringForSubmittedSession(startedState.session.id),
      ).rejects.toThrow(ConflictException);

      const stateAfterIllegalScoring = await context.requestSessionService.getSessionStateForPatient(
        PATIENT_USER_ID,
        requestId,
      );
      expect(stateAfterIllegalScoring.session.status).toBe(ExamSessionStatus.IN_PROGRESS);
    });
  });

  it('rejects post-submit answer mutation and preserves submitted answer snapshot', async () => {
    await withIntegrationContext(async (context) => {
      await seedProfiles(context.profileService);

      const { requestId } = await createApprovedRequest(context);
      await context.requestSessionService.startSessionForPatient(PATIENT_USER_ID, requestId);

      await context.requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, requestId, {
        answers: [
          {
            questionNumber: 1,
            answer: 'true',
          },
          {
            questionNumber: 2,
            answer: 'false',
          },
        ],
      });

      const submittedState = await context.requestSessionService.submitSessionForPatient(PATIENT_USER_ID, requestId);
      expect(submittedState.session.status).toBe(ExamSessionStatus.SUBMITTED);

      await expect(
        context.requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, requestId, {
          answers: [
            {
              questionNumber: 1,
              answer: 'false',
            },
            {
              questionNumber: 3,
              answer: 'true',
            },
          ],
        }),
      ).rejects.toThrow(ConflictException);

      const reloadedState = await context.requestSessionService.getSessionStateForPatient(PATIENT_USER_ID, requestId);
      expect(reloadedState.session.status).toBe(ExamSessionStatus.SUBMITTED);
      expect(reloadedState.progress.answeredCount).toBe(2);
      expect(reloadedState.answers).toHaveLength(2);
      expect(reloadedState.answers.find((answer) => answer.questionNumber === 1)?.answerState).toBe('true');
      expect(reloadedState.answers.find((answer) => answer.questionNumber === 3)).toBeUndefined();
    });
  });

  it('deduplicates duplicate payment webhook delivery without duplicate request transitions', async () => {
    await withIntegrationContext(async (context) => {
      await context.paymentService.updateBillingMode(BillingMode.MIDTRANS);
      await seedProfiles(context.profileService);

      const createdRequest = await context.requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
        purpose: 'Webhook duplicate delivery test',
      });

      expect(createdRequest.status).toBe(AssessmentRequestStatus.AWAITING_PAYMENT);

      const createdPayment = await context.requestSessionService.createPaymentForPatientRequest(
        PATIENT_USER_ID,
        createdRequest.id,
      );

      const payment = (await context.paymentService.listPaymentsByRequestId(createdRequest.id)).at(-1);
      expect(payment).toBeDefined();
      if (payment === undefined || payment.providerReferenceId === null) {
        throw new Error('Expected active payment with provider reference.');
      }

      const paidPayload = {
        providerCode: payment.providerCode,
        providerReferenceId: payment.providerReferenceId,
        providerEventId: 'evt-negative-dup-paid-001',
        providerStatus: 'paid',
        rawBody: '{"transaction_status":"settlement"}',
      } as const;

      const afterFirstDelivery = await context.requestSessionService.processPaymentWebhook(paidPayload);
      expect(afterFirstDelivery.status).toBe(AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW);
      expect(afterFirstDelivery.paymentSatisfied).toBe(true);
      expect(afterFirstDelivery.activePaymentId).toBe(createdPayment.paymentId);

      const firstUpdatedAtMs = afterFirstDelivery.updatedAt.getTime();
      const afterDuplicateDelivery = await context.requestSessionService.processPaymentWebhook(paidPayload);

      expect(afterDuplicateDelivery.status).toBe(AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW);
      expect(afterDuplicateDelivery.paymentSatisfied).toBe(true);
      expect(afterDuplicateDelivery.activePaymentId).toBe(createdPayment.paymentId);
      expect(afterDuplicateDelivery.updatedAt.getTime()).toBe(firstUpdatedAtMs);
    });
  });

  it('treats frozen version refs as authoritative and blocks scoring when they drift', async () => {
    await withIntegrationContext(async (context) => {
      await seedProfiles(context.profileService);

      const submitted = await createSubmittedSession(context);
      const stateBeforeTamper = await context.requestSessionService.getSessionStateForPatient(
        PATIENT_USER_ID,
        submitted.requestId,
      );

      await context.requestSessionRepository.saveSession(stateBeforeTamper.session, {
        ...submitted.frozenVersions,
        scoringConfigVersionId: 'mmpi2-scoring-config-v9999',
      });

      await expect(context.scoringService.runScoringForSubmittedSession(submitted.sessionId)).rejects.toThrow(
        ConflictException,
      );

      const stateAfterRejectedScoring = await context.requestSessionService.getSessionStateForPatient(
        PATIENT_USER_ID,
        submitted.requestId,
      );

      expect(stateAfterRejectedScoring.session.status).toBe(ExamSessionStatus.SUBMITTED);
      expect(stateAfterRejectedScoring.frozenVersions.scoringConfigVersionId).toBe(
        'mmpi2-scoring-config-v9999',
      );

      await context.requestSessionRepository.saveSession(
        stateAfterRejectedScoring.session,
        submitted.frozenVersions,
      );
      const scoredView = await context.scoringService.runScoringForSubmittedSession(submitted.sessionId);
      expect(scoredView.resultSet.status).toBe(ScoreResultSetStatus.COMPLETED);
      expect(scoredView.resultSet.scoringConfigVersionId).toBe(
        submitted.frozenVersions.scoringConfigVersionId,
      );
    });
  });

  it('keeps published reports immutable and enforces amendment lineage constraints', async () => {
    await withIntegrationContext(async (context) => {
      await seedProfiles(context.profileService);

      const submitted = await createSubmittedSession(context);
      const scoredView = await context.scoringService.runScoringForSubmittedSession(submitted.sessionId);
      expect(scoredView.resultSet.status).toBe(ScoreResultSetStatus.COMPLETED);

      await context.reportService.saveDraftForDoctor(submitted.sessionId, DOCTOR_USER_ID, {
        interpretationSummary: 'Draft summary for immutability negative checks.',
        narrative: 'Draft narrative before sign-off.',
      });

      await context.reportService.signReportForDoctor(submitted.sessionId, DOCTOR_USER_ID, {
        signatureStoragePath: 'signatures/doctor-negative-suite.png',
      });

      const published = await context.reportService.publishReportForDoctor(submitted.sessionId, DOCTOR_USER_ID, {
        interpretationSummary: 'Published interpretation baseline for lineage constraints.',
        narrative: 'Published narrative baseline that must stay immutable.',
      });

      const publishedReport = published.report;
      if (publishedReport === null) {
        throw new Error('Expected published report to be present.');
      }

      expect(publishedReport.reportStatus).toBe(ClinicalReportStatus.PUBLISHED);
      await expect(
        context.reportService.saveDraftForDoctor(submitted.sessionId, DOCTOR_USER_ID, {
          narrative: 'Illegal direct edit attempt on published report.',
        }),
      ).rejects.toThrow(ConflictException);

      const stateAfterIllegalDirectEdit = await context.reportService.getReportStateForDoctor(
        submitted.sessionId,
        DOCTOR_USER_ID,
      );

      expect(stateAfterIllegalDirectEdit.report?.id).toBe(publishedReport.id);
      expect(stateAfterIllegalDirectEdit.report?.narrative).toBe(
        'Published narrative baseline that must stay immutable.',
      );

      const amended = await context.reportService.amendPublishedReportForDoctor(
        submitted.sessionId,
        DOCTOR_USER_ID,
        {
          interpretationSummary: 'Amended interpretation after chart correction.',
          narrative: 'Amended narrative with corrected conclusions.',
          amendmentReason: 'Secondary clinical review clarified risk framing.',
        },
      );

      expect(amended.report?.reportStatus).toBe(ClinicalReportStatus.PUBLISHED);
      expect(amended.report?.id).not.toBe(publishedReport.id);
      expect(amended.report?.amendedFromId).toBe(publishedReport.id);

      const amendedReportId = amended.report?.id;
      expect(amendedReportId).toBeDefined();

      const amendedAncestor = await context.reportRepository.findReportById(publishedReport.id);
      expect(amendedAncestor?.reportStatus).toBe(ClinicalReportStatus.AMENDED);
      expect(amendedAncestor?.narrative).toBe('Published narrative baseline that must stay immutable.');

      await expect(
        context.reportService.publishReportForDoctor(submitted.sessionId, DOCTOR_USER_ID, {
          interpretationSummary: 'Illegal republish attempt',
          narrative: 'Latest report is already published and must be amended instead.',
        }),
      ).rejects.toThrow(ConflictException);

      const finalState = await context.reportService.getReportStateForDoctor(
        submitted.sessionId,
        DOCTOR_USER_ID,
      );
      expect(finalState.report?.id).toBe(amendedReportId);
      expect(finalState.report?.amendedFromId).toBe(publishedReport.id);
    });
  });
});
