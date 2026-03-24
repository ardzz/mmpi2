import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AssignDoctorSchema,
  ConfirmPaymentManuallySchema,
  CreateAssessmentRequestSchema,
  PaymentWebhookPayloadSchema,
  ReviewRequestSchema,
  SaveAnswersBatchSchema,
  UserRole,
  WaivePaymentSchema,
  type AssignDoctorDto,
  type ConfirmPaymentManuallyDto,
  type CreateAssessmentRequestDto,
  type ReviewRequestDto,
  type SaveAnswersBatchDto,
  type PaymentWebhookPayload,
  type WaivePaymentDto,
} from '@mmpi2/contracts';
import {
  CurrentUser,
  RequireMinRole,
  type AuthenticatedUserContext,
} from '../auth';
import { RequestSessionService } from './request-session.service';

@Controller('workflow')
export class RequestSessionController {
  constructor(@Inject(RequestSessionService) private readonly service: RequestSessionService) {}

  @RequireMinRole(UserRole.PATIENT)
  @Post('requests')
  createAssessmentRequest(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Body() body: unknown,
  ) {
    const payload = this.parseCreateAssessmentRequestBody(body);
    return this.service.createAssessmentRequest(this.getCurrentUserIdOrThrow(user), payload);
  }

  @RequireMinRole(UserRole.ADMIN)
  @Patch('requests/:requestId/doctor')
  assignDoctor(@Param('requestId') requestId: string, @Body() body: unknown) {
    const payload = this.parseAssignDoctorBody(body);
    return this.service.assignDoctor(requestId, payload);
  }

  @RequireMinRole(UserRole.ADMIN)
  @Patch('requests/:requestId/review')
  reviewRequest(@Param('requestId') requestId: string, @Body() body: unknown) {
    const payload = this.parseReviewBody(body);
    return this.service.reviewRequest(requestId, payload);
  }

  @RequireMinRole(UserRole.PATIENT)
  @Post('requests/:requestId/payments')
  async createPaymentForRequest(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('requestId') requestId: string,
  ) {
    return this.service.createPaymentForPatientRequest(this.getCurrentUserIdOrThrow(user), requestId);
  }

  @RequireMinRole(UserRole.ADMIN)
  @Post('requests/:requestId/payments/confirm')
  confirmPaymentManually(@Param('requestId') requestId: string, @Body() body: unknown) {
    const payload = this.parseConfirmPaymentBody(body);
    return this.service.confirmPaymentForRequestManually(requestId, payload);
  }

  @RequireMinRole(UserRole.ADMIN)
  @Post('requests/:requestId/payments/waive')
  waivePayment(@Param('requestId') requestId: string, @Body() body: unknown) {
    const payload = this.parseWaivePaymentBody(body);
    return this.service.waivePaymentForRequest(requestId, payload);
  }

  @Post('payments/webhooks')
  async processPaymentWebhook(@Body() body: unknown) {
    const payload = this.parsePaymentWebhookPayload(body);
    return this.service.processPaymentWebhook(payload);
  }

  @RequireMinRole(UserRole.PATIENT)
  @Post('requests/:requestId/session/start')
  startSession(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('requestId') requestId: string,
  ) {
    return this.service.startSessionForPatient(this.getCurrentUserIdOrThrow(user), requestId);
  }

  @RequireMinRole(UserRole.PATIENT)
  @Get('requests/:requestId/session')
  getSessionState(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('requestId') requestId: string,
  ) {
    return this.service.getSessionStateForPatient(this.getCurrentUserIdOrThrow(user), requestId);
  }

  @RequireMinRole(UserRole.PATIENT)
  @Put('requests/:requestId/session/answers')
  saveAnswers(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('requestId') requestId: string,
    @Body() body: unknown,
  ) {
    const payload = this.parseSaveAnswersBody(body);
    return this.service.saveAnswersForPatient(this.getCurrentUserIdOrThrow(user), requestId, payload);
  }

  @RequireMinRole(UserRole.PATIENT)
  @Post('requests/:requestId/session/submit')
  submitSession(
    @CurrentUser() user: AuthenticatedUserContext | undefined,
    @Param('requestId') requestId: string,
  ) {
    return this.service.submitSessionForPatient(this.getCurrentUserIdOrThrow(user), requestId);
  }

  private parseCreateAssessmentRequestBody(body: unknown): CreateAssessmentRequestDto {
    const parsed = CreateAssessmentRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid create assessment request payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseAssignDoctorBody(body: unknown): AssignDoctorDto {
    const parsed = AssignDoctorSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid assign doctor payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseReviewBody(body: unknown): ReviewRequestDto {
    const parsed = ReviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid review request payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseSaveAnswersBody(body: unknown): SaveAnswersBatchDto {
    const parsed = SaveAnswersBatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid save answers payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseConfirmPaymentBody(body: unknown): ConfirmPaymentManuallyDto {
    const parsed = ConfirmPaymentManuallySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid confirm payment payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parseWaivePaymentBody(body: unknown): WaivePaymentDto {
    const parsed = WaivePaymentSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid waive payment payload.',
        details: parsed.error.flatten(),
      });
    }

    return parsed.data;
  }

  private parsePaymentWebhookPayload(body: unknown): PaymentWebhookPayload {
    const parsed = PaymentWebhookPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid payment webhook payload.',
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
