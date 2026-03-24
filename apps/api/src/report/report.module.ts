import { Module } from '@nestjs/common';
import { ScoringModule } from '../scoring/scoring.module';
import { InMemoryReportRepository } from './in-memory-report.repository';
import { ReportController } from './report.controller';
import { ReportRepository } from './report.repository';
import { ReportService } from './report.service';

@Module({
  imports: [ScoringModule],
  controllers: [ReportController],
  providers: [
    InMemoryReportRepository,
    {
      provide: ReportRepository,
      useExisting: InMemoryReportRepository,
    },
    ReportService,
  ],
  exports: [ReportService],
})
export class ReportModule {}
