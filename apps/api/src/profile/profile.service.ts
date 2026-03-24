import { randomUUID } from 'node:crypto';
import {
  DoctorProfileSchema,
  type DoctorProfile,
  PatientProfileSchema,
  type PatientProfile,
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

  getPatientProfileByUserId(userId: string): PatientProfile {
    const profile = this.profileRepository.findPatientByUserId(userId);
    if (profile === null) {
      throw new NotFoundException(`Patient profile for user '${userId}' was not found.`);
    }

    return PatientProfileSchema.parse(profile);
  }

  upsertPatientProfile(userId: string, payload: UpsertPatientProfileDto): PatientProfile {
    const existingProfile = this.profileRepository.findPatientByUserId(userId);
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

  getDoctorProfileByUserId(userId: string): DoctorProfile {
    const profile = this.profileRepository.findDoctorByUserId(userId);
    if (profile === null) {
      throw new NotFoundException(`Doctor profile for user '${userId}' was not found.`);
    }

    return DoctorProfileSchema.parse(profile);
  }

  upsertDoctorProfile(userId: string, payload: UpsertDoctorProfileDto): DoctorProfile {
    const existingProfile = this.profileRepository.findDoctorByUserId(userId);
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
