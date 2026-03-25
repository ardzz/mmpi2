import { randomUUID } from 'node:crypto';
import {
  type UserRole,
  type AdminUserDirectoryItem,
  DoctorProfileSchema,
  type DoctorProfile,
  PatientProfileSchema,
  type PatientProfile,
  type UpdateUserRolesDto,
  type UpsertDoctorProfileDto,
  type UpsertPatientProfileDto,
} from '@mmpi2/contracts';
import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileRepository } from './profile.repository';

const REQUIRED_DEMOGRAPHIC_FIELDS = [
  'education',
  'occupation',
  'phoneNumber',
  'address',
] as const;

@Injectable()
export class ProfileService {
  constructor(@Inject(ProfileRepository) private readonly profileRepository: ProfileRepository) {}

  async getPatientProfileByUserId(userId: string): Promise<PatientProfile> {
    const profile = await this.profileRepository.findPatientByUserId(userId);
    if (profile === null) {
      throw new NotFoundException(`Patient profile for user '${userId}' was not found.`);
    }

    return PatientProfileSchema.parse(profile);
  }

  async upsertPatientProfile(userId: string, payload: UpsertPatientProfileDto): Promise<PatientProfile> {
    const existingProfile = await this.profileRepository.findPatientByUserId(userId);
    const now = new Date();

    const profile: PatientProfile = {
      id: existingProfile?.id ?? randomUUID(),
      userId,
      fullName: payload.fullName,
      governmentId: payload.governmentId,
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
      demographics: payload.demographics ?? null,
      isProfileComplete: this.isPatientProfileComplete(payload),
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now,
    };

    const validatedProfile = PatientProfileSchema.parse(profile);
    return this.profileRepository.savePatientProfile(validatedProfile);
  }

  async getDoctorProfileByUserId(userId: string): Promise<DoctorProfile> {
    const profile = await this.profileRepository.findDoctorByUserId(userId);
    if (profile === null) {
      throw new NotFoundException(`Doctor profile for user '${userId}' was not found.`);
    }

    return DoctorProfileSchema.parse(profile);
  }

  async upsertDoctorProfile(userId: string, payload: UpsertDoctorProfileDto): Promise<DoctorProfile> {
    const existingProfile = await this.profileRepository.findDoctorByUserId(userId);
    const now = new Date();

    const profile: DoctorProfile = {
      id: existingProfile?.id ?? randomUUID(),
      userId,
      fullName: payload.fullName,
      licenseNumber: payload.licenseNumber,
      specialty: payload.specialty,
      isActive: existingProfile?.isActive ?? true,
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now,
    };

    const validatedProfile = DoctorProfileSchema.parse(profile);
    return this.profileRepository.saveDoctorProfile(validatedProfile);
  }

  async listAdminUserDirectory(query?: { q?: string; role?: UserRole | 'all' }): Promise<AdminUserDirectoryItem[]> {
    return this.profileRepository.listAdminUserDirectory(query);
  }

  async updateUserRoles(userId: string, payload: UpdateUserRolesDto): Promise<AdminUserDirectoryItem> {
    return this.profileRepository.updateUserRoles(userId, payload.roles);
  }

  isPatientProfileComplete(payload: UpsertPatientProfileDto): boolean {
    const hasRequiredIdentity =
      this.hasTextValue(payload.fullName) &&
      this.hasTextValue(payload.governmentId) &&
      payload.dateOfBirth instanceof Date &&
      Number.isFinite(payload.dateOfBirth.getTime());

    const demographics = payload.demographics;
    if (demographics === undefined) {
      return false;
    }

    const hasRequiredDemographics = REQUIRED_DEMOGRAPHIC_FIELDS.every((fieldName) =>
      this.hasTextValue(demographics[fieldName]),
    );

    return hasRequiredIdentity && hasRequiredDemographics;
  }

  private hasTextValue(value: string | undefined): boolean {
    return value !== undefined && value.trim().length > 0;
  }
}
