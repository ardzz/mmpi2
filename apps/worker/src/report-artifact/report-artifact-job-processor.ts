import {
  ReportArtifactJobPayloadSchema,
  ReportArtifactJobResultSchema,
  buildReportCompositionData,
  type ReportArtifactJobPayload,
  type ReportArtifactJobResult,
} from '@mmpi2/reports';
import type { ArtifactStorage } from './artifact-storage';
import type { ReportPdfRenderer } from './report-pdf-renderer';

export class ReportArtifactJobProcessor {
  constructor(
    private readonly artifactStorage: ArtifactStorage,
    private readonly reportPdfRenderer: ReportPdfRenderer,
  ) {}

  async process(payload: ReportArtifactJobPayload): Promise<ReportArtifactJobResult> {
    const normalizedPayload = ReportArtifactJobPayloadSchema.parse(payload);
    const compositionData = buildReportCompositionData(normalizedPayload);
    const pdfBytes = await this.reportPdfRenderer.render(compositionData);

    const artifactMetadata = await this.artifactStorage.save({
      key: normalizedPayload.output.storageKey,
      contentType: normalizedPayload.output.contentType,
      body: pdfBytes,
      metadata: {
        jobId: normalizedPayload.jobId,
        reportId: normalizedPayload.source.report.id,
        scoreResultSetId: normalizedPayload.source.scoreResultSet.id,
        artifactType: normalizedPayload.artifactType,
      },
    });

    return ReportArtifactJobResultSchema.parse({
      jobId: normalizedPayload.jobId,
      reportId: normalizedPayload.source.report.id,
      scoreResultSetId: normalizedPayload.source.scoreResultSet.id,
      storageKey: artifactMetadata.key,
      fileName: normalizedPayload.output.fileName,
      contentType: artifactMetadata.contentType,
      artifactByteLength: artifactMetadata.byteLength,
      checksumSha256: artifactMetadata.checksumSha256,
      generatedAt: artifactMetadata.createdAt,
    });
  }
}
