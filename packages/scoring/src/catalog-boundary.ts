import type {
  ConsistencyPairRule,
  CriticalItemGroup,
  NormTable,
  ScaleDefinition,
  ScaleKey,
  ScaleKeyEntry,
  ScoringConfig,
} from './types.js';

export function getScaleDefinition(
  config: ScoringConfig,
  scaleKey: ScaleKey,
): ScaleDefinition | undefined {
  return config.scales.find((scale) => scale.key === scaleKey);
}

export function getScaleKeyEntries(
  config: ScoringConfig,
  scaleKey: ScaleKey,
): ScaleKeyEntry[] {
  return config.scaleKeyEntries.filter((entry) => entry.scaleKey === scaleKey);
}

export function getNormTables(
  config: ScoringConfig,
  scaleKey: ScaleKey,
): NormTable[] {
  return config.normTables.filter((table) => table.scaleKey === scaleKey);
}

export function getConsistencyPairs(
  config: ScoringConfig,
  scaleKey?: ConsistencyPairRule['scaleKey'],
): ConsistencyPairRule[] {
  if (!scaleKey) {
    return config.consistencyPairs;
  }

  return config.consistencyPairs.filter((pair) => pair.scaleKey === scaleKey);
}

export function getCriticalItemGroups(config: ScoringConfig): CriticalItemGroup[] {
  return config.criticalItemGroups;
}

export function getCriticalItemGroup(
  config: ScoringConfig,
  groupKey: string,
): CriticalItemGroup | undefined {
  return config.criticalItemGroups.find((group) => group.key === groupKey);
}
