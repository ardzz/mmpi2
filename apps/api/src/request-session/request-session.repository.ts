import type {
  AdminAssignmentDetail,
  AdminRequestDetail,
  AdminRequestQueueItem,
  AssessmentRequest,
  DoctorCaseQueueItem,
  ExamSession,
  SessionAnswer,
  SessionEvent,
} from '@mmpi2/contracts';

export interface FrozenVersionRefs {
  instrumentVersionId: string;
  questionBankVersionId: string;
  scoringConfigVersionId: string;
}

export abstract class RequestSessionRepository {
  abstract findRequestById(requestId: string): Promise<AssessmentRequest | null>;
  abstract saveRequest(request: AssessmentRequest): Promise<AssessmentRequest>;

  abstract findSessionById(sessionId: string): Promise<ExamSession | null>;
  abstract findSessionByRequestId(assessmentRequestId: string): Promise<ExamSession | null>;
  abstract saveSession(session: ExamSession, frozenVersions?: FrozenVersionRefs): Promise<ExamSession>;
  abstract getFrozenVersionsForSession(sessionId: string): Promise<FrozenVersionRefs | null>;

  abstract upsertAnswer(answer: SessionAnswer): Promise<SessionAnswer>;
  abstract listAnswersBySessionId(sessionId: string): Promise<SessionAnswer[]>;

  abstract appendSessionEvent(event: SessionEvent): Promise<SessionEvent>;
  abstract listSessionEvents(sessionId: string): Promise<SessionEvent[]>;
  abstract listDoctorCaseQueue(doctorUserId: string, query?: { q?: string }): Promise<DoctorCaseQueueItem[]>;
  abstract listAdminRequests(query?: { q?: string; status?: string }): Promise<AdminRequestQueueItem[]>;
  abstract getAdminRequestDetail(requestId: string): Promise<AdminRequestDetail | null>;
  abstract getAdminAssignmentDetail(requestId: string): Promise<AdminAssignmentDetail | null>;
}
