import type { RawScoreResult, NormTable, TScoreResult } from './types.js';

const CLINICAL_ELEVATION_T = 65;
const CLINICAL_SIGNIFICANCE_T = 70;

/**
 * Look up T-score from norm table for a given raw score.
 * Uses linear interpolation for raw scores between table entries.
 */
export function lookupTScore(rawScore: number, normTable: NormTable): number | null {
  const tScore = normTable.rawToTScore[rawScore];
  if (tScore !== undefined) return tScore;

  // Linear interpolation between nearest entries
  const keys = Object.keys(normTable.rawToTScore)
    .map(Number)
    .sort((a, b) => a - b);

  const lower = keys.filter((k) => k <= rawScore).at(-1);
  const upper = keys.filter((k) => k >= rawScore).at(0);

  if (lower === undefined || upper === undefined || lower === upper) return null;

  const lowerT = normTable.rawToTScore[lower];
  const upperT = normTable.rawToTScore[upper];

  if (lowerT === undefined || upperT === undefined) return null;

  const ratio = (rawScore - lower) / (upper - lower);
  return Math.round(lowerT + ratio * (upperT - lowerT));
}

/**
 * Convert all raw scores to T-scores using the appropriate norm tables.
 */
export function computeTScores(
  rawScores: RawScoreResult[],
  normTables: NormTable[],
  gender: 'male' | 'female',
): TScoreResult[] {
  const results: TScoreResult[] = [];

  for (const raw of rawScores) {
    const score = raw.correctedScore ?? raw.rawScore;
    const table = normTables.find(
      (t) => t.scaleKey === raw.scaleKey && (t.gender === gender || t.gender === 'combined'),
    );

    if (!table) continue;

    const tScore = lookupTScore(score, table) ?? 50; // fallback to mean

    results.push({
      scaleKey: raw.scaleKey,
      tScore,
      isElevated: tScore >= CLINICAL_ELEVATION_T,
      isClinicallySignificant: tScore >= CLINICAL_SIGNIFICANCE_T,
    });
  }

  return results;
}
