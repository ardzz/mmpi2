import { describe, expect, it } from 'vitest';
import {
  createScoringConfigFromCatalog,
  type ReferenceCatalogBoundary,
  type ScoringConfig,
} from '../types.js';
import {
  getConsistencyPairs,
  getCriticalItemGroup,
  getCriticalItemGroups,
  getNormTables,
  getScaleDefinition,
  getScaleKeyEntries,
} from '../catalog-boundary.js';

const catalogBoundary: ReferenceCatalogBoundary = {
  versionTriplet: {
    instrument: {
      id: 'instrument-1989',
      name: 'MMPI-2',
      revision: '1989',
      totalItems: 567,
      publishedAt: '1989-01-01',
    },
    questionBank: {
      id: 'qb-1989-v1',
      version: '1.0.0',
      itemCount: 567,
    },
    scoringConfig: {
      id: 'sc-1989-v1',
      version: '1.0.0',
      checksum: 'abc123',
    },
  },
  scaleDefinitions: [
    {
      key: 'L',
      name: 'Lie',
      group: 'Validity',
      scoreType: 'raw',
      items: [15, 45],
      trueKeyed: [],
      falseKeyed: [15, 45],
      sourceTitle: 'L Scale',
    },
  ],
  scaleKeyEntries: [
    {
      scaleKey: 'L',
      questionNumber: 15,
      keyedAnswer: 'false',
      weight: 1,
    },
  ],
  normTables: [
    {
      scaleKey: 'L',
      gender: 'male',
      rawToTScore: { 0: 45, 1: 50 },
    },
  ],
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
  ],
  criticalItemGroups: [
    {
      key: 'KB1',
      title: 'Critical Group 1',
      items: [12, 45],
      trueKeyed: [12],
      falseKeyed: [45],
    },
  ],
  validityThresholds: {
    cannotSayMax: 30,
    vrinMax: 80,
    trinMax: 80,
    fMax: 110,
  },
};

function makeConfig(): ScoringConfig {
  return createScoringConfigFromCatalog(catalogBoundary);
}

describe('catalog boundary helpers', () => {
  it('builds scoring config from reference catalog boundary', () => {
    const config = makeConfig();
    expect(config.versionId).toBe('sc-1989-v1');
    expect(config.versionTriplet?.instrument.name).toBe('MMPI-2');
    expect(config.scaleKeyEntries).toHaveLength(1);
    expect(config.consistencyPairs).toHaveLength(2);
    expect(config.criticalItemGroups).toHaveLength(1);
  });

  it('returns scale, key entries, and norm tables by scale key', () => {
    const config = makeConfig();
    expect(getScaleDefinition(config, 'L')?.name).toBe('Lie');
    expect(getScaleDefinition(config, 'K')).toBeUndefined();
    expect(getScaleKeyEntries(config, 'L')).toHaveLength(1);
    expect(getNormTables(config, 'L')).toHaveLength(1);
  });

  it('returns consistency pair subsets by scale key', () => {
    const config = makeConfig();
    expect(getConsistencyPairs(config)).toHaveLength(2);
    expect(getConsistencyPairs(config, 'VRIN')).toHaveLength(1);
    expect(getConsistencyPairs(config, 'TRIN')).toHaveLength(1);
  });

  it('returns critical item groups and specific group lookups', () => {
    const config = makeConfig();
    expect(getCriticalItemGroups(config)).toHaveLength(1);
    expect(getCriticalItemGroup(config, 'KB1')?.title).toBe('Critical Group 1');
    expect(getCriticalItemGroup(config, 'missing')).toBeUndefined();
  });
});
