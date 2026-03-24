import { Module } from '@nestjs/common';
import { ReportArtifactModule } from './report-artifact/report-artifact.module';

/**
 * Worker root module.
 *
 * Report artifact job processors and storage abstraction
 * are wired here. Queue/runtime integration can be swapped later.
 */
@Module({
  imports: [ReportArtifactModule],
  providers: [],
})
export class WorkerModule {}
