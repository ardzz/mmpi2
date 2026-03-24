import { Module } from '@nestjs/common';
import { PaymentModule } from '../payment/payment.module';
import { ProfileModule } from '../profile/profile.module';
import { InMemoryRequestSessionRepository } from './in-memory-request-session.repository';
import { RequestSessionController } from './request-session.controller';
import { RequestSessionRepository } from './request-session.repository';
import { RequestSessionService } from './request-session.service';

@Module({
  imports: [ProfileModule, PaymentModule],
  controllers: [RequestSessionController],
  providers: [
    InMemoryRequestSessionRepository,
    {
      provide: RequestSessionRepository,
      useExisting: InMemoryRequestSessionRepository,
    },
    RequestSessionService,
  ],
  exports: [RequestSessionService, RequestSessionRepository],
})
export class RequestSessionModule {}
