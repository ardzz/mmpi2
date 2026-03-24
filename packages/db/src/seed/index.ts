import { PrismaClient } from '../generated/client/index.js';
import { seedAppSettings } from './app-settings.seed.js';
import { seedReferenceData } from './reference-data.seed.js';
import { seedRoles } from './roles.seed.js';

async function main() {
  const prisma = new PrismaClient();

  try {
    await seedAppSettings(prisma);
    await seedRoles(prisma);
    await seedReferenceData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error: unknown) => {
  console.error('Database seed failed.', error);
  process.exitCode = 1;
});
