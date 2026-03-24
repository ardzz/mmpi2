import type { SessionAnswer, ScaleDefinition, RawScoreResult, AnswerValue } from './types.js';

/**
 * Compute raw scale scores from session answers against scale definitions.
 */

function isDeviantResponse(
  questionNumber: number,
  answer: AnswerValue,
  scale: ScaleDefinition,
): boolean {
  if (answer === 'cannot_say') return false;
  if (answer === 'true' && scale.trueKeyed.includes(questionNumber)) return true;
  if (answer === 'false' && scale.falseKeyed.includes(questionNumber)) return true;
  return false;
}

/**
 * Compute the raw score for a single scale.
 */
export function computeRawScore(
  answers: SessionAnswer[],
  scale: ScaleDefinition,
): number {
  const answerMap = new Map(answers.map((a) => [a.questionNumber, a]));
  let raw = 0;
  for (const itemNum of scale.items) {
    const answer = answerMap.get(itemNum);
    if (answer && isDeviantResponse(itemNum, answer.answer, scale)) {
      raw++;
    }
  }
  return raw;
}

/**
 * Compute raw scores for all scales.
 * Also applies K-correction where specified by the scale definition.
 */
export function computeAllRawScores(
  answers: SessionAnswer[],
  scales: ScaleDefinition[],
  kRawScore: number,
): RawScoreResult[] {
  return scales.map((scale) => {
    const rawScore = computeRawScore(answers, scale);
    const correctedScore = scale.kCorrectionWeight !== undefined
      ? rawScore + Math.round(scale.kCorrectionWeight * kRawScore)
      : undefined;
    return { scaleKey: scale.key, rawScore, correctedScore };
  });
}
