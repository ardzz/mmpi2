import {
  AdminAssignmentDetailSchema,
  AssignmentCandidateSchema,
  AdminRequestDetailSchema,
  AdminRequestQueueItemSchema,
  AssessmentRequestSchema,
  DoctorCaseQueueItemSchema,
  DoctorCaseValidityLabel,
  ExamSessionSchema,
  SessionAnswerSchema,
  SessionEventSchema,
  type AdminAssignmentDetail,
  type AdminRequestDetail,
  type AdminRequestQueueItem,
  type AssessmentRequest,
  type DoctorCaseQueueItem,
  type ExamSession,
  type SessionAnswer,
  type SessionEvent,
} from '@mmpi2/contracts';
import { prisma } from '@mmpi2/db/client';
import { Injectable } from '@nestjs/common';
import {
  type FrozenVersionRefs,
  RequestSessionRepository,
} from './request-session.repository';

type AssessmentRequestRow = {
  id: string;
  patientUserId: string;
  assessmentTypeId: string;
  requestStatus: string;
  paymentRequirement: string;
  paymentSatisfied: boolean;
  activePaymentId: string | null;
  doctorUserId: string | null;
  purpose: string | null;
  adminNote: string | null;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ExamSessionRow = {
  id: string;
  assessmentRequestId: string;
  patientUserId: string;
  doctorUserId: string | null;
  instrumentVersionId: string;
  questionBankVersionId: string;
  scoringConfigVersionId: string;
  sessionStatus: string;
  approvedAt: Date | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
};

type SessionAnswerRow = {
  id: string;
  examSessionId: string;
  questionNumber: number;
  answerState: string;
  answeredAt: Date | null;
};

type SessionEventRow = {
  id: string;
  examSessionId: string;
  eventType: string;
  payload: unknown;
  occurredAt: Date;
};

type DoctorCaseQueueRow = {
  id: string;
  assessmentRequestId: string;
  patientUserId: string;
  doctorUserId: string | null;
  sessionStatus: string;
  submittedAt: Date | null;
  assessmentRequest: {
    id: string;
    requestStatus: string;
    purpose: string | null;
  };
  patient: {
    fullName: string;
  };
  scoreResultSets: Array<{
    status: string;
    validityFlags: Array<{
      severity: string;
      description: string | null;
    }>;
  }>;
};

type AdminRequestListRow = {
  id: string;
  patientUserId: string;
  requestStatus: string;
  paymentRequirement: string;
  paymentSatisfied: boolean;
  activePaymentId: string | null;
  doctorUserId: string | null;
  purpose: string | null;
  adminNote: string | null;
  requestedAt: Date;
  patient: {
    fullName: string;
  };
  assignedDoctor: {
    fullName: string;
  } | null;
  examSession: {
    id: string;
    sessionStatus: string;
  } | null;
  activePayment: {
    paymentStatus: string;
    amount: { toNumber(): number };
    currency: string;
    events: Array<{
      eventType: string;
      occurredAt: Date;
    }>;
  } | null;
};

type DoctorCandidateRow = {
  userId: string;
  isActive: boolean;
  user: {
    fullName: string;
  };
  licenseNumber: string;
  specialty: string | null;
};

@Injectable()
export class PrismaRequestSessionRepository extends RequestSessionRepository {
  async findRequestById(requestId: string): Promise<AssessmentRequest | null> {
    const row = await prisma.assessmentRequest.findUnique({
      where: { id: requestId },
    });

    if (row === null) {
      return null;
    }

    return this.toAssessmentRequestContract(row as AssessmentRequestRow);
  }

  async saveRequest(request: AssessmentRequest): Promise<AssessmentRequest> {
    const row = await prisma.assessmentRequest.upsert({
      where: { id: request.id },
      create: {
        id: request.id,
        patientUserId: request.patientUserId,
        assessmentTypeId: request.assessmentTypeId,
        requestStatus: request.status,
        paymentRequirement: request.paymentRequirement,
        paymentSatisfied: request.paymentSatisfied,
        activePaymentId: request.activePaymentId,
        doctorUserId: request.doctorUserId,
        purpose: request.purpose,
        adminNote: request.adminNote,
        requestedAt: request.requestedAt,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
      update: {
        requestStatus: request.status,
        paymentRequirement: request.paymentRequirement,
        paymentSatisfied: request.paymentSatisfied,
        activePaymentId: request.activePaymentId,
        doctorUserId: request.doctorUserId,
        purpose: request.purpose,
        adminNote: request.adminNote,
        requestedAt: request.requestedAt,
        updatedAt: request.updatedAt,
      },
    });

    return this.toAssessmentRequestContract(row as AssessmentRequestRow);
  }

  async findSessionById(sessionId: string): Promise<ExamSession | null> {
    const row = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (row === null) {
      return null;
    }

    return this.toExamSessionContract(row as ExamSessionRow);
  }

  async findSessionByRequestId(assessmentRequestId: string): Promise<ExamSession | null> {
    const row = await prisma.examSession.findUnique({
      where: { assessmentRequestId },
    });

    if (row === null) {
      return null;
    }

    return this.toExamSessionContract(row as ExamSessionRow);
  }

  async saveSession(session: ExamSession, frozenVersions?: FrozenVersionRefs): Promise<ExamSession> {
    const existing = await prisma.examSession.findUnique({
      where: { id: session.id },
      select: { scoringConfigVersionId: true },
    });

    if (existing === null && frozenVersions === undefined) {
      throw new Error(
        `Cannot create session '${session.id}' without frozen scoring config version refs.`,
      );
    }

    const scoringConfigVersionId = frozenVersions?.scoringConfigVersionId ?? existing?.scoringConfigVersionId;

    if (scoringConfigVersionId === undefined) {
      throw new Error(`Frozen scoring config version for session '${session.id}' is undefined.`);
    }

    const row = await prisma.examSession.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        assessmentRequestId: session.assessmentRequestId,
        patientUserId: session.patientUserId,
        doctorUserId: session.doctorUserId,
        instrumentVersionId: frozenVersions?.instrumentVersionId ?? session.instrumentVersionId,
        questionBankVersionId: frozenVersions?.questionBankVersionId ?? session.questionBankVersionId,
        scoringConfigVersionId,
        sessionStatus: session.status,
        approvedAt: session.approvedAt,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        completionPercentage: session.completionPercentage,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      update: {
        patientUserId: session.patientUserId,
        doctorUserId: session.doctorUserId,
        instrumentVersionId: frozenVersions?.instrumentVersionId ?? session.instrumentVersionId,
        questionBankVersionId: frozenVersions?.questionBankVersionId ?? session.questionBankVersionId,
        scoringConfigVersionId,
        sessionStatus: session.status,
        approvedAt: session.approvedAt,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        completionPercentage: session.completionPercentage,
        updatedAt: session.updatedAt,
      },
    });

    return this.toExamSessionContract(row as ExamSessionRow);
  }

  async getFrozenVersionsForSession(sessionId: string): Promise<FrozenVersionRefs | null> {
    const row = await prisma.examSession.findUnique({
      where: { id: sessionId },
      select: {
        instrumentVersionId: true,
        questionBankVersionId: true,
        scoringConfigVersionId: true,
      },
    });

    if (row === null) {
      return null;
    }

    return {
      instrumentVersionId: row.instrumentVersionId,
      questionBankVersionId: row.questionBankVersionId,
      scoringConfigVersionId: row.scoringConfigVersionId,
    };
  }

  async upsertAnswer(answer: SessionAnswer): Promise<SessionAnswer> {
    const session = await prisma.examSession.findUnique({
      where: { id: answer.examSessionId },
      select: { questionBankVersionId: true },
    });

    if (session === null) {
      throw new Error(`Exam session '${answer.examSessionId}' was not found while upserting answer.`);
    }

    const questionBankItem = await prisma.questionBankItem.findUnique({
      where: {
        questionBankVersionId_questionNumber: {
          questionBankVersionId: session.questionBankVersionId,
          questionNumber: answer.questionNumber,
        },
      },
      select: { id: true },
    });

    if (questionBankItem === null) {
      throw new Error(
        `Question bank item for version '${session.questionBankVersionId}' and question '${answer.questionNumber}' was not found.`,
      );
    }

    const row = await prisma.sessionAnswer.upsert({
      where: {
        examSessionId_questionNumber: {
          examSessionId: answer.examSessionId,
          questionNumber: answer.questionNumber,
        },
      },
      create: {
        id: answer.id,
        examSessionId: answer.examSessionId,
        questionBankItemId: questionBankItem.id,
        questionNumber: answer.questionNumber,
        answerState: answer.answerState,
        answeredAt: answer.answeredAt,
      },
      update: {
        answerState: answer.answerState,
        answeredAt: answer.answeredAt,
      },
    });

    return this.toSessionAnswerContract(row as SessionAnswerRow);
  }

  async listAnswersBySessionId(sessionId: string): Promise<SessionAnswer[]> {
    const rows = await prisma.sessionAnswer.findMany({
      where: { examSessionId: sessionId },
      orderBy: { questionNumber: 'asc' },
    });

    return (rows as SessionAnswerRow[]).map((row) => this.toSessionAnswerContract(row));
  }

  async appendSessionEvent(event: SessionEvent): Promise<SessionEvent> {
    const session = await prisma.examSession.findUnique({
      where: { id: event.examSessionId },
      select: { sessionStatus: true },
    });

    if (session === null) {
      throw new Error(`Exam session '${event.examSessionId}' was not found while appending event.`);
    }

    const row = await prisma.sessionEvent.create({
      data: {
        id: event.id,
        examSessionId: event.examSessionId,
        fromStatus: null,
        toStatus: session.sessionStatus,
        eventType: event.eventType,
        payload: event.payload ?? undefined,
        occurredAt: event.occurredAt,
      },
    });

    return this.toSessionEventContract(row as SessionEventRow);
  }

  async listSessionEvents(sessionId: string): Promise<SessionEvent[]> {
    const rows = await prisma.sessionEvent.findMany({
      where: { examSessionId: sessionId },
      orderBy: { occurredAt: 'asc' },
    });

    return (rows as SessionEventRow[]).map((row) => this.toSessionEventContract(row));
  }

  async listDoctorCaseQueue(doctorUserId: string, query?: { q?: string }): Promise<DoctorCaseQueueItem[]> {
    const normalizedQuery = query?.q?.trim();

    const rows = await prisma.examSession.findMany({
      where: {
        doctorUserId,
        ...(normalizedQuery
          ? {
              OR: [
                { id: { contains: normalizedQuery } },
                { patient: { fullName: { contains: normalizedQuery, mode: 'insensitive' } } },
                { assessmentRequest: { purpose: { contains: normalizedQuery, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
      include: {
        assessmentRequest: {
          select: {
            id: true,
            requestStatus: true,
            purpose: true,
          },
        },
        patient: {
          select: {
            fullName: true,
          },
        },
        scoreResultSets: {
          orderBy: { scoredAt: 'desc' },
          take: 1,
          include: {
            validityFlags: {
              orderBy: { flagCode: 'asc' },
            },
          },
        },
      },
    });

    return (rows as unknown as DoctorCaseQueueRow[]).map((row) => this.toDoctorCaseQueueItem(row));
  }

  async listAdminRequests(query?: { q?: string; status?: string }): Promise<AdminRequestQueueItem[]> {
    const normalizedQuery = query?.q?.trim();
    const normalizedStatus = query?.status?.trim();

    const rows = await prisma.assessmentRequest.findMany({
      where: {
        ...(normalizedQuery
          ? {
              OR: [
                { id: { contains: normalizedQuery } },
                { patient: { fullName: { contains: normalizedQuery, mode: 'insensitive' } } },
                { purpose: { contains: normalizedQuery, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(normalizedStatus ? { requestStatus: normalizedStatus } : {}),
      },
      orderBy: { requestedAt: 'desc' },
      include: {
        patient: { select: { fullName: true } },
        assignedDoctor: { select: { fullName: true } },
        examSession: {
          select: { id: true, sessionStatus: true },
        },
      },
    });

    return (rows as unknown as AdminRequestListRow[]).map((row) => this.toAdminRequestQueueItem(row));
  }

  async getAdminRequestDetail(requestId: string): Promise<AdminRequestDetail | null> {
    const row = await prisma.assessmentRequest.findUnique({
      where: { id: requestId },
      include: {
        patient: { select: { fullName: true } },
        assignedDoctor: { select: { fullName: true } },
        examSession: {
          select: { id: true, sessionStatus: true },
        },
        activePayment: {
          select: {
            paymentStatus: true,
            amount: true,
            currency: true,
            events: {
              orderBy: { occurredAt: 'desc' },
              take: 1,
              select: {
                eventType: true,
                occurredAt: true,
              },
            },
          },
        },
      },
    });

    if (row === null) {
      return null;
    }

    return this.toAdminRequestDetail(row as unknown as AdminRequestListRow);
  }

  async getAdminAssignmentDetail(requestId: string): Promise<AdminAssignmentDetail | null> {
    const detail = await this.getAdminRequestDetail(requestId);
    if (detail === null) {
      return null;
    }

    const candidates = await prisma.doctorProfile.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return AdminAssignmentDetailSchema.parse({
      ...detail,
      candidates: (candidates as DoctorCandidateRow[]).map((candidate) =>
        AssignmentCandidateSchema.parse({
          userId: candidate.userId,
          fullName: candidate.user.fullName,
          licenseNumber: candidate.licenseNumber,
          specialty: candidate.specialty,
          isActive: candidate.isActive,
        }),
      ),
    });
  }

  private async toExamSessionContract(row: ExamSessionRow): Promise<ExamSession> {
    const lastAnswer = await prisma.sessionAnswer.findFirst({
      where: { examSessionId: row.id },
      orderBy: { answeredAt: 'desc' },
      select: { answeredAt: true },
    });

    const lastActivityAt =
      lastAnswer?.answeredAt ?? row.submittedAt ?? row.startedAt;

    return ExamSessionSchema.parse({
      id: row.id,
      assessmentRequestId: row.assessmentRequestId,
      patientUserId: row.patientUserId,
      doctorUserId: row.doctorUserId,
      instrumentVersionId: row.instrumentVersionId,
      questionBankVersionId: row.questionBankVersionId,
      status: row.sessionStatus,
      approvedAt: row.approvedAt,
      startedAt: row.startedAt,
      lastActivityAt,
      submittedAt: row.submittedAt,
      completionPercentage: row.completionPercentage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toAssessmentRequestContract(row: AssessmentRequestRow): AssessmentRequest {
    return AssessmentRequestSchema.parse({
      id: row.id,
      patientUserId: row.patientUserId,
      assessmentTypeId: row.assessmentTypeId,
      status: row.requestStatus,
      paymentRequirement: row.paymentRequirement,
      paymentSatisfied: row.paymentSatisfied,
      activePaymentId: row.activePaymentId,
      doctorUserId: row.doctorUserId,
      purpose: row.purpose,
      adminNote: row.adminNote,
      requestedAt: row.requestedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toSessionAnswerContract(row: SessionAnswerRow): SessionAnswer {
    return SessionAnswerSchema.parse({
      id: row.id,
      examSessionId: row.examSessionId,
      questionNumber: row.questionNumber,
      answerState: row.answerState,
      answeredAt: row.answeredAt ?? new Date(),
    });
  }

  private toSessionEventContract(row: SessionEventRow): SessionEvent {
    return SessionEventSchema.parse({
      id: row.id,
      examSessionId: row.examSessionId,
      eventType: row.eventType,
      payload:
        row.payload !== null && row.payload !== undefined
          ? (row.payload as Record<string, unknown>)
          : null,
      occurredAt: row.occurredAt,
    });
  }

  private toDoctorCaseQueueItem(row: DoctorCaseQueueRow): DoctorCaseQueueItem {
    const latestScore = row.scoreResultSets[0] ?? null;
    const highestFlagSeverity = latestScore?.validityFlags.some((flag) => flag.severity === 'critical' || flag.severity === 'warning')
      ? DoctorCaseValidityLabel.REVIEW_RECOMMENDED
      : latestScore === null
        ? DoctorCaseValidityLabel.PENDING
        : DoctorCaseValidityLabel.VALID;

    const validitySummary = latestScore?.validityFlags[0]?.description ?? null;

    return DoctorCaseQueueItemSchema.parse({
      sessionId: row.id,
      assessmentRequestId: row.assessmentRequest.id,
      patientUserId: row.patientUserId,
      patientFullName: row.patient.fullName,
      requestStatus: row.assessmentRequest.requestStatus,
      sessionStatus: row.sessionStatus,
      purpose: row.assessmentRequest.purpose,
      submittedAt: row.submittedAt,
      latestScoreStatus: latestScore?.status ?? null,
      validityLabel: highestFlagSeverity,
      validitySummary,
    });
  }

  private toAdminRequestQueueItem(row: AdminRequestListRow): AdminRequestQueueItem {
    return AdminRequestQueueItemSchema.parse({
      id: row.id,
      patientUserId: row.patientUserId,
      patientFullName: row.patient.fullName,
      requestStatus: row.requestStatus,
      paymentRequirement: row.paymentRequirement,
      paymentSatisfied: row.paymentSatisfied,
      activePaymentId: row.activePaymentId,
      doctorUserId: row.doctorUserId,
      doctorName: row.assignedDoctor?.fullName ?? null,
      purpose: row.purpose,
      adminNote: row.adminNote,
      requestedAt: row.requestedAt,
      sessionId: row.examSession?.id ?? null,
      sessionStatus: row.examSession?.sessionStatus ?? null,
    });
  }

  private toAdminRequestDetail(row: AdminRequestListRow): AdminRequestDetail {
    const latestPaymentEvent = row.activePayment?.events[0] ?? null;

    return AdminRequestDetailSchema.parse({
      ...this.toAdminRequestQueueItem(row),
      paymentStatus: row.activePayment?.paymentStatus ?? null,
      paymentAmount: row.activePayment?.amount?.toNumber() ?? null,
      paymentCurrency: row.activePayment?.currency ?? null,
      latestPaymentEventType: latestPaymentEvent?.eventType ?? null,
      latestPaymentEventAt: latestPaymentEvent?.occurredAt ?? null,
    });
  }
}
