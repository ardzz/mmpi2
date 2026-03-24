import { describe, expect, it } from 'vitest';
import { scoreSession } from '../engine.js';
import type { ScoringInput, ScoringConfig, SessionAnswer } from '../types.js';

const mockConfig: ScoringConfig = {
  versionId: 'test-v1',
  scales: [
    {
      key: 'K',
      name: 'K (Correction)',
      items: [1, 2],
      trueKeyed: [1, 2],
      falseKeyed: [],
    },
    {
      key: 'L',
      name: 'L (Lie)',
      items: [3, 4],
      trueKeyed: [3, 4],
      falseKeyed: [],
    },
    {
      key: 'Hs',
      name: 'Hypochondriasis',
      items: [5, 6],
      trueKeyed: [5, 6],
      falseKeyed: [],
      kCorrectionWeight: 0.5,
    },
    {
      key: 'F',
      name: 'Infrequency',
      items: [7],
      trueKeyed: [7],
      falseKeyed: [],
    },
  ],
  scaleKeyEntries: [],
  normTables: [
    {
      scaleKey: 'K',
      gender: 'combined',
      rawToTScore: { 0: 35, 1: 45, 2: 55 },
    },
    {
      scaleKey: 'L',
      gender: 'combined',
      rawToTScore: { 0: 45, 1: 55, 2: 65 },
    },
    {
      scaleKey: 'Hs',
      gender: 'combined',
      rawToTScore: { 0: 30, 1: 40, 2: 50, 3: 60 },
    },
    {
      scaleKey: 'F',
      gender: 'combined',
      rawToTScore: { 0: 40, 1: 90 },
    },
    {
      scaleKey: 'VRIN',
      gender: 'combined',
      rawToTScore: { 0: 40, 1: 60, 2: 80 },
    },
    {
      scaleKey: 'TRIN',
      gender: 'combined',
      rawToTScore: { 0: -80, 1: -60, 2: 50, 3: 60, 4: 80 },
    },
  ],
  consistencyPairs: [
    {
      scaleKey: 'VRIN',
      leftQuestionNumber: 8,
      leftAnswer: 'true',
      rightQuestionNumber: 9,
      rightAnswer: 'false',
      weight: 1,
    },
    {
      scaleKey: 'TRIN',
      leftQuestionNumber: 10,
      leftAnswer: 'true',
      rightQuestionNumber: 11,
      rightAnswer: 'true',
      weight: 1,
    },
  ],
  criticalItemGroups: [
    {
      key: 'KB1',
      title: 'Acute Anxiety Scale',
      items: [12, 13],
      trueKeyed: [12],
      falseKeyed: [13],
    },
  ],
  validityThresholds: {
    cannotSayMax: 30,
    vrinMax: 80,
    trinMax: 80,
    fMax: 110,
  },
};

function makeAnswers(count: number, value: SessionAnswer['answer'] = 'false'): SessionAnswer[] {
  return Array.from({ length: count }, (_, index) => ({
    questionNumber: index + 1,
    answer: value,
  }));
}

describe('scoreSession', () => {
  it('returns invalid_completeness when fewer than 90% of first 370 items answered', () => {
    const answers = makeAnswers(100, 'true');
    const input: ScoringInput = { sessionId: 'sess-1', answers, config: mockConfig, gender: 'male' };
    const result = scoreSession(input);

    expect(result.outcome).toBe('invalid_completeness');
    expect(result.validity.isValid).toBe(false);
  });

  it('computes deterministic raw, K-corrected, and T scores', () => {
    const answers = makeAnswers(370, 'false').map((answer) => {
      if ([1, 2, 3, 5, 6, 7, 8, 10, 11, 12].includes(answer.questionNumber)) {
        return { ...answer, answer: 'true' as const };
      }

      return answer;
    });

    const input: ScoringInput = { sessionId: 'sess-2', answers, config: mockConfig, gender: 'female' };
    const result = scoreSession(input);

    expect(result.outcome).toBe('valid');
    expect(result.validity.isValid).toBe(true);

    const kRaw = result.rawScores.find((score) => score.scaleKey === 'K');
    const hsRaw = result.rawScores.find((score) => score.scaleKey === 'Hs');
    const hsTScore = result.tScores.find((score) => score.scaleKey === 'Hs');

    expect(kRaw?.rawScore).toBe(2);
    expect(hsRaw?.rawScore).toBe(2);
    expect(hsRaw?.correctedScore).toBe(3);
    expect(hsTScore?.tScore).toBe(60);

    // Validity scales are computed via consistency pairs and thresholds.
    expect(result.validity.validityScores.VRIN?.tScore).toBe(60);
    expect(result.validity.validityScores.TRIN?.tScore).toBe(60);
  });

  it('is deterministic — identical inputs produce identical outputs', () => {
    const answers = makeAnswers(370, 'false');
    const input: ScoringInput = { sessionId: 'sess-3', answers, config: mockConfig, gender: 'male' };
    const firstResult = scoreSession(input);
    const secondResult = scoreSession(input);

    expect(firstResult.outcome).toBe(secondResult.outcome);
    expect(firstResult.tScores).toEqual(secondResult.tScores);
    expect(firstResult.rawScores).toEqual(secondResult.rawScores);
    expect(firstResult.criticalItemFlags).toEqual(secondResult.criticalItemFlags);
  });

  it('cannot_say threshold triggers invalid_validity', () => {
    const answers: SessionAnswer[] = [
      ...makeAnswers(370, 'true'),
      ...Array.from({ length: 31 }, (_, index) => ({
        questionNumber: 371 + index,
        answer: 'cannot_say' as const,
      })),
    ];
    const input: ScoringInput = { sessionId: 'sess-4', answers, config: mockConfig, gender: 'male' };
    const result = scoreSession(input);

    expect(result.outcome).toBe('invalid_validity');
    expect(result.validity.cannotSayCount).toBe(31);
    expect(result.validity.isValid).toBe(false);
  });

  it('emits critical item flags from keyed critical-item groups', () => {
    const answers = makeAnswers(370, 'false').map((answer) => {
      if (answer.questionNumber === 12) {
        return { ...answer, answer: 'true' as const };
      }

      if (answer.questionNumber === 13) {
        return { ...answer, answer: 'false' as const };
      }

      return answer;
    });
    const input: ScoringInput = { sessionId: 'sess-5', answers, config: mockConfig, gender: 'male' };
    const result = scoreSession(input);

    expect(result.criticalItemFlags).toEqual([
      { groupKey: 'KB1', questionNumber: 12, answer: 'true' },
      { groupKey: 'KB1', questionNumber: 13, answer: 'false' },
    ]);
  });

  it('records scoring config version in result', () => {
    const answers = makeAnswers(370, 'false');
    const input: ScoringInput = { sessionId: 'sess-6', answers, config: mockConfig, gender: 'male' };
    const result = scoreSession(input);

    expect(result.scoringConfigVersionId).toBe('test-v1');
  });

  it('ignores non-binary critical-item answers when flagging', () => {
    const answers = makeAnswers(370, 'false').map((answer) => {
      if (answer.questionNumber === 12) {
        return { ...answer, answer: 'cannot_say' as const };
      }

      if (answer.questionNumber === 13) {
        return { ...answer, answer: 'false' as const };
      }

      return answer;
    });

    const input: ScoringInput = { sessionId: 'sess-7', answers, config: mockConfig, gender: 'male' };
    const result = scoreSession(input);

    expect(result.criticalItemFlags).toEqual([
      { groupKey: 'KB1', questionNumber: 13, answer: 'false' },
    ]);
  });

  it('keeps deterministic golden-vector outputs while preserving config version identity', () => {
    const answers = makeAnswers(370, 'false').map((answer) => {
      if ([3, 4].includes(answer.questionNumber)) {
        return { ...answer, answer: 'true' as const };
      }

      return answer;
    });

    const v1Input: ScoringInput = {
      sessionId: 'sess-8',
      answers,
      config: mockConfig,
      gender: 'male',
    };

    const v2Config: ScoringConfig = {
      ...mockConfig,
      versionId: 'test-v2',
      normTables: mockConfig.normTables.map((table) => (
        table.scaleKey === 'L'
          ? {
              ...table,
              rawToTScore: { 0: 40, 1: 50, 2: 60 },
            }
          : table
      )),
    };

    const v2Input: ScoringInput = {
      ...v1Input,
      config: v2Config,
      sessionId: 'sess-9',
    };

    const v1 = scoreSession(v1Input);
    const v2 = scoreSession(v2Input);

    const v1L = v1.tScores.find((score) => score.scaleKey === 'L');
    const v2L = v2.tScores.find((score) => score.scaleKey === 'L');

    expect(v1.scoringConfigVersionId).toBe('test-v1');
    expect(v2.scoringConfigVersionId).toBe('test-v2');

    expect(v1L?.tScore).toBe(65);
    expect(v2L?.tScore).toBe(60);
  });
});
