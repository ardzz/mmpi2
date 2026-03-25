import {
  AdminAssignmentDetailSchema,
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
import { Injectable } from '@nestjs/common';
import {
  type FrozenVersionRefs,
  RequestSessionRepository,
} from './request-session.repository';

@Injectable()
export class InMemoryRequestSessionRepository extends RequestSessionRepository {
  private readonly requestsById = new Map<string, AssessmentRequest>();
  private readonly sessionsById = new Map<string, ExamSession>();
  private readonly sessionIdsByRequestId = new Map<string, string>();
  private readonly frozenVersionsBySessionId = new Map<string, FrozenVersionRefs>();
  private readonly answersBySessionId = new Map<string, Map<number, SessionAnswer>>();
  private readonly eventsBySessionId = new Map<string, SessionEvent[]>();

  async findRequestById(requestId: string): Promise<AssessmentRequest | null> {
    return this.requestsById.get(requestId) ?? null;
  }

  async saveRequest(request: AssessmentRequest): Promise<AssessmentRequest> {
    const validated = AssessmentRequestSchema.parse(request);
    this.requestsById.set(validated.id, validated);
    return validated;
  }

  async findSessionById(sessionId: string): Promise<ExamSession | null> {
    return this.sessionsById.get(sessionId) ?? null;
  }

  async findSessionByRequestId(assessmentRequestId: string): Promise<ExamSession | null> {
    const sessionId = this.sessionIdsByRequestId.get(assessmentRequestId);
    if (sessionId === undefined) {
      return null;
    }

    return this.sessionsById.get(sessionId) ?? null;
  }

  async saveSession(session: ExamSession, frozenVersions?: FrozenVersionRefs): Promise<ExamSession> {
    const validated = ExamSessionSchema.parse(session);
    this.sessionsById.set(validated.id, validated);
    this.sessionIdsByRequestId.set(validated.assessmentRequestId, validated.id);

    if (frozenVersions !== undefined) {
      this.frozenVersionsBySessionId.set(validated.id, frozenVersions);
    }

    return validated;
  }

  async getFrozenVersionsForSession(sessionId: string): Promise<FrozenVersionRefs | null> {
    return this.frozenVersionsBySessionId.get(sessionId) ?? null;
  }

  async upsertAnswer(answer: SessionAnswer): Promise<SessionAnswer> {
    const validated = SessionAnswerSchema.parse(answer);
    const answersByQuestion = this.getOrCreateAnswerMap(validated.examSessionId);
    const existing = answersByQuestion.get(validated.questionNumber);

    if (existing === undefined) {
      answersByQuestion.set(validated.questionNumber, validated);
      return validated;
    }

    const updatedAnswer: SessionAnswer = {
      ...existing,
      answerState: validated.answerState,
      answeredAt: validated.answeredAt,
    };

    const normalized = SessionAnswerSchema.parse(updatedAnswer);
    answersByQuestion.set(validated.questionNumber, normalized);
    return normalized;
  }

  async listAnswersBySessionId(sessionId: string): Promise<SessionAnswer[]> {
    const answersByQuestion = this.answersBySessionId.get(sessionId);
    if (answersByQuestion === undefined) {
      return [];
    }

    return [...answersByQuestion.values()].sort((left, right) => left.questionNumber - right.questionNumber);
  }

  async appendSessionEvent(event: SessionEvent): Promise<SessionEvent> {
    const validated = SessionEventSchema.parse(event);
    const sessionEvents = this.eventsBySessionId.get(validated.examSessionId) ?? [];
    sessionEvents.push(validated);
    this.eventsBySessionId.set(validated.examSessionId, sessionEvents);
    return validated;
  }

  async listSessionEvents(sessionId: string): Promise<SessionEvent[]> {
    return this.eventsBySessionId.get(sessionId) ?? [];
  }

  async listDoctorCaseQueue(doctorUserId: string, query?: { q?: string }): Promise<DoctorCaseQueueItem[]> {
    const normalizedQuery = query?.q?.trim().toLowerCase() ?? '';

    const items = [...this.sessionsById.values()]
      .filter((session) => session.doctorUserId === doctorUserId)
      .map((session) => {
        const request = this.requestsById.get(session.assessmentRequestId);
        if (request === undefined) {
          return null;
        }

        return DoctorCaseQueueItemSchema.parse({
          sessionId: session.id,
          assessmentRequestId: request.id,
          patientUserId: session.patientUserId,
          patientFullName: `Patient ${session.patientUserId.slice(0, 8)}`,
          requestStatus: request.status,
          sessionStatus: session.status,
          purpose: request.purpose,
          submittedAt: session.submittedAt,
          latestScoreStatus: null,
          validityLabel: DoctorCaseValidityLabel.PENDING,
          validitySummary: null,
        });
      })
      .filter((item): item is DoctorCaseQueueItem => item !== null)
      .filter((item) => {
        if (normalizedQuery.length === 0) {
          return true;
        }

        return [
          item.sessionId,
          item.patientFullName,
          item.purpose ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => {
        const leftTime = left.submittedAt?.getTime() ?? 0;
        const rightTime = right.submittedAt?.getTime() ?? 0;
        return rightTime - leftTime;
      });

    return items;
  }

  async listAdminRequests(query?: { q?: string; status?: string }): Promise<AdminRequestQueueItem[]> {
    const normalizedQuery = query?.q?.trim().toLowerCase() ?? '';
    const normalizedStatus = query?.status?.trim().toLowerCase() ?? '';

    return [...this.requestsById.values()]
      .map((request) => {
        const session = [...this.sessionsById.values()].find(
          (candidate) => candidate.assessmentRequestId === request.id,
        );

        return AdminRequestQueueItemSchema.parse({
          id: request.id,
          patientUserId: request.patientUserId,
          patientFullName: `Patient ${request.patientUserId.slice(0, 8)}`,
          requestStatus: request.status,
          paymentRequirement: request.paymentRequirement,
          paymentSatisfied: request.paymentSatisfied,
          activePaymentId: request.activePaymentId,
          doctorUserId: request.doctorUserId,
          doctorName:
            request.doctorUserId === null ? null : `Doctor ${request.doctorUserId.slice(0, 8)}`,
          purpose: request.purpose,
          adminNote: request.adminNote,
          requestedAt: request.requestedAt,
          sessionId: session?.id ?? null,
          sessionStatus: session?.status ?? null,
        });
      })
      .filter((item) => {
        if (normalizedQuery.length === 0) {
          return true;
        }

        return [item.id, item.patientFullName, item.purpose ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .filter((item) => normalizedStatus.length === 0 || item.requestStatus.toLowerCase() === normalizedStatus)
      .sort((left, right) => right.requestedAt.getTime() - left.requestedAt.getTime());
  }

  async getAdminRequestDetail(requestId: string): Promise<AdminRequestDetail | null> {
    const request = this.requestsById.get(requestId);
    if (request === undefined) {
      return null;
    }

    const session = [...this.sessionsById.values()].find(
      (candidate) => candidate.assessmentRequestId === request.id,
    );

    return AdminRequestDetailSchema.parse({
      id: request.id,
      patientUserId: request.patientUserId,
      patientFullName: `Patient ${request.patientUserId.slice(0, 8)}`,
      requestStatus: request.status,
      paymentRequirement: request.paymentRequirement,
      paymentSatisfied: request.paymentSatisfied,
      activePaymentId: request.activePaymentId,
      doctorUserId: request.doctorUserId,
      doctorName:
        request.doctorUserId === null ? null : `Doctor ${request.doctorUserId.slice(0, 8)}`,
      purpose: request.purpose,
      adminNote: request.adminNote,
      requestedAt: request.requestedAt,
      sessionId: session?.id ?? null,
      sessionStatus: session?.status ?? null,
      paymentStatus: null,
      paymentAmount: null,
      paymentCurrency: null,
      latestPaymentEventType: null,
      latestPaymentEventAt: null,
    });
  }

  async getAdminAssignmentDetail(requestId: string): Promise<AdminAssignmentDetail | null> {
    const detail = await this.getAdminRequestDetail(requestId);
    if (detail === null) {
      return null;
    }

    const assignedDoctorId = detail.doctorUserId;

    return AdminAssignmentDetailSchema.parse({
      ...detail,
      candidates: [
        {
          userId: assignedDoctorId ?? '22222222-2222-4222-8222-222222222222',
          fullName: detail.doctorName ?? 'Dr. Assigned Candidate',
          licenseNumber: 'PSY-9001',
          specialty: 'Clinical Psychology',
          isActive: true,
        },
      ],
    });
  }

  private getOrCreateAnswerMap(sessionId: string): Map<number, SessionAnswer> {
    const existing = this.answersBySessionId.get(sessionId);
    if (existing !== undefined) {
      return existing;
    }

    const created = new Map<number, SessionAnswer>();
    this.answersBySessionId.set(sessionId, created);
    return created;
  }
}
