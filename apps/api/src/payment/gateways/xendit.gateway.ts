import { Injectable } from '@nestjs/common';
import { ProviderCode } from '@mmpi2/contracts';
import {
  type CreateGatewayChargeInput,
  type CreateGatewayChargeResult,
  PaymentGateway,
  type VerifyGatewayWebhookInput,
  type VerifyGatewayWebhookResult,
  type VerifiedWebhookStatus,
} from '../payment-gateway';

function normalizeXenditStatus(rawStatus: string): VerifiedWebhookStatus {
  const normalized = rawStatus.trim().toLowerCase();

  if (normalized === 'paid' || normalized === 'succeeded') {
    return 'paid';
  }

  if (normalized === 'processing') {
    return 'processing';
  }

  if (normalized === 'pending') {
    return 'pending';
  }

  if (normalized === 'expired') {
    return 'expired';
  }

  if (normalized === 'cancel' || normalized === 'cancelled' || normalized === 'canceled') {
    return 'cancelled';
  }

  return 'failed';
}

@Injectable()
export class XenditGateway extends PaymentGateway {
  readonly gatewayCode = ProviderCode.XENDIT;

  async createCharge(input: CreateGatewayChargeInput): Promise<CreateGatewayChargeResult> {
    return {
      kind: 'checkout_created',
      providerCode: ProviderCode.XENDIT,
      providerReferenceId: `xendit-${input.paymentId}`,
      checkoutUrl: `https://payments.xendit.local/invoice/${input.paymentId}`,
      providerMetadata: {
        mode: 'stub',
      },
      expiresAt: null,
    };
  }

  async verifyWebhook(input: VerifyGatewayWebhookInput): Promise<VerifyGatewayWebhookResult> {
    if (input.payload.rawSignature === 'invalid') {
      return {
        kind: 'rejected',
        reason: 'Xendit signature verification failed.',
        providerMetadata: {
          mode: 'stub',
        },
      };
    }

    return {
      kind: 'verified',
      normalizedStatus: normalizeXenditStatus(input.payload.providerStatus),
      occurredAt: null,
      providerMetadata: {
        mode: 'stub',
      },
    };
  }
}
