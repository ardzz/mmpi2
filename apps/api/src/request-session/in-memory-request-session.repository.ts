import {
  AssessmentRequestSchema,
  ExamSessionSchema,
  SessionAnswerSchema,
  SessionEventSchema,
  type AssessmentRequest,
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

  findRequestById(requestId: string): AssessmentRequest | null {
    return this.requestsById.get(requestId) ?? null;
  }

  saveRequest(request: AssessmentRequest): AssessmentRequest {
    const validated = AssessmentRequestSchema.parse(request);
    this.requestsById.set(validated.id, validated);
    return validated;
  }

  findSessionById(sessionId: string): ExamSession | null {
    return this.sessionsById.get(sessionId) ?? null;
  }

  findSessionByRequestId(assessmentRequestId: string): ExamSession | null {
    const sessionId = this.sessionIdsByRequestId.get(assessmentRequestId);
    if (sessionId === undefined) {
      return null;
    }

    return this.sessionsById.get(sessionId) ?? null;
  }

  saveSession(session: ExamSession, frozenVersions?: FrozenVersionRefs): ExamSession {
    const validated = ExamSessionSchema.parse(session);
    this.sessionsById.set(validated.id, validated);
    this.sessionIdsByRequestId.set(validated.assessmentRequestId, validated.id);

    if (frozenVersions !== undefined) {
      this.frozenVersionsBySessionId.set(validated.id, frozenVersions);
    }

    return validated;
  }

  getFrozenVersionsForSession(sessionId: string): FrozenVersionRefs | null {
    return this.frozenVersionsBySessionId.get(sessionId) ?? null;
  }

  upsertAnswer(answer: SessionAnswer): SessionAnswer {
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

  listAnswersBySessionId(sessionId: string): SessionAnswer[] {
    const answersByQuestion = this.answersBySessionId.get(sessionId);
    if (answersByQuestion === undefined) {
      return [];
    }

    return [...answersByQuestion.values()].sort((left, right) => left.questionNumber - right.questionNumber);
  }

  appendSessionEvent(event: SessionEvent): SessionEvent {
    const validated = SessionEventSchema.parse(event);
    const sessionEvents = this.eventsBySessionId.get(validated.examSessionId) ?? [];
    sessionEvents.push(validated);
    this.eventsBySessionId.set(validated.examSessionId, sessionEvents);
    return validated;
  }

  listSessionEvents(sessionId: string): SessionEvent[] {
    return this.eventsBySessionId.get(sessionId) ?? [];
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
