import { Module } from '@nestjs/common';
import { AuthModule } from './auth';
import { AuditModule } from './audit/audit.module';
import { AppController } from './app.controller';
import { PaymentModule } from './payment/payment.module';
import { ProfileModule } from './profile/profile.module';
import { ReportModule } from './report/report.module';
import { RequestSessionModule } from './request-session/request-session.module';
import { ScoringModule } from './scoring/scoring.module';

@Module({
  imports: [AuthModule, AuditModule, ProfileModule, PaymentModule, RequestSessionModule, ScoringModule, ReportModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
