import type { ReportArtifactJobResult } from '@mmpi2/reports';
import type { ReportArtifactJobProcessor } from './report-artifact-job-processor';
import type { ReportArtifactJobQueue } from './report-artifact-job-queue';

export class ReportArtifactJobRunner {
  constructor(
    private readonly queue: ReportArtifactJobQueue,
    private readonly processor: ReportArtifactJobProcessor,
  ) {}

  async processNext(): Promise<ReportArtifactJobResult | null> {
    const payload = await this.queue.dequeue();
    if (payload === null) {
      return null;
    }

    return this.processor.process(payload);
  }

  async processUntilEmpty(): Promise<ReportArtifactJobResult[]> {
    const processedResults: ReportArtifactJobResult[] = [];

    while (true) {
      const result = await this.processNext();
      if (result === null) {
        break;
      }

      processedResults.push(result);
    }

    return processedResults;
  }
}
