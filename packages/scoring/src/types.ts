/**
 * Core type definitions for the MMPI-2 scoring engine.
 * These are pure domain types with no framework dependencies.
 */

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type AnswerValue = 'true' | 'false' | 'cannot_say';
export type KeyedAnswerValue = Exclude<AnswerValue, 'cannot_say'>;
export type GenderBasis = 'male' | 'female' | 'combined';

export interface SessionAnswer {
  questionNumber: number; // 1–567
  answer: AnswerValue;
}

export interface ScoringConfigVersion {
  id: string;
  version: string;
  checksum: string;
}

export interface InstrumentVersion {
  id: string;
  name: string;
  revision: string;
  totalItems: number;
  publishedAt: string;
}

export interface QuestionBankVersion {
  id: string;
  version: string;
  itemCount: number;
  totalQuestions?: number;
}

export interface VersionTriplet {
  instrument: InstrumentVersion;
  questionBank: QuestionBankVersion;
  scoringConfig: ScoringConfigVersion;
}

// ---------------------------------------------------------------------------
// Scale definitions
// ---------------------------------------------------------------------------

export type ValidityScaleKey = 'L' | 'F' | 'K' | 'VRIN' | 'TRIN' | 'Fb' | 'Fp';

export type ClinicalScaleKey =
  | 'Hs' // 1 — Hypochondriasis
  | 'D'  // 2 — Depression
  | 'Hy' // 3 — Hysteria
  | 'Pd' // 4 — Psychopathic Deviate
  | 'Mf' // 5 — Masculinity-Femininity
  | 'Pa' // 6 — Paranoia
  | 'Pt' // 7 — Psychasthenia
  | 'Sc' // 8 — Schizophrenia
  | 'Ma' // 9 — Hypomania
  | 'Si' // 0 — Social Introversion

export type ScaleKey = ValidityScaleKey | ClinicalScaleKey | string;

// ---------------------------------------------------------------------------
// Scoring config shapes
// ---------------------------------------------------------------------------

export interface ScaleDefinition {
  key: ScaleKey;
  name: string;
  group?: string;
  scoreType?: 'raw' | 't_score';
  items: number[];           // item numbers scored in this scale
  trueKeyed: number[];       // items where True = deviant response
  falseKeyed: number[];      // items where False = deviant response
  kCorrectionWeight?: number; // K-correction factor (0.5 or 1.0) if applicable
  gender?: Exclude<GenderBasis, 'combined'>;
  sourceTitle?: string;
}

export interface ScaleKeyEntry {
  scaleKey: ScaleKey;
  questionNumber: number;
  keyedAnswer: KeyedAnswerValue;
  weight: number;
}

export interface NormTable {
  scaleKey: ScaleKey;
  gender: GenderBasis;
  rawToTScore: Record<number, number>; // raw score → T-score
}

export interface ConsistencyPairRule {
  scaleKey: 'VRIN' | 'TRIN';
  leftQuestionNumber: number;
  leftAnswer: KeyedAnswerValue;
  rightQuestionNumber: number;
  rightAnswer: KeyedAnswerValue;
  weight: number;
}

export interface CriticalItemGroup {
  key: string;
  title: string;
  items: number[];
  trueKeyed: number[];
  falseKeyed: number[];
}

export interface ScoringConfig {
  versionId: string;
  versionTriplet?: VersionTriplet;
  scales: ScaleDefinition[];
  scaleKeyEntries: ScaleKeyEntry[];
  normTables: NormTable[];
  consistencyPairs: ConsistencyPairRule[];
  criticalItemGroups: CriticalItemGroup[];
  validityThresholds: ValidityThresholds;
}

export interface ReferenceCatalogBoundary {
  versionTriplet: VersionTriplet;
  scaleDefinitions: ScaleDefinition[];
  scaleKeyEntries: ScaleKeyEntry[];
  normTables: NormTable[];
  consistencyPairs: ConsistencyPairRule[];
  criticalItemGroups: CriticalItemGroup[];
  validityThresholds: ValidityThresholds;
}

export interface ValidityThresholds {
  cannotSayMax: number;       // Cannot Say ≤ this value
  vrinMax: number;            // VRIN T-score < this
  trinMax: number;            // TRIN T-score < this
  fMax: number;               // F T-score < this (basic validity)
}

export function createScoringConfigFromCatalog(
  catalog: ReferenceCatalogBoundary,
): ScoringConfig {
  return {
    versionId: catalog.versionTriplet.scoringConfig.id,
    versionTriplet: catalog.versionTriplet,
    scales: catalog.scaleDefinitions,
    scaleKeyEntries: catalog.scaleKeyEntries,
    normTables: catalog.normTables,
    consistencyPairs: catalog.consistencyPairs,
    criticalItemGroups: catalog.criticalItemGroups,
    validityThresholds: catalog.validityThresholds,
  };
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface RawScoreResult {
  scaleKey: ScaleKey;
  rawScore: number;
  correctedScore?: number;    // after K-correction
}

export interface TScoreResult {
  scaleKey: ScaleKey;
  tScore: number;
  isElevated: boolean;        // T ≥ 65
  isClinicallySignificant: boolean; // T ≥ 70
}

export interface ValidityResult {
  isValid: boolean;
  cannotSayCount: number;
  failedThresholds: string[];
  validityScores: Partial<Record<ValidityScaleKey, TScoreResult>>;
}

export interface CriticalItemFlag {
  groupKey: string;
  questionNumber: number;
  answer: KeyedAnswerValue;
}

export type ScoringOutcome = 'valid' | 'invalid_validity' | 'invalid_completeness';

export interface ScoreResultSet {
  sessionId: string;
  scoringConfigVersionId: string;
  outcome: ScoringOutcome;
  validity: ValidityResult;
  rawScores: RawScoreResult[];
  tScores: TScoreResult[];
  criticalItemFlags: CriticalItemFlag[];
  computedAt: Date;
}

// ---------------------------------------------------------------------------
// Scoring engine input
// ---------------------------------------------------------------------------

export interface ScoringInput {
  sessionId: string;
  answers: SessionAnswer[];
  config: ScoringConfig;
  gender: 'male' | 'female';
}
