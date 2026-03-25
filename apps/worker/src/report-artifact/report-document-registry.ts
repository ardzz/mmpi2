import type {
  ReportArtifactJobPayload,
  ReportArtifactJobResult,
} from '@mmpi2/reports';

export abstract class ReportDocumentRegistry {
  abstract persistGeneratedArtifact(
    payload: ReportArtifactJobPayload,
    result: ReportArtifactJobResult,
  ): Promise<void>;
}

export class PrismaReportDocumentRegistry extends ReportDocumentRegistry {
  async persistGeneratedArtifact(
    payload: ReportArtifactJobPayload,
    result: ReportArtifactJobResult,
  ): Promise<void> {
    const { prisma } = await import('@mmpi2/db/client');

    await prisma.reportDocument.create({
      data: {
        clinicalReportId: result.reportId,
        scoreResultSetId: result.scoreResultSetId,
        documentType: payload.artifactType,
        templateVersion: 'clinical-report-v1',
        storageKey: result.storageKey,
        fileHash: result.checksumSha256,
        generatedAt: result.generatedAt,
      },
    });
  }
}
