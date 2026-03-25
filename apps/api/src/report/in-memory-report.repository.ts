import {
  ClinicalReportSchema,
  PatientDocumentDownloadSchema,
  ReportSignatureSchema,
  type ClinicalReport,
  type PatientDocumentDownload,
  type ReportSignature,
} from '@mmpi2/contracts';
import { Injectable } from '@nestjs/common';
import {
  ReportRepository,
} from './report.repository';

@Injectable()
export class InMemoryReportRepository extends ReportRepository {
  private readonly reportsById = new Map<string, ClinicalReport>();
  private readonly reportIdsBySessionId = new Map<string, string[]>();

  private readonly signaturesById = new Map<string, ReportSignature>();
  private readonly signatureIdsByReportId = new Map<string, string[]>();
  private readonly documentsByReportId = new Map<string, PatientDocumentDownload>();

  async createReport(report: ClinicalReport): Promise<ClinicalReport> {
    const normalized = this.normalizeReport(report);
    this.reportsById.set(normalized.id, normalized);

    const reportIds = this.reportIdsBySessionId.get(normalized.examSessionId) ?? [];
    reportIds.push(normalized.id);
    this.reportIdsBySessionId.set(normalized.examSessionId, reportIds);

    return this.normalizeReport(normalized);
  }

  async saveReport(report: ClinicalReport): Promise<ClinicalReport> {
    const normalized = this.normalizeReport(report);
    this.reportsById.set(normalized.id, normalized);

    if (!this.reportIdsBySessionId.has(normalized.examSessionId)) {
      this.reportIdsBySessionId.set(normalized.examSessionId, [normalized.id]);
    }

    return this.normalizeReport(normalized);
  }

  async findReportById(reportId: string): Promise<ClinicalReport | null> {
    const report = this.reportsById.get(reportId);
    return report === undefined ? null : this.normalizeReport(report);
  }

  async findLatestReportBySessionId(sessionId: string): Promise<ClinicalReport | null> {
    const reports = await this.listReportsBySessionId(sessionId);
    if (reports.length === 0) {
      return null;
    }

    return reports[reports.length - 1] ?? null;
  }

  async listReportsBySessionId(sessionId: string): Promise<ClinicalReport[]> {
    const reportIds = this.reportIdsBySessionId.get(sessionId) ?? [];

    return reportIds
      .map((reportId) => this.reportsById.get(reportId))
      .filter((report): report is ClinicalReport => report !== undefined)
      .map((report) => this.normalizeReport(report));
  }

  async listPublishedReports(): Promise<ClinicalReport[]> {
    return [...this.reportsById.values()]
      .filter((report) => report.reportStatus === 'published')
      .sort((left, right) => {
        const leftTime = left.publishedAt?.getTime() ?? 0;
        const rightTime = right.publishedAt?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .map((report) => this.normalizeReport(report));
  }

  async findLatestDocumentByReportId(reportId: string): Promise<PatientDocumentDownload | null> {
    const document = this.documentsByReportId.get(reportId);
    return document === undefined ? null : this.normalizeDocument(document);
  }

  async createSignature(signature: ReportSignature): Promise<ReportSignature> {
    const normalized = this.normalizeSignature(signature);
    this.signaturesById.set(normalized.id, normalized);

    const signatureIds = this.signatureIdsByReportId.get(normalized.clinicalReportId) ?? [];
    signatureIds.push(normalized.id);
    this.signatureIdsByReportId.set(normalized.clinicalReportId, signatureIds);

    this.documentsByReportId.set(normalized.clinicalReportId, this.normalizeDocument({
      reportId: normalized.clinicalReportId,
      documentId: normalized.id,
      documentType: 'clinical_report_pdf',
      fileName: `${normalized.clinicalReportId}.pdf`,
      contentType: 'application/pdf',
      byteLength: 128,
      checksumSha256: 'in-memory-artifact-hash',
      generatedAt: normalized.signedAt,
      storageKey: normalized.storagePath,
      bodyBase64: Buffer.from(`Report artifact for ${normalized.clinicalReportId}`).toString('base64'),
    }));

    return this.normalizeSignature(normalized);
  }

  async findLatestSignatureByReportId(reportId: string): Promise<ReportSignature | null> {
    const signatureIds = this.signatureIdsByReportId.get(reportId) ?? [];
    if (signatureIds.length === 0) {
      return null;
    }

    const latestSignatureId = signatureIds[signatureIds.length - 1];
    if (latestSignatureId === undefined) {
      return null;
    }

    const signature = this.signaturesById.get(latestSignatureId);
    return signature === undefined ? null : this.normalizeSignature(signature);
  }

  private normalizeReport(report: ClinicalReport): ClinicalReport {
    return ClinicalReportSchema.parse(report);
  }

  private normalizeSignature(signature: ReportSignature): ReportSignature {
    return ReportSignatureSchema.parse(signature);
  }

  private normalizeDocument(document: PatientDocumentDownload): PatientDocumentDownload {
    return PatientDocumentDownloadSchema.parse(document);
  }
}
