/**
 * @mmpi2/scoring
 *
 * Pure deterministic MMPI-2 scoring engine.
 * Zero framework dependencies — accepts typed input, produces typed output.
 *
 * Entry points:
 *   scoreSession()   — primary scoring function
 *   validateAnswers() — validity gate (must pass before clinical interpretation)
 */

export * from './types.js';
export * from './catalog-boundary.js';
export * from './validity.js';
export * from './raw-scores.js';
export * from './t-scores.js';
export * from './engine.js';
