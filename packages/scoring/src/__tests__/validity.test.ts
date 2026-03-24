import { describe, expect, it } from 'vitest';
import type { ScoringConfig, SessionAnswer } from '../types.js';
import {
  checkCannotSay,
  computeTRIN,
  computeVRIN,
  countCannotSay,
  evaluateValidity,
  hasMinimumCompleteness,
} from '../validity.js';

function makeAnswers(count: number, answer: SessionAnswer['answer'] = 'true'): SessionAnswer[] {
  return Array.from({ length: count }, (_, index) => ({
    questionNumber: index + 1,
    answer,
  }));
}

const baseConfig: ScoringConfig = {
  versionId: 'cfg-v1',
  scales: [
    {
      key: 'F',
      name: 'Infrequency',
      items: [7, 8],
      trueKeyed: [7, 8],
      falseKeyed: [],
    },
  ],
  scaleKeyEntries: [],
  normTables: [
    {
      scaleKey: 'VRIN',
      gender: 'combined',
      rawToTScore: {
        0: 30,
        1: 50,
        2: 80,
      },
    },
    {
      scaleKey: 'TRIN',
      gender: 'combined',
      rawToTScore: {
        0: -80,
        1: -60,
        2: 50,
        3: 60,
        4: 80,
      },
    },
    {
      scaleKey: 'F',
      gender: 'combined',
      rawToTScore: {
        0: 45,
        1: 90,
        2: 120,
      },
    },
  ],
  consistencyPairs: [],
  criticalItemGroups: [],
  validityThresholds: {
    cannotSayMax: 30,
    vrinMax: 80,
    trinMax: 80,
    fMax: 110,
  },
};

describe('validity boundaries', () => {
  it('counts cannot_say and checks threshold', () => {
    const answers: SessionAnswer[] = [
      { questionNumber: 1, answer: 'cannot_say' },
      { questionNumber: 2, answer: 'true' },
      { questionNumber: 3, answer: 'cannot_say' },
    ];

    expect(countCannotSay(answers)).toBe(2);
    expect(checkCannotSay(2, 2)).toBe(true);
    expect(checkCannotSay(3, 2)).toBe(false);
  });

  it('enforces minimum completeness for first 370 items', () => {
    expect(hasMinimumCompleteness(makeAnswers(333, 'true'))).toBe(true);
    expect(hasMinimumCompleteness(makeAnswers(332, 'true'))).toBe(false);
  });

  it('computes deterministic VRIN/TRIN T-scores from consistency pair rules', () => {
    const withPairs: ScoringConfig = {
      ...baseConfig,
      consistencyPairs: [
        {
          scaleKey: 'VRIN',
          leftQuestionNumber: 1,
          leftAnswer: 'true',
          rightQuestionNumber: 2,
          rightAnswer: 'false',
          weight: 1,
        },
        {
          scaleKey: 'TRIN',
          leftQuestionNumber: 3,
          leftAnswer: 'true',
          rightQuestionNumber: 4,
          rightAnswer: 'true',
          weight: 1,
        },
        {
          scaleKey: 'TRIN',
          leftQuestionNumber: 5,
          leftAnswer: 'false',
          rightQuestionNumber: 6,
          rightAnswer: 'false',
          weight: -1,
        },
      ],
    };

    const answers: SessionAnswer[] = [
      { questionNumber: 1, answer: 'true' },
      { questionNumber: 2, answer: 'false' },
      { questionNumber: 3, answer: 'true' },
      { questionNumber: 4, answer: 'true' },
      { questionNumber: 5, answer: 'false' },
      { questionNumber: 6, answer: 'false' },
    ];

    expect(computeVRIN(makeAnswers(370, 'true'), baseConfig)).toBe(30);
    expect(computeTRIN(makeAnswers(370, 'true'), baseConfig)).toBe(50);

    // VRIN raw = 1 matched pair -> T=50
    expect(computeVRIN(answers, withPairs)).toBe(50);

    // TRIN weighted raw = (+1) + (-1) = 0 -> centered to T=50
    expect(computeTRIN(answers, withPairs)).toBe(50);

    const trueBiasedAnswers: SessionAnswer[] = [
      { questionNumber: 3, answer: 'true' },
      { questionNumber: 4, answer: 'true' },
    ];

    // TRIN weighted raw = +1, centered raw key = 3 -> T=60
    expect(computeTRIN(trueBiasedAnswers, withPairs)).toBe(60);

    const falseBiasedAnswers: SessionAnswer[] = [
      { questionNumber: 5, answer: 'false' },
      { questionNumber: 6, answer: 'false' },
    ];

    // TRIN weighted raw = -1, centered raw key = 1 -> T=-60
    expect(computeTRIN(falseBiasedAnswers, withPairs)).toBe(-60);
  });

  it('uses gender-specific norm table first, then combined fallback', () => {
    const genderedConfig: ScoringConfig = {
      ...baseConfig,
      normTables: [
        {
          scaleKey: 'VRIN',
          gender: 'male',
          rawToTScore: {
            0: 42,
          },
        },
        {
          scaleKey: 'VRIN',
          gender: 'combined',
          rawToTScore: {
            0: 30,
          },
        },
        ...baseConfig.normTables.filter((table) => table.scaleKey !== 'VRIN'),
      ],
    };

    const answers = makeAnswers(370, 'true');

    expect(computeVRIN(answers, genderedConfig, 'male')).toBe(42);
    expect(computeVRIN(answers, genderedConfig, 'female')).toBe(30);
  });

  it('falls back to mean T=50 when VRIN/TRIN norm tables are missing', () => {
    const noPairNorms: ScoringConfig = {
      ...baseConfig,
      normTables: baseConfig.normTables.filter(
        (table) => table.scaleKey !== 'VRIN' && table.scaleKey !== 'TRIN',
      ),
    };

    const answers = makeAnswers(370, 'false');

    expect(computeVRIN(answers, noPairNorms, 'male')).toBe(50);
    expect(computeTRIN(answers, noPairNorms, 'female')).toBe(50);
  });

  it('marks invalid when VRIN/TRIN/F thresholds fail', () => {
    const thresholdConfig: ScoringConfig = {
      ...baseConfig,
      consistencyPairs: [
        {
          scaleKey: 'VRIN',
          leftQuestionNumber: 1,
          leftAnswer: 'true',
          rightQuestionNumber: 2,
          rightAnswer: 'false',
          weight: 1,
        },
        {
          scaleKey: 'VRIN',
          leftQuestionNumber: 3,
          leftAnswer: 'true',
          rightQuestionNumber: 4,
          rightAnswer: 'false',
          weight: 1,
        },
        {
          scaleKey: 'TRIN',
          leftQuestionNumber: 5,
          leftAnswer: 'true',
          rightQuestionNumber: 6,
          rightAnswer: 'true',
          weight: 1,
        },
        {
          scaleKey: 'TRIN',
          leftQuestionNumber: 7,
          leftAnswer: 'true',
          rightQuestionNumber: 8,
          rightAnswer: 'true',
          weight: 1,
        },
      ],
    };

    const answers = makeAnswers(370, 'false').map((answer) => {
      if ([1, 3, 5, 6, 7, 8].includes(answer.questionNumber)) {
        return {
          ...answer,
          answer: 'true' as const,
        };
      }

      return answer;
    });

    const result = evaluateValidity(answers, thresholdConfig, 'male');

    expect(result.isValid).toBe(false);
    expect(result.failedThresholds).toContain('VRIN T=80 ≥ threshold 80');
    expect(result.failedThresholds).toContain('TRIN T=80 exceeds ±80');
    expect(result.failedThresholds).toContain('F T=120 ≥ threshold 110');
    expect(result.validityScores.VRIN?.tScore).toBe(80);
    expect(result.validityScores.TRIN?.tScore).toBe(80);
    expect(result.validityScores.F?.tScore).toBe(120);
  });

  it('handles negative TRIN polarity as invalid when absolute threshold fails', () => {
    const withTrinPairs: ScoringConfig = {
      ...baseConfig,
      consistencyPairs: [
        {
          scaleKey: 'TRIN',
          leftQuestionNumber: 1,
          leftAnswer: 'false',
          rightQuestionNumber: 2,
          rightAnswer: 'false',
          weight: -1,
        },
        {
          scaleKey: 'TRIN',
          leftQuestionNumber: 3,
          leftAnswer: 'false',
          rightQuestionNumber: 4,
          rightAnswer: 'false',
          weight: -1,
        },
      ],
      validityThresholds: {
        ...baseConfig.validityThresholds,
        trinMax: 80,
      },
    };

    const answers = makeAnswers(370, 'true').map((answer) => {
      if ([1, 2, 3, 4].includes(answer.questionNumber)) {
        return {
          ...answer,
          answer: 'false' as const,
        };
      }

      return answer;
    });

    const result = evaluateValidity(answers, withTrinPairs, 'female');
    expect(result.isValid).toBe(false);
    expect(result.validityScores.TRIN?.tScore).toBe(-80);
    expect(result.failedThresholds).toContain('TRIN T=-80 exceeds ±80');
  });

  it('marks invalid when cannot_say and completeness thresholds fail', () => {
    const incompleteAnswers = makeAnswers(200, 'true');
    const result = evaluateValidity(incompleteAnswers, baseConfig, 'male');

    expect(result.isValid).toBe(false);
    expect(result.failedThresholds).toContain(
      'Insufficient item completion (fewer than 90% of first 370 items)',
    );
    expect(result.validityScores.VRIN?.tScore).toBe(30);
    expect(result.validityScores.TRIN?.tScore).toBe(50);
  });
});
