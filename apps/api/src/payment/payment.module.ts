import { Module } from '@nestjs/common';
import { MidtransGateway } from './gateways/midtrans.gateway';
import { NullGateway } from './gateways/null.gateway';
import { XenditGateway } from './gateways/xendit.gateway';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { PrismaPaymentRepository } from './prisma-payment.repository';

@Module({
  controllers: [PaymentController],
  providers: [
    PrismaPaymentRepository,
    {
      provide: PaymentRepository,
      useExisting: PrismaPaymentRepository,
    },
    NullGateway,
    MidtransGateway,
    XenditGateway,
    PaymentService,
  ],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
