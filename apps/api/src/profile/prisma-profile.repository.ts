import { Injectable } from '@nestjs/common';
import {
  AdminUserDirectoryItemSchema,
} from '@mmpi2/contracts';
import type {
  AdminUserDirectoryItem,
  DoctorProfile,
  PatientProfile,
  PatientDemographics,
  UserRole,
} from '@mmpi2/contracts';
import { prisma } from '@mmpi2/db/client';
import { ProfileRepository } from './profile.repository';

type PatientRow = {
  id: string;
  userId: string;
  governmentId: string | null;
  birthDate: Date;
  sexAtNorming: string;
  demographics: unknown;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { fullName: string };
};

type DoctorRow = {
  id: string;
  userId: string;
  licenseNumber: string;
  specialty: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { fullName: string };
};

type AdminUserDirectoryRow = {
  id: string;
  email: string;
  fullName: string;
  accountStatus: string;
  createdAt: Date;
  updatedAt: Date;
  roleAssignments: Array<{
    role: {
      roleCode: string;
    };
  }>;
  patientProfile: {
    isComplete: boolean;
  } | null;
  doctorProfile: {
    licenseNumber: string;
    specialty: string | null;
  } | null;
};

@Injectable()
export class PrismaProfileRepository extends ProfileRepository {
  async findPatientByUserId(userId: string): Promise<PatientProfile | null> {
    const row = await prisma.patientProfile.findUnique({
      where: { userId },
      include: { user: { select: { fullName: true } } },
    });

    if (row === null) {
      return null;
    }

    return this.toPatientContract(row as PatientRow);
  }

  async savePatientProfile(profile: PatientProfile): Promise<PatientProfile> {
    const [row] = await prisma.$transaction([
      prisma.patientProfile.upsert({
        where: { userId: profile.userId },
        create: {
          id: profile.id,
          userId: profile.userId,
          governmentId: profile.governmentId ?? null,
          birthDate: profile.dateOfBirth,
          sexAtNorming: profile.gender,
          demographics: (profile.demographics ?? undefined) as Record<string, unknown> | undefined,
          isComplete: profile.isProfileComplete,
        },
        update: {
          governmentId: profile.governmentId ?? null,
          birthDate: profile.dateOfBirth,
          sexAtNorming: profile.gender,
          demographics: (profile.demographics ?? undefined) as Record<string, unknown> | undefined,
          isComplete: profile.isProfileComplete,
        },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.user.update({
        where: { id: profile.userId },
        data: { fullName: profile.fullName },
      }),
    ]);

    return this.toPatientContract({
      ...(row as PatientRow),
      user: { fullName: profile.fullName },
    });
  }

  async findDoctorByUserId(userId: string): Promise<DoctorProfile | null> {
    const row = await prisma.doctorProfile.findUnique({
      where: { userId },
      include: { user: { select: { fullName: true } } },
    });

    if (row === null) {
      return null;
    }

    return this.toDoctorContract(row as DoctorRow);
  }

  async saveDoctorProfile(profile: DoctorProfile): Promise<DoctorProfile> {
    const [row] = await prisma.$transaction([
      prisma.doctorProfile.upsert({
        where: { userId: profile.userId },
        create: {
          id: profile.id,
          userId: profile.userId,
          licenseNumber: profile.licenseNumber,
          specialty: profile.specialty ?? null,
          isActive: profile.isActive,
        },
        update: {
          licenseNumber: profile.licenseNumber,
          specialty: profile.specialty ?? null,
          isActive: profile.isActive,
        },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.user.update({
        where: { id: profile.userId },
        data: { fullName: profile.fullName },
      }),
    ]);

    return this.toDoctorContract({
      ...(row as DoctorRow),
      user: { fullName: profile.fullName },
    });
  }

  async listAdminUserDirectory(query?: { q?: string; role?: UserRole | 'all' }): Promise<AdminUserDirectoryItem[]> {
    const normalizedQuery = query?.q?.trim();
    const roleFilter = query?.role;

    const rows = await prisma.user.findMany({
      where: {
        ...(normalizedQuery
          ? {
              OR: [
                { fullName: { contains: normalizedQuery, mode: 'insensitive' } },
                { email: { contains: normalizedQuery, mode: 'insensitive' } },
                {
                  doctorProfile: {
                    specialty: { contains: normalizedQuery, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
        ...(roleFilter && roleFilter !== 'all'
          ? {
              roleAssignments: {
                some: {
                  role: {
                    roleCode: roleFilter,
                  },
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        roleAssignments: {
          include: {
            role: {
              select: { roleCode: true },
            },
          },
        },
        patientProfile: {
          select: {
            isComplete: true,
          },
        },
        doctorProfile: {
          select: {
            licenseNumber: true,
            specialty: true,
          },
        },
      },
    });

    return (rows as AdminUserDirectoryRow[]).map((row) =>
      AdminUserDirectoryItemSchema.parse({
        id: row.id,
        email: row.email,
        fullName: row.fullName,
        accountStatus: row.accountStatus,
        roles: row.roleAssignments.map((assignment) => assignment.role.roleCode as UserRole),
        isProfileComplete: row.patientProfile?.isComplete ?? null,
        doctorLicenseNumber: row.doctorProfile?.licenseNumber ?? null,
        doctorSpecialty: row.doctorProfile?.specialty ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async updateUserRoles(userId: string, roles: UserRole[]): Promise<AdminUserDirectoryItem> {
    const roleRows = await prisma.role.findMany({
      where: {
        roleCode: {
          in: roles,
        },
      },
      select: {
        id: true,
        roleCode: true,
      },
    });

    if (roleRows.length !== roles.length) {
      throw new Error(`One or more roles could not be found for user '${userId}'.`);
    }

    await prisma.$transaction([
      prisma.userRoleAssignment.deleteMany({ where: { userId } }),
      prisma.userRoleAssignment.createMany({
        data: roleRows.map((role: { id: string; roleCode: string }) => ({
          userId,
          roleId: role.id,
          assignedBy: null,
        })),
      }),
    ]);

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: {
              select: { roleCode: true },
            },
          },
        },
        patientProfile: {
          select: {
            isComplete: true,
          },
        },
        doctorProfile: {
          select: {
            licenseNumber: true,
            specialty: true,
          },
        },
      },
    });

    return AdminUserDirectoryItemSchema.parse({
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      accountStatus: row.accountStatus,
      roles: row.roleAssignments.map((assignment: { role: { roleCode: string } }) => assignment.role.roleCode as UserRole),
      isProfileComplete: row.patientProfile?.isComplete ?? null,
      doctorLicenseNumber: row.doctorProfile?.licenseNumber ?? null,
      doctorSpecialty: row.doctorProfile?.specialty ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toPatientContract(row: PatientRow): PatientProfile {
    return {
      id: row.id,
      userId: row.userId,
      fullName: row.user.fullName,
      governmentId: row.governmentId ?? undefined,
      dateOfBirth: row.birthDate,
      gender: row.sexAtNorming as PatientProfile['gender'],
      demographics: (row.demographics as PatientDemographics) ?? null,
      isProfileComplete: row.isComplete,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDoctorContract(row: DoctorRow): DoctorProfile {
    return {
      id: row.id,
      userId: row.userId,
      fullName: row.user.fullName,
      licenseNumber: row.licenseNumber,
      specialty: row.specialty ?? undefined,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
