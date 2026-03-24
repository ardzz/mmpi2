import type { ReportArtifactJobPayload } from '@mmpi2/reports';
import { Injectable } from '@nestjs/common';
import { ReportArtifactJobQueue } from './report-artifact-job-queue';

@Injectable()
export class InMemoryReportArtifactJobQueue extends ReportArtifactJobQueue {
  private readonly queue: ReportArtifactJobPayload[] = [];

  async enqueue(payload: ReportArtifactJobPayload): Promise<void> {
    this.queue.push(payload);
  }

  async dequeue(): Promise<ReportArtifactJobPayload | null> {
    return this.queue.shift() ?? null;
  }

  async size(): Promise<number> {
    return this.queue.length;
  }
}
