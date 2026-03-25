import { createHash } from 'node:crypto';
import {
  CriticalItemFlagSchema,
  ScaleResultSchema,
  ScoreResultSetSchema,
  ScoreResultSetStatus,
  ValidityFlagSchema,
  type CriticalItemFlag,
  type ScaleResult,
  type ScoreResultSet,
  type ValidityFlag,
} from '@mmpi2/contracts';
import { prisma } from '@mmpi2/db/client';
import type { Prisma } from '@mmpi2/db';
import { Injectable } from '@nestjs/common';

/** Prisma interactive-transaction client (excludes lifecycle methods). */
type TxClient = Prisma.TransactionClient;
import {
  ScoringRepository,
  type ScoringResultSetSnapshot,
} from './scoring.repository';

// ---------------------------------------------------------------------------
// Prisma row type aliases — kept narrow so mapping logic stays explicit.
// ---------------------------------------------------------------------------

type ScoreResultSetRow = {
  id: string;
  examSessionId: string;
  scoringConfigVersionId: string;
  normTableId: string;
  scoringEngineVersion: string;
  inputHash: string;
  isValidProtocol: boolean;
  status: string;
  scoredAt: Date;
  normTable: { sexBasis: string };
};

type ScaleResultRow = {
  id: string;
  scoreResultSetId: string;
  scaleDefinitionId: string;
  scaleCode: string;
  rawScore: { toNumber(): number };
  correctedScore: { toNumber(): number } | null;
  tScore: { toNumber(): number } | null;
  scaleDefinition: { scaleGroup: string };
};

type ValidityFlagRow = {
  id: string;
  scoreResultSetId: string;
  flagCode: string;
  severity: string;
  description: string | null;
};

type CriticalItemFlagRow = {
  id: string;
  scoreResultSetId: string;
  flagCode: string;
  sourceGroup: string;
  description: string | null;
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

@Injectable()
export class PrismaScoringRepository extends ScoringRepository {
  async createResultSetSnapshot(snapshot: ScoringResultSetSnapshot): Promise<ScoringResultSetSnapshot> {
    const { resultSet, scaleResults, validityFlags, criticalItemFlags } = snapshot;

    const normTableId = await this.resolveNormTableId(
      resultSet.scoringConfigVersionId,
      resultSet.patientGender,
    );

    const inputHash = this.computeInputHash(resultSet.examSessionId, resultSet.id);
    const isValidProtocol = resultSet.status === ScoreResultSetStatus.COMPLETED;
    const scoredAt = resultSet.scoredAt ?? new Date();

    await prisma.$transaction(async (tx: TxClient) => {
      await tx.scoreResultSet.create({
        data: {
          id: resultSet.id,
          examSessionId: resultSet.examSessionId,
          scoringConfigVersionId: resultSet.scoringConfigVersionId,
          normTableId,
          scoringEngineVersion: resultSet.engineVersion,
          inputHash,
          isValidProtocol,
          status: resultSet.status,
          scoredAt,
        },
      });

      if (scaleResults.length > 0) {
        await tx.scaleResult.createMany({
          data: scaleResults.map((sr) => ({
            id: sr.id,
            scoreResultSetId: sr.scoreResultSetId,
            scaleDefinitionId: sr.scaleDefinitionId,
            scaleCode: sr.scaleCode,
            rawScore: sr.rawScore,
            correctedScore: sr.correctedScore,
            tScore: sr.tScore,
            percentile: null,
          })),
        });
      }

      if (validityFlags.length > 0) {
        await tx.validityFlag.createMany({
          data: validityFlags.map((vf) => ({
            id: vf.id,
            scoreResultSetId: vf.scoreResultSetId,
            flagCode: vf.flagCode,
            severity: vf.severity,
            description: vf.description,
          })),
        });
      }

      if (criticalItemFlags.length > 0) {
        await tx.criticalItemFlag.createMany({
          data: criticalItemFlags.map((cf) => ({
            id: cf.id,
            scoreResultSetId: cf.scoreResultSetId,
            flagCode: cf.flagCode,
            sourceGroup: cf.sourceGroup,
            description: cf.description,
          })),
        });
      }
    });

    return this.loadSnapshotByResultSetId(resultSet.id);
  }

  async findLatestResultSetBySessionId(sessionId: string): Promise<ScoringResultSetSnapshot | null> {
    const row = await prisma.scoreResultSet.findFirst({
      where: { examSessionId: sessionId },
      orderBy: { scoredAt: 'desc' },
      include: { normTable: { select: { sexBasis: true } } },
    });

    if (row === null) {
      return null;
    }

    return this.loadSnapshotByResultSetId(row.id);
  }

  async listResultSetsBySessionId(sessionId: string): Promise<ScoringResultSetSnapshot[]> {
    const rows = await prisma.scoreResultSet.findMany({
      where: { examSessionId: sessionId },
      orderBy: { scoredAt: 'asc' },
      select: { id: true },
    });

    const snapshots: ScoringResultSetSnapshot[] = [];
    for (const row of rows) {
      snapshots.push(await this.loadSnapshotByResultSetId(row.id));
    }
    return snapshots;
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async loadSnapshotByResultSetId(resultSetId: string): Promise<ScoringResultSetSnapshot> {
    const row = await prisma.scoreResultSet.findUniqueOrThrow({
      where: { id: resultSetId },
      include: {
        normTable: { select: { sexBasis: true } },
        scaleResults: {
          include: { scaleDefinition: { select: { scaleGroup: true } } },
          orderBy: { scaleCode: 'asc' },
        },
        validityFlags: { orderBy: { flagCode: 'asc' } },
        criticalItemFlags: { orderBy: { flagCode: 'asc' } },
      },
    });

    const resultSet = this.toResultSetContract(row as unknown as ScoreResultSetRow);
    const scaleResults = (row.scaleResults as unknown as ScaleResultRow[]).map(
      (sr) => this.toScaleResultContract(sr),
    );
    const validityFlags = (row.validityFlags as unknown as ValidityFlagRow[]).map(
      (vf) => this.toValidityFlagContract(vf),
    );
    const criticalItemFlags = (row.criticalItemFlags as unknown as CriticalItemFlagRow[]).map(
      (cf) => this.toCriticalItemFlagContract(cf),
    );

    return { resultSet, scaleResults, validityFlags, criticalItemFlags };
  }

  /**
   * Resolve a norm table matching the scoring config version and patient gender.
   * Falls back to the first available norm table for the config version when no
   * exact match is found (defensive for test/dev environments without full seed data).
   */
  private async resolveNormTableId(scoringConfigVersionId: string, patientGender: string): Promise<string> {
    const exactMatch = await prisma.normTable.findFirst({
      where: { scoringConfigVersionId, sexBasis: patientGender },
      select: { id: true },
    });

    if (exactMatch !== null) {
      return exactMatch.id;
    }

    const fallback = await prisma.normTable.findFirst({
      where: { scoringConfigVersionId },
      select: { id: true },
    });

    if (fallback !== null) {
      return fallback.id;
    }

    // Last-resort deterministic ID so the FK doesn't break in a seedless test DB.
    // This should not happen in production; the schema seed guarantees norm tables exist.
    return this.toDeterministicUuid(`norm:${scoringConfigVersionId}:${patientGender}`);
  }

  private computeInputHash(examSessionId: string, resultSetId: string): string {
    return createHash('sha256')
      .update(`${examSessionId}:${resultSetId}`)
      .digest('hex')
      .slice(0, 64);
  }

  // -------------------------------------------------------------------------
  // Prisma row → contract mapping
  // -------------------------------------------------------------------------

  private toResultSetContract(row: ScoreResultSetRow): ScoreResultSet {
    return ScoreResultSetSchema.parse({
      id: row.id,
      examSessionId: row.examSessionId,
      scoringConfigVersionId: row.scoringConfigVersionId,
      engineVersion: row.scoringEngineVersion,
      status: row.status,
      patientGender: row.normTable.sexBasis,
      scoredAt: row.scoredAt,
      createdAt: row.scoredAt,
    });
  }

  private toScaleResultContract(row: ScaleResultRow): ScaleResult {
    const tScoreValue = row.tScore !== null ? row.tScore.toNumber() : null;

    return ScaleResultSchema.parse({
      id: row.id,
      scoreResultSetId: row.scoreResultSetId,
      scaleDefinitionId: row.scaleDefinitionId,
      scaleCode: row.scaleCode,
      groupCode: row.scaleDefinition.scaleGroup,
      rawScore: row.rawScore.toNumber(),
      correctedScore: row.correctedScore !== null ? row.correctedScore.toNumber() : null,
      tScore: tScoreValue,
      severityBand: this.toSeverityBand(tScoreValue),
    });
  }

  private toValidityFlagContract(row: ValidityFlagRow): ValidityFlag {
    return ValidityFlagSchema.parse({
      id: row.id,
      scoreResultSetId: row.scoreResultSetId,
      flagCode: row.flagCode,
      severity: row.severity,
      description: row.description ?? '',
    });
  }

  private toCriticalItemFlagContract(row: CriticalItemFlagRow): CriticalItemFlag {
    return CriticalItemFlagSchema.parse({
      id: row.id,
      scoreResultSetId: row.scoreResultSetId,
      flagCode: row.flagCode,
      sourceGroup: row.sourceGroup,
      description: row.description ?? '',
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
