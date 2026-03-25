import type {
  CriticalItemFlag,
  ScaleResult,
  ScoreResultSet,
  ValidityFlag,
} from '@mmpi2/contracts';

export interface ScoringResultSetSnapshot {
  resultSet: ScoreResultSet;
  scaleResults: ScaleResult[];
  validityFlags: ValidityFlag[];
  criticalItemFlags: CriticalItemFlag[];
}

export abstract class ScoringRepository {
  abstract createResultSetSnapshot(snapshot: ScoringResultSetSnapshot): Promise<ScoringResultSetSnapshot>;
  abstract findLatestResultSetBySessionId(sessionId: string): Promise<ScoringResultSetSnapshot | null>;
  abstract listResultSetsBySessionId(sessionId: string): Promise<ScoringResultSetSnapshot[]>;
}
