import {
  AppBillingSettingsSchema,
  BillingModeSchema,
  PaymentEventSchema,
  PaymentSchema,
  type AppBillingSettings,
  type BillingMode,
  type Payment,
  type PaymentEvent,
} from '@mmpi2/contracts';
import { prisma } from '@mmpi2/db/client';
import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';

const APP_SETTINGS_SINGLETON_ID = '00000000-0000-4000-8000-000000000001';

type DecimalLike = {
  toNumber(): number;
};

type AppSettingsRow = {
  billingMode: string;
  defaultCurrency: string;
  defaultAmount: DecimalLike | number | string | null;
};

type PaymentRow = {
  id: string;
  assessmentRequestId: string;
  providerCode: string;
  providerReferenceId: string | null;
  currency: string;
  amount: DecimalLike | number | string;
  status: string;
  checkoutUrl: string | null;
  providerMetadata: unknown;
  expiresAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PaymentEventRow = {
  id: string;
  paymentId: string;
  eventType: string;
  providerEventId: string | null;
  providerStatus: string | null;
  signatureVerified: boolean;
  idempotencyKey: string;
  payload: unknown;
  occurredAt: Date;
  recordedAt: Date;
};

@Injectable()
export class PrismaPaymentRepository extends PaymentRepository {
  async getBillingSettings(): Promise<AppBillingSettings> {
    const row = await prisma.appSettings.findUnique({
      where: { id: APP_SETTINGS_SINGLETON_ID },
    });

    if (row === null) {
      return AppBillingSettingsSchema.parse({
        billingMode: 'disabled',
        defaultCurrency: 'IDR',
        defaultAmount: 0,
      });
    }

    return this.toAppBillingSettingsContract(row as AppSettingsRow);
  }

  async saveBillingSettings(settings: AppBillingSettings): Promise<AppBillingSettings> {
    const validated = AppBillingSettingsSchema.parse(settings);

    const row = await prisma.appSettings.upsert({
      where: { id: APP_SETTINGS_SINGLETON_ID },
      create: {
        id: APP_SETTINGS_SINGLETON_ID,
        billingMode: validated.billingMode,
        defaultCurrency: validated.defaultCurrency,
        defaultAmount: validated.defaultAmount ?? null,
      },
      update: {
        billingMode: validated.billingMode,
        defaultCurrency: validated.defaultCurrency,
        defaultAmount: validated.defaultAmount ?? null,
      },
    });

    return this.toAppBillingSettingsContract(row as AppSettingsRow);
  }

  async saveRequestBillingModeSnapshot(requestId: string, billingMode: BillingMode): Promise<void> {
    const validatedBillingMode = BillingModeSchema.parse(billingMode);

    await prisma.assessmentRequest.updateMany({
      where: { id: requestId },
      data: {
        billingModeSnapshot: validatedBillingMode,
      },
    });
  }

  async findRequestBillingModeSnapshot(requestId: string): Promise<BillingMode | null> {
    const row = await prisma.assessmentRequest.findUnique({
      where: { id: requestId },
      select: { billingModeSnapshot: true },
    });

    if (row === null || row.billingModeSnapshot === null) {
      return null;
    }

    return BillingModeSchema.parse(row.billingModeSnapshot);
  }

  async findPaymentById(paymentId: string): Promise<Payment | null> {
    const row = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (row === null) {
      return null;
    }

    return this.toPaymentContract(row as PaymentRow);
  }

  async findPaymentByProviderReference(
    providerCode: Payment['providerCode'],
    providerReferenceId: string,
  ): Promise<Payment | null> {
    const row = await prisma.payment.findFirst({
      where: {
        providerCode,
        providerReferenceId,
      },
    });

    if (row === null) {
      return null;
    }

    return this.toPaymentContract(row as PaymentRow);
  }

  async listPaymentsByRequestId(requestId: string): Promise<Payment[]> {
    const rows = await prisma.payment.findMany({
      where: {
        assessmentRequestId: requestId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return (rows as PaymentRow[]).map((row) => this.toPaymentContract(row));
  }

  async savePayment(payment: Payment): Promise<Payment> {
    const validated = PaymentSchema.parse(payment);

    const row = await prisma.payment.upsert({
      where: { id: validated.id },
      create: {
        id: validated.id,
        assessmentRequestId: validated.assessmentRequestId,
        providerCode: validated.providerCode,
        providerReferenceId: validated.providerReferenceId,
        currency: validated.currency,
        amount: validated.amount,
        status: validated.paymentStatus,
        checkoutUrl: validated.checkoutUrl,
        providerMetadata: validated.providerMetadata ?? undefined,
        expiresAt: validated.expiresAt,
        paidAt: validated.paidAt,
        createdAt: validated.createdAt,
        updatedAt: validated.updatedAt,
      },
      update: {
        assessmentRequestId: validated.assessmentRequestId,
        providerCode: validated.providerCode,
        providerReferenceId: validated.providerReferenceId,
        currency: validated.currency,
        amount: validated.amount,
        status: validated.paymentStatus,
        checkoutUrl: validated.checkoutUrl,
        providerMetadata: validated.providerMetadata ?? undefined,
        expiresAt: validated.expiresAt,
        paidAt: validated.paidAt,
        updatedAt: validated.updatedAt,
      },
    });

    return this.toPaymentContract(row as PaymentRow);
  }

  async appendPaymentEvent(event: PaymentEvent): Promise<PaymentEvent> {
    const validated = PaymentEventSchema.parse(event);

    const row = await prisma.paymentEvent.create({
      data: {
        id: validated.id,
        paymentId: validated.paymentId,
        eventType: validated.eventType,
        providerEventId: validated.providerEventId,
        providerStatus: validated.providerStatus,
        signatureVerified: validated.signatureVerified,
        idempotencyKey: validated.idempotencyKey,
        payload: validated.payload ?? undefined,
        occurredAt: validated.occurredAt,
        recordedAt: validated.recordedAt,
      },
    });

    return this.toPaymentEventContract(row as PaymentEventRow);
  }

  async findPaymentEventByIdempotencyKey(idempotencyKey: string): Promise<PaymentEvent | null> {
    const row = await prisma.paymentEvent.findUnique({
      where: { idempotencyKey },
    });

    if (row === null) {
      return null;
    }

    return this.toPaymentEventContract(row as PaymentEventRow);
  }

  async listPaymentEventsByPaymentId(paymentId: string): Promise<PaymentEvent[]> {
    const rows = await prisma.paymentEvent.findMany({
      where: { paymentId },
      orderBy: { recordedAt: 'asc' },
    });

    return (rows as PaymentEventRow[]).map((row) => this.toPaymentEventContract(row));
  }

  private toAppBillingSettingsContract(row: AppSettingsRow): AppBillingSettings {
    return AppBillingSettingsSchema.parse({
      billingMode: row.billingMode,
      defaultCurrency: row.defaultCurrency,
      defaultAmount:
        row.defaultAmount === null
          ? undefined
          : this.toNumber(row.defaultAmount),
    });
  }

  private toPaymentContract(row: PaymentRow): Payment {
    return PaymentSchema.parse({
      id: row.id,
      assessmentRequestId: row.assessmentRequestId,
      providerCode: row.providerCode,
      providerReferenceId: row.providerReferenceId,
      currency: row.currency,
      amount: this.toNumber(row.amount),
      paymentStatus: row.status,
      checkoutUrl: row.checkoutUrl,
      providerMetadata: this.toRecordOrNull(row.providerMetadata),
      expiresAt: row.expiresAt,
      paidAt: row.paidAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toPaymentEventContract(row: PaymentEventRow): PaymentEvent {
    return PaymentEventSchema.parse({
      id: row.id,
      paymentId: row.paymentId,
      eventType: row.eventType,
      providerEventId: row.providerEventId,
      providerStatus: row.providerStatus,
      signatureVerified: row.signatureVerified,
      idempotencyKey: row.idempotencyKey,
      payload: this.toRecordOrNull(row.payload),
      occurredAt: row.occurredAt,
      recordedAt: row.recordedAt,
    });
  }

  private toNumber(value: DecimalLike | number | string): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      return Number(value);
    }

    return value.toNumber();
  }

  private toRecordOrNull(value: unknown): Record<string, unknown> | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }
}
