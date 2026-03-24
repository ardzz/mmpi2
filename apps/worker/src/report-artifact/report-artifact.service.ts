import {
  ReportArtifactJobPayloadSchema,
  type ReportArtifactJobPayload,
  type ReportArtifactJobResult,
} from '@mmpi2/reports';
import type { ReportArtifactJobQueue } from './report-artifact-job-queue';
import type { ReportArtifactJobRunner } from './report-artifact-job-runner';

export class ReportArtifactService {
  constructor(
    private readonly queue: ReportArtifactJobQueue,
    private readonly runner: ReportArtifactJobRunner,
  ) {}

  async enqueue(payload: ReportArtifactJobPayload): Promise<void> {
    const normalizedPayload = ReportArtifactJobPayloadSchema.parse(payload);
    await this.queue.enqueue(normalizedPayload);
  }

  async processNext(): Promise<ReportArtifactJobResult | null> {
    return this.runner.processNext();
  }

  async processAllPending(): Promise<ReportArtifactJobResult[]> {
    return this.runner.processUntilEmpty();
  }

  async pendingCount(): Promise<number> {
    return this.queue.size();
  }
}
