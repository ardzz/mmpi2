/**
 * Singleton Prisma client instance for use across the application.
 *
 * Import from '@mmpi2/db/client' in API and worker services.
 * Do NOT import this in packages that should remain ORM-free (scoring, config).
 */

import { PrismaClient } from './generated/client/index.js';

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient } from './generated/client/index.js';
