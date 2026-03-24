import type {
  PaymentWebhookPayload,
  ProviderCode,
} from '@mmpi2/contracts';

export interface CreateGatewayChargeInput {
  paymentId: string;
  assessmentRequestId: string;
  amount: number;
  currency: string;
}

export type CreateGatewayChargeResult =
  | {
      kind: 'checkout_created';
      providerCode: ProviderCode;
      providerReferenceId: string;
      checkoutUrl: string;
      providerMetadata: Record<string, unknown>;
      expiresAt: Date | null;
    }
  | {
      kind: 'billing_not_required';
      providerMetadata: Record<string, unknown>;
    };

export type VerifiedWebhookStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface VerifyGatewayWebhookInput {
  payload: PaymentWebhookPayload;
}

export type VerifyGatewayWebhookResult =
  | {
      kind: 'verified';
      normalizedStatus: VerifiedWebhookStatus;
      occurredAt: Date | null;
      providerMetadata: Record<string, unknown>;
    }
  | {
      kind: 'rejected';
      reason: string;
      providerMetadata: Record<string, unknown>;
    };

export abstract class PaymentGateway {
  abstract readonly gatewayCode: ProviderCode | 'disabled';
  abstract createCharge(input: CreateGatewayChargeInput): Promise<CreateGatewayChargeResult>;
  abstract verifyWebhook(input: VerifyGatewayWebhookInput): Promise<VerifyGatewayWebhookResult>;
}
