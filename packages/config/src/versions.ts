import type { VersionTriplet } from './types.js';

/**
 * The canonical MMPI-2 1989 version triplet.
 * Used to seed the database and as the default active version.
 */
export const MMPI2_1989_TRIPLET: VersionTriplet = {
  instrument: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'MMPI-2',
    revision: '1989',
    totalItems: 567,
    publishedAt: '1989-01-01',
    isActive: true,
  },
  questionBank: {
    id: '00000000-0000-0000-0000-000000000002',
    instrumentVersionId: '00000000-0000-0000-0000-000000000001',
    version: '1989-r1',
    itemCount: 567,
    checksum: '4a77b4be00567d2c6d3f5b136052c3daf93afd90a9eec33f161b0f6e5ebd6c37',
    isActive: true,
    releasedAt: '1989-01-01',
  },
  scoringConfig: {
    id: '00000000-0000-0000-0000-000000000003',
    instrumentVersionId: '00000000-0000-0000-0000-000000000001',
    version: '1989-r1',
    description: 'Standard MMPI-2 scoring configuration (1989 normative sample)',
    checksum: '0b528077184b38ea450ed138c4814aecd7cd7012251e54feb231c160e36ed696',
    isActive: true,
    releasedAt: '1989-01-01',
  },
};
