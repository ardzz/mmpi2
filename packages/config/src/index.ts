/**
 * @mmpi2/config
 *
 * Versioned MMPI-2 question bank, scoring configuration,
 * thresholds, and reference data.
 *
 * Config is treated like code: changes require review and release notes.
 * This package must never import ORM, HTTP, or framework packages.
 */

export * from './types.js';
export * from './versions.js';
export * from './catalog.js';
