import { describe, expect, it } from 'vitest';
import type { NormTable, RawScoreResult } from '../types.js';
import { computeTScores, lookupTScore } from '../t-scores.js';

describe('t-score lookup and conversion', () => {
  it('returns exact and interpolated T-scores from norm table vectors', () => {
    const table: NormTable = {
      scaleKey: 'D',
      gender: 'combined',
      rawToTScore: {
        0: 30,
        4: 70,
      },
    };

    expect(lookupTScore(4, table)).toBe(70);
    expect(lookupTScore(2, table)).toBe(50);
    expect(lookupTScore(5, table)).toBeNull();
  });

  it('returns null for malformed or unbounded tables', () => {
    const malformed = {
      scaleKey: 'Hy',
      gender: 'combined',
      rawToTScore: {
        0: 30,
        4: undefined,
      },
    } as unknown as NormTable;

    expect(lookupTScore(2, malformed)).toBeNull();
    expect(lookupTScore(0, { ...malformed, rawToTScore: {} as Record<number, number> })).toBeNull();
  });

  it('selects gender-aware norm tables, applies fallback mean, and skips missing scales', () => {
    const rawScores: RawScoreResult[] = [
      { scaleKey: 'D', rawScore: 1, correctedScore: 2 },
      { scaleKey: 'Hy', rawScore: 1 },
      { scaleKey: 'Pa', rawScore: 3 },
      { scaleKey: 'Sc', rawScore: 2 },
    ];

    const tables: NormTable[] = [
      {
        scaleKey: 'D',
        gender: 'male',
        rawToTScore: {
          2: 68,
        },
      },
      {
        scaleKey: 'D',
        gender: 'combined',
        rawToTScore: {
          2: 62,
        },
      },
      {
        scaleKey: 'Hy',
        gender: 'combined',
        rawToTScore: {
          1: 55,
        },
      },
      {
        scaleKey: 'Sc',
        gender: 'combined',
        rawToTScore: {
          0: 40,
          1: 45,
        },
      },
    ];

    const male = computeTScores(rawScores, tables, 'male');
    const female = computeTScores(rawScores, tables, 'female');

    expect(male).toEqual([
      {
        scaleKey: 'D',
        tScore: 68,
        isElevated: true,
        isClinicallySignificant: false,
      },
      {
        scaleKey: 'Hy',
        tScore: 55,
        isElevated: false,
        isClinicallySignificant: false,
      },
      {
        scaleKey: 'Sc',
        tScore: 50,
        isElevated: false,
        isClinicallySignificant: false,
      },
    ]);

    expect(female).toEqual([
      {
        scaleKey: 'D',
        tScore: 62,
        isElevated: false,
        isClinicallySignificant: false,
      },
      {
        scaleKey: 'Hy',
        tScore: 55,
        isElevated: false,
        isClinicallySignificant: false,
      },
      {
        scaleKey: 'Sc',
        tScore: 50,
        isElevated: false,
        isClinicallySignificant: false,
      },
    ]);
  });
});
