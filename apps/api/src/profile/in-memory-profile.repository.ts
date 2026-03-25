import {
  Injectable,
} from '@nestjs/common';
import {
  AdminUserDirectoryItemSchema,
  UserRole,
} from '@mmpi2/contracts';
import type {
  AdminUserDirectoryItem,
  DoctorProfile,
  PatientProfile,
} from '@mmpi2/contracts';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class InMemoryProfileRepository extends ProfileRepository {
  private readonly patientProfilesByUserId = new Map<string, PatientProfile>();
  private readonly doctorProfilesByUserId = new Map<string, DoctorProfile>();
  private readonly rolesByUserId = new Map<string, UserRole[]>();

  async findPatientByUserId(userId: string): Promise<PatientProfile | null> {
    return this.patientProfilesByUserId.get(userId) ?? null;
  }

  async savePatientProfile(profile: PatientProfile): Promise<PatientProfile> {
    this.patientProfilesByUserId.set(profile.userId, profile);
    return profile;
  }

  async findDoctorByUserId(userId: string): Promise<DoctorProfile | null> {
    return this.doctorProfilesByUserId.get(userId) ?? null;
  }

  async saveDoctorProfile(profile: DoctorProfile): Promise<DoctorProfile> {
    this.doctorProfilesByUserId.set(profile.userId, profile);
    return profile;
  }

  async listAdminUserDirectory(query?: { q?: UserRole | string; role?: UserRole | 'all' }): Promise<AdminUserDirectoryItem[]> {
    const normalizedQuery = typeof query?.q === 'string' ? query.q.trim().toLowerCase() : '';
    const roleFilter = query?.role ?? 'all';

    const userIds = new Set<string>([
      ...this.patientProfilesByUserId.keys(),
      ...this.doctorProfilesByUserId.keys(),
    ]);

    return [...userIds].map((userId) => {
      const patient = this.patientProfilesByUserId.get(userId) ?? null;
      const doctor = this.doctorProfilesByUserId.get(userId) ?? null;
      const roles = [
        ...(patient ? [UserRole.PATIENT] : []),
        ...(doctor ? [UserRole.DOCTOR] : []),
      ];

      return AdminUserDirectoryItemSchema.parse({
        id: userId,
        email: `${userId.slice(0, 8)}@example.com`,
        fullName: patient?.fullName ?? doctor?.fullName ?? `User ${userId.slice(0, 8)}`,
        accountStatus: 'active',
        roles: this.rolesByUserId.get(userId) ?? (roles.length > 0 ? roles : [UserRole.ADMIN]),
        isProfileComplete: patient?.isProfileComplete ?? null,
        doctorLicenseNumber: doctor?.licenseNumber ?? null,
        doctorSpecialty: doctor?.specialty ?? null,
        createdAt: patient?.createdAt ?? doctor?.createdAt ?? new Date(),
        updatedAt: patient?.updatedAt ?? doctor?.updatedAt ?? new Date(),
      });
    }).filter((item) => {
      const matchesRole = roleFilter === 'all' || item.roles.includes(roleFilter);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.fullName, item.email, item.doctorSpecialty ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesRole && matchesQuery;
    });
  }

  async updateUserRoles(userId: string, roles: UserRole[]): Promise<AdminUserDirectoryItem> {
    this.rolesByUserId.set(userId, [...roles]);

    const patient = this.patientProfilesByUserId.get(userId) ?? null;
    const doctor = this.doctorProfilesByUserId.get(userId) ?? null;

    return AdminUserDirectoryItemSchema.parse({
      id: userId,
      email: `${userId.slice(0, 8)}@example.com`,
      fullName: patient?.fullName ?? doctor?.fullName ?? `User ${userId.slice(0, 8)}`,
      accountStatus: 'active',
      roles,
      isProfileComplete: patient?.isProfileComplete ?? null,
      doctorLicenseNumber: doctor?.licenseNumber ?? null,
      doctorSpecialty: doctor?.specialty ?? null,
      createdAt: patient?.createdAt ?? doctor?.createdAt ?? new Date(),
      updatedAt: new Date(),
    });
  }
}
