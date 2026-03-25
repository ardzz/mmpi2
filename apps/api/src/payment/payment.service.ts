import { randomUUID } from 'node:crypto';
import {
  AssessmentRequestStatus,
  BillingMode,
  PaymentRequirement,
  PaymentStatus,
  ProviderCode,
  type PaymentEvent,
  type PaymentWebhookPayload,
  canTransitionPayment,
  type AssessmentRequest,
  type AppBillingSettings,
  type BillingMode as BillingModeType,
  type Payment,
} from '@mmpi2/contracts';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MidtransGateway } from './gateways/midtrans.gateway';
import { NullGateway } from './gateways/null.gateway';
import { XenditGateway } from './gateways/xendit.gateway';
import type { PaymentGateway } from './payment-gateway';
import { PaymentRepository } from './payment.repository';

export interface RequestBillingPlan {
  billingMode: BillingModeType;
  paymentRequirement: AssessmentRequest['paymentRequirement'];
  paymentSatisfied: boolean;
  initialRequestStatus: AssessmentRequest['status'];
}

export interface RequestPaymentCreationResult {
  payment: Payment;
  requestStatus: AssessmentRequest['status'];
}

export interface ProcessPaymentWebhookResult {
  payment: Payment;
  event: PaymentEvent;
  requestId: string;
  wasDuplicate: boolean;
  outcome: 'pending' | 'processing' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'rejected';
  billingSatisfied: boolean;
}

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PaymentRepository)
    private readonly repository: PaymentRepository,
    @Inject(NullGateway)
    private readonly nullGateway: NullGateway,
    @Inject(MidtransGateway)
    private readonly midtransGateway: MidtransGateway,
    @Inject(XenditGateway)
    private readonly xenditGateway: XenditGateway,
  ) {}

  async getBillingSettings(): Promise<AppBillingSettings> {
    return this.repository.getBillingSettings();
  }

  async updateBillingMode(billingMode: BillingModeType): Promise<AppBillingSettings> {
    const currentSettings = await this.repository.getBillingSettings();
    return this.repository.saveBillingSettings({
      ...currentSettings,
      billingMode,
    });
  }

  async createBillingPlanForNewRequest(requestId: string): Promise<RequestBillingPlan> {
    const { billingMode } = await this.repository.getBillingSettings();
    await this.repository.saveRequestBillingModeSnapshot(requestId, billingMode);

    if (billingMode === BillingMode.DISABLED) {
      return {
        billingMode,
        paymentRequirement: PaymentRequirement.FREE,
        paymentSatisfied: true,
        initialRequestStatus: AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW,
      };
    }

    return {
      billingMode,
      paymentRequirement: PaymentRequirement.GATEWAY_REQUIRED,
      paymentSatisfied: false,
      initialRequestStatus: AssessmentRequestStatus.AWAITING_PAYMENT,
    };
  }

  async saveRequestBillingModeSnapshot(requestId: string, billingMode: BillingModeType): Promise<void> {
    await this.repository.saveRequestBillingModeSnapshot(requestId, billingMode);
  }

  async createPaymentForRequest(request: AssessmentRequest): Promise<RequestPaymentCreationResult> {
    if (request.paymentRequirement !== PaymentRequirement.GATEWAY_REQUIRED) {
      throw new ConflictException('This request does not require a gateway payment.');
    }

    if (request.paymentSatisfied) {
      throw new ConflictException('Payment is already satisfied for this request.');
    }

    if (
      request.status !== AssessmentRequestStatus.AWAITING_PAYMENT &&
      request.status !== AssessmentRequestStatus.PAYMENT_PENDING
    ) {
      throw new ConflictException(
        `Cannot create payment for request in status '${request.status}'.`,
      );
    }

    const billingMode = await this.getOrInferRequestBillingMode(request.id);
    const gateway = this.selectGateway(billingMode);
    const currentSettings = await this.repository.getBillingSettings();

    const existingPendingPayment = request.activePaymentId
      ? await this.repository.findPaymentById(request.activePaymentId)
      : null;

    if (
      existingPendingPayment !== null &&
      (existingPendingPayment.paymentStatus === PaymentStatus.PENDING ||
        existingPendingPayment.paymentStatus === PaymentStatus.PROCESSING)
    ) {
      throw new ConflictException('An active pending payment already exists for this request.');
    }

    const paymentId = randomUUID();
    const now = new Date();
    const gatewayResult = await gateway.createCharge({
      paymentId,
      assessmentRequestId: request.id,
      amount: currentSettings.defaultAmount ?? 0,
      currency: currentSettings.defaultCurrency,
    });

    if (gatewayResult.kind === 'billing_not_required') {
      throw new ConflictException('Billing is disabled for this request snapshot. No payment row is created.');
    }

    const payment = await this.repository.savePayment({
      id: paymentId,
      assessmentRequestId: request.id,
      providerCode: gatewayResult.providerCode,
      providerReferenceId: gatewayResult.providerReferenceId,
      currency: currentSettings.defaultCurrency,
      amount: currentSettings.defaultAmount ?? 0,
      paymentStatus: PaymentStatus.PENDING,
      checkoutUrl: gatewayResult.checkoutUrl,
      providerMetadata: gatewayResult.providerMetadata,
      expiresAt: gatewayResult.expiresAt,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await this.repository.appendPaymentEvent({
      id: randomUUID(),
      paymentId: payment.id,
      eventType: 'charge_created',
      providerEventId: null,
      providerStatus: payment.paymentStatus,
      signatureVerified: true,
      idempotencyKey: `payment-create-${payment.id}`,
      payload: {
        providerReferenceId: payment.providerReferenceId,
        checkoutUrl: payment.checkoutUrl,
      },
      occurredAt: now,
      recordedAt: now,
    });

    return {
      payment,
      requestStatus: AssessmentRequestStatus.PAYMENT_PENDING,
    };
  }

  async confirmPaymentManually(request: AssessmentRequest, adminNote: string | null): Promise<Payment> {
    if (request.activePaymentId === null) {
      throw new ConflictException('Cannot manually confirm payment without an active payment record.');
    }

    const payment = await this.repository.findPaymentById(request.activePaymentId);
    if (payment === null) {
      throw new NotFoundException(`Payment '${request.activePaymentId}' was not found.`);
    }

    if (payment.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('Payment is already marked as paid.');
    }

    const isManualConfirmOverrideAllowed = payment.paymentStatus === PaymentStatus.PENDING;
    if (!isManualConfirmOverrideAllowed && !canTransitionPayment(payment.paymentStatus, PaymentStatus.PAID)) {
      throw new ConflictException(
        `Cannot transition payment from '${payment.paymentStatus}' to 'paid'.`,
      );
    }

    const now = new Date();
    const confirmedPayment = await this.repository.savePayment({
      ...payment,
      paymentStatus: PaymentStatus.PAID,
      paidAt: now,
      updatedAt: now,
    });

    await this.repository.appendPaymentEvent({
      id: randomUUID(),
      paymentId: confirmedPayment.id,
      eventType: 'manual_confirmation',
      providerEventId: null,
      providerStatus: confirmedPayment.paymentStatus,
      signatureVerified: true,
      idempotencyKey: `manual-confirm-${confirmedPayment.id}-${now.toISOString()}`,
      payload: {
        adminNote,
      },
      occurredAt: now,
      recordedAt: now,
    });

    return confirmedPayment;
  }

  async waivePayment(request: AssessmentRequest, adminNote: string | null): Promise<Payment | null> {
    if (request.activePaymentId === null) {
      return null;
    }

    const payment = await this.repository.findPaymentById(request.activePaymentId);
    if (payment === null) {
      throw new NotFoundException(`Payment '${request.activePaymentId}' was not found.`);
    }

    if (payment.paymentStatus === PaymentStatus.WAIVED) {
      return payment;
    }

    const isManualWaiveOverrideAllowed = payment.paymentStatus === PaymentStatus.PROCESSING;
    if (!isManualWaiveOverrideAllowed && !canTransitionPayment(payment.paymentStatus, PaymentStatus.WAIVED)) {
      throw new ConflictException(
        `Cannot transition payment from '${payment.paymentStatus}' to 'waived'.`,
      );
    }

    const now = new Date();
    const waivedPayment = await this.repository.savePayment({
      ...payment,
      paymentStatus: PaymentStatus.WAIVED,
      updatedAt: now,
    });

    await this.repository.appendPaymentEvent({
      id: randomUUID(),
      paymentId: waivedPayment.id,
      eventType: 'payment_waived',
      providerEventId: null,
      providerStatus: waivedPayment.paymentStatus,
      signatureVerified: true,
      idempotencyKey: `manual-waive-${waivedPayment.id}-${now.toISOString()}`,
      payload: {
        adminNote,
      },
      occurredAt: now,
      recordedAt: now,
    });

    return waivedPayment;
  }

  async listPaymentsByRequestId(requestId: string): Promise<Payment[]> {
    return this.repository.listPaymentsByRequestId(requestId);
  }

  async processWebhook(payload: PaymentWebhookPayload): Promise<ProcessPaymentWebhookResult> {
    const idempotencyKey = this.toWebhookIdempotencyKey(payload);
    const existingEvent = await this.repository.findPaymentEventByIdempotencyKey(idempotencyKey);

    if (existingEvent !== null) {
      const existingPayment = await this.repository.findPaymentById(existingEvent.paymentId);
      if (existingPayment === null) {
        throw new NotFoundException(`Payment '${existingEvent.paymentId}' was not found.`);
      }

      return {
        payment: existingPayment,
        event: existingEvent,
        requestId: existingPayment.assessmentRequestId,
        wasDuplicate: true,
        outcome: this.toOutcomeFromProviderStatus(existingEvent.providerStatus),
        billingSatisfied: existingPayment.paymentStatus === PaymentStatus.PAID,
      };
    }

    const payment = await this.repository.findPaymentByProviderReference(
      payload.providerCode,
      payload.providerReferenceId,
    );
    if (payment === null) {
      throw new NotFoundException(
        `Payment with provider reference '${payload.providerCode}:${payload.providerReferenceId}' was not found.`,
      );
    }

    const gateway = this.selectGatewayByProviderCode(payload.providerCode);
    const verification = await gateway.verifyWebhook({
      payload,
    });

    const now = new Date();
    let nextPayment = payment;
    let outcome: ProcessPaymentWebhookResult['outcome'];
    let eventType = 'provider_status_confirmed';
    let transitionApplied = false;
    let transitionSkipReason: string | null = null;

    if (verification.kind === 'rejected') {
      outcome = 'rejected';
      eventType = 'provider_webhook_received';
      transitionSkipReason = verification.reason;
    } else {
      outcome = verification.normalizedStatus;
      const mapped = this.mapVerifiedStatusToPaymentMutation(verification.normalizedStatus);
      eventType = mapped.eventType;

      if (payment.paymentStatus !== mapped.nextPaymentStatus) {
        const isWebhookPaidOverrideAllowed =
          payment.paymentStatus === PaymentStatus.PENDING &&
          mapped.nextPaymentStatus === PaymentStatus.PAID;

        if (
          !isWebhookPaidOverrideAllowed &&
          !canTransitionPayment(payment.paymentStatus, mapped.nextPaymentStatus)
        ) {
          transitionSkipReason =
            `Cannot transition payment from '${payment.paymentStatus}' to '${mapped.nextPaymentStatus}'.`;
        } else {
          nextPayment = await this.repository.savePayment({
            ...payment,
            paymentStatus: mapped.nextPaymentStatus,
            paidAt:
              mapped.nextPaymentStatus === PaymentStatus.PAID
                ? payment.paidAt ?? now
                : payment.paidAt,
            updatedAt: now,
          });
          transitionApplied = true;
        }
      } else {
        transitionSkipReason = 'Payment is already in the target status.';
      }
    }

    const recordedEvent = await this.repository.appendPaymentEvent({
      id: randomUUID(),
      paymentId: payment.id,
      eventType,
      providerEventId: payload.providerEventId,
      providerStatus: payload.providerStatus,
      signatureVerified: verification.kind === 'verified',
      idempotencyKey,
      payload: {
        rawProviderPayload: payload,
        verification,
        transition: {
          fromStatus: payment.paymentStatus,
          toStatus: nextPayment.paymentStatus,
          applied: transitionApplied,
          skipReason: transitionSkipReason,
        },
      },
      occurredAt: verification.kind === 'verified' ? verification.occurredAt ?? now : now,
      recordedAt: now,
    });

    return {
      payment: nextPayment,
      event: recordedEvent,
      requestId: nextPayment.assessmentRequestId,
      wasDuplicate: false,
      outcome,
      billingSatisfied: nextPayment.paymentStatus === PaymentStatus.PAID,
    };
  }

  private async getOrInferRequestBillingMode(requestId: string): Promise<BillingModeType> {
    const existingSnapshot = await this.repository.findRequestBillingModeSnapshot(requestId);
    if (existingSnapshot !== null) {
      return existingSnapshot;
    }

    const fallbackBillingMode = (await this.repository.getBillingSettings()).billingMode;
    await this.repository.saveRequestBillingModeSnapshot(requestId, fallbackBillingMode);
    return fallbackBillingMode;
  }

  private selectGateway(mode: BillingModeType): PaymentGateway {
    switch (mode) {
      case BillingMode.DISABLED:
        return this.nullGateway;
      case BillingMode.MIDTRANS:
        return this.midtransGateway;
      case BillingMode.XENDIT:
        return this.xenditGateway;
      default:
        throw new ConflictException(`Unsupported billing mode '${mode}'.`);
    }
  }

  private selectGatewayByProviderCode(providerCode: ProviderCode): PaymentGateway {
    switch (providerCode) {
      case ProviderCode.MIDTRANS:
        return this.midtransGateway;
      case ProviderCode.XENDIT:
        return this.xenditGateway;
      default:
        throw new ConflictException(`Unsupported provider code '${providerCode}'.`);
    }
  }

  private toWebhookIdempotencyKey(payload: PaymentWebhookPayload): string {
    return `${payload.providerCode}:${payload.providerEventId}`;
  }

  private mapVerifiedStatusToPaymentMutation(
    status: Exclude<ProcessPaymentWebhookResult['outcome'], 'rejected'>,
  ): {
    nextPaymentStatus: PaymentStatus;
    eventType: string;
  } {
    switch (status) {
      case 'pending':
        return {
          nextPaymentStatus: PaymentStatus.PENDING,
          eventType: 'provider_status_confirmed',
        };
      case 'processing':
        return {
          nextPaymentStatus: PaymentStatus.PROCESSING,
          eventType: 'provider_status_confirmed',
        };
      case 'paid':
        return {
          nextPaymentStatus: PaymentStatus.PAID,
          eventType: 'provider_status_confirmed',
        };
      case 'failed':
        return {
          nextPaymentStatus: PaymentStatus.FAILED,
          eventType: 'payment_failed',
        };
      case 'expired':
        return {
          nextPaymentStatus: PaymentStatus.EXPIRED,
          eventType: 'payment_expired',
        };
      case 'cancelled':
        return {
          nextPaymentStatus: PaymentStatus.FAILED,
          eventType: 'payment_cancelled',
        };
      default:
        return {
          nextPaymentStatus: PaymentStatus.FAILED,
          eventType: 'payment_failed',
        };
    }
  }

  private toOutcomeFromProviderStatus(providerStatus: string | null): ProcessPaymentWebhookResult['outcome'] {
    const normalized = providerStatus?.trim().toLowerCase() ?? '';

    if (normalized === 'paid' || normalized === 'settlement' || normalized === 'succeeded') {
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

    if (normalized.length > 0) {
      return 'failed';
    }

    return 'rejected';
  }
}
