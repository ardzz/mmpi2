import { z } from 'zod';
import {
  AccountStatusSchema,
  GenderSchema,
} from './state-machines.js';

// ---------------------------------------------------------------------------
// Role definitions — source of truth across the system
// ---------------------------------------------------------------------------

export const UserRole = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserRoleSchema = z.enum(['patient', 'doctor', 'admin', 'super_admin']);

// ---------------------------------------------------------------------------
// User / identity record
// ---------------------------------------------------------------------------

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  accountStatus: AccountStatusSchema,
  roles: z.array(UserRoleSchema).min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

// ---------------------------------------------------------------------------
// Patient profile — blueprint ERD: PATIENT_PROFILES
// ---------------------------------------------------------------------------

export const PatientDemographicsSchema = z.object({
  education: z.string().max(100).optional(),
  occupation: z.string().max(200).optional(),
  phoneNumber: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  maritalStatus: z.string().max(50).optional(),
  religion: z.string().max(100).optional(),
});

export type PatientDemographics = z.infer<typeof PatientDemographicsSchema>;

export const PatientProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string().min(2).max(200),
  governmentId: z.string().max(50).optional(),
  dateOfBirth: z.coerce.date(),
  gender: GenderSchema,
  demographics: PatientDemographicsSchema.nullable(),
  isProfileComplete: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PatientProfile = z.infer<typeof PatientProfileSchema>;

/** DTO for creating or fully updating a patient profile. */
export const UpsertPatientProfileSchema = z.object({
  fullName: z.string().min(2).max(200),
  governmentId: z.string().max(50).optional(),
  dateOfBirth: z.coerce.date(),
  gender: GenderSchema,
  demographics: PatientDemographicsSchema.optional(),
});

export type UpsertPatientProfileDto = z.infer<typeof UpsertPatientProfileSchema>;

// ---------------------------------------------------------------------------
// Doctor profile — blueprint ERD: DOCTOR_PROFILES
// ---------------------------------------------------------------------------

export const DoctorProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string().min(2).max(200),
  licenseNumber: z.string().max(100),
  specialty: z.string().max(200).optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type DoctorProfile = z.infer<typeof DoctorProfileSchema>;

/** DTO for creating or updating a doctor profile. */
export const UpsertDoctorProfileSchema = z.object({
  fullName: z.string().min(2).max(200),
  licenseNumber: z.string().min(1).max(100),
  specialty: z.string().max(200).optional(),
});

export type UpsertDoctorProfileDto = z.infer<typeof UpsertDoctorProfileSchema>;

// ---------------------------------------------------------------------------
// Auth session — lightweight token payload shape
// ---------------------------------------------------------------------------

export const SessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  roles: z.array(UserRoleSchema).min(1),
  profileId: z.string().uuid().optional(),
  profileComplete: z.boolean().optional(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
