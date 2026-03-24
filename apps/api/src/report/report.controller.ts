import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AmendReportSchema,
  PublishReportSchema,
  SaveDraftReportSchema,
  SignReportSchema,
  UserRole,
  type AmendReportDto,
  type PublishReportDto,
  type SaveDraftReportDto,
  type SignReportDto,
} from '@mmpi2/contracts';
import {
  CurrentUser,
  RequireMinRole,
  type AuthenticatedUserContext,
} from '../auth';
import { ReportService } from './report.service';

@Controller('workflow')
export class ReportController {
  constructor(@Inject(ReportService) private readonly reportService: ReportService) {}

  @RequireMinRole(UserRole.DOCTOR)
  @Get('sessions/:sessionId/report')
  getReportState(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('sessionId') sessionId: string,
  ) {
    return this.reportService.getReportStateForDoctor(sessionId, this.getCurrentDoctorIdOrThrow(user));
  }

  @RequireMinRole(UserRole.DOCTOR)
  @Put('sessions/:sessionId/report/draft')
  saveDraft(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
  ) {
    const payload = this.parseSaveDraftBody(body);
    return this.reportService.saveDraftForDoctor(sessionId, this.getCurrentDoctorIdOrThrow(user), payload);
  }

  @RequireMinRole(UserRole.DOCTOR)
  @Post('sessions/:sessionId/report/sign')
  signReport(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
  ) {
    const payload = this.parseSignReportBody(body);
    return this.reportService.signReportForDoctor(sessionId, this.getCurrentDoctorIdOrThrow(user), payload);
  }

  @RequireMinRole(UserRole.DOCTOR)
  @Post('sessions/:sessionId/report/publish')
  publishReport(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
  ) {
    const payload = this.parsePublishReportBody(body);
    return this.reportService.publishReportForDoctor(sessionId, this.getCurrentDoctorIdOrThrow(user), payload);
  }

  @RequireMinRole(UserRole.DOCTOR)
  @Post('sessions/:sessionId/report/amend')
  amendReport(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
  ) {
    const payload = this.parseAmendReportBody(body);
    return this.reportService.amendPublishedReportForDoctor(
      sessionId,
      this.getCurrentDoctorIdOrThrow(user),
      payload,
    );
  }

  private parseSaveDraftBody(body: unknown): SaveDraftReportDto {
    const parsed = SaveDraftReportSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid save draft report payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseSignReportBody(body: unknown): SignReportDto {
    const parsed = SignReportSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid sign report payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parsePublishReportBody(body: unknown): PublishReportDto {
    const parsed = PublishReportSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid publish report payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseAmendReportBody(body: unknown): AmendReportDto {
    const parsed = AmendReportSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid amend report payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private getCurrentDoctorIdOrThrow(user: AuthenticatedUserContext | undefined): string {
    if (user === undefined) {
      throw new UnauthorizedException('Authentication required.');
    }

    const hasDoctorRole = user.roles.includes(UserRole.DOCTOR);
    if (!hasDoctorRole) {
      throw new UnauthorizedException('Doctor role is required for report authoring actions.');
    }

    return user.userId;
  }
}
