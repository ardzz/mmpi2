import type { ReportArtifactJobPayload } from '@mmpi2/reports';

export abstract class ReportArtifactJobQueue {
  abstract enqueue(payload: ReportArtifactJobPayload): Promise<void>;
  abstract dequeue(): Promise<ReportArtifactJobPayload | null>;
  abstract size(): Promise<number>;
}
