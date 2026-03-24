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
  abstract createResultSetSnapshot(snapshot: ScoringResultSetSnapshot): ScoringResultSetSnapshot;
  abstract findLatestResultSetBySessionId(sessionId: string): ScoringResultSetSnapshot | null;
  abstract listResultSetsBySessionId(sessionId: string): ScoringResultSetSnapshot[];
}
