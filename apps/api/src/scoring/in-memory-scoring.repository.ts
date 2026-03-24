import {
  CriticalItemFlagSchema,
  ScaleResultSchema,
  ScoreResultSetSchema,
  ValidityFlagSchema,
} from '@mmpi2/contracts';
import { Injectable } from '@nestjs/common';
import {
  ScoringRepository,
  type ScoringResultSetSnapshot,
} from './scoring.repository';

@Injectable()
export class InMemoryScoringRepository extends ScoringRepository {
  private readonly snapshotsByResultSetId = new Map<string, ScoringResultSetSnapshot>();
  private readonly resultSetIdsBySessionId = new Map<string, string[]>();

  createResultSetSnapshot(snapshot: ScoringResultSetSnapshot): ScoringResultSetSnapshot {
    const normalized = this.normalizeSnapshot(snapshot);
    this.snapshotsByResultSetId.set(normalized.resultSet.id, normalized);

    const sessionResultSetIds = this.resultSetIdsBySessionId.get(normalized.resultSet.examSessionId) ?? [];
    sessionResultSetIds.push(normalized.resultSet.id);
    this.resultSetIdsBySessionId.set(normalized.resultSet.examSessionId, sessionResultSetIds);

    return this.normalizeSnapshot(normalized);
  }

  findLatestResultSetBySessionId(sessionId: string): ScoringResultSetSnapshot | null {
    const snapshots = this.listResultSetsBySessionId(sessionId);
    if (snapshots.length === 0) {
      return null;
    }

    return snapshots[snapshots.length - 1] ?? null;
  }

  listResultSetsBySessionId(sessionId: string): ScoringResultSetSnapshot[] {
    const resultSetIds = this.resultSetIdsBySessionId.get(sessionId) ?? [];
    return resultSetIds
      .map((resultSetId) => this.snapshotsByResultSetId.get(resultSetId))
      .filter((snapshot): snapshot is ScoringResultSetSnapshot => snapshot !== undefined)
      .map((snapshot) => this.normalizeSnapshot(snapshot));
  }

  private normalizeSnapshot(snapshot: ScoringResultSetSnapshot): ScoringResultSetSnapshot {
    return {
      resultSet: ScoreResultSetSchema.parse(snapshot.resultSet),
      scaleResults: snapshot.scaleResults.map((result) => ScaleResultSchema.parse(result)),
      validityFlags: snapshot.validityFlags.map((flag) => ValidityFlagSchema.parse(flag)),
      criticalItemFlags: snapshot.criticalItemFlags.map((flag) => CriticalItemFlagSchema.parse(flag)),
    };
  }
}
