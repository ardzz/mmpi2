import { createHash, randomUUID } from 'node:crypto';
import {
  AssessmentRequestStatus,
  ClinicalReportStatus,
  ExamSessionStatus,
  ScoreResultSetStatus,
  ValidityFlagSeverity,
} from '@mmpi2/contracts';
import {
  type ReportArtifactJobPayload,
  ReportArtifactJobPayloadSchema,
  buildReportCompositionData,
  renderClinicalReportPdf,
} from '@mmpi2/reports';
import { Test, type TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { InMemoryProfileRepository } from '../../profile/in-memory-profile.repository';
import { ProfileRepository } from '../../profile/profile.repository';
import { ProfileService } from '../../profile/profile.service';
import { InMemoryPaymentRepository } from '../../payment/in-memory-payment.repository';
import { PaymentRepository } from '../../payment/payment.repository';
import { InMemoryReportRepository } from '../../report/in-memory-report.repository';
import { ReportRepository } from '../../report/report.repository';
import { InMemoryRequestSessionRepository } from '../../request-session/in-memory-request-session.repository';
import { RequestSessionRepository } from '../../request-session/request-session.repository';
import { ReportService } from '../../report/report.service';
import { RequestSessionService } from '../../request-session/request-session.service';
import { InMemoryScoringRepository } from '../../scoring/in-memory-scoring.repository';
import { ScoringRepository } from '../../scoring/scoring.repository';
import { ScoringService } from '../../scoring/scoring.service';

const PATIENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_USER_ID = '22222222-2222-4222-8222-222222222222';
const TOTAL_MMPI2_QUESTIONS = 567;

interface StoredArtifact {
  key: string;
  contentType: 'application/pdf';
  byteLength: number;
  checksumSha256: string;
  createdAt: Date;
  body: Uint8Array;
}

class InMemoryArtifactStore {
  private readonly byKey = new Map<string, StoredArtifact>();

  save(input: { key: string; contentType: 'application/pdf'; body: Uint8Array }): StoredArtifact {
    const createdAt = new Date();
    const stored: StoredArtifact = {
      key: input.key,
      contentType: input.contentType,
      byteLength: input.body.byteLength,
      checksumSha256: createHash('sha256').update(input.body).digest('hex'),
      createdAt,
      body: new Uint8Array(input.body),
    };

    this.byKey.set(stored.key, stored);
    return {
      ...stored,
      createdAt: new Date(stored.createdAt),
      body: new Uint8Array(stored.body),
    };
  }

  get(key: string): StoredArtifact | null {
    const stored = this.byKey.get(key);
    if (stored === undefined) {
      return null;
    }

    return {
      ...stored,
      createdAt: new Date(stored.createdAt),
      body: new Uint8Array(stored.body),
    };
  }
}

function createAnswerInputs(): Array<{ questionNumber: number; answer: 'true' | 'false' }> {
  return Array.from({ length: TOTAL_MMPI2_QUESTIONS }, (_, index) => ({
    questionNumber: index + 1,
    answer: (index + 1) % 3 === 0 ? 'true' : 'false',
  }));
}

describe('MMPI-2 integration happy path', () => {
  it('verifies request -> session -> scoring -> publish -> artifact availability', async () => {
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
      const profileService = testingModule.get(ProfileService);
      const requestSessionService = testingModule.get(RequestSessionService);
      const scoringService = testingModule.get(ScoringService);
      const reportService = testingModule.get(ReportService);

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

      const createdRequest = await requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
        purpose: 'Integration happy path verification',
      });
      expect(createdRequest.status).toBe(AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW);
      expect(createdRequest.paymentSatisfied).toBe(true);

      const assignedRequest = await requestSessionService.assignDoctor(createdRequest.id, {
        doctorUserId: DOCTOR_USER_ID,
      });
      expect(assignedRequest.doctorUserId).toBe(DOCTOR_USER_ID);

      const approvedRequest = await requestSessionService.reviewRequest(createdRequest.id, {
        decision: 'approved',
      });
      expect(approvedRequest.status).toBe(AssessmentRequestStatus.APPROVED);

      const readyState = await requestSessionService.getSessionStateForPatient(PATIENT_USER_ID, createdRequest.id);
      expect(readyState.session.status).toBe(ExamSessionStatus.READY_TO_START);

      const startedState = await requestSessionService.startSessionForPatient(PATIENT_USER_ID, createdRequest.id);
      expect(startedState.session.status).toBe(ExamSessionStatus.IN_PROGRESS);

      const answerInputs = createAnswerInputs();
      for (let index = 0; index < answerInputs.length; index += 75) {
        await requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, createdRequest.id, {
          answers: answerInputs.slice(index, index + 75),
        });
      }

      const submittedState = await requestSessionService.submitSessionForPatient(PATIENT_USER_ID, createdRequest.id);
      expect(submittedState.session.status).toBe(ExamSessionStatus.SUBMITTED);
      expect(submittedState.progress.answeredCount).toBe(TOTAL_MMPI2_QUESTIONS);
      expect(submittedState.progress.unansweredCount).toBe(0);

      const scoredView = await scoringService.runScoringForSubmittedSession(submittedState.session.id);
      expect(scoredView.resultSet.status).toBe(ScoreResultSetStatus.COMPLETED);
      expect(scoredView.scaleResults.length).toBeGreaterThan(0);
      expect(scoredView.resultSet.examSessionId).toBe(submittedState.session.id);

      const draftedState = await reportService.saveDraftForDoctor(submittedState.session.id, DOCTOR_USER_ID, {
        interpretationSummary: 'Integration draft summary before sign-off.',
        narrative: 'Patient completed the full instrument and generated publishable scoring output.',
      });
      expect(draftedState.report?.reportStatus).toBe(ClinicalReportStatus.DRAFT);

      const signedState = await reportService.signReportForDoctor(submittedState.session.id, DOCTOR_USER_ID, {
        signatureStoragePath: 'signatures/integration-doctor.png',
      });
      expect(signedState.report?.reportStatus).toBe('pending_review');
      expect(signedState.signature?.storagePath).toBe('signatures/integration-doctor.png');

      const publishedState = await reportService.publishReportForDoctor(submittedState.session.id, DOCTOR_USER_ID, {
        interpretationSummary: 'Published report for integration verification.',
        narrative:
          'This published report confirms the end-to-end happy path from request creation to scored output.',
        supplementalObservations: {
          conclusion: 'Artifact generation should now be available.',
        },
      });

      expect(publishedState.report?.reportStatus).toBe(ClinicalReportStatus.PUBLISHED);
      expect(publishedState.report?.publishedAt).not.toBeNull();
      expect(publishedState.signature).not.toBeNull();

      const publishedReport = publishedState.report;
      if (publishedReport === null) {
        throw new Error('Expected published report to be available.');
      }

      const patientProfile = await profileService.getPatientProfileByUserId(PATIENT_USER_ID);
      const doctorProfile = await profileService.getDoctorProfileByUserId(DOCTOR_USER_ID);
      const storageKey = `reports/${publishedReport.id}.pdf`;

      const artifactPayload: ReportArtifactJobPayload = ReportArtifactJobPayloadSchema.parse({
        jobId: randomUUID(),
        requestedAt: new Date(),
        artifactType: 'clinical_report_pdf',
        source: {
          report: publishedReport,
          scoreResultSet: scoredView.resultSet,
          scaleResults: scoredView.scaleResults,
          validityFlags: scoredView.validityFlags,
          patientProfile,
          doctorProfile,
          signature: publishedState.signature,
          scoringSummary: {
            isValid: !scoredView.validityFlags.some((flag) => flag.severity === ValidityFlagSeverity.CRITICAL),
            cannotSayCount: submittedState.progress.unansweredCount,
            notes:
              scoredView.validityFlags.length === 0
                ? ['No validity warnings were raised during scoring.']
                : scoredView.validityFlags.map((flag) => `${flag.flagCode}: ${flag.description}`),
          },
        },
        output: {
          storageKey,
          fileName: `mmpi2-report-${publishedReport.id}.pdf`,
          contentType: 'application/pdf',
        },
      });

      const composition = buildReportCompositionData(artifactPayload);
      const pdfBytes = await renderClinicalReportPdf(composition);

      expect(pdfBytes.byteLength).toBeGreaterThan(1024);
      expect(Buffer.from(pdfBytes).subarray(0, 4).toString('utf8')).toBe('%PDF');

      const artifactStore = new InMemoryArtifactStore();
      const savedArtifact = artifactStore.save({
        key: artifactPayload.output.storageKey,
        contentType: artifactPayload.output.contentType,
        body: pdfBytes,
      });

      const storedArtifact = artifactStore.get(artifactPayload.output.storageKey);
      expect(storedArtifact).not.toBeNull();
      expect(savedArtifact.key).toBe(storageKey);
      expect(savedArtifact.contentType).toBe('application/pdf');
      expect(savedArtifact.byteLength).toBe(pdfBytes.byteLength);
      expect(savedArtifact.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(storedArtifact?.checksumSha256).toBe(savedArtifact.checksumSha256);
      expect(storedArtifact?.body.byteLength).toBe(pdfBytes.byteLength);
    } finally {
      await testingModule.close();
    }
  });
});
