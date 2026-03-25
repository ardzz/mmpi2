import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Query,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import {
  UserRole,
  UpdateUserRolesSchema,
  type UpdateUserRolesDto,
  UpsertDoctorProfileSchema,
  UpsertPatientProfileSchema,
  type UpsertDoctorProfileDto,
  type UpsertPatientProfileDto,
} from '@mmpi2/contracts';
import {
  CurrentUser,
  RequireMinRole,
  type AuthenticatedUserContext,
} from '../auth';
import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(@Inject(ProfileService) private readonly profileService: ProfileService) {}

  @RequireMinRole(UserRole.PATIENT)
  @Get('patient/me')
  getMyPatientProfile(@CurrentUser() user: AuthenticatedUserContext | undefined) {
    return this.profileService.getPatientProfileByUserId(this.getCurrentUserIdOrThrow(user));
  }

  @RequireMinRole(UserRole.PATIENT)
  @Put('patient/me')
  upsertMyPatientProfile(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Body() body: unknown,
  ) {
    const payload = this.parseUpsertPatientProfileBody(body);
    return this.profileService.upsertPatientProfile(this.getCurrentUserIdOrThrow(user), payload);
  }

  @RequireMinRole(UserRole.DOCTOR)
  @Get('doctor/me')
  getMyDoctorProfile(@CurrentUser() user: AuthenticatedUserContext | undefined) {
    return this.profileService.getDoctorProfileByUserId(this.getCurrentUserIdOrThrow(user));
  }

  @RequireMinRole(UserRole.DOCTOR)
  @Put('doctor/me')
  upsertMyDoctorProfile(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Body() body: unknown,
  ) {
    const payload = this.parseUpsertDoctorProfileBody(body);
    return this.profileService.upsertDoctorProfile(this.getCurrentUserIdOrThrow(user), payload);
  }

  @RequireMinRole(UserRole.ADMIN)
  @Get('admin/users')
  listAdminUsers(@Query('q') q?: string, @Query('role') role?: UserRole | 'all') {
    return this.profileService.listAdminUserDirectory({ q, role });
  }

  @RequireMinRole(UserRole.ADMIN)
  @Put('admin/users/:userId/roles')
  updateUserRoles(@Param('userId') userId: string, @Body() body: unknown) {
    const payload = this.parseUpdateUserRolesBody(body);
    return this.profileService.updateUserRoles(userId, payload);
  }

  @RequireMinRole(UserRole.ADMIN)
  @Get('patient/:userId')
  getPatientProfileByUserId(@Param('userId') userId: string) {
    return this.profileService.getPatientProfileByUserId(userId);
  }

  @RequireMinRole(UserRole.ADMIN)
  @Get('doctor/:userId')
  getDoctorProfileByUserId(@Param('userId') userId: string) {
    return this.profileService.getDoctorProfileByUserId(userId);
  }

  private parseUpsertPatientProfileBody(body: unknown): UpsertPatientProfileDto {
    const parsed = UpsertPatientProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid patient profile payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseUpsertDoctorProfileBody(body: unknown): UpsertDoctorProfileDto {
    const parsed = UpsertDoctorProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid doctor profile payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseUpdateUserRolesBody(body: unknown): UpdateUserRolesDto {
    const parsed = UpdateUserRolesSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid user role payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private getCurrentUserIdOrThrow(user: AuthenticatedUserContext | undefined): string {
    if (user === undefined) {
      throw new UnauthorizedException('Authentication required.');
    }

    return user.userId;
  }
}
