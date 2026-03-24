import type {
  ClinicalReport,
  ReportSignature,
} from '@mmpi2/contracts';

export abstract class ReportRepository {
  abstract createReport(report: ClinicalReport): ClinicalReport;
  abstract saveReport(report: ClinicalReport): ClinicalReport;
  abstract findReportById(reportId: string): ClinicalReport | null;
  abstract findLatestReportBySessionId(sessionId: string): ClinicalReport | null;
  abstract listReportsBySessionId(sessionId: string): ClinicalReport[];

  abstract createSignature(signature: ReportSignature): ReportSignature;
  abstract findLatestSignatureByReportId(reportId: string): ReportSignature | null;
}
