import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Patch,
} from '@nestjs/common';
import {
  BillingModeSchema,
  UserRole,
  type BillingMode,
} from '@mmpi2/contracts';
import { RequireMinRole } from '../auth';
import { PaymentService } from './payment.service';

interface UpdateBillingSettingsDto {
  billingMode: BillingMode;
}

@Controller('workflow/billing')
export class PaymentController {
  constructor(@Inject(PaymentService) private readonly paymentService: PaymentService) {}

  @RequireMinRole(UserRole.ADMIN)
  @Get('settings')
  async getBillingSettings() {
    return this.paymentService.getBillingSettings();
  }

  @RequireMinRole(UserRole.ADMIN)
  @Patch('settings')
  async updateBillingSettings(@Body() body: unknown) {
    const payload = this.parseUpdateBillingSettingsBody(body);
    return this.paymentService.updateBillingMode(payload.billingMode);
  }

  private parseUpdateBillingSettingsBody(body: unknown): UpdateBillingSettingsDto {
    if (body === null || typeof body !== 'object') {
      throw new BadRequestException({
        message: 'Invalid update billing settings payload.',
        details: {
          formErrors: ['Payload must be an object.'],
          fieldErrors: {},
        },
      });
    }

    const billingModeRaw =
      'billingMode' in body ? (body as { billingMode?: unknown }).billingMode : undefined;
    const parsedBillingMode = BillingModeSchema.safeParse(billingModeRaw);
    if (!parsedBillingMode.success) {
      throw new BadRequestException({
        message: 'Invalid update billing settings payload.',
        details: parsedBillingMode.error.flatten(),
      });
    }

    return {
      billingMode: parsedBillingMode.data,
    };
  }
}
