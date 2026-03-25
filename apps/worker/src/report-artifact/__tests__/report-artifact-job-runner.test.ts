import {
  describe,
  expect,
  it,
} from 'vitest';
import { InMemoryArtifactStorage } from '../in-memory-artifact-storage';
import { InMemoryReportArtifactJobQueue } from '../in-memory-report-artifact-job-queue';
import { ReportArtifactJobProcessor } from '../report-artifact-job-processor';
import { ReportArtifactJobRunner } from '../report-artifact-job-runner';
import { ReportDocumentRegistry } from '../report-document-registry';
import { ReportArtifactService } from '../report-artifact.service';
import { ReportPdfRenderer } from '../report-pdf-renderer';
import { createReportArtifactJobPayload } from './report-artifact-fixtures';

class FakeReportPdfRenderer extends ReportPdfRenderer {
  render(): Promise<Uint8Array> {
    return Promise.resolve(Buffer.from('%PDF-runner-flow'));
  }
}

class NoopReportDocumentRegistry extends ReportDocumentRegistry {
  async persistGeneratedArtifact(): Promise<void> {
    return Promise.resolve();
  }
}

describe('ReportArtifactService and ReportArtifactJobRunner', () => {
  it('processes queued jobs asynchronously through queue -> processor -> storage', async () => {
    const queue = new InMemoryReportArtifactJobQueue();
    const storage = new InMemoryArtifactStorage();
    const processor = new ReportArtifactJobProcessor(
      storage,
      new FakeReportPdfRenderer(),
      new NoopReportDocumentRegistry(),
    );
    const runner = new ReportArtifactJobRunner(queue, processor);
    const service = new ReportArtifactService(queue, runner);

    const firstPayload = createReportArtifactJobPayload();
    const secondPayload = createReportArtifactJobPayload({
      jobId: '4fd740f2-472d-435c-9261-b58fd58be173',
      output: {
        storageKey: 'reports/second-report.pdf',
        fileName: 'mmpi2-report-second.pdf',
        contentType: 'application/pdf',
      },
    });

    await service.enqueue(firstPayload);
    await service.enqueue(secondPayload);

    expect(await service.pendingCount()).toBe(2);

    const processedResults = await service.processAllPending();

    expect(processedResults).toHaveLength(2);
    expect(processedResults.map((result) => result.jobId)).toEqual([
      firstPayload.jobId,
      secondPayload.jobId,
    ]);
    expect(await service.pendingCount()).toBe(0);
    expect(await storage.getMetadata(firstPayload.output.storageKey)).not.toBeNull();
    expect(await storage.getMetadata(secondPayload.output.storageKey)).not.toBeNull();
  });
});
