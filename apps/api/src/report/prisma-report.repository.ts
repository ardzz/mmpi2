import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, normalize, resolve } from 'node:path';
import {
  ClinicalReportSchema,
  PatientDocumentDownloadSchema,
  ReportSignatureSchema,
  type ClinicalReport,
  type PatientDocumentDownload,
  type ReportSignature,
} from '@mmpi2/contracts';
import { prisma } from '@mmpi2/db/client';
import { Injectable } from '@nestjs/common';
import { ReportRepository } from './report.repository';

// ---------------------------------------------------------------------------
// Prisma row type aliases — kept narrow so mapping stays explicit.
// ---------------------------------------------------------------------------

type ClinicalReportRow = {
  id: string;
  scoreResultSetId: string;
  authoredByUserId: string;
  reportStatus: string;
  interpretationSummary: string | null;
  narrative: string | null;
  recommendations: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  scoreResultSet: { examSessionId: string };
  amendments: Array<{ amendedFromReportId: string }>;
};

type ReportSignatureRow = {
  id: string;
  clinicalReportId: string;
  storageKey: string;
  signedAt: Date;
};

type ReportDocumentRow = {
  id: string;
  clinicalReportId: string;
  documentType: string;
  storageKey: string;
  fileHash: string;
  generatedAt: Date;
};

type PersistedArtifactMetadata = {
  key: string;
  contentType: string;
  byteLength: number;
  checksumSha256: string;
  createdAt: string;
  metadata: Record<string, string>;
};

// Shared include clause for ClinicalReport queries.
const REPORT_INCLUDE = {
  scoreResultSet: { select: { examSessionId: true } },
  amendments: {
    select: { amendedFromReportId: true },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

@Injectable()
export class PrismaReportRepository extends ReportRepository {
  // ---- Reports ------------------------------------------------------------

  async createReport(report: ClinicalReport): Promise<ClinicalReport> {
    const supplementalJson = report.supplementalObservations
      ? JSON.stringify(report.supplementalObservations)
      : null;

    await prisma.clinicalReport.create({
      data: {
        id: report.id,
        scoreResultSetId: report.scoreResultSetId,
        authoredByUserId: report.authorUserId,
        reportStatus: report.reportStatus,
        interpretationSummary: report.interpretationSummary,
        narrative: report.narrative,
        recommendations: supplementalJson,
        publishedAt: report.publishedAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
      include: REPORT_INCLUDE,
    });

    // If this report is an amendment, create the amendment join record.
    if (report.amendedFromId !== null) {
      await prisma.clinicalReportAmendment.create({
        data: {
          clinicalReportId: report.id,
          amendedFromReportId: report.amendedFromId,
          amendmentReason: 'Amendment created via report workflow.',
        },
      });
    }

    const persistedReport = await prisma.clinicalReport.findUniqueOrThrow({
      where: { id: report.id },
      include: REPORT_INCLUDE,
    });

    return this.toReportContract(persistedReport as unknown as ClinicalReportRow);
  }

  async saveReport(report: ClinicalReport): Promise<ClinicalReport> {
    const supplementalJson = report.supplementalObservations
      ? JSON.stringify(report.supplementalObservations)
      : null;

    const row = await prisma.clinicalReport.update({
      where: { id: report.id },
      data: {
        reportStatus: report.reportStatus,
        interpretationSummary: report.interpretationSummary,
        narrative: report.narrative,
        recommendations: supplementalJson,
        publishedAt: report.publishedAt,
        updatedAt: report.updatedAt,
      },
      include: REPORT_INCLUDE,
    });

    return this.toReportContract(row as unknown as ClinicalReportRow);
  }

  async findReportById(reportId: string): Promise<ClinicalReport | null> {
    const row = await prisma.clinicalReport.findUnique({
      where: { id: reportId },
      include: REPORT_INCLUDE,
    });

    if (row === null) {
      return null;
    }

    return this.toReportContract(row as unknown as ClinicalReportRow);
  }

  async findLatestReportBySessionId(sessionId: string): Promise<ClinicalReport | null> {
    // ClinicalReport links to session through scoreResultSet.examSessionId.
    const row = await prisma.clinicalReport.findFirst({
      where: {
        scoreResultSet: { examSessionId: sessionId },
      },
      orderBy: { createdAt: 'desc' },
      include: REPORT_INCLUDE,
    });

    if (row === null) {
      return null;
    }

    return this.toReportContract(row as unknown as ClinicalReportRow);
  }

  async listReportsBySessionId(sessionId: string): Promise<ClinicalReport[]> {
    const rows = await prisma.clinicalReport.findMany({
      where: {
        scoreResultSet: { examSessionId: sessionId },
      },
      orderBy: { createdAt: 'asc' },
      include: REPORT_INCLUDE,
    });

    return rows.map((row: unknown) => this.toReportContract(row as ClinicalReportRow));
  }

  async listPublishedReports(): Promise<ClinicalReport[]> {
    const rows = await prisma.clinicalReport.findMany({
      where: { reportStatus: 'published' },
      orderBy: { publishedAt: 'desc' },
      include: REPORT_INCLUDE,
    });

    return rows.map((row: unknown) => this.toReportContract(row as ClinicalReportRow));
  }

  async findLatestDocumentByReportId(reportId: string): Promise<PatientDocumentDownload | null> {
    const row = await prisma.reportDocument.findFirst({
      where: { clinicalReportId: reportId },
      orderBy: { generatedAt: 'desc' },
    });

    if (row === null) {
      return null;
    }

    try {
      return await this.toDocumentContract(row as unknown as ReportDocumentRow);
    } catch {
      return null;
    }
  }

  // ---- Signatures ---------------------------------------------------------

  async createSignature(signature: ReportSignature): Promise<ReportSignature> {
    // Prisma enforces 1:1 (unique clinicalReportId), so upsert to handle
    // the case where the test or workflow re-signs the same report.
    const row = await prisma.reportSignature.upsert({
      where: { clinicalReportId: signature.clinicalReportId },
      create: {
        id: signature.id,
        clinicalReportId: signature.clinicalReportId,
        storageKey: signature.storagePath,
        fileHash: this.computeFileHash(signature.storagePath),
        signedAt: signature.signedAt,
      },
      update: {
        storageKey: signature.storagePath,
        fileHash: this.computeFileHash(signature.storagePath),
        signedAt: signature.signedAt,
      },
    });

    return this.toSignatureContract(row as unknown as ReportSignatureRow);
  }

  async findLatestSignatureByReportId(reportId: string): Promise<ReportSignature | null> {
    const row = await prisma.reportSignature.findUnique({
      where: { clinicalReportId: reportId },
    });

    if (row === null) {
      return null;
    }

    return this.toSignatureContract(row as unknown as ReportSignatureRow);
  }

  // ---- Mapping helpers ----------------------------------------------------

  private toReportContract(row: ClinicalReportRow): ClinicalReport {
    const amendedFromId =
      row.amendments.length > 0
        ? (row.amendments[0]?.amendedFromReportId ?? null)
        : null;

    const supplementalObservations = row.recommendations
      ? (JSON.parse(row.recommendations) as Record<string, unknown>)
      : null;

    return ClinicalReportSchema.parse({
      id: row.id,
      examSessionId: row.scoreResultSet.examSessionId,
      authorUserId: row.authoredByUserId,
      scoreResultSetId: row.scoreResultSetId,
      reportStatus: row.reportStatus,
      interpretationSummary: row.interpretationSummary,
      narrative: row.narrative,
      supplementalObservations,
      publishedAt: row.publishedAt,
      amendedFromId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toSignatureContract(row: ReportSignatureRow): ReportSignature {
    return ReportSignatureSchema.parse({
      id: row.id,
      clinicalReportId: row.clinicalReportId,
      storagePath: row.storageKey,
      signedAt: row.signedAt,
    });
  }

  private async toDocumentContract(row: ReportDocumentRow): Promise<PatientDocumentDownload> {
    const objectPath = this.toArtifactObjectPath(row.storageKey);
    const metadataPath = this.toArtifactMetadataPath(row.storageKey);

    const [body, rawMetadata] = await Promise.all([
      readFile(objectPath),
      readFile(metadataPath, 'utf8'),
    ]);

    const metadata = JSON.parse(rawMetadata) as PersistedArtifactMetadata;

    return PatientDocumentDownloadSchema.parse({
      reportId: row.clinicalReportId,
      documentId: row.id,
      documentType: row.documentType,
      fileName: `${row.clinicalReportId}.pdf`,
      contentType: metadata.contentType,
      byteLength: metadata.byteLength,
      checksumSha256: metadata.checksumSha256,
      generatedAt: row.generatedAt,
      storageKey: row.storageKey,
      bodyBase64: body.toString('base64'),
    });
  }

  private toArtifactObjectPath(key: string): string {
    return this.toArtifactScopedPath(key, '.bin');
  }

  private toArtifactMetadataPath(key: string): string {
    return this.toArtifactScopedPath(key, '.meta.json');
  }

  private toArtifactScopedPath(key: string, extension: string): string {
    const rootDirectory = resolve('var/artifacts');
    const normalizedKey = normalize(key.replace(/\\/g, '/')).replace(/^\/+/, '');
    const candidate = resolve(join(rootDirectory, `${normalizedKey}${extension}`));

    if (!candidate.startsWith(rootDirectory)) {
      throw new Error(`Artifact key '${key}' resolves outside storage root.`);
    }

    return candidate;
  }

  private computeFileHash(storagePath: string): string {
    return createHash('sha256').update(storagePath).digest('hex').slice(0, 64);
  }
}
