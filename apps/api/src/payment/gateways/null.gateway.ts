import { Injectable } from '@nestjs/common';
import {
  type CreateGatewayChargeInput,
  type CreateGatewayChargeResult,
  PaymentGateway,
  type VerifyGatewayWebhookInput,
  type VerifyGatewayWebhookResult,
} from '../payment-gateway';

@Injectable()
export class NullGateway extends PaymentGateway {
  readonly gatewayCode = 'disabled' as const;

  async createCharge(_input: CreateGatewayChargeInput): Promise<CreateGatewayChargeResult> {
    return {
      kind: 'billing_not_required',
      providerMetadata: {
        reason: 'billing_mode_disabled',
      },
    };
  }

  async verifyWebhook(_input: VerifyGatewayWebhookInput): Promise<VerifyGatewayWebhookResult> {
    return {
      kind: 'rejected',
      reason: 'Billing mode disabled does not accept payment webhooks.',
      providerMetadata: {
        mode: 'disabled',
      },
    };
  }
}
