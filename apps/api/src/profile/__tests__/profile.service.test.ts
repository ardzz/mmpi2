import type { AdminUserDirectoryItem, DoctorProfile, PatientProfile } from '@mmpi2/contracts';
import { describe, expect, it } from 'vitest';
import { ProfileRepository } from '../profile.repository';
import { ProfileService } from '../profile.service';

class TestProfileRepository extends ProfileRepository {
  private readonly patientProfilesByUserId = new Map<string, PatientProfile>();
  private readonly doctorProfilesByUserId = new Map<string, DoctorProfile>();
  private readonly adminDirectory: AdminUserDirectoryItem[] = [];

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

  async listAdminUserDirectory(): Promise<AdminUserDirectoryItem[]> {
    return this.adminDirectory;
  }

  async updateUserRoles(userId: string, roles: Array<'patient' | 'doctor' | 'admin' | 'super_admin'>): Promise<AdminUserDirectoryItem> {
    const existing = this.adminDirectory.find((item) => item.id === userId);
    const updated: AdminUserDirectoryItem = {
      ...(existing ?? {
        id: userId,
        email: `${userId.slice(0, 8)}@example.com`,
        fullName: 'Directory User',
        accountStatus: 'active',
        isProfileComplete: null,
        doctorLicenseNumber: null,
        doctorSpecialty: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        roles: ['patient'],
      }),
      roles,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    const existingIndex = this.adminDirectory.findIndex((item) => item.id === userId);
    if (existingIndex >= 0) {
      this.adminDirectory.splice(existingIndex, 1, updated);
    } else {
      this.adminDirectory.push(updated);
    }

    return updated;
  }

  setAdminDirectory(items: AdminUserDirectoryItem[]) {
    this.adminDirectory.splice(0, this.adminDirectory.length, ...items);
  }
}

describe('ProfileService', () => {
  it('marks patient profile complete only when required identity + demographics are provided', async () => {
    const repository = new TestProfileRepository();
    const service = new ProfileService(repository);

    const incompleteProfile = await service.upsertPatientProfile('11111111-1111-1111-1111-111111111111', {
      fullName: 'Patient One',
      dateOfBirth: new Date('1994-02-10'),
      gender: 'female',
    });

    expect(incompleteProfile.isProfileComplete).toBe(false);

    const completeProfile = await service.upsertPatientProfile('11111111-1111-1111-1111-111111111111', {
      fullName: 'Patient One',
      governmentId: 'ID-778899',
      dateOfBirth: new Date('1994-02-10'),
      gender: 'female',
      demographics: {
        education: 'Bachelor Degree',
        occupation: 'Designer',
        phoneNumber: '+62-812-1234-5678',
        address: 'Jakarta',
      },
    });

    expect(completeProfile.isProfileComplete).toBe(true);
  });

  it('persists doctor profile updates and preserves active status', async () => {
    const repository = new TestProfileRepository();
    const service = new ProfileService(repository);

    const created = await service.upsertDoctorProfile('22222222-2222-2222-2222-222222222222', {
      fullName: 'Dr. Jane',
      licenseNumber: 'PSY-001',
      specialty: 'Clinical Psychology',
    });

    expect(created.isActive).toBe(true);

    const updated = await service.upsertDoctorProfile('22222222-2222-2222-2222-222222222222', {
      fullName: 'Dr. Jane Updated',
      licenseNumber: 'PSY-001',
      specialty: 'Neuropsychology',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.isActive).toBe(true);
    expect(updated.fullName).toBe('Dr. Jane Updated');
  });

  it('evaluates completeness helper consistently for assessment gate usage', () => {
    const service = new ProfileService(new TestProfileRepository());

    expect(
      service.isPatientProfileComplete({
        fullName: 'Patient Complete',
        governmentId: 'ID-1',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        demographics: {
          education: 'S1',
          occupation: 'Engineer',
          phoneNumber: '0812',
          address: 'Bandung',
        },
      }),
    ).toBe(true);

    expect(
      service.isPatientProfileComplete({
        fullName: 'Patient Incomplete',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
      }),
    ).toBe(false);
  });

  it('returns admin user directory read models from the repository', async () => {
    const repository = new TestProfileRepository();
    repository.setAdminDirectory([
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'doctor@example.com',
        fullName: 'Dr. Directory',
        accountStatus: 'active',
        roles: ['doctor'],
        isProfileComplete: null,
        doctorLicenseNumber: 'PSY-009',
        doctorSpecialty: 'Clinical Psychology',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const service = new ProfileService(repository);
    const directory = await service.listAdminUserDirectory();

    expect(directory).toHaveLength(1);
    expect(directory[0]?.fullName).toBe('Dr. Directory');
    expect(directory[0]?.roles).toEqual(['doctor']);
  });
});
