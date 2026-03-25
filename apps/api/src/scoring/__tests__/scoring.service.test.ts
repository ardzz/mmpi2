import { MMPI2_1989_TRIPLET } from '@mmpi2/config';
import {
  BillingMode,
  ExamSessionStatus,
  type BillingMode as BillingModeType,
} from '@mmpi2/contracts';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { InMemoryPaymentRepository } from '../../payment/in-memory-payment.repository';
import { MidtransGateway } from '../../payment/gateways/midtrans.gateway';
import { NullGateway } from '../../payment/gateways/null.gateway';
import { XenditGateway } from '../../payment/gateways/xendit.gateway';
import { PaymentService } from '../../payment/payment.service';
import { InMemoryProfileRepository } from '../../profile/in-memory-profile.repository';
import { ProfileService } from '../../profile/profile.service';
import { InMemoryRequestSessionRepository } from '../../request-session/in-memory-request-session.repository';
import { RequestSessionService } from '../../request-session/request-session.service';
import { InMemoryScoringRepository } from '../in-memory-scoring.repository';
import { ScoringService } from '../scoring.service';

const PATIENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_USER_ID = '22222222-2222-4222-8222-222222222222';

function setupServices(billingMode: BillingModeType = BillingMode.DISABLED) {
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
  paymentService.updateBillingMode(billingMode);
  const requestSessionService = new RequestSessionService(
    requestSessionRepository,
    profileService,
    paymentService,
  );

  const scoringRepository = new InMemoryScoringRepository();
  const scoringService = new ScoringService(scoringRepository, requestSessionRepository, profileService);

  return {
    requestSessionService,
    scoringService,
    profileService,
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
    fullName: 'Dr. Tester',
    licenseNumber: 'PSY-9001',
    specialty: 'Clinical Psychology',
  });
}

async function createSubmittedSession(
  requestSessionService: RequestSessionService,
  profileService: ProfileService,
): Promise<string> {
  await createCompletePatientProfile(profileService, PATIENT_USER_ID);
  await createDoctorProfile(profileService, DOCTOR_USER_ID);

  const createdRequest = await requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
    purpose: 'Scoring workflow test',
  });

  await requestSessionService.assignDoctor(createdRequest.id, {
    doctorUserId: DOCTOR_USER_ID,
  });
  await requestSessionService.reviewRequest(createdRequest.id, {
    decision: 'approved',
  });
  await requestSessionService.startSessionForPatient(PATIENT_USER_ID, createdRequest.id);

  const answerInputs = Array.from({ length: 333 }, (_, index) => ({
    questionNumber: index + 1,
    answer: 'false' as const,
  }));

  for (let index = 0; index < answerInputs.length; index += 50) {
    await requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, createdRequest.id, {
      answers: answerInputs.slice(index, index + 50),
    });
  }

  const submittedState = await requestSessionService.submitSessionForPatient(PATIENT_USER_ID, createdRequest.id);
  expect(submittedState.session.status).toBe(ExamSessionStatus.SUBMITTED);
  return submittedState.session.id;
}

describe('ScoringService', () => {
  it('scores a submitted session, persists immutable result sets, and exposes doctor retrieval view', async () => {
    const { requestSessionService, scoringService, profileService } = setupServices(BillingMode.DISABLED);
    const sessionId = await createSubmittedSession(requestSessionService, profileService);

    const scoredView = await scoringService.runScoringForSubmittedSession(sessionId);

    expect(scoredView.resultSet.status).toBe('completed');
    expect(scoredView.resultSet.examSessionId).toBe(sessionId);
    expect(scoredView.resultSet.scoringConfigVersionId).toBe(MMPI2_1989_TRIPLET.scoringConfig.id);
    expect(scoredView.scaleResults.length).toBeGreaterThan(0);
    expect([ExamSessionStatus.SCORED, ExamSessionStatus.NEEDS_CLINICAL_REVIEW]).toContain(
      scoredView.session.status,
    );

    const doctorView = await scoringService.getLatestScoreForDoctor(sessionId, DOCTOR_USER_ID);
    expect(doctorView.resultSet.id).toBe(scoredView.resultSet.id);

    doctorView.resultSet.engineVersion = 'tampered';
    const reloadedDoctorView = await scoringService.getLatestScoreForDoctor(sessionId, DOCTOR_USER_ID);
    expect(reloadedDoctorView.resultSet.engineVersion).toBe('0.0.1');
  });

  it('rejects scoring trigger unless session is submitted', async () => {
    const { requestSessionService, scoringService, profileService } = setupServices(BillingMode.DISABLED);
    await createCompletePatientProfile(profileService, PATIENT_USER_ID);
    await createDoctorProfile(profileService, DOCTOR_USER_ID);

    const createdRequest = await requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Illegal trigger case',
    });

    await requestSessionService.assignDoctor(createdRequest.id, {
      doctorUserId: DOCTOR_USER_ID,
    });
    await requestSessionService.reviewRequest(createdRequest.id, {
      decision: 'approved',
    });

    const startedState = await requestSessionService.startSessionForPatient(PATIENT_USER_ID, createdRequest.id);
    expect(startedState.session.status).toBe(ExamSessionStatus.IN_PROGRESS);

    await expect(scoringService.runScoringForSubmittedSession(startedState.session.id)).rejects.toThrow(
      ConflictException,
    );
    await expect(scoringService.getLatestScoreForDoctor(startedState.session.id, DOCTOR_USER_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});
