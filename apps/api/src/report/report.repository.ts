import type {
  ClinicalReport,
  PatientDocumentDownload,
  ReportSignature,
} from '@mmpi2/contracts';

export abstract class ReportRepository {
  abstract createReport(report: ClinicalReport): Promise<ClinicalReport>;
  abstract saveReport(report: ClinicalReport): Promise<ClinicalReport>;
  abstract findReportById(reportId: string): Promise<ClinicalReport | null>;
  abstract findLatestReportBySessionId(sessionId: string): Promise<ClinicalReport | null>;
  abstract listReportsBySessionId(sessionId: string): Promise<ClinicalReport[]>;
  abstract listPublishedReports(): Promise<ClinicalReport[]>;
  abstract findLatestDocumentByReportId(reportId: string): Promise<PatientDocumentDownload | null>;

  abstract createSignature(signature: ReportSignature): Promise<ReportSignature>;
  abstract findLatestSignatureByReportId(reportId: string): Promise<ReportSignature | null>;
}
