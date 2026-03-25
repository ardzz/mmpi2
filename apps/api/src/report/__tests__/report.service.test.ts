import { BillingMode } from '@mmpi2/contracts';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { MidtransGateway } from '../../payment/gateways/midtrans.gateway';
import { NullGateway } from '../../payment/gateways/null.gateway';
import { XenditGateway } from '../../payment/gateways/xendit.gateway';
import { InMemoryPaymentRepository } from '../../payment/in-memory-payment.repository';
import { PaymentService } from '../../payment/payment.service';
import { InMemoryProfileRepository } from '../../profile/in-memory-profile.repository';
import { ProfileService } from '../../profile/profile.service';
import { InMemoryReportRepository } from '../in-memory-report.repository';
import { ReportService } from '../report.service';
import { InMemoryRequestSessionRepository } from '../../request-session/in-memory-request-session.repository';
import { RequestSessionService } from '../../request-session/request-session.service';
import { InMemoryScoringRepository } from '../../scoring/in-memory-scoring.repository';
import { ScoringService } from '../../scoring/scoring.service';

const PATIENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_USER_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_DOCTOR_USER_ID = '33333333-3333-4333-8333-333333333333';

function setupServices() {
  const profileRepository = new InMemoryProfileRepository();
  const profileService = new ProfileService(profileRepository);

  const requestSessionRepository = new InMemoryRequestSessionRepository();
  const paymentRepository = new InMemoryPaymentRepository();
  const paymentService = new PaymentService(
    paymentRepository,
    new NullGateway(),
    new MidtransGateway(),
    new XenditGateway(),
  );
  paymentService.updateBillingMode(BillingMode.DISABLED);
  const requestSessionService = new RequestSessionService(
    requestSessionRepository,
    profileService,
    paymentService,
  );

  const scoringRepository = new InMemoryScoringRepository();
  const scoringService = new ScoringService(scoringRepository, requestSessionRepository, profileService);

  const reportRepository = new InMemoryReportRepository();
  const reportService = new ReportService(
    reportRepository,
    requestSessionRepository,
    profileService,
    scoringService,
  );

  return {
    profileService,
    requestSessionService,
    scoringService,
    reportService,
    reportRepository,
  };
}

async function createCompletePatientProfile(profileService: ProfileService, userId: string): Promise<void> {
  await profileService.upsertPatientProfile(userId, {
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
}

async function createDoctorProfile(profileService: ProfileService, userId: string): Promise<void> {
  await profileService.upsertDoctorProfile(userId, {
    fullName: `Dr. ${userId.slice(0, 4)}`,
    licenseNumber: `PSY-${userId.slice(0, 4)}`,
    specialty: 'Clinical Psychology',
  });
}

async function createScoredSession(
  requestSessionService: RequestSessionService,
  scoringService: ScoringService,
  profileService: ProfileService,
): Promise<string> {
  await createCompletePatientProfile(profileService, PATIENT_USER_ID);
  await createDoctorProfile(profileService, DOCTOR_USER_ID);

  const request = await requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
    purpose: 'Report workflow test',
  });

  await requestSessionService.assignDoctor(request.id, {
    doctorUserId: DOCTOR_USER_ID,
  });
  await requestSessionService.reviewRequest(request.id, {
    decision: 'approved',
  });
  await requestSessionService.startSessionForPatient(PATIENT_USER_ID, request.id);

  const answerInputs = Array.from({ length: 333 }, (_, index) => ({
    questionNumber: index + 1,
    answer: 'false' as const,
  }));

  for (let index = 0; index < answerInputs.length; index += 60) {
    await requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, request.id, {
      answers: answerInputs.slice(index, index + 60),
    });
  }

  const submitted = await requestSessionService.submitSessionForPatient(PATIENT_USER_ID, request.id);
  const scored = await scoringService.runScoringForSubmittedSession(submitted.session.id);
  expect(scored.resultSet.status).toBe('completed');

  return submitted.session.id;
}

describe('ReportService', () => {
  it('supports doctor draft -> sign -> publish flow bound to canonical result set', async () => {
    const { requestSessionService, scoringService, profileService, reportService } = setupServices();
    const sessionId = await createScoredSession(requestSessionService, scoringService, profileService);

    const initialState = await reportService.getReportStateForDoctor(sessionId, DOCTOR_USER_ID);
    expect(initialState.report).toBeNull();

    const drafted = await reportService.saveDraftForDoctor(sessionId, DOCTOR_USER_ID, {
      interpretationSummary: 'Initial interpretation draft content for review.',
    });

    expect(drafted.report?.reportStatus).toBe('draft');
    expect(drafted.report?.scoreResultSetId).toBe(initialState.resultSet.id);

    const signed = await reportService.signReportForDoctor(sessionId, DOCTOR_USER_ID, {
      signatureStoragePath: 'signatures/doctor-a.png',
    });

    expect(signed.report?.reportStatus).toBe('pending_review');
    expect(signed.signature?.storagePath).toBe('signatures/doctor-a.png');

    const published = await reportService.publishReportForDoctor(sessionId, DOCTOR_USER_ID, {
      interpretationSummary: 'Final interpretation summary with clinical context and validated findings.',
      narrative:
        'Patient profile indicates notable response consistency and a clinically reviewable but publishable profile.',
      supplementalObservations: {
        conclusion: 'Clinical interpretation finalized and approved for publication.',
      },
    });

    expect(published.report?.reportStatus).toBe('published');
    expect(published.report?.publishedAt).not.toBeNull();
    expect(published.report?.scoreResultSetId).toBe(initialState.resultSet.id);

    await expect(
      reportService.saveDraftForDoctor(sessionId, DOCTOR_USER_ID, {
        narrative: 'Attempt direct edit on published report',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects publish before sign-off and blocks unassigned doctors from authoring', async () => {
    const { requestSessionService, scoringService, profileService, reportService } = setupServices();
    const sessionId = await createScoredSession(requestSessionService, scoringService, profileService);
    await createDoctorProfile(profileService, OTHER_DOCTOR_USER_ID);

    await reportService.saveDraftForDoctor(sessionId, DOCTOR_USER_ID, {
      interpretationSummary: 'Draft prepared for illegal publish test.',
      narrative: 'Narrative draft created before sign-off.',
    });

    await expect(
      reportService.publishReportForDoctor(sessionId, DOCTOR_USER_ID, {
        interpretationSummary: 'Publish attempt without sign-off should be rejected by service rules.',
        narrative: 'No explicit signature captured yet.',
      }),
    ).rejects.toThrow(ConflictException);

    await expect(reportService.getReportStateForDoctor(sessionId, OTHER_DOCTOR_USER_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('creates amendment lineage instead of mutating published records', async () => {
    const { requestSessionService, scoringService, profileService, reportService, reportRepository } =
      setupServices();
    const sessionId = await createScoredSession(requestSessionService, scoringService, profileService);

    await expect(
      reportService.amendPublishedReportForDoctor(sessionId, DOCTOR_USER_ID, {
        interpretationSummary: 'Invalid amendment attempt',
        narrative: 'No published report exists yet.',
        amendmentReason: 'Needs correction',
      }),
    ).rejects.toThrow(NotFoundException);

    const drafted = await reportService.saveDraftForDoctor(sessionId, DOCTOR_USER_ID, {
      interpretationSummary: 'Publishable draft for amendment scenario.',
      narrative: 'Narrative baseline before publication.',
    });

    const draftId = drafted.report?.id;
    expect(draftId).toBeTruthy();

    await reportService.signReportForDoctor(sessionId, DOCTOR_USER_ID, {
      signatureStoragePath: 'signatures/doctor-a.png',
    });

    const published = await reportService.publishReportForDoctor(sessionId, DOCTOR_USER_ID, {
      interpretationSummary: 'Published summary ready for potential amendment if correction is needed.',
      narrative: 'Published narrative baseline for lineage verification.',
    });

    expect(published.report?.reportStatus).toBe('published');

    const amended = await reportService.amendPublishedReportForDoctor(sessionId, DOCTOR_USER_ID, {
      interpretationSummary: 'Amended summary reflecting corrected clinical framing and conclusions.',
      narrative: 'Amended narrative with corrected emphasis and clarified risk interpretation.',
      amendmentReason: 'Updated interpretation after secondary chart review.',
    });

    expect(amended.report?.reportStatus).toBe('published');
    expect(amended.report?.amendedFromId).toBe(draftId);
    expect(amended.report?.id).not.toBe(draftId);

    const originalReport = await reportRepository.findReportById(draftId ?? '');
    expect(originalReport?.reportStatus).toBe('amended');
    expect(originalReport?.narrative).toBe('Published narrative baseline for lineage verification.');
  });

  it('lists published patient documents and enforces ownership on detail reads', async () => {
    const { requestSessionService, scoringService, profileService, reportService } = setupServices();
    const sessionId = await createScoredSession(requestSessionService, scoringService, profileService);

    await reportService.saveDraftForDoctor(sessionId, DOCTOR_USER_ID, {
      interpretationSummary: 'Patient document summary ready for release.',
      narrative: 'Narrative body for patient-facing document read endpoint.',
    });
    await reportService.signReportForDoctor(sessionId, DOCTOR_USER_ID, {
      signatureStoragePath: 'signatures/patient-docs.png',
    });
    const published = await reportService.publishReportForDoctor(sessionId, DOCTOR_USER_ID, {
      interpretationSummary: 'Published patient-facing interpretation summary.',
      narrative: 'Published patient-facing narrative body.',
      supplementalObservations: {
        conclusion: 'Patient document endpoint verified.',
      },
    });

    const reportId = published.report?.id;
    expect(reportId).toBeTruthy();

    const documentList = await reportService.listPublishedDocumentsForPatient(PATIENT_USER_ID);
    expect(documentList).toHaveLength(1);
    expect(documentList[0]?.id).toBe(reportId);
    expect(documentList[0]?.authorName).toBe('Dr. 2222');

    const detail = await reportService.getPublishedDocumentDetailForPatient(PATIENT_USER_ID, reportId ?? '');
    expect(detail.id).toBe(reportId);
    expect(detail.narrative).toContain('Published patient-facing narrative body.');

    await expect(
      reportService.getPublishedDocumentDetailForPatient('44444444-4444-4444-8444-444444444444', reportId ?? ''),
    ).rejects.toThrow(ForbiddenException);
  });
});
