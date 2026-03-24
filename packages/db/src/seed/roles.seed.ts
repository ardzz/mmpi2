import type { PrismaClient } from '../generated/client/index.js';

const ROLE_SEEDS = [
  {
    id: '00000000-0000-0000-0000-0000000000b1',
    roleCode: 'patient',
    displayName: 'Patient',
  },
  {
    id: '00000000-0000-0000-0000-0000000000b2',
    roleCode: 'doctor',
    displayName: 'Doctor',
  },
  {
    id: '00000000-0000-0000-0000-0000000000b3',
    roleCode: 'admin',
    displayName: 'Admin',
  },
  {
    id: '00000000-0000-0000-0000-0000000000b4',
    roleCode: 'super_admin',
    displayName: 'Super Admin',
  },
] as const;

export async function seedRoles(prisma: PrismaClient) {
  for (const role of ROLE_SEEDS) {
    await prisma.role.upsert({
      where: { roleCode: role.roleCode },
      update: {
        displayName: role.displayName,
      },
      create: role,
    });
  }
}

export { ROLE_SEEDS };
