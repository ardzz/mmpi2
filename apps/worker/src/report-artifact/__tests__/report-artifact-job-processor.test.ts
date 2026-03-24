import {
  describe,
  expect,
  it,
} from 'vitest';
import { InMemoryArtifactStorage } from '../in-memory-artifact-storage';
import { ReportArtifactJobProcessor } from '../report-artifact-job-processor';
import {
  ReportPdfRenderer,
} from '../report-pdf-renderer';
import { createReportArtifactJobPayload } from './report-artifact-fixtures';

class FakeReportPdfRenderer extends ReportPdfRenderer {
  render(): Promise<Uint8Array> {
    return Promise.resolve(Buffer.from('%PDF-fake-report'));
  }
}

describe('ReportArtifactJobProcessor', () => {
  it('renders and stores a report artifact with deterministic metadata', async () => {
    const storage = new InMemoryArtifactStorage();
    const processor = new ReportArtifactJobProcessor(storage, new FakeReportPdfRenderer());
    const payload = createReportArtifactJobPayload();

    const result = await processor.process(payload);
    const storedMetadata = await storage.getMetadata(payload.output.storageKey);

    expect(result.jobId).toBe(payload.jobId);
    expect(result.reportId).toBe(payload.source.report.id);
    expect(result.storageKey).toBe(payload.output.storageKey);
    expect(result.artifactByteLength).toBeGreaterThan(5);
    expect(result.checksumSha256).toMatch(/^[a-f0-9]{64}$/);

    expect(storedMetadata).not.toBeNull();
    expect(storedMetadata?.metadata.reportId).toBe(payload.source.report.id);
    expect(storedMetadata?.metadata.scoreResultSetId).toBe(payload.source.scoreResultSet.id);
  });
});
