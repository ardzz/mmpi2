import {
  AppBillingSettingsSchema,
  BillingMode,
  BillingModeSchema,
  PaymentEventSchema,
  PaymentSchema,
  type AppBillingSettings,
  type BillingMode as BillingModeType,
  type Payment,
  type PaymentEvent,
} from '@mmpi2/contracts';
import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';

@Injectable()
export class InMemoryPaymentRepository extends PaymentRepository {
  private billingSettings: AppBillingSettings = AppBillingSettingsSchema.parse({
    billingMode: BillingMode.DISABLED,
    defaultCurrency: 'IDR',
    defaultAmount: 0,
  });

  private readonly requestBillingModeSnapshots = new Map<string, BillingModeType>();
  private readonly paymentsById = new Map<string, Payment>();
  private readonly paymentIdsByProviderReference = new Map<string, string>();
  private readonly paymentIdsByRequestId = new Map<string, string[]>();
  private readonly paymentEventsByPaymentId = new Map<string, PaymentEvent[]>();
  private readonly paymentEventsByIdempotencyKey = new Map<string, PaymentEvent>();

  getBillingSettings(): AppBillingSettings {
    return this.billingSettings;
  }

  saveBillingSettings(settings: AppBillingSettings): AppBillingSettings {
    const validated = AppBillingSettingsSchema.parse(settings);
    this.billingSettings = validated;
    return validated;
  }

  saveRequestBillingModeSnapshot(requestId: string, billingMode: BillingModeType): void {
    this.requestBillingModeSnapshots.set(requestId, BillingModeSchema.parse(billingMode));
  }

  findRequestBillingModeSnapshot(requestId: string): BillingModeType | null {
    return this.requestBillingModeSnapshots.get(requestId) ?? null;
  }

  findPaymentById(paymentId: string): Payment | null {
    return this.paymentsById.get(paymentId) ?? null;
  }

  findPaymentByProviderReference(
    providerCode: Payment['providerCode'],
    providerReferenceId: string,
  ): Payment | null {
    const lookupKey = this.toProviderReferenceLookupKey(providerCode, providerReferenceId);
    const paymentId = this.paymentIdsByProviderReference.get(lookupKey);
    if (paymentId === undefined) {
      return null;
    }

    return this.findPaymentById(paymentId);
  }

  listPaymentsByRequestId(requestId: string): Payment[] {
    const paymentIds = this.paymentIdsByRequestId.get(requestId) ?? [];
    const payments = paymentIds
      .map((paymentId) => this.paymentsById.get(paymentId) ?? null)
      .filter((payment): payment is Payment => payment !== null);

    return payments.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  savePayment(payment: Payment): Payment {
    const validated = PaymentSchema.parse(payment);
    this.paymentsById.set(validated.id, validated);

    if (validated.providerReferenceId !== null) {
      const lookupKey = this.toProviderReferenceLookupKey(
        validated.providerCode,
        validated.providerReferenceId,
      );
      this.paymentIdsByProviderReference.set(lookupKey, validated.id);
    }

    const paymentIds = this.paymentIdsByRequestId.get(validated.assessmentRequestId) ?? [];
    if (!paymentIds.includes(validated.id)) {
      paymentIds.push(validated.id);
      this.paymentIdsByRequestId.set(validated.assessmentRequestId, paymentIds);
    }

    return validated;
  }

  appendPaymentEvent(event: PaymentEvent): PaymentEvent {
    const validated = PaymentEventSchema.parse(event);
    const paymentEvents = this.paymentEventsByPaymentId.get(validated.paymentId) ?? [];
    paymentEvents.push(validated);
    this.paymentEventsByPaymentId.set(validated.paymentId, paymentEvents);
    this.paymentEventsByIdempotencyKey.set(validated.idempotencyKey, validated);
    return validated;
  }

  findPaymentEventByIdempotencyKey(idempotencyKey: string): PaymentEvent | null {
    return this.paymentEventsByIdempotencyKey.get(idempotencyKey) ?? null;
  }

  listPaymentEventsByPaymentId(paymentId: string): PaymentEvent[] {
    return this.paymentEventsByPaymentId.get(paymentId) ?? [];
  }

  private toProviderReferenceLookupKey(providerCode: string, providerReferenceId: string): string {
    return `${providerCode}:${providerReferenceId}`;
  }
}
