import {
  Injectable,
} from '@nestjs/common';
import type {
  DoctorProfile,
  PatientProfile,
} from '@mmpi2/contracts';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class InMemoryProfileRepository extends ProfileRepository {
  private readonly patientProfilesByUserId = new Map<string, PatientProfile>();
  private readonly doctorProfilesByUserId = new Map<string, DoctorProfile>();

  findPatientByUserId(userId: string): PatientProfile | null {
    return this.patientProfilesByUserId.get(userId) ?? null;
  }

  savePatientProfile(profile: PatientProfile): PatientProfile {
    this.patientProfilesByUserId.set(profile.userId, profile);
    return profile;
  }

  findDoctorByUserId(userId: string): DoctorProfile | null {
    return this.doctorProfilesByUserId.get(userId) ?? null;
  }

  saveDoctorProfile(profile: DoctorProfile): DoctorProfile {
    this.doctorProfilesByUserId.set(profile.userId, profile);
    return profile;
  }
}
