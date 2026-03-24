import type {
  SessionAnswer,
  ScoringConfig,
  ValidityResult,
  ValidityScaleKey,
  GenderBasis,
  TScoreResult,
} from './types.js';
import { getConsistencyPairs, getNormTables } from './catalog-boundary.js';
import { computeRawScore } from './raw-scores.js';
import { lookupTScore } from './t-scores.js';

/**
 * Validity gate — MUST be evaluated before any clinical scale output is shown.
 * Returns a ValidityResult that determines whether clinical interpretation is permissible.
 */

const CANNOT_SAY_DEFAULT_MAX = 30;
const CLINICAL_ELEVATION_T = 65;
const CLINICAL_SIGNIFICANCE_T = 70;

function toAnswerMap(answers: SessionAnswer[]): Map<number, SessionAnswer['answer']> {
  return new Map(answers.map((answer) => [answer.questionNumber, answer.answer]));
}

function toTScoreResult(scaleKey: ValidityScaleKey, tScore: number): TScoreResult {
  return {
    scaleKey,
    tScore,
    isElevated: tScore >= CLINICAL_ELEVATION_T,
    isClinicallySignificant: tScore >= CLINICAL_SIGNIFICANCE_T,
  };
}

function selectNormTable(
  config: ScoringConfig,
  scaleKey: ValidityScaleKey,
  gender: GenderBasis,
) {
  const tables = getNormTables(config, scaleKey);
  return tables.find((table) => table.gender === gender)
    ?? tables.find((table) => table.gender === 'combined');
}

function toConsistencyPairWeightedRaw(
  answers: SessionAnswer[],
  config: ScoringConfig,
  scaleKey: 'VRIN' | 'TRIN',
): number {
  const pairRules = getConsistencyPairs(config, scaleKey);
  if (pairRules.length === 0) {
    return 0;
  }

  const answerMap = toAnswerMap(answers);
  let weightedRaw = 0;

  for (const pair of pairRules) {
    const leftAnswer = answerMap.get(pair.leftQuestionNumber);
    const rightAnswer = answerMap.get(pair.rightQuestionNumber);

    if (
      leftAnswer === pair.leftAnswer
      && rightAnswer === pair.rightAnswer
    ) {
      weightedRaw += pair.weight;
    }
  }

  return weightedRaw;
}

function resolveTrinCenterKey(config: ScoringConfig, gender: GenderBasis): number {
  const table = selectNormTable(config, 'TRIN', gender);
  if (!table) {
    return 0;
  }

  const exactCenter = Object.entries(table.rawToTScore).find(([, tScore]) => tScore === 50);
  if (exactCenter) {
    return Number(exactCenter[0]);
  }

  const sortedKeys = Object.keys(table.rawToTScore)
    .map(Number)
    .sort((left, right) => left - right);

  return sortedKeys[Math.floor(sortedKeys.length / 2)] ?? 0;
}

/**
 * Count items left unanswered or marked as Cannot Say.
 */
export function countCannotSay(answers: SessionAnswer[]): number {
  return answers.filter((a) => a.answer === 'cannot_say').length;
}

/**
 * Check if the minimum number of answered items has been met.
 * MMPI-2 requires answers to questions 1–370 at minimum for basic validity.
 */
export function hasMinimumCompleteness(answers: SessionAnswer[]): boolean {
  const answered = new Set(
    answers
      .filter((a) => a.answer !== 'cannot_say')
      .map((a) => a.questionNumber),
  );
  // Must have answered at least 90% of first 370 critical items
  const criticalAnswered = [...answered].filter((n) => n <= 370).length;
  return criticalAnswered >= 333; // 90% of 370
}

/**
 * Compute a simple Cannot Say validity check.
 */
export function checkCannotSay(
  cannotSayCount: number,
  maxAllowed: number = CANNOT_SAY_DEFAULT_MAX,
): boolean {
  return cannotSayCount <= maxAllowed;
}

/**
 * VRIN (Variable Response Inconsistency) — measures random responding.
 * Simplified: pair-based inconsistency check.
 * Full implementation requires VRIN item pairs from scoring config.
 */
export function computeVRIN(
  answers: SessionAnswer[],
  config: ScoringConfig,
  gender: GenderBasis = 'combined',
): number {
  const vrinRaw = toConsistencyPairWeightedRaw(answers, config, 'VRIN');
  const table = selectNormTable(config, 'VRIN', gender);

  if (!table) {
    return 50;
  }

  return lookupTScore(vrinRaw, table) ?? 50;
}

/**
 * TRIN (True Response Inconsistency) — measures acquiescence/nay-saying bias.
 * Stub pending full item-pair data.
 */
export function computeTRIN(
  answers: SessionAnswer[],
  config: ScoringConfig,
  gender: GenderBasis = 'combined',
): number {
  const trinRaw = toConsistencyPairWeightedRaw(answers, config, 'TRIN');
  const table = selectNormTable(config, 'TRIN', gender);
  if (!table) {
    return 50;
  }

  const centeredRaw = trinRaw + resolveTrinCenterKey(config, gender);
  return lookupTScore(centeredRaw, table) ?? 50;
}

/**
 * Primary validity evaluation entry point.
 *
 * @returns ValidityResult indicating whether clinical interpretation is permissible
 */
export function evaluateValidity(
  answers: SessionAnswer[],
  config: ScoringConfig,
  gender: 'male' | 'female',
): ValidityResult {
  const cannotSayCount = countCannotSay(answers);
  const failedThresholds: string[] = [];

  // Cannot Say threshold
  const maxCannotSay = config.validityThresholds.cannotSayMax ?? CANNOT_SAY_DEFAULT_MAX;
  if (cannotSayCount > maxCannotSay) {
    failedThresholds.push(`Cannot Say (${cannotSayCount} > ${maxCannotSay})`);
  }

  // Completeness gate
  if (!hasMinimumCompleteness(answers)) {
    failedThresholds.push('Insufficient item completion (fewer than 90% of first 370 items)');
  }

  // Compute validity scale T-scores from deterministic pair / keyed rules
  const vrinTScore = computeVRIN(answers, config, gender);
  const trinTScore = computeTRIN(answers, config, gender);

  const validityScores: Partial<Record<ValidityScaleKey, TScoreResult>> = {};
  validityScores.VRIN = toTScoreResult('VRIN', vrinTScore);
  validityScores.TRIN = toTScoreResult('TRIN', trinTScore);

  if (vrinTScore >= config.validityThresholds.vrinMax) {
    failedThresholds.push(`VRIN T=${vrinTScore} ≥ threshold ${config.validityThresholds.vrinMax}`);
  }

  if (Math.abs(trinTScore) >= config.validityThresholds.trinMax) {
    failedThresholds.push(
      `TRIN T=${trinTScore} exceeds ±${config.validityThresholds.trinMax}`,
    );
  }

  const fScale = config.scales.find((scale) => scale.key === 'F');
  const fNormTable = selectNormTable(config, 'F', gender);
  if (fScale && fNormTable) {
    const fRawScore = computeRawScore(answers, fScale);
    const fTScore = lookupTScore(fRawScore, fNormTable) ?? 50;
    validityScores.F = toTScoreResult('F', fTScore);

    if (fTScore >= config.validityThresholds.fMax) {
      failedThresholds.push(`F T=${fTScore} ≥ threshold ${config.validityThresholds.fMax}`);
    }
  }

  return {
    isValid: failedThresholds.length === 0,
    cannotSayCount,
    failedThresholds,
    validityScores,
  };
}
