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

function createCompletePatientProfile(profileService: ProfileService, userId: string): void {
  profileService.upsertPatientProfile(userId, {
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

function createDoctorProfile(profileService: ProfileService, userId: string): void {
  profileService.upsertDoctorProfile(userId, {
    fullName: 'Dr. Tester',
    licenseNumber: 'PSY-9001',
    specialty: 'Clinical Psychology',
  });
}

function createSubmittedSession(
  requestSessionService: RequestSessionService,
  profileService: ProfileService,
): string {
  createCompletePatientProfile(profileService, PATIENT_USER_ID);
  createDoctorProfile(profileService, DOCTOR_USER_ID);

  const createdRequest = requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
    purpose: 'Scoring workflow test',
  });

  requestSessionService.assignDoctor(createdRequest.id, {
    doctorUserId: DOCTOR_USER_ID,
  });
  requestSessionService.reviewRequest(createdRequest.id, {
    decision: 'approved',
  });
  requestSessionService.startSessionForPatient(PATIENT_USER_ID, createdRequest.id);

  const answerInputs = Array.from({ length: 333 }, (_, index) => ({
    questionNumber: index + 1,
    answer: 'false' as const,
  }));

  for (let index = 0; index < answerInputs.length; index += 50) {
    requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, createdRequest.id, {
      answers: answerInputs.slice(index, index + 50),
    });
  }

  const submittedState = requestSessionService.submitSessionForPatient(PATIENT_USER_ID, createdRequest.id);
  expect(submittedState.session.status).toBe(ExamSessionStatus.SUBMITTED);
  return submittedState.session.id;
}

describe('ScoringService', () => {
  it('scores a submitted session, persists immutable result sets, and exposes doctor retrieval view', () => {
    const { requestSessionService, scoringService, profileService } = setupServices(BillingMode.DISABLED);
    const sessionId = createSubmittedSession(requestSessionService, profileService);

    const scoredView = scoringService.runScoringForSubmittedSession(sessionId);

    expect(scoredView.resultSet.status).toBe('completed');
    expect(scoredView.resultSet.examSessionId).toBe(sessionId);
    expect(scoredView.resultSet.scoringConfigVersionId).toBe(MMPI2_1989_TRIPLET.scoringConfig.id);
    expect(scoredView.scaleResults.length).toBeGreaterThan(0);
    expect([ExamSessionStatus.SCORED, ExamSessionStatus.NEEDS_CLINICAL_REVIEW]).toContain(
      scoredView.session.status,
    );

    const doctorView = scoringService.getLatestScoreForDoctor(sessionId, DOCTOR_USER_ID);
    expect(doctorView.resultSet.id).toBe(scoredView.resultSet.id);

    doctorView.resultSet.engineVersion = 'tampered';
    const reloadedDoctorView = scoringService.getLatestScoreForDoctor(sessionId, DOCTOR_USER_ID);
    expect(reloadedDoctorView.resultSet.engineVersion).toBe('0.0.1');
  });

  it('rejects scoring trigger unless session is submitted', () => {
    const { requestSessionService, scoringService, profileService } = setupServices(BillingMode.DISABLED);
    createCompletePatientProfile(profileService, PATIENT_USER_ID);
    createDoctorProfile(profileService, DOCTOR_USER_ID);

    const createdRequest = requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Illegal trigger case',
    });

    requestSessionService.assignDoctor(createdRequest.id, {
      doctorUserId: DOCTOR_USER_ID,
    });
    requestSessionService.reviewRequest(createdRequest.id, {
      decision: 'approved',
    });

    const startedState = requestSessionService.startSessionForPatient(PATIENT_USER_ID, createdRequest.id);
    expect(startedState.session.status).toBe(ExamSessionStatus.IN_PROGRESS);

    expect(() => scoringService.runScoringForSubmittedSession(startedState.session.id)).toThrow(
      ConflictException,
    );
    expect(() => scoringService.getLatestScoreForDoctor(startedState.session.id, DOCTOR_USER_ID)).toThrow(
      NotFoundException,
    );
  });
});
