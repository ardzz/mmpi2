import type {
  AssessmentRequest,
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
  abstract findRequestById(requestId: string): AssessmentRequest | null;
  abstract saveRequest(request: AssessmentRequest): AssessmentRequest;

  abstract findSessionById(sessionId: string): ExamSession | null;
  abstract findSessionByRequestId(assessmentRequestId: string): ExamSession | null;
  abstract saveSession(session: ExamSession, frozenVersions?: FrozenVersionRefs): ExamSession;
  abstract getFrozenVersionsForSession(sessionId: string): FrozenVersionRefs | null;

  abstract upsertAnswer(answer: SessionAnswer): SessionAnswer;
  abstract listAnswersBySessionId(sessionId: string): SessionAnswer[];

  abstract appendSessionEvent(event: SessionEvent): SessionEvent;
  abstract listSessionEvents(sessionId: string): SessionEvent[];
}
