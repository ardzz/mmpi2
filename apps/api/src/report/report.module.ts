import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module';
import { RequestSessionModule } from '../request-session/request-session.module';
import { ScoringModule } from '../scoring/scoring.module';
import { PrismaReportRepository } from './prisma-report.repository';
import { ReportController } from './report.controller';
import { ReportRepository } from './report.repository';
import { ReportService } from './report.service';

@Module({
  imports: [ProfileModule, RequestSessionModule, ScoringModule],
  controllers: [ReportController],
  providers: [
    PrismaReportRepository,
    {
      provide: ReportRepository,
      useExisting: PrismaReportRepository,
    },
    ReportService,
  ],
  exports: [ReportService],
})
export class ReportModule {}
