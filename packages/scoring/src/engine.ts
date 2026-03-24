import type {
  CriticalItemFlag,
  ScoreResultSet,
  ScoringOutcome,
  ScoringInput,
} from './types.js';
import { evaluateValidity, hasMinimumCompleteness } from './validity.js';
import { computeAllRawScores, computeRawScore } from './raw-scores.js';
import { computeTScores } from './t-scores.js';
import { getCriticalItemGroups } from './catalog-boundary.js';

export type { ScoringInput } from './types.js';

function computeCriticalItemFlags(input: ScoringInput): CriticalItemFlag[] {
  const answerMap = new Map(input.answers.map((answer) => [answer.questionNumber, answer.answer]));
  const groups = getCriticalItemGroups(input.config);
  const flags: CriticalItemFlag[] = [];

  for (const group of groups) {
    for (const questionNumber of group.items) {
      const answer = answerMap.get(questionNumber);
      if (answer !== 'true' && answer !== 'false') {
        continue;
      }

      const isTrueKeyedFlag = answer === 'true' && group.trueKeyed.includes(questionNumber);
      const isFalseKeyedFlag = answer === 'false' && group.falseKeyed.includes(questionNumber);

      if (isTrueKeyedFlag || isFalseKeyedFlag) {
        flags.push({
          groupKey: group.key,
          questionNumber,
          answer,
        });
      }
    }
  }

  return flags;
}

/**
 * Primary scoring entry point.
 *
 * This function is the single source of truth for MMPI-2 scoring.
 * It must be called server-side only and its output persisted as
 * an immutable ScoreResultSet before any clinical surface reads it.
 */
export function scoreSession(input: ScoringInput): ScoreResultSet {
  const { sessionId, answers, config, gender } = input;
  const criticalItemFlags = computeCriticalItemFlags(input);

  // Step 1: Completeness gate
  if (!hasMinimumCompleteness(answers)) {
    return {
      sessionId,
      scoringConfigVersionId: config.versionId,
      outcome: 'invalid_completeness',
      validity: {
        isValid: false,
        cannotSayCount: answers.filter((a) => a.answer === 'cannot_say').length,
        failedThresholds: ['Insufficient item completion'],
        validityScores: {},
      },
      rawScores: [],
      tScores: [],
      criticalItemFlags,
      computedAt: new Date(),
    };
  }

  // Step 2: Full validity evaluation
  const validity = evaluateValidity(answers, config, gender);
  const outcome: ScoringOutcome = validity.isValid ? 'valid' : 'invalid_validity';

  // Step 3: Compute K scale raw score (needed for K-correction on clinical scales)
  const kScale = config.scales.find((s) => s.key === 'K');
  const kRawScore = kScale ? computeRawScore(answers, kScale) : 0;

  // Step 4: Compute all raw scores
  const rawScores = computeAllRawScores(answers, config.scales, kRawScore);

  // Step 5: Convert to T-scores via norm tables
  const tScores = computeTScores(rawScores, config.normTables, gender);

  return {
    sessionId,
    scoringConfigVersionId: config.versionId,
    outcome,
    validity,
    rawScores,
    tScores,
    criticalItemFlags,
    computedAt: new Date(),
  };
}
