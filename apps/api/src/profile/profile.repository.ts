import type {
  AdminUserDirectoryItem,
  DoctorProfile,
  PatientProfile,
  UserRole,
} from '@mmpi2/contracts';

export abstract class ProfileRepository {
  abstract findPatientByUserId(userId: string): Promise<PatientProfile | null>;
  abstract savePatientProfile(profile: PatientProfile): Promise<PatientProfile>;

  abstract findDoctorByUserId(userId: string): Promise<DoctorProfile | null>;
  abstract saveDoctorProfile(profile: DoctorProfile): Promise<DoctorProfile>;

  abstract listAdminUserDirectory(query?: { q?: string; role?: UserRole | 'all' }): Promise<AdminUserDirectoryItem[]>;
  abstract updateUserRoles(userId: string, roles: UserRole[]): Promise<AdminUserDirectoryItem>;
}
