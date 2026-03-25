import {
  AssessmentRequestStatus,
  BillingMode,
  PaymentRequirement,
  PaymentStatus,
  type AssessmentRequest,
} from '@mmpi2/contracts';
import { ConflictException } from '@nestjs/common';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { MidtransGateway } from '../gateways/midtrans.gateway';
import { NullGateway } from '../gateways/null.gateway';
import { XenditGateway } from '../gateways/xendit.gateway';
import { InMemoryPaymentRepository } from '../in-memory-payment.repository';
import { PaymentService } from '../payment.service';

function createService() {
  const repository = new InMemoryPaymentRepository();
  const service = new PaymentService(
    repository,
    new NullGateway(),
    new MidtransGateway(),
    new XenditGateway(),
  );

  return {
    service,
    repository,
  };
}

function buildRequest(overrides: Partial<AssessmentRequest> = {}): AssessmentRequest {
  const now = new Date('2026-03-24T00:00:00.000Z');
  return {
    id: 'aaaa1111-1111-4111-8111-111111111111',
    patientUserId: 'bbbb2222-2222-4222-8222-222222222222',
    assessmentTypeId: 'cccc3333-3333-4333-8333-333333333333',
    status: AssessmentRequestStatus.AWAITING_PAYMENT,
    paymentRequirement: PaymentRequirement.GATEWAY_REQUIRED,
    paymentSatisfied: false,
    activePaymentId: null,
    doctorUserId: null,
    purpose: 'Billing test request',
    adminNote: null,
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('PaymentService', () => {
  it('reads and updates global billing mode settings', async () => {
    const { service } = createService();

    expect((await service.getBillingSettings()).billingMode).toBe(BillingMode.DISABLED);

    await service.updateBillingMode(BillingMode.MIDTRANS);
    expect((await service.getBillingSettings()).billingMode).toBe(BillingMode.MIDTRANS);

    await service.updateBillingMode(BillingMode.XENDIT);
    expect((await service.getBillingSettings()).billingMode).toBe(BillingMode.XENDIT);
  });

  it('snapshots billing mode per request so mode changes only affect new requests', async () => {
    const { service } = createService();
    await service.updateBillingMode(BillingMode.MIDTRANS);

    const firstRequestId = '11111111-1111-4111-8111-111111111111';
    const secondRequestId = '22222222-2222-4222-8222-222222222222';

    const firstPlan = await service.createBillingPlanForNewRequest(firstRequestId);
    expect(firstPlan.billingMode).toBe(BillingMode.MIDTRANS);
    expect(firstPlan.paymentRequirement).toBe(PaymentRequirement.GATEWAY_REQUIRED);

    await service.updateBillingMode(BillingMode.XENDIT);
    const secondPlan = await service.createBillingPlanForNewRequest(secondRequestId);
    expect(secondPlan.billingMode).toBe(BillingMode.XENDIT);

    const firstRequest = buildRequest({ id: firstRequestId });
    const secondRequest = buildRequest({ id: secondRequestId });

    const firstPayment = await service.createPaymentForRequest(firstRequest);
    const secondPayment = await service.createPaymentForRequest(secondRequest);

    expect(firstPayment.payment.providerCode).toBe('midtrans');
    expect(secondPayment.payment.providerCode).toBe('xendit');
  });

  it('keeps disabled mode honest by creating no fake payment rows', async () => {
    const { service } = createService();
    const requestId = '33333333-3333-4333-8333-333333333333';

    const plan = await service.createBillingPlanForNewRequest(requestId);
    expect(plan.paymentRequirement).toBe(PaymentRequirement.FREE);
    expect(plan.paymentSatisfied).toBe(true);

    await expect(
      service.createPaymentForRequest(
        buildRequest({
          id: requestId,
          paymentRequirement: PaymentRequirement.FREE,
          paymentSatisfied: true,
          status: AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW,
        }),
      ),
    ).rejects.toThrow(ConflictException);

    expect(await service.listPaymentsByRequestId(requestId)).toEqual([]);
  });

  it('supports manual confirmation and waiver transitions on payment records', async () => {
    const { service } = createService();
    const confirmRequestId = '44444444-4444-4444-8444-444444444444';
    const waiveRequestId = '55555555-5555-4555-8555-555555555555';

    await service.updateBillingMode(BillingMode.MIDTRANS);
    await service.createBillingPlanForNewRequest(confirmRequestId);
    await service.createBillingPlanForNewRequest(waiveRequestId);

    const createdForConfirm = await service.createPaymentForRequest(
      buildRequest({ id: confirmRequestId }),
    );
    const confirmRequest = buildRequest({
      id: confirmRequestId,
      status: AssessmentRequestStatus.PAYMENT_PENDING,
      activePaymentId: createdForConfirm.payment.id,
    });

    const confirmed = await service.confirmPaymentManually(
      confirmRequest,
      'Confirmed via admin transfer check.',
    );
    expect(confirmed.paymentStatus).toBe(PaymentStatus.PAID);
    expect(confirmed.paidAt).not.toBeNull();

    const createdForWaive = await service.createPaymentForRequest(buildRequest({ id: waiveRequestId }));
    const waiveRequest = buildRequest({
      id: waiveRequestId,
      status: AssessmentRequestStatus.PAYMENT_PENDING,
      activePaymentId: createdForWaive.payment.id,
    });

    const waived = await service.waivePayment(waiveRequest, 'Waiver granted by admin policy.');
    expect(waived?.paymentStatus).toBe(PaymentStatus.WAIVED);
  });

  it('deduplicates provider webhooks by idempotency key and keeps event log append-only', async () => {
    const { service, repository } = createService();
    await service.updateBillingMode(BillingMode.MIDTRANS);

    const requestId = '66666666-6666-4666-8666-666666666666';
    await service.createBillingPlanForNewRequest(requestId);

    const created = await service.createPaymentForRequest(buildRequest({ id: requestId }));
    const providerReferenceId = created.payment.providerReferenceId;
    expect(providerReferenceId).not.toBeNull();

    const webhookPayload = {
      providerCode: created.payment.providerCode,
      providerReferenceId: providerReferenceId ?? '',
      providerEventId: 'evt-midtrans-paid-001',
      providerStatus: 'paid',
      rawBody: '{"transaction_status":"settlement"}',
      rawSignature: 'stub-signature',
    } as const;

    const firstProcess = await service.processWebhook(webhookPayload);
    expect(firstProcess.wasDuplicate).toBe(false);
    expect(firstProcess.billingSatisfied).toBe(true);
    expect(firstProcess.payment.paymentStatus).toBe(PaymentStatus.PAID);
    expect(firstProcess.event.signatureVerified).toBe(true);
    expect(firstProcess.event.payload).toMatchObject({
      rawProviderPayload: webhookPayload,
    });

    const secondProcess = await service.processWebhook(webhookPayload);
    expect(secondProcess.wasDuplicate).toBe(true);
    expect(secondProcess.payment.paymentStatus).toBe(PaymentStatus.PAID);

    const events = await repository.listPaymentEventsByPaymentId(created.payment.id);
    expect(events).toHaveLength(2);
    expect(events.at(-1)?.idempotencyKey).toBe('midtrans:evt-midtrans-paid-001');
  });

  it('maps verified provider statuses into payment state updates without requiring session logic', async () => {
    const { service, repository } = createService();
    await service.updateBillingMode(BillingMode.XENDIT);

    const requestId = '77777777-7777-4777-8777-777777777777';
    await service.createBillingPlanForNewRequest(requestId);

    const created = await service.createPaymentForRequest(buildRequest({ id: requestId }));
    const providerReferenceId = created.payment.providerReferenceId;
    expect(providerReferenceId).not.toBeNull();

    const processingPayload = {
      providerCode: created.payment.providerCode,
      providerReferenceId: providerReferenceId ?? '',
      providerEventId: 'evt-xendit-processing-001',
      providerStatus: 'processing',
      rawBody: '{"status":"PROCESSING"}',
    } as const;

    const processingResult = await service.processWebhook(processingPayload);
    expect(processingResult.outcome).toBe('processing');
    expect(processingResult.payment.paymentStatus).toBe(PaymentStatus.PROCESSING);

    const cancelledPayload = {
      ...processingPayload,
      providerEventId: 'evt-xendit-cancelled-001',
      providerStatus: 'cancelled',
      rawBody: '{"status":"CANCELLED"}',
    } as const;

    const cancelledResult = await service.processWebhook(cancelledPayload);
    expect(cancelledResult.outcome).toBe('cancelled');
    expect(cancelledResult.payment.paymentStatus).toBe(PaymentStatus.FAILED);
    expect(cancelledResult.event.eventType).toBe('payment_cancelled');

    const events = await repository.listPaymentEventsByPaymentId(created.payment.id);
    expect(events.some((event) => event.eventType === 'payment_cancelled')).toBe(true);
  });

  it('records rejected webhook payloads without applying payment transitions', async () => {
    const { service, repository } = createService();
    await service.updateBillingMode(BillingMode.MIDTRANS);

    const requestId = '88888888-8888-4888-8888-888888888888';
    await service.createBillingPlanForNewRequest(requestId);
    const created = await service.createPaymentForRequest(buildRequest({ id: requestId }));

    const rejected = await service.processWebhook({
      providerCode: created.payment.providerCode,
      providerReferenceId: created.payment.providerReferenceId ?? '',
      providerEventId: 'evt-midtrans-invalid-signature-001',
      providerStatus: 'paid',
      rawSignature: 'invalid',
      rawBody: '{"transaction_status":"settlement"}',
    });

    expect(rejected.outcome).toBe('rejected');
    expect(rejected.billingSatisfied).toBe(false);
    expect(rejected.payment.paymentStatus).toBe(PaymentStatus.PENDING);
    expect(rejected.event.signatureVerified).toBe(false);

    const events = await repository.listPaymentEventsByPaymentId(created.payment.id);
    expect(events).toHaveLength(2);
  });
});
