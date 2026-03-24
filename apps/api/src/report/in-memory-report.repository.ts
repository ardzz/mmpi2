import {
  ClinicalReportSchema,
  ReportSignatureSchema,
  type ClinicalReport,
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

  createReport(report: ClinicalReport): ClinicalReport {
    const normalized = this.normalizeReport(report);
    this.reportsById.set(normalized.id, normalized);

    const reportIds = this.reportIdsBySessionId.get(normalized.examSessionId) ?? [];
    reportIds.push(normalized.id);
    this.reportIdsBySessionId.set(normalized.examSessionId, reportIds);

    return this.normalizeReport(normalized);
  }

  saveReport(report: ClinicalReport): ClinicalReport {
    const normalized = this.normalizeReport(report);
    this.reportsById.set(normalized.id, normalized);

    if (!this.reportIdsBySessionId.has(normalized.examSessionId)) {
      this.reportIdsBySessionId.set(normalized.examSessionId, [normalized.id]);
    }

    return this.normalizeReport(normalized);
  }

  findReportById(reportId: string): ClinicalReport | null {
    const report = this.reportsById.get(reportId);
    return report === undefined ? null : this.normalizeReport(report);
  }

  findLatestReportBySessionId(sessionId: string): ClinicalReport | null {
    const reports = this.listReportsBySessionId(sessionId);
    if (reports.length === 0) {
      return null;
    }

    return reports[reports.length - 1] ?? null;
  }

  listReportsBySessionId(sessionId: string): ClinicalReport[] {
    const reportIds = this.reportIdsBySessionId.get(sessionId) ?? [];

    return reportIds
      .map((reportId) => this.reportsById.get(reportId))
      .filter((report): report is ClinicalReport => report !== undefined)
      .map((report) => this.normalizeReport(report));
  }

  createSignature(signature: ReportSignature): ReportSignature {
    const normalized = this.normalizeSignature(signature);
    this.signaturesById.set(normalized.id, normalized);

    const signatureIds = this.signatureIdsByReportId.get(normalized.clinicalReportId) ?? [];
    signatureIds.push(normalized.id);
    this.signatureIdsByReportId.set(normalized.clinicalReportId, signatureIds);

    return this.normalizeSignature(normalized);
  }

  findLatestSignatureByReportId(reportId: string): ReportSignature | null {
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
}
