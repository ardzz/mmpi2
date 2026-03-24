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

function normalizeMidtransStatus(rawStatus: string): VerifiedWebhookStatus {
  const normalized = rawStatus.trim().toLowerCase();

  if (normalized === 'paid' || normalized === 'settlement') {
    return 'paid';
  }

  if (normalized === 'processing' || normalized === 'capture') {
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
export class MidtransGateway extends PaymentGateway {
  readonly gatewayCode = ProviderCode.MIDTRANS;

  async createCharge(input: CreateGatewayChargeInput): Promise<CreateGatewayChargeResult> {
    return {
      kind: 'checkout_created',
      providerCode: ProviderCode.MIDTRANS,
      providerReferenceId: `midtrans-${input.paymentId}`,
      checkoutUrl: `https://payments.midtrans.local/checkout/${input.paymentId}`,
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
        reason: 'Midtrans signature verification failed.',
        providerMetadata: {
          mode: 'stub',
        },
      };
    }

    return {
      kind: 'verified',
      normalizedStatus: normalizeMidtransStatus(input.payload.providerStatus),
      occurredAt: null,
      providerMetadata: {
        mode: 'stub',
      },
    };
  }
}
