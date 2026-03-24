import { randomUUID } from 'node:crypto';
import { MMPI2_1989_TRIPLET } from '@mmpi2/config';
import {
  AnswerState,
  AssessmentRequestSchema,
  AssessmentRequestStatus,
  ExamSessionSchema,
  ExamSessionStatus,
  PaymentStatus,
  PaymentRequirement,
  SessionAnswerSchema,
  SessionProgressSchema,
  type PaymentWebhookPayload,
  canTransitionRequest,
  canTransitionSession,
  isSessionActivatable,
  type AssessmentRequest,
  type CreateAssessmentRequestDto,
  type AssignDoctorDto,
  type ReviewRequestDto,
  type ConfirmPaymentManuallyDto,
  type ExamSession,
  type SaveAnswersBatchDto,
  type SessionAnswer,
  type SessionProgress,
  type WaivePaymentDto,
} from '@mmpi2/contracts';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';
import { PaymentService } from '../payment/payment.service';
import {
  type FrozenVersionRefs,
  RequestSessionRepository,
} from './request-session.repository';

const TOTAL_QUESTIONS = 567 as const;

export interface RequestSessionState {
  request: AssessmentRequest;
  session: ExamSession;
  progress: SessionProgress;
  answers: SessionAnswer[];
  frozenVersions: FrozenVersionRefs;
}

@Injectable()
export class RequestSessionService {
  constructor(
    @Inject(RequestSessionRepository)
    private readonly repository: RequestSessionRepository,
    @Inject(ProfileService)
    private readonly profileService: ProfileService,
    @Inject(PaymentService)
    private readonly paymentService: PaymentService,
  ) {}

  createAssessmentRequest(patientUserId: string, payload: CreateAssessmentRequestDto): AssessmentRequest {
    const patientProfile = this.profileService.getPatientProfileByUserId(patientUserId);
    if (!patientProfile.isProfileComplete) {
      throw new ForbiddenException('Patient profile must be complete before creating an assessment request.');
    }

    const requestId = randomUUID();
    const now = new Date();
    const billingPlan = this.paymentService.createBillingPlanForNewRequest(requestId);
    const targetStatus = billingPlan.initialRequestStatus;

    if (!canTransitionRequest(AssessmentRequestStatus.DRAFT, targetStatus)) {
      throw new ConflictException(`Cannot transition request from 'draft' to '${targetStatus}'.`);
    }

    const request: AssessmentRequest = {
      id: requestId,
      patientUserId,
      assessmentTypeId: MMPI2_1989_TRIPLET.instrument.id,
      status: targetStatus,
      paymentRequirement: billingPlan.paymentRequirement,
      paymentSatisfied: billingPlan.paymentSatisfied,
      activePaymentId: null,
      doctorUserId: null,
      purpose: payload.purpose?.trim() ?? null,
      adminNote: null,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.saveRequest(AssessmentRequestSchema.parse(request));
  }

  assignDoctor(requestId: string, payload: AssignDoctorDto): AssessmentRequest {
    const request = this.mustFindRequest(requestId);

    if (
      request.status === AssessmentRequestStatus.REJECTED ||
      request.status === AssessmentRequestStatus.CANCELLED
    ) {
      throw new ConflictException(`Cannot assign doctor while request is '${request.status}'.`);
    }

    const doctorProfile = this.profileService.getDoctorProfileByUserId(payload.doctorUserId);
    if (!doctorProfile.isActive) {
      throw new ConflictException(`Doctor '${payload.doctorUserId}' is not active.`);
    }

    const updatedRequest = this.repository.saveRequest(
      AssessmentRequestSchema.parse({
        ...request,
        doctorUserId: payload.doctorUserId,
        updatedAt: new Date(),
      }),
    );

    this.syncSessionAvailability(updatedRequest);
    return updatedRequest;
  }

  reviewRequest(requestId: string, payload: ReviewRequestDto): AssessmentRequest {
    const request = this.mustFindRequest(requestId);
    const nextStatus =
      payload.decision === 'approved'
        ? AssessmentRequestStatus.APPROVED
        : AssessmentRequestStatus.REJECTED;

    if (!canTransitionRequest(request.status, nextStatus)) {
      throw new ConflictException(
        `Cannot transition request from '${request.status}' to '${nextStatus}'.`,
      );
    }

    let assignedDoctorUserId = request.doctorUserId;
    if (payload.doctorUserId !== undefined) {
      const doctorProfile = this.profileService.getDoctorProfileByUserId(payload.doctorUserId);
      if (!doctorProfile.isActive) {
        throw new ConflictException(`Doctor '${payload.doctorUserId}' is not active.`);
      }

      assignedDoctorUserId = payload.doctorUserId;
    }

    const updatedRequest = this.repository.saveRequest(
      AssessmentRequestSchema.parse({
        ...request,
        status: nextStatus,
        doctorUserId: assignedDoctorUserId,
        adminNote: payload.adminNote?.trim() ?? request.adminNote,
        updatedAt: new Date(),
      }),
    );

    if (nextStatus === AssessmentRequestStatus.APPROVED) {
      this.ensureSessionCreatedForApprovedRequest(updatedRequest);
      this.syncSessionAvailability(updatedRequest);
    }

    return updatedRequest;
  }

  async createPaymentForPatientRequest(
    patientUserId: string,
    requestId: string,
  ): Promise<{ request: AssessmentRequest; paymentId: string }> {
    const request = this.mustFindPatientOwnedRequest(patientUserId, requestId);
    const createdPayment = await this.paymentService.createPaymentForRequest(request);

    const requestStatus = createdPayment.requestStatus;
    if (!canTransitionRequest(request.status, requestStatus) && request.status !== requestStatus) {
      throw new ConflictException(
        `Cannot transition request from '${request.status}' to '${requestStatus}'.`,
      );
    }

    const updatedRequest = this.repository.saveRequest(
      AssessmentRequestSchema.parse({
        ...request,
        status: requestStatus,
        activePaymentId: createdPayment.payment.id,
        updatedAt: new Date(),
      }),
    );

    return {
      request: updatedRequest,
      paymentId: createdPayment.payment.id,
    };
  }

  async processPaymentWebhook(payload: PaymentWebhookPayload): Promise<AssessmentRequest> {
    const webhookResult = await this.paymentService.processWebhook(payload);
    const request = this.mustFindRequest(webhookResult.requestId);

    if (request.activePaymentId !== webhookResult.payment.id) {
      return request;
    }

    if (webhookResult.billingSatisfied) {
      return this.markRequestPaymentSatisfied(request);
    }

    const shouldMoveToPending =
      request.status === AssessmentRequestStatus.AWAITING_PAYMENT &&
      canTransitionRequest(request.status, AssessmentRequestStatus.PAYMENT_PENDING);

    return this.repository.saveRequest(
      AssessmentRequestSchema.parse({
        ...request,
        status: shouldMoveToPending ? AssessmentRequestStatus.PAYMENT_PENDING : request.status,
        paymentSatisfied: false,
        updatedAt: new Date(),
      }),
    );
  }

  confirmPaymentForRequestManually(
    requestId: string,
    payload: ConfirmPaymentManuallyDto,
  ): AssessmentRequest {
    const request = this.mustFindRequest(requestId);
    const confirmedPayment = this.paymentService.confirmPaymentManually(
      request,
      payload.adminNote?.trim() ?? null,
    );

    if (confirmedPayment.paymentStatus !== PaymentStatus.PAID) {
      throw new ConflictException('Manual confirmation did not produce a paid payment state.');
    }

    if (!canTransitionRequest(request.status, AssessmentRequestStatus.PAYMENT_CONFIRMED)) {
      throw new ConflictException(
        `Cannot transition request from '${request.status}' to 'payment_confirmed'.`,
      );
    }

    const withConfirmedPayment = this.repository.saveRequest(
      AssessmentRequestSchema.parse({
        ...request,
        status: AssessmentRequestStatus.PAYMENT_CONFIRMED,
        paymentSatisfied: true,
        adminNote: payload.adminNote?.trim() ?? request.adminNote,
        updatedAt: new Date(),
      }),
    );

    if (!canTransitionRequest(withConfirmedPayment.status, AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW)) {
      throw new ConflictException(
        `Cannot transition request from '${withConfirmedPayment.status}' to 'ready_for_admin_review'.`,
      );
    }

    return this.repository.saveRequest(
      AssessmentRequestSchema.parse({
        ...withConfirmedPayment,
        status: AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW,
        updatedAt: new Date(),
      }),
    );
  }

  waivePaymentForRequest(requestId: string, payload: WaivePaymentDto): AssessmentRequest {
    const request = this.mustFindRequest(requestId);
    if (request.paymentSatisfied) {
      throw new ConflictException('Payment is already satisfied for this request.');
    }

    const requestForWaiver =
      request.status === AssessmentRequestStatus.AWAITING_PAYMENT
        ? this.repository.saveRequest(
            AssessmentRequestSchema.parse({
              ...request,
              status: AssessmentRequestStatus.PAYMENT_PENDING,
              updatedAt: new Date(),
            }),
          )
        : request;

    this.paymentService.waivePayment(requestForWaiver, payload.adminNote?.trim() ?? null);

    const canWaiveFromStatus =
      requestForWaiver.status === AssessmentRequestStatus.AWAITING_PAYMENT ||
      requestForWaiver.status === AssessmentRequestStatus.PAYMENT_PENDING;
    if (!canWaiveFromStatus) {
      throw new ConflictException(
        `Cannot waive payment for request in status '${requestForWaiver.status}'.`,
      );
    }

    const waivedRequest = this.repository.saveRequest(
      AssessmentRequestSchema.parse({
        ...requestForWaiver,
        status: AssessmentRequestStatus.PAYMENT_WAIVED,
        paymentRequirement: PaymentRequirement.WAIVED,
        paymentSatisfied: true,
        adminNote: payload.adminNote?.trim() ?? requestForWaiver.adminNote,
        updatedAt: new Date(),
      }),
    );

    if (!canTransitionRequest(waivedRequest.status, AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW)) {
      throw new ConflictException(
        `Cannot transition request from '${waivedRequest.status}' to 'ready_for_admin_review'.`,
      );
    }

    return this.repository.saveRequest(
      AssessmentRequestSchema.parse({
        ...waivedRequest,
        status: AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW,
        updatedAt: new Date(),
      }),
    );
  }

  getSessionStateForPatient(patientUserId: string, requestId: string): RequestSessionState {
    const request = this.mustFindPatientOwnedRequest(patientUserId, requestId);
    const session = this.mustFindSessionByRequestId(request.id);
    const answers = this.repository.listAnswersBySessionId(session.id);
    return this.toSessionState(request, session, answers);
  }

  startSessionForPatient(patientUserId: string, requestId: string): RequestSessionState {
    const request = this.mustFindPatientOwnedRequest(patientUserId, requestId);
    const session = this.mustFindSessionByRequestId(request.id);

    const activatable = isSessionActivatable({
      requestApproved: request.status === AssessmentRequestStatus.APPROVED,
      paymentCleared: request.paymentSatisfied,
      doctorAssigned: request.doctorUserId !== null,
    });

    if (!activatable) {
      throw new ConflictException('Session cannot be started until request is approved, paid, and assigned.');
    }

    if (session.status === ExamSessionStatus.SUBMITTED) {
      throw new ConflictException('Submitted sessions cannot transition back to in-progress.');
    }

    let updatedSession = session;
    if (updatedSession.status === ExamSessionStatus.APPROVED) {
      updatedSession = this.transitionSession(updatedSession, ExamSessionStatus.READY_TO_START);
    }

    if (updatedSession.status === ExamSessionStatus.READY_TO_START) {
      const now = new Date();
      updatedSession = this.transitionSession(
        {
          ...updatedSession,
          startedAt: updatedSession.startedAt ?? now,
          lastActivityAt: now,
        },
        ExamSessionStatus.IN_PROGRESS,
      );
      this.appendSessionEvent(updatedSession.id, 'session_started', {
        requestId: request.id,
      });
    }

    if (updatedSession.status !== ExamSessionStatus.IN_PROGRESS) {
      throw new ConflictException(
        `Session cannot be started from status '${updatedSession.status}'.`,
      );
    }

    const answers = this.repository.listAnswersBySessionId(updatedSession.id);
    return this.toSessionState(request, updatedSession, answers);
  }

  saveAnswersForPatient(
    patientUserId: string,
    requestId: string,
    payload: SaveAnswersBatchDto,
  ): RequestSessionState {
    const request = this.mustFindPatientOwnedRequest(patientUserId, requestId);
    const session = this.mustFindSessionByRequestId(request.id);

    if (session.status === ExamSessionStatus.SUBMITTED) {
      throw new ConflictException('Cannot modify answers after session submission.');
    }

    if (session.status !== ExamSessionStatus.IN_PROGRESS) {
      throw new ConflictException('Answers can only be saved while session is in progress.');
    }

    const now = new Date();
    for (const answerInput of payload.answers) {
      this.repository.upsertAnswer(
        SessionAnswerSchema.parse({
          id: randomUUID(),
          examSessionId: session.id,
          questionNumber: answerInput.questionNumber,
          answerState: answerInput.answer,
          answeredAt: now,
        }),
      );
    }

    const answers = this.repository.listAnswersBySessionId(session.id);
    const updatedSession = this.repository.saveSession(
      ExamSessionSchema.parse({
        ...session,
        completionPercentage: this.computeCompletionPercentageInt(answers),
        lastActivityAt: now,
        updatedAt: now,
      }),
    );

    return this.toSessionState(request, updatedSession, answers);
  }

  submitSessionForPatient(patientUserId: string, requestId: string): RequestSessionState {
    const request = this.mustFindPatientOwnedRequest(patientUserId, requestId);
    const session = this.mustFindSessionByRequestId(request.id);

    if (session.status === ExamSessionStatus.SUBMITTED) {
      throw new ConflictException('Session is already submitted.');
    }

    if (session.status !== ExamSessionStatus.IN_PROGRESS) {
      throw new ConflictException(`Cannot submit session from status '${session.status}'.`);
    }

    if (!canTransitionSession(session.status, ExamSessionStatus.SUBMITTED)) {
      throw new ConflictException(
        `Cannot transition session from '${session.status}' to 'submitted'.`,
      );
    }

    const answers = this.repository.listAnswersBySessionId(session.id);
    const now = new Date();
    const submittedSession = this.repository.saveSession(
      ExamSessionSchema.parse({
        ...session,
        status: ExamSessionStatus.SUBMITTED,
        completionPercentage: this.computeCompletionPercentageInt(answers),
        submittedAt: now,
        lastActivityAt: now,
        updatedAt: now,
      }),
    );

    this.appendSessionEvent(submittedSession.id, 'session_submitted', {
      requestId: request.id,
    });

    return this.toSessionState(request, submittedSession, answers);
  }

  private mustFindRequest(requestId: string): AssessmentRequest {
    const request = this.repository.findRequestById(requestId);
    if (request === null) {
      throw new NotFoundException(`Assessment request '${requestId}' was not found.`);
    }

    return request;
  }

  private mustFindPatientOwnedRequest(patientUserId: string, requestId: string): AssessmentRequest {
    const request = this.mustFindRequest(requestId);
    if (request.patientUserId !== patientUserId) {
      throw new ForbiddenException('You are not allowed to access this request/session.');
    }

    return request;
  }

  private mustFindSessionByRequestId(requestId: string): ExamSession {
    const session = this.repository.findSessionByRequestId(requestId);
    if (session === null) {
      throw new NotFoundException(
        `Exam session for request '${requestId}' was not found. Admin approval may be pending.`,
      );
    }

    return session;
  }

  private ensureSessionCreatedForApprovedRequest(request: AssessmentRequest): ExamSession {
    const existing = this.repository.findSessionByRequestId(request.id);
    if (existing !== null) {
      return existing;
    }

    const now = new Date();
    const frozenVersions: FrozenVersionRefs = {
      instrumentVersionId: MMPI2_1989_TRIPLET.instrument.id,
      questionBankVersionId: MMPI2_1989_TRIPLET.questionBank.id,
      scoringConfigVersionId: MMPI2_1989_TRIPLET.scoringConfig.id,
    };

    const session = this.repository.saveSession(
      ExamSessionSchema.parse({
        id: randomUUID(),
        assessmentRequestId: request.id,
        patientUserId: request.patientUserId,
        doctorUserId: request.doctorUserId,
        instrumentVersionId: frozenVersions.instrumentVersionId,
        questionBankVersionId: frozenVersions.questionBankVersionId,
        status: ExamSessionStatus.APPROVED,
        approvedAt: now,
        startedAt: null,
        lastActivityAt: null,
        submittedAt: null,
        completionPercentage: 0,
        createdAt: now,
        updatedAt: now,
      }),
      frozenVersions,
    );

    this.appendSessionEvent(session.id, 'session_approved', {
      requestId: request.id,
    });

    return session;
  }

  private syncSessionAvailability(request: AssessmentRequest): void {
    const session = this.repository.findSessionByRequestId(request.id);
    if (session === null) {
      return;
    }

    const now = new Date();
    const refreshedSession =
      session.doctorUserId === request.doctorUserId
        ? session
        : this.repository.saveSession(
            ExamSessionSchema.parse({
              ...session,
              doctorUserId: request.doctorUserId,
              updatedAt: now,
            }),
          );

    const activatable = isSessionActivatable({
      requestApproved: request.status === AssessmentRequestStatus.APPROVED,
      paymentCleared: request.paymentSatisfied,
      doctorAssigned: request.doctorUserId !== null,
    });

    if (refreshedSession.status !== ExamSessionStatus.APPROVED || !activatable) {
      return;
    }

    if (!canTransitionSession(refreshedSession.status, ExamSessionStatus.READY_TO_START)) {
      throw new ConflictException(
        `Cannot transition session from '${refreshedSession.status}' to 'ready_to_start'.`,
      );
    }

    const readySession = this.repository.saveSession(
      ExamSessionSchema.parse({
        ...refreshedSession,
        status: ExamSessionStatus.READY_TO_START,
        updatedAt: now,
      }),
    );

    this.appendSessionEvent(readySession.id, 'session_ready_to_start', {
      requestId: request.id,
    });
  }

  private transitionSession(session: ExamSession, targetStatus: ExamSession['status']): ExamSession {
    if (!canTransitionSession(session.status, targetStatus)) {
      throw new ConflictException(
        `Cannot transition session from '${session.status}' to '${targetStatus}'.`,
      );
    }

    return this.repository.saveSession(
      ExamSessionSchema.parse({
        ...session,
        status: targetStatus,
        updatedAt: new Date(),
      }),
    );
  }

  private markRequestPaymentSatisfied(request: AssessmentRequest): AssessmentRequest {
    let updatedRequest = request;
    const now = new Date();

    if (
      updatedRequest.status === AssessmentRequestStatus.AWAITING_PAYMENT &&
      canTransitionRequest(updatedRequest.status, AssessmentRequestStatus.PAYMENT_PENDING)
    ) {
      updatedRequest = this.repository.saveRequest(
        AssessmentRequestSchema.parse({
          ...updatedRequest,
          status: AssessmentRequestStatus.PAYMENT_PENDING,
          paymentSatisfied: true,
          updatedAt: now,
        }),
      );
    }

    if (
      updatedRequest.status === AssessmentRequestStatus.PAYMENT_PENDING &&
      canTransitionRequest(updatedRequest.status, AssessmentRequestStatus.PAYMENT_CONFIRMED)
    ) {
      updatedRequest = this.repository.saveRequest(
        AssessmentRequestSchema.parse({
          ...updatedRequest,
          status: AssessmentRequestStatus.PAYMENT_CONFIRMED,
          paymentSatisfied: true,
          updatedAt: now,
        }),
      );
    }

    if (
      updatedRequest.status === AssessmentRequestStatus.PAYMENT_CONFIRMED &&
      canTransitionRequest(updatedRequest.status, AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW)
    ) {
      updatedRequest = this.repository.saveRequest(
        AssessmentRequestSchema.parse({
          ...updatedRequest,
          status: AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW,
          paymentSatisfied: true,
          updatedAt: now,
        }),
      );

      return updatedRequest;
    }

    if (!updatedRequest.paymentSatisfied) {
      return this.repository.saveRequest(
        AssessmentRequestSchema.parse({
          ...updatedRequest,
          paymentSatisfied: true,
          updatedAt: now,
        }),
      );
    }

    return updatedRequest;
  }

  private toSessionState(
    request: AssessmentRequest,
    session: ExamSession,
    answers: SessionAnswer[],
  ): RequestSessionState {
    const frozenVersions = this.repository.getFrozenVersionsForSession(session.id);
    if (frozenVersions === null) {
      throw new NotFoundException(`Frozen version refs for session '${session.id}' were not found.`);
    }

    return {
      request,
      session,
      progress: this.toSessionProgress(session.id, answers, session.lastActivityAt),
      answers,
      frozenVersions,
    };
  }

  private toSessionProgress(
    sessionId: string,
    answers: SessionAnswer[],
    lastActivityAt: Date | null,
  ): SessionProgress {
    const answeredCount = answers.filter((answer) => answer.answerState !== AnswerState.UNANSWERED).length;
    const unansweredCount = TOTAL_QUESTIONS - answeredCount;

    return SessionProgressSchema.parse({
      sessionId,
      totalQuestions: TOTAL_QUESTIONS,
      answeredCount,
      unansweredCount,
      percentComplete: this.computeCompletionPercentage(answers),
      lastActivityAt,
    });
  }

  private computeCompletionPercentage(answers: SessionAnswer[]): number {
    const answeredCount = answers.filter((answer) => answer.answerState !== AnswerState.UNANSWERED).length;
    return Number(((answeredCount / TOTAL_QUESTIONS) * 100).toFixed(2));
  }

  private computeCompletionPercentageInt(answers: SessionAnswer[]): number {
    return Math.round(this.computeCompletionPercentage(answers));
  }

  private appendSessionEvent(
    sessionId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): void {
    this.repository.appendSessionEvent({
      id: randomUUID(),
      examSessionId: sessionId,
      eventType,
      payload,
      occurredAt: new Date(),
    });
  }
}
