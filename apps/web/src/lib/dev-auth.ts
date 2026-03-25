import { UserRole } from '@mmpi2/contracts';

export const DEV_PATIENT_USER_ID = '11111111-1111-4111-8111-111111111111';
export const DEV_DOCTOR_USER_ID = '22222222-2222-4222-8222-222222222222';
export const DEV_ADMIN_USER_ID = '33333333-3333-4333-8333-333333333333';

export const DEV_PATIENT_AUTH = {
  userId: DEV_PATIENT_USER_ID,
  role: UserRole.PATIENT,
} as const;

export const DEV_DOCTOR_AUTH = {
  userId: DEV_DOCTOR_USER_ID,
  role: UserRole.DOCTOR,
} as const;

export const DEV_ADMIN_AUTH = {
  userId: DEV_ADMIN_USER_ID,
  role: UserRole.ADMIN,
} as const;
