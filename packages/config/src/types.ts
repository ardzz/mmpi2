/**
 * Version catalog types for the MMPI-2 reference data pipeline.
 */

export type GenderBasis = 'male' | 'female' | 'combined';

export type AnswerState = 'true' | 'false' | 'cannot_say';

export interface InstrumentVersion {
  id: string;
  name: string;          // e.g. "MMPI-2"
  revision: string;      // e.g. "1989"
  totalItems: number;    // 567
  publishedAt: string;   // ISO date
  isActive: boolean;
}

export interface QuestionBankVersion {
  id: string;
  instrumentVersionId: string;
  version: string;
  itemCount: number;
  checksum: string;
  isActive: boolean;
  releasedAt: string;
}

export interface ScoringConfigVersion {
  id: string;
  instrumentVersionId: string;
  version: string;
  description: string;
  checksum: string;
  isActive: boolean;
  releasedAt: string;
}

export interface VersionTriplet {
  instrument: InstrumentVersion;
  questionBank: QuestionBankVersion;
  scoringConfig: ScoringConfigVersion;
}

export interface QuestionBankItemRecord {
  questionNumber: number;
  itemText: string;
  isActive: boolean;
}

export interface ScaleDefinitionRecord {
  key: string;
  name: string;
  group: string;
  scoreType: 'raw' | 't_score';
  items: number[];
  trueKeyed: number[];
  falseKeyed: number[];
  kCorrectionWeight?: number;
  gender?: Exclude<GenderBasis, 'combined'>;
  sourceTitle: string;
}

export interface ScaleKeyEntryRecord {
  scaleKey: string;
  questionNumber: number;
  keyedAnswer: 'true' | 'false';
  weight: number;
}

export interface NormTableRecord {
  normCode: string;
  scaleKey: string;
  gender: Exclude<GenderBasis, 'combined'>;
  rawToTScore: Record<number, number>;
}

export interface ConsistencyPairRule {
  scaleKey: 'VRIN' | 'TRIN';
  leftQuestionNumber: number;
  leftAnswer: 'true' | 'false';
  rightQuestionNumber: number;
  rightAnswer: 'true' | 'false';
  weight: number;
}

export interface CriticalItemGroupRecord {
  key: string;
  title: string;
  items: number[];
  trueKeyed: number[];
  falseKeyed: number[];
}

export interface ValidityThresholdRecord {
  cannotSayMax: number;
  vrinMax: number;
  trinMax: number;
  fMax: number;
}

export interface ReferenceCatalog {
  versionTriplet: VersionTriplet;
  questionBankItems: QuestionBankItemRecord[];
  scaleDefinitions: ScaleDefinitionRecord[];
  scaleKeyEntries: ScaleKeyEntryRecord[];
  normTables: NormTableRecord[];
  consistencyPairs: ConsistencyPairRule[];
  criticalItemGroups: CriticalItemGroupRecord[];
  validityThresholds: ValidityThresholdRecord;
}
