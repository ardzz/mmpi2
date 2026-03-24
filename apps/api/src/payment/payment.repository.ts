import type {
  AppBillingSettings,
  BillingMode,
  Payment,
  PaymentEvent,
} from '@mmpi2/contracts';

export abstract class PaymentRepository {
  abstract getBillingSettings(): AppBillingSettings;
  abstract saveBillingSettings(settings: AppBillingSettings): AppBillingSettings;

  abstract saveRequestBillingModeSnapshot(requestId: string, billingMode: BillingMode): void;
  abstract findRequestBillingModeSnapshot(requestId: string): BillingMode | null;

  abstract findPaymentById(paymentId: string): Payment | null;
  abstract findPaymentByProviderReference(
    providerCode: Payment['providerCode'],
    providerReferenceId: string,
  ): Payment | null;
  abstract listPaymentsByRequestId(requestId: string): Payment[];
  abstract savePayment(payment: Payment): Payment;

  abstract appendPaymentEvent(event: PaymentEvent): PaymentEvent;
  abstract findPaymentEventByIdempotencyKey(idempotencyKey: string): PaymentEvent | null;
  abstract listPaymentEventsByPaymentId(paymentId: string): PaymentEvent[];
}
