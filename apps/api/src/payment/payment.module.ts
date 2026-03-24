import { Module } from '@nestjs/common';
import { MidtransGateway } from './gateways/midtrans.gateway';
import { NullGateway } from './gateways/null.gateway';
import { XenditGateway } from './gateways/xendit.gateway';
import { InMemoryPaymentRepository } from './in-memory-payment.repository';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController],
  providers: [
    InMemoryPaymentRepository,
    {
      provide: PaymentRepository,
      useExisting: InMemoryPaymentRepository,
    },
    NullGateway,
    MidtransGateway,
    XenditGateway,
    PaymentService,
  ],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
