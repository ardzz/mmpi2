import type {
  AppBillingSettings,
  BillingMode,
  Payment,
  PaymentEvent,
} from '@mmpi2/contracts';

export abstract class PaymentRepository {
  abstract getBillingSettings(): Promise<AppBillingSettings>;
  abstract saveBillingSettings(settings: AppBillingSettings): Promise<AppBillingSettings>;

  abstract saveRequestBillingModeSnapshot(requestId: string, billingMode: BillingMode): Promise<void>;
  abstract findRequestBillingModeSnapshot(requestId: string): Promise<BillingMode | null>;

  abstract findPaymentById(paymentId: string): Promise<Payment | null>;
  abstract findPaymentByProviderReference(
    providerCode: Payment['providerCode'],
    providerReferenceId: string,
  ): Promise<Payment | null>;
  abstract listPaymentsByRequestId(requestId: string): Promise<Payment[]>;
  abstract savePayment(payment: Payment): Promise<Payment>;

  abstract appendPaymentEvent(event: PaymentEvent): Promise<PaymentEvent>;
  abstract findPaymentEventByIdempotencyKey(idempotencyKey: string): Promise<PaymentEvent | null>;
  abstract listPaymentEventsByPaymentId(paymentId: string): Promise<PaymentEvent[]>;
}
