import { z } from 'zod';
import {
  BillingModeSchema,
  PaymentStatusSchema,
} from './state-machines.js';

// ---------------------------------------------------------------------------
// Re-export BillingMode from state-machines for backward compat
// ---------------------------------------------------------------------------

export { BillingMode, BillingModeSchema } from './state-machines.js';

// ---------------------------------------------------------------------------
// Payment record — blueprint ERD: PAYMENTS
// ---------------------------------------------------------------------------

export const ProviderCode = {
  MIDTRANS: 'midtrans',
  XENDIT: 'xendit',
} as const;

export type ProviderCode = (typeof ProviderCode)[keyof typeof ProviderCode];

export const ProviderCodeSchema = z.enum(['midtrans', 'xendit']);

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  assessmentRequestId: z.string().uuid(),
  providerCode: ProviderCodeSchema,
  providerReferenceId: z.string().nullable(),
  currency: z.string().length(3),
  amount: z.number().nonnegative(),
  paymentStatus: PaymentStatusSchema,
  checkoutUrl: z.string().url().nullable(),
  providerMetadata: z.record(z.unknown()).nullable(),
  expiresAt: z.coerce.date().nullable(),
  paidAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Payment = z.infer<typeof PaymentSchema>;

// ---------------------------------------------------------------------------
// Payment Event record — blueprint ERD: PAYMENT_EVENTS
// ---------------------------------------------------------------------------

export const PaymentEventSchema = z.object({
  id: z.string().uuid(),
  paymentId: z.string().uuid(),
  eventType: z.string().min(1).max(100),
  providerEventId: z.string().nullable(),
  providerStatus: z.string().nullable(),
  signatureVerified: z.boolean(),
  idempotencyKey: z.string().min(1).max(255),
  payload: z.record(z.unknown()).nullable(),
  occurredAt: z.coerce.date(),
  recordedAt: z.coerce.date(),
});

export type PaymentEvent = z.infer<typeof PaymentEventSchema>;

// ---------------------------------------------------------------------------
// Webhook payload — gateway-agnostic inbound shape
// Blueprint 7.4: payment confirmation comes from gateway callback
// ---------------------------------------------------------------------------

export const PaymentWebhookPayloadSchema = z.object({
  providerCode: ProviderCodeSchema,
  providerReferenceId: z.string().min(1),
  providerEventId: z.string().min(1),
  providerStatus: z.string().min(1),
  rawSignature: z.string().optional(),
  rawBody: z.string(),
});

export type PaymentWebhookPayload = z.infer<typeof PaymentWebhookPayloadSchema>;

// ---------------------------------------------------------------------------
// App-level billing settings — blueprint ERD: APP_SETTINGS
// ---------------------------------------------------------------------------

export const AppBillingSettingsSchema = z.object({
  billingMode: BillingModeSchema,
  defaultCurrency: z.string().length(3).default('IDR'),
  defaultAmount: z.number().nonnegative().optional(),
});

export type AppBillingSettings = z.infer<typeof AppBillingSettingsSchema>;
