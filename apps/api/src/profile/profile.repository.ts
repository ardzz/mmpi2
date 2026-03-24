import type {
  DoctorProfile,
  PatientProfile,
} from '@mmpi2/contracts';

export abstract class ProfileRepository {
  abstract findPatientByUserId(userId: string): PatientProfile | null;
  abstract savePatientProfile(profile: PatientProfile): PatientProfile;

  abstract findDoctorByUserId(userId: string): DoctorProfile | null;
  abstract saveDoctorProfile(profile: DoctorProfile): DoctorProfile;
}
