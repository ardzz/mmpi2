import { Module } from '@nestjs/common';
import { ArtifactStorage } from './artifact-storage';
import { FileSystemArtifactStorage } from './filesystem-artifact-storage';
import { InMemoryReportArtifactJobQueue } from './in-memory-report-artifact-job-queue';
import { ReportArtifactJobProcessor } from './report-artifact-job-processor';
import { ReportArtifactJobQueue } from './report-artifact-job-queue';
import { ReportArtifactJobRunner } from './report-artifact-job-runner';
import { ReportArtifactService } from './report-artifact.service';
import {
  PrismaReportDocumentRegistry,
  ReportDocumentRegistry,
} from './report-document-registry';
import {
  ReactPdfReportRenderer,
  ReportPdfRenderer,
} from './report-pdf-renderer';

@Module({
  providers: [
    FileSystemArtifactStorage,
    {
      provide: ArtifactStorage,
      useExisting: FileSystemArtifactStorage,
    },
    InMemoryReportArtifactJobQueue,
    {
      provide: ReportArtifactJobQueue,
      useExisting: InMemoryReportArtifactJobQueue,
    },
    ReactPdfReportRenderer,
    {
      provide: ReportPdfRenderer,
      useExisting: ReactPdfReportRenderer,
    },
    PrismaReportDocumentRegistry,
    {
      provide: ReportDocumentRegistry,
      useExisting: PrismaReportDocumentRegistry,
    },
    {
      provide: ReportArtifactJobProcessor,
      useFactory: (
        artifactStorage: ArtifactStorage,
        reportPdfRenderer: ReportPdfRenderer,
        reportDocumentRegistry: ReportDocumentRegistry,
      ) => new ReportArtifactJobProcessor(artifactStorage, reportPdfRenderer, reportDocumentRegistry),
      inject: [ArtifactStorage, ReportPdfRenderer, ReportDocumentRegistry],
    },
    {
      provide: ReportArtifactJobRunner,
      useFactory: (
        queue: ReportArtifactJobQueue,
        processor: ReportArtifactJobProcessor,
      ) => new ReportArtifactJobRunner(queue, processor),
      inject: [ReportArtifactJobQueue, ReportArtifactJobProcessor],
    },
    {
      provide: ReportArtifactService,
      useFactory: (
        queue: ReportArtifactJobQueue,
        runner: ReportArtifactJobRunner,
      ) => new ReportArtifactService(queue, runner),
      inject: [ReportArtifactJobQueue, ReportArtifactJobRunner],
    },
  ],
  exports: [
    ArtifactStorage,
    ReportArtifactJobQueue,
    ReportPdfRenderer,
    ReportDocumentRegistry,
    ReportArtifactJobProcessor,
    ReportArtifactJobRunner,
    ReportArtifactService,
  ],
})
export class ReportArtifactModule {}
