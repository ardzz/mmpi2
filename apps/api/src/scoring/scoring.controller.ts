import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  UserRole,
  type UserRole as UserRoleType,
} from '@mmpi2/contracts';
import {
  CurrentUser,
  RequireMinRole,
  type AuthenticatedUserContext,
} from '../auth';
import { ScoringService } from './scoring.service';

@Controller('workflow')
export class ScoringController {
  constructor(@Inject(ScoringService) private readonly scoringService: ScoringService) {}

  @RequireMinRole(UserRole.ADMIN)
  @Post('sessions/:sessionId/scoring')
  runScoringForSession(@Param('sessionId') sessionId: string) {
    return this.scoringService.runScoringForSubmittedSession(sessionId);
  }

  @RequireMinRole(UserRole.DOCTOR)
  @Get('sessions/:sessionId/scoring')
  getLatestScoreForDoctor(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('sessionId') sessionId: string,
  ) {
    this.assertDoctorRole(user);
    return this.scoringService.getLatestScoreForDoctor(sessionId, this.getCurrentUserIdOrThrow(user));
  }

  private getCurrentUserIdOrThrow(user: AuthenticatedUserContext | undefined): string {
    if (user === undefined) {
      throw new UnauthorizedException('Authentication required.');
    }

    return user.userId;
  }

  private assertDoctorRole(user: AuthenticatedUserContext | undefined): void {
    if (user === undefined) {
      throw new UnauthorizedException('Authentication required.');
    }

    const hasDoctorRole = user.roles.includes(UserRole.DOCTOR as UserRoleType);
    if (!hasDoctorRole) {
      throw new UnauthorizedException('Doctor role is required to review scored sessions.');
    }
  }
}
