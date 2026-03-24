import type { PrismaClient } from '../generated/client/index.js';

const APP_SETTINGS_ID = '00000000-0000-0000-0000-0000000000a1';

export async function seedAppSettings(prisma: PrismaClient) {
  return prisma.appSettings.upsert({
    where: { id: APP_SETTINGS_ID },
    update: {
      billingMode: 'disabled',
      updatedByUserId: null,
    },
    create: {
      id: APP_SETTINGS_ID,
      billingMode: 'disabled',
      updatedByUserId: null,
    },
  });
}
