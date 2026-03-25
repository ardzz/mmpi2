import { MMPI2_1989_TRIPLET } from '@mmpi2/config';
import {
  BillingMode,
  DoctorCaseValidityLabel,
  ExamSessionStatus,
  PaymentRequirement,
  type BillingMode as BillingModeType,
} from '@mmpi2/contracts';
import {
  ConflictException,
  ForbiddenException,
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
import { ProfileService } from '../../profile/profile.service';
import { InMemoryProfileRepository } from '../../profile/in-memory-profile.repository';
import { InMemoryRequestSessionRepository } from '../in-memory-request-session.repository';
import { RequestSessionService } from '../request-session.service';

const PATIENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_USER_ID = '22222222-2222-4222-8222-222222222222';

async function setupService(billingMode: BillingModeType = BillingMode.DISABLED) {
  const profileRepository = new InMemoryProfileRepository();
  const profileService = new ProfileService(profileRepository);

  const workflowRepository = new InMemoryRequestSessionRepository();

  const paymentRepository = new InMemoryPaymentRepository();
  const paymentService = new PaymentService(
    paymentRepository,
    new NullGateway(),
    new MidtransGateway(),
    new XenditGateway(),
  );
  await paymentService.updateBillingMode(billingMode);

  const service = new RequestSessionService(workflowRepository, profileService, paymentService);
  return {
    service,
    profileService,
    paymentService,
    paymentRepository,
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

describe('RequestSessionService', () => {
  it('executes free-mode happy path with frozen versions and answer upsert behavior', async () => {
    const { service, profileService } = await setupService(BillingMode.DISABLED);
    await createCompletePatientProfile(profileService, PATIENT_USER_ID);
    await createDoctorProfile(profileService, DOCTOR_USER_ID);

    const createdRequest = await service.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Pre-employment screening',
    });

    expect(createdRequest.paymentRequirement).toBe(PaymentRequirement.FREE);
    expect(createdRequest.paymentSatisfied).toBe(true);
    expect(createdRequest.activePaymentId).toBeNull();
    expect(createdRequest.status).toBe('ready_for_admin_review');

    const assignedRequest = await service.assignDoctor(createdRequest.id, {
      doctorUserId: DOCTOR_USER_ID,
    });
    expect(assignedRequest.doctorUserId).toBe(DOCTOR_USER_ID);

    const approvedRequest = await service.reviewRequest(createdRequest.id, {
      decision: 'approved',
    });
    expect(approvedRequest.status).toBe('approved');

    const readyState = await service.getSessionStateForPatient(PATIENT_USER_ID, createdRequest.id);
    expect(readyState.session.status).toBe(ExamSessionStatus.READY_TO_START);
    expect(readyState.frozenVersions).toEqual({
      instrumentVersionId: MMPI2_1989_TRIPLET.instrument.id,
      questionBankVersionId: MMPI2_1989_TRIPLET.questionBank.id,
      scoringConfigVersionId: MMPI2_1989_TRIPLET.scoringConfig.id,
    });

    const startedState = await service.startSessionForPatient(PATIENT_USER_ID, createdRequest.id);
    expect(startedState.session.status).toBe(ExamSessionStatus.IN_PROGRESS);
    expect(startedState.session.startedAt).not.toBeNull();

    const savedState = await service.saveAnswersForPatient(PATIENT_USER_ID, createdRequest.id, {
      answers: [
        { questionNumber: 1, answer: 'true' },
        { questionNumber: 2, answer: 'false' },
      ],
    });

    expect(savedState.answers).toHaveLength(2);
    expect(savedState.progress.answeredCount).toBe(2);

    const overwrittenState = await service.saveAnswersForPatient(PATIENT_USER_ID, createdRequest.id, {
      answers: [{ questionNumber: 1, answer: 'false' }],
    });

    expect(overwrittenState.answers).toHaveLength(2);
    expect(overwrittenState.answers.find((answer) => answer.questionNumber === 1)?.answerState).toBe(
      'false',
    );

    const submittedState = await service.submitSessionForPatient(PATIENT_USER_ID, createdRequest.id);
    expect(submittedState.session.status).toBe(ExamSessionStatus.SUBMITTED);
    expect(submittedState.session.submittedAt).not.toBeNull();

    await expect(
      service.saveAnswersForPatient(PATIENT_USER_ID, createdRequest.id, {
        answers: [{ questionNumber: 3, answer: 'true' }],
      }),
    ).rejects.toThrow(ConflictException);

    await expect(service.startSessionForPatient(PATIENT_USER_ID, createdRequest.id)).rejects.toThrow(
      ConflictException,
    );
  });

  it('blocks request creation when patient profile is incomplete', async () => {
    const { service, profileService } = await setupService(BillingMode.DISABLED);

    await profileService.upsertPatientProfile(PATIENT_USER_ID, {
      fullName: 'Incomplete Patient',
      dateOfBirth: new Date('1991-01-01'),
      gender: 'male',
    });

    await expect(
      service.createAssessmentRequest(PATIENT_USER_ID, {
        purpose: 'Should fail',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('enforces payment/admin gating and doctor-assignment prerequisite before start', async () => {
    const { service: paidService, profileService: paidProfiles } = await setupService(BillingMode.MIDTRANS);
    await createCompletePatientProfile(paidProfiles, PATIENT_USER_ID);

    const paidRequest = await paidService.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Paid flow',
    });

    expect(paidRequest.paymentRequirement).toBe(PaymentRequirement.GATEWAY_REQUIRED);
    expect(paidRequest.status).toBe('awaiting_payment');
    await expect(
      paidService.reviewRequest(paidRequest.id, {
        decision: 'approved',
      }),
    ).rejects.toThrow(ConflictException);

    const { service: freeService, profileService: freeProfiles } = await setupService(BillingMode.DISABLED);
    await createCompletePatientProfile(freeProfiles, PATIENT_USER_ID);

    const freeRequest = await freeService.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'No doctor assigned yet',
    });

    await freeService.reviewRequest(freeRequest.id, {
      decision: 'approved',
    });

    const stateBeforeDoctorAssignment = await freeService.getSessionStateForPatient(
      PATIENT_USER_ID,
      freeRequest.id,
    );
    expect(stateBeforeDoctorAssignment.session.status).toBe(ExamSessionStatus.APPROVED);

    await expect(freeService.startSessionForPatient(PATIENT_USER_ID, freeRequest.id)).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates payment rows for gateway-required requests and supports manual confirmation', async () => {
    const { service, profileService } = await setupService(BillingMode.MIDTRANS);
    await createCompletePatientProfile(profileService, PATIENT_USER_ID);

    const request = await service.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Gateway payment flow',
    });

    expect(request.paymentRequirement).toBe(PaymentRequirement.GATEWAY_REQUIRED);
    expect(request.paymentSatisfied).toBe(false);

    const withPayment = await service.createPaymentForPatientRequest(PATIENT_USER_ID, request.id);
    expect(withPayment.request.status).toBe('payment_pending');
    expect(withPayment.request.activePaymentId).toBe(withPayment.paymentId);

    const confirmed = await service.confirmPaymentForRequestManually(request.id, {
      adminNote: 'Bank transfer verified by admin.',
    });

    expect(confirmed.paymentSatisfied).toBe(true);
    expect(confirmed.status).toBe('ready_for_admin_review');
  });

  it('waives gateway-required payment without creating extra payment rows', async () => {
    const { service, profileService, paymentService } = await setupService(BillingMode.XENDIT);
    await createCompletePatientProfile(profileService, PATIENT_USER_ID);

    const request = await service.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Waiver path',
    });

    const waived = await service.waivePaymentForRequest(request.id, {
      adminNote: 'Compassionate waiver approved.',
    });

    expect(waived.paymentRequirement).toBe(PaymentRequirement.WAIVED);
    expect(waived.paymentSatisfied).toBe(true);
    expect(waived.status).toBe('ready_for_admin_review');
    expect(waived.activePaymentId).toBeNull();
    expect(await paymentService.listPaymentsByRequestId(request.id)).toEqual([]);
  });

  it('applies verified paid webhook to request-level billing only and ignores duplicates', async () => {
    const {
      service,
      profileService,
      paymentService,
      paymentRepository,
    } = await setupService(BillingMode.MIDTRANS);
    await createCompletePatientProfile(profileService, PATIENT_USER_ID);

    const request = await service.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Webhook paid flow',
    });

    const withPayment = await service.createPaymentForPatientRequest(PATIENT_USER_ID, request.id);
    const payment = (await paymentService.listPaymentsByRequestId(request.id)).at(-1);
    expect(payment).toBeDefined();
    if (payment === undefined || payment.providerReferenceId === null) {
      throw new Error('Expected active payment with provider reference.');
    }
    expect(withPayment.request.status).toBe('payment_pending');

    const paidPayload = {
      providerCode: payment.providerCode,
      providerReferenceId: payment.providerReferenceId,
      providerEventId: 'evt-paid-dup-001',
      providerStatus: 'paid',
      rawBody: '{"transaction_status":"settlement"}',
    } as const;

    const afterPaid = await service.processPaymentWebhook(paidPayload);
    expect(afterPaid.paymentSatisfied).toBe(true);
    expect(afterPaid.status).toBe('ready_for_admin_review');

    const afterDuplicate = await service.processPaymentWebhook(paidPayload);
    expect(afterDuplicate.status).toBe('ready_for_admin_review');
    expect(afterDuplicate.paymentSatisfied).toBe(true);

    const paymentEvents = await paymentRepository.listPaymentEventsByPaymentId(withPayment.paymentId);
    expect(paymentEvents).toHaveLength(2);
    expect(paymentEvents.at(-1)?.idempotencyKey).toBe('midtrans:evt-paid-dup-001');
  });

  it('keeps request unsatisfied when verified webhook reports failed/expired/cancelled outcomes', async () => {
    const { service, profileService, paymentService } = await setupService(BillingMode.XENDIT);
    await createCompletePatientProfile(profileService, PATIENT_USER_ID);

    const request = await service.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Webhook failed flow',
    });

    const withPayment = await service.createPaymentForPatientRequest(PATIENT_USER_ID, request.id);
    const payment = (await paymentService.listPaymentsByRequestId(request.id)).at(-1);
    expect(payment).toBeDefined();
    if (payment === undefined || payment.providerReferenceId === null) {
      throw new Error('Expected active payment with provider reference.');
    }

    const failedResult = await service.processPaymentWebhook({
      providerCode: payment.providerCode,
      providerReferenceId: payment.providerReferenceId,
      providerEventId: 'evt-failed-001',
      providerStatus: 'cancelled',
      rawBody: '{"status":"CANCELLED"}',
    });

    expect(failedResult.paymentSatisfied).toBe(false);
    expect(failedResult.status).toBe('payment_pending');

    const latestPayment = (await paymentService.listPaymentsByRequestId(request.id)).at(-1);
    expect(latestPayment?.paymentStatus).toBe('failed');
    expect(withPayment.request.activePaymentId).toBe(latestPayment?.id);
  });

  it('lists doctor queue cases ordered by latest submission time', async () => {
    const { service, profileService } = await setupService(BillingMode.DISABLED);
    await createCompletePatientProfile(profileService, PATIENT_USER_ID);
    await createDoctorProfile(profileService, DOCTOR_USER_ID);

    const firstRequest = await service.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Doctor queue case one',
    });
    await service.assignDoctor(firstRequest.id, { doctorUserId: DOCTOR_USER_ID });
    await service.reviewRequest(firstRequest.id, { decision: 'approved' });
    await service.startSessionForPatient(PATIENT_USER_ID, firstRequest.id);
    await service.submitSessionForPatient(PATIENT_USER_ID, firstRequest.id);

    const secondRequest = await service.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Doctor queue case two',
    });
    await service.assignDoctor(secondRequest.id, { doctorUserId: DOCTOR_USER_ID });
    await service.reviewRequest(secondRequest.id, { decision: 'approved' });

    const doctorQueue = await service.getDoctorCaseQueue(DOCTOR_USER_ID);

    expect(doctorQueue).toHaveLength(2);
    expect(doctorQueue[0]?.assessmentRequestId).toBe(firstRequest.id);
    expect(doctorQueue[0]?.validityLabel).toBe(DoctorCaseValidityLabel.PENDING);
    expect(doctorQueue[1]?.assessmentRequestId).toBe(secondRequest.id);
  });
});
