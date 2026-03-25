import { createHash, randomUUID } from 'node:crypto';
import {
  MMPI2_1989_REFERENCE_CATALOG,
  MMPI2_1989_TRIPLET,
} from '@mmpi2/config';
import {
  AnswerState,
  CriticalItemFlagSchema,
  DomainEventType,
  ExamSessionStatus,
  ScaleResultSchema,
  ScoreResultSetStatus,
  ScoreResultSetSchema,
  ValidityFlagSeverity,
  ValidityFlagSchema,
  canTransitionSession,
  type CriticalItemFlag,
  type ExamSession,
  type ScaleResult,
  type ScoreResultSet,
  type SessionAnswer,
  type ValidityFlag,
} from '@mmpi2/contracts';
import {
  createScoringConfigFromCatalog,
  scoreSession,
  type ScoringConfig,
  type ScoringOutcome,
} from '@mmpi2/scoring';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';
import {
  type FrozenVersionRefs,
  RequestSessionRepository,
} from '../request-session/request-session.repository';
import {
  ScoringRepository,
  type ScoringResultSetSnapshot,
} from './scoring.repository';

const SCORING_ENGINE_VERSION = '0.0.1' as const;

const MMPI2_SCORING_CONFIG: ScoringConfig = createScoringConfigFromCatalog({
  versionTriplet: {
    instrument: {
      id: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.instrument.id,
      name: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.instrument.name,
      revision: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.instrument.revision,
      totalItems: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.instrument.totalItems,
      publishedAt: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.instrument.publishedAt,
    },
    questionBank: {
      id: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.questionBank.id,
      version: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.questionBank.version,
      itemCount: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.questionBank.itemCount,
      totalQuestions: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.instrument.totalItems,
    },
    scoringConfig: {
      id: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.scoringConfig.id,
      version: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.scoringConfig.version,
      checksum: MMPI2_1989_REFERENCE_CATALOG.versionTriplet.scoringConfig.checksum,
    },
  },
  scaleDefinitions: MMPI2_1989_REFERENCE_CATALOG.scaleDefinitions,
  scaleKeyEntries: MMPI2_1989_REFERENCE_CATALOG.scaleKeyEntries,
  normTables: MMPI2_1989_REFERENCE_CATALOG.normTables,
  consistencyPairs: MMPI2_1989_REFERENCE_CATALOG.consistencyPairs,
  criticalItemGroups: MMPI2_1989_REFERENCE_CATALOG.criticalItemGroups,
  validityThresholds: MMPI2_1989_REFERENCE_CATALOG.validityThresholds,
});

export interface ScoredSessionView {
  session: ExamSession;
  frozenVersions: FrozenVersionRefs;
  resultSet: ScoreResultSet;
  scaleResults: ScaleResult[];
  validityFlags: ValidityFlag[];
  criticalItemFlags: CriticalItemFlag[];
}

@Injectable()
export class ScoringService {
  constructor(
    @Inject(ScoringRepository)
    private readonly scoringRepository: ScoringRepository,
    @Inject(RequestSessionRepository)
    private readonly requestSessionRepository: RequestSessionRepository,
    @Inject(ProfileService)
    private readonly profileService: ProfileService,
  ) {}

  async runScoringForSubmittedSession(sessionId: string): Promise<ScoredSessionView> {
    const session = await this.mustFindSession(sessionId);
    const frozenVersions = await this.mustFindFrozenVersions(session.id);

    if (session.status !== ExamSessionStatus.SUBMITTED) {
      throw new ConflictException(`Scoring can only run for submitted sessions. Current status: '${session.status}'.`);
    }

    this.assertFrozenVersionsMatchScoringCatalog(session, frozenVersions);

    const patientProfile = await this.profileService.getPatientProfileByUserId(session.patientUserId);
    const scoringSession = await this.transitionSession(session, ExamSessionStatus.SCORING);
    await this.appendSessionEvent(scoringSession.id, 'scoring_started', {
      requestId: scoringSession.assessmentRequestId,
      scoringConfigVersionId: frozenVersions.scoringConfigVersionId,
    });

    try {
      const scoreOutput = scoreSession({
        sessionId: scoringSession.id,
        answers: this.toScoringAnswers(await this.requestSessionRepository.listAnswersBySessionId(scoringSession.id)),
        config: MMPI2_SCORING_CONFIG,
        gender: patientProfile.gender,
      });

      const snapshot = await this.persistCompletedResultSet(
        scoringSession,
        frozenVersions,
        patientProfile.gender,
        scoreOutput.outcome,
        scoreOutput,
      );

      const finalStatus =
        scoreOutput.outcome === 'valid'
          ? ExamSessionStatus.SCORED
          : ExamSessionStatus.NEEDS_CLINICAL_REVIEW;

      const finalizedSession = await this.transitionSession(scoringSession, finalStatus);
      await this.appendSessionEvent(finalizedSession.id, DomainEventType.SCORING_COMPLETED, {
        requestId: finalizedSession.assessmentRequestId,
        scoreResultSetId: snapshot.resultSet.id,
        scoreOutcome: scoreOutput.outcome,
        nextSessionStatus: finalStatus,
      });

      return this.toScoredSessionView(finalizedSession, frozenVersions, snapshot);
    } catch {
      const failedSnapshot = await this.persistFailedResultSet(scoringSession, frozenVersions, patientProfile.gender);
      const finalizedSession = await this.transitionSession(scoringSession, ExamSessionStatus.NEEDS_CLINICAL_REVIEW);

      await this.appendSessionEvent(finalizedSession.id, 'scoring_failed', {
        requestId: finalizedSession.assessmentRequestId,
        scoreResultSetId: failedSnapshot.resultSet.id,
      });

      throw new InternalServerErrorException(
        `Scoring failed for session '${sessionId}'. Session marked for clinical review.`,
      );
    }
  }

  async getLatestScoreForDoctor(sessionId: string, doctorUserId: string): Promise<ScoredSessionView> {
    const session = await this.mustFindSession(sessionId);

    if (session.doctorUserId !== doctorUserId) {
      throw new ForbiddenException(`Doctor '${doctorUserId}' is not assigned to session '${sessionId}'.`);
    }

    const frozenVersions = await this.mustFindFrozenVersions(session.id);
    const latestSnapshot = await this.scoringRepository.findLatestResultSetBySessionId(session.id);

    if (latestSnapshot === null) {
      throw new NotFoundException(`Scoring result set for session '${session.id}' was not found.`);
    }

    return this.toScoredSessionView(session, frozenVersions, latestSnapshot);
  }

  private async persistCompletedResultSet(
    session: ExamSession,
    frozenVersions: FrozenVersionRefs,
    patientGender: ScoreResultSet['patientGender'],
    outcome: ScoringOutcome,
    scoringOutput: ReturnType<typeof scoreSession>,
  ): Promise<ScoringResultSetSnapshot> {
    const resultSetId = randomUUID();

    const resultSet = ScoreResultSetSchema.parse({
      id: resultSetId,
      examSessionId: session.id,
      scoringConfigVersionId: frozenVersions.scoringConfigVersionId,
      engineVersion: SCORING_ENGINE_VERSION,
      status: ScoreResultSetStatus.COMPLETED,
      patientGender,
      scoredAt: scoringOutput.computedAt,
      createdAt: new Date(),
    });

    const scaleResults = this.toScaleResults(resultSetId, frozenVersions, scoringOutput);
    const validityFlags = this.toValidityFlags(resultSetId, outcome, scoringOutput.validity.failedThresholds);
    const criticalItemFlags = this.toCriticalItemFlags(resultSetId, scoringOutput.criticalItemFlags);

    return this.scoringRepository.createResultSetSnapshot({
      resultSet,
      scaleResults,
      validityFlags,
      criticalItemFlags,
    });
  }

  private async persistFailedResultSet(
    session: ExamSession,
    frozenVersions: FrozenVersionRefs,
    patientGender: ScoreResultSet['patientGender'],
  ): Promise<ScoringResultSetSnapshot> {
    const resultSetId = randomUUID();

    return this.scoringRepository.createResultSetSnapshot({
      resultSet: ScoreResultSetSchema.parse({
        id: resultSetId,
        examSessionId: session.id,
        scoringConfigVersionId: frozenVersions.scoringConfigVersionId,
        engineVersion: SCORING_ENGINE_VERSION,
        status: ScoreResultSetStatus.FAILED,
        patientGender,
        scoredAt: null,
        createdAt: new Date(),
      }),
      scaleResults: [],
      validityFlags: [
        ValidityFlagSchema.parse({
          id: randomUUID(),
          scoreResultSetId: resultSetId,
          flagCode: 'SCORING_FAILED',
          severity: ValidityFlagSeverity.CRITICAL,
          description: 'Scoring execution failed. Retry is required before report authoring.',
        }),
      ],
      criticalItemFlags: [],
    });
  }

  private toScaleResults(
    resultSetId: string,
    frozenVersions: FrozenVersionRefs,
    scoringOutput: ReturnType<typeof scoreSession>,
  ): ScaleResult[] {
    const rawByKey = new Map(scoringOutput.rawScores.map((rawScore) => [rawScore.scaleKey, rawScore]));
    const tScoreByKey = new Map(scoringOutput.tScores.map((tScore) => [tScore.scaleKey, tScore]));
    const scaleDefinitionByKey = new Map(MMPI2_SCORING_CONFIG.scales.map((scale) => [scale.key, scale]));

    const scaleKeys = [...new Set([...rawByKey.keys(), ...tScoreByKey.keys()])].sort((left, right) =>
      left.localeCompare(right),
    );

    return scaleKeys.map((scaleKey) => {
      const rawResult = rawByKey.get(scaleKey);
      const tScoreResult = tScoreByKey.get(scaleKey);
      const scaleDefinition = scaleDefinitionByKey.get(scaleKey);

      return ScaleResultSchema.parse({
        id: this.toDeterministicUuid(`${resultSetId}:scale:${scaleKey}`),
        scoreResultSetId: resultSetId,
        scaleDefinitionId: this.toDeterministicUuid(
          `${frozenVersions.scoringConfigVersionId}:definition:${scaleKey}`,
        ),
        scaleCode: scaleKey,
        groupCode: scaleDefinition?.group ?? 'unknown',
        rawScore: rawResult?.rawScore ?? 0,
        correctedScore: rawResult?.correctedScore ?? null,
        tScore: tScoreResult?.tScore ?? null,
        severityBand: this.toSeverityBand(tScoreResult?.tScore ?? null),
      });
    });
  }

  private toSeverityBand(tScore: number | null): ScaleResult['severityBand'] {
    if (tScore === null) {
      return null;
    }

    if (tScore >= 80) {
      return 'very_high';
    }

    if (tScore >= 70) {
      return 'high';
    }

    if (tScore >= 65) {
      return 'moderate';
    }

    return 'normal';
  }

  private toValidityFlags(
    resultSetId: string,
    outcome: ScoringOutcome,
    failedThresholds: string[],
  ): ValidityFlag[] {
    if (failedThresholds.length === 0) {
      return [];
    }

    return failedThresholds.map((threshold, index) =>
      ValidityFlagSchema.parse({
        id: this.toDeterministicUuid(`${resultSetId}:validity:${index + 1}`),
        scoreResultSetId: resultSetId,
        flagCode: this.toBoundedFlagCode(threshold, `VALIDITY_${index + 1}`),
        severity:
          outcome === 'valid'
            ? ValidityFlagSeverity.INFO
            : outcome === 'invalid_completeness'
              ? ValidityFlagSeverity.CRITICAL
              : ValidityFlagSeverity.WARNING,
        description: threshold,
      }),
    );
  }

  private toCriticalItemFlags(
    resultSetId: string,
    sourceFlags: ReturnType<typeof scoreSession>['criticalItemFlags'],
  ): CriticalItemFlag[] {
    return sourceFlags.map((flag, index) =>
      CriticalItemFlagSchema.parse({
        id: this.toDeterministicUuid(
          `${resultSetId}:critical:${flag.groupKey}:${flag.questionNumber}:${flag.answer}`,
        ),
        scoreResultSetId: resultSetId,
        flagCode: this.toBoundedFlagCode(`${flag.groupKey}_${flag.questionNumber}`, `CRITICAL_${index + 1}`),
        sourceGroup: flag.groupKey,
        description: `Critical response at item ${flag.questionNumber} (${flag.answer}).`,
      }),
    );
  }

  private toScoredSessionView(
    session: ExamSession,
    frozenVersions: FrozenVersionRefs,
    snapshot: ScoringResultSetSnapshot,
  ): ScoredSessionView {
    return {
      session,
      frozenVersions,
      resultSet: snapshot.resultSet,
      scaleResults: snapshot.scaleResults,
      validityFlags: snapshot.validityFlags,
      criticalItemFlags: snapshot.criticalItemFlags,
    };
  }

  private toScoringAnswers(answers: SessionAnswer[]): Array<{ questionNumber: number; answer: 'true' | 'false' | 'cannot_say' }> {
    return answers.map((answer) => ({
      questionNumber: answer.questionNumber,
      answer:
        answer.answerState === AnswerState.UNANSWERED
          ? 'cannot_say'
          : answer.answerState,
    }));
  }

  private assertFrozenVersionsMatchScoringCatalog(
    session: ExamSession,
    frozenVersions: FrozenVersionRefs,
  ): void {
    if (session.instrumentVersionId !== MMPI2_1989_TRIPLET.instrument.id) {
      throw new ConflictException(
        `Unsupported instrument version '${session.instrumentVersionId}' for scoring in this slice.`,
      );
    }

    if (session.questionBankVersionId !== MMPI2_1989_TRIPLET.questionBank.id) {
      throw new ConflictException(
        `Unsupported question bank version '${session.questionBankVersionId}' for scoring in this slice.`,
      );
    }

    if (frozenVersions.scoringConfigVersionId !== MMPI2_1989_TRIPLET.scoringConfig.id) {
      throw new ConflictException(
        `Unsupported scoring config version '${frozenVersions.scoringConfigVersionId}' for scoring in this slice.`,
      );
    }
  }

  private async mustFindSession(sessionId: string): Promise<ExamSession> {
    const session = await this.requestSessionRepository.findSessionById(sessionId);
    if (session === null) {
      throw new NotFoundException(`Exam session '${sessionId}' was not found.`);
    }

    return session;
  }

  private async mustFindFrozenVersions(sessionId: string): Promise<FrozenVersionRefs> {
    const frozenVersions = await this.requestSessionRepository.getFrozenVersionsForSession(sessionId);
    if (frozenVersions === null) {
      throw new NotFoundException(`Frozen version refs for session '${sessionId}' were not found.`);
    }

    return frozenVersions;
  }

  private async transitionSession(
    session: ExamSession,
    targetStatus: ExamSession['status'],
  ): Promise<ExamSession> {
    if (!canTransitionSession(session.status, targetStatus)) {
      throw new ConflictException(
        `Cannot transition session from '${session.status}' to '${targetStatus}'.`,
      );
    }

    return this.requestSessionRepository.saveSession({
      ...session,
      status: targetStatus,
      updatedAt: new Date(),
    });
  }

  private async appendSessionEvent(
    sessionId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.requestSessionRepository.appendSessionEvent({
      id: randomUUID(),
      examSessionId: sessionId,
      eventType,
      payload,
      occurredAt: new Date(),
    });
  }

  private toBoundedFlagCode(rawValue: string, fallback: string): string {
    const normalized = rawValue
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const bounded = normalized.slice(0, 30);
    return bounded.length > 0 ? bounded : fallback;
  }

  private toDeterministicUuid(seed: string): string {
    const hashHex = createHash('sha256').update(seed).digest('hex');
    const variantNibble = ((Number.parseInt(hashHex[16] ?? '0', 16) & 0x3) | 0x8).toString(16);

    return [
      hashHex.slice(0, 8),
      hashHex.slice(8, 12),
      `4${hashHex.slice(13, 16)}`,
      `${variantNibble}${hashHex.slice(17, 20)}`,
      hashHex.slice(20, 32),
    ].join('-');
  }
}
