import { randomUUID } from 'node:crypto';
import {
  canTransitionReport,
  ClinicalReportSchema,
  ClinicalReportStatus,
  PatientDocumentDownloadSchema,
  PatientDocumentDetailSchema,
  PatientDocumentSummarySchema,
  ScoreResultSetStatus,
  type AmendReportDto,
  type ClinicalReport,
  type ExamSession,
  type PatientDocumentDownload,
  type PatientDocumentDetail,
  type PatientDocumentSummary,
  type PublishReportDto,
  type ReportSignature,
  type SaveDraftReportDto,
  type ScoreResultSet,
  type SignReportDto,
} from '@mmpi2/contracts';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from '../profile/profile.service';
import { RequestSessionRepository } from '../request-session/request-session.repository';
import { ScoringService } from '../scoring/scoring.service';
import { ReportRepository } from './report.repository';

export interface ReportAuthoringState {
  session: ExamSession;
  resultSet: ScoreResultSet;
  report: ClinicalReport | null;
  signature: ReportSignature | null;
}

@Injectable()
export class ReportService {
  constructor(
    @Inject(ReportRepository)
    private readonly reportRepository: ReportRepository,
    @Inject(RequestSessionRepository)
    private readonly requestSessionRepository: RequestSessionRepository,
    @Inject(ProfileService)
    private readonly profileService: ProfileService,
    @Inject(ScoringService)
    private readonly scoringService: ScoringService,
  ) {}

  async listPublishedDocumentsForPatient(patientUserId: string): Promise<PatientDocumentSummary[]> {
    const publishedReports = await this.reportRepository.listPublishedReports();
    const documents: PatientDocumentSummary[] = [];

    for (const report of publishedReports) {
      const session = await this.requestSessionRepository.findSessionById(report.examSessionId);
      if (session === null || session.patientUserId !== patientUserId) {
        continue;
      }

      const author = await this.profileService.getDoctorProfileByUserId(report.authorUserId);
      documents.push(
        PatientDocumentSummarySchema.parse({
          id: report.id,
          examSessionId: report.examSessionId,
          title: 'Clinical Report',
          documentType: 'clinical_report',
          reportStatus: report.reportStatus,
          publishedAt: report.publishedAt,
          authorUserId: report.authorUserId,
          authorName: author.fullName,
          hasDownload: (await this.reportRepository.findLatestDocumentByReportId(report.id)) !== null,
        }),
      );
    }

    return documents.sort((left, right) => {
      const leftTime = left.publishedAt?.getTime() ?? 0;
      const rightTime = right.publishedAt?.getTime() ?? 0;
      return rightTime - leftTime;
    });
  }

  async getPublishedDocumentDetailForPatient(
    patientUserId: string,
    reportId: string,
  ): Promise<PatientDocumentDetail> {
    const report = await this.reportRepository.findReportById(reportId);
    if (report === null || report.reportStatus !== ClinicalReportStatus.PUBLISHED) {
      throw new NotFoundException(`Published report '${reportId}' was not found.`);
    }

    const session = await this.requestSessionRepository.findSessionById(report.examSessionId);
    if (session === null) {
      throw new NotFoundException(`Exam session '${report.examSessionId}' was not found.`);
    }

    if (session.patientUserId !== patientUserId) {
      throw new ForbiddenException('You are not allowed to access this document.');
    }

    const author = await this.profileService.getDoctorProfileByUserId(report.authorUserId);
    const document = await this.reportRepository.findLatestDocumentByReportId(report.id);

    return PatientDocumentDetailSchema.parse({
      id: report.id,
      examSessionId: report.examSessionId,
      title: 'Clinical Report',
      documentType: 'clinical_report',
      reportStatus: report.reportStatus,
      publishedAt: report.publishedAt,
      authorUserId: report.authorUserId,
      authorName: author.fullName,
      interpretationSummary: report.interpretationSummary,
      narrative: report.narrative,
      supplementalObservations: report.supplementalObservations,
      amendedFromId: report.amendedFromId,
      hasDownload: document !== null,
    });
  }

  async getPublishedDocumentDownloadForPatient(
    patientUserId: string,
    reportId: string,
  ): Promise<PatientDocumentDownload> {
    await this.getPublishedDocumentDetailForPatient(patientUserId, reportId);

    const document = await this.reportRepository.findLatestDocumentByReportId(reportId);
    if (document === null) {
      throw new NotFoundException(`Published report document '${reportId}' is not yet available.`);
    }

    return PatientDocumentDownloadSchema.parse(document);
  }

  async getReportStateForDoctor(sessionId: string, doctorUserId: string): Promise<ReportAuthoringState> {
    const scoredSession = await this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const latestReport = await this.reportRepository.findLatestReportBySessionId(sessionId);

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, latestReport);
  }

  async saveDraftForDoctor(
    sessionId: string,
    doctorUserId: string,
    payload: SaveDraftReportDto,
  ): Promise<ReportAuthoringState> {
    const scoredSession = await this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const existingReport = await this.reportRepository.findLatestReportBySessionId(sessionId);
    const now = new Date();

    const report =
      existingReport === null
        ? await this.reportRepository.createReport(
            ClinicalReportSchema.parse({
              id: randomUUID(),
              examSessionId: scoredSession.session.id,
              authorUserId: doctorUserId,
              scoreResultSetId: scoredSession.resultSet.id,
              reportStatus: ClinicalReportStatus.DRAFT,
              interpretationSummary: payload.interpretationSummary ?? null,
              narrative: payload.narrative ?? null,
              supplementalObservations: payload.supplementalObservations ?? null,
              publishedAt: null,
              amendedFromId: null,
              createdAt: now,
              updatedAt: now,
            }),
          )
        : await this.updateEditableReportDraft(existingReport, scoredSession.resultSet.id, payload);

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, report);
  }

  async signReportForDoctor(
    sessionId: string,
    doctorUserId: string,
    payload: SignReportDto,
  ): Promise<ReportAuthoringState> {
    const scoredSession = await this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const existingReport = await this.mustFindLatestReportOrThrow(sessionId);
    this.assertCanonicalResultBinding(existingReport, scoredSession.resultSet.id);

    if (existingReport.reportStatus === ClinicalReportStatus.PUBLISHED) {
      throw new ConflictException('Published reports are immutable. Use amendment workflow instead.');
    }

    if (existingReport.reportStatus === ClinicalReportStatus.AMENDED) {
      throw new ConflictException('Amended report revisions cannot be signed.');
    }

    const signedReport =
      existingReport.reportStatus === ClinicalReportStatus.DRAFT
        ? await this.transitionReport(existingReport, ClinicalReportStatus.PENDING_REVIEW)
        : existingReport;

    await this.reportRepository.createSignature({
      id: randomUUID(),
      clinicalReportId: signedReport.id,
      storagePath: payload.signatureStoragePath,
      signedAt: new Date(),
    });

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, signedReport);
  }

  async publishReportForDoctor(
    sessionId: string,
    doctorUserId: string,
    payload: PublishReportDto,
  ): Promise<ReportAuthoringState> {
    const scoredSession = await this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const report = await this.mustFindLatestReportOrThrow(sessionId);
    this.assertCanonicalResultBinding(report, scoredSession.resultSet.id);

    if (report.reportStatus === ClinicalReportStatus.PUBLISHED) {
      throw new ConflictException('Report is already published. Use amendment workflow for changes.');
    }

    if (report.reportStatus === ClinicalReportStatus.AMENDED) {
      throw new ConflictException('Amended records cannot be republished directly.');
    }

    const signature = await this.reportRepository.findLatestSignatureByReportId(report.id);
    if (signature === null) {
      throw new ConflictException('Publishing requires explicit doctor sign-off first.');
    }

    if (!canTransitionReport(report.reportStatus, ClinicalReportStatus.PUBLISHED)) {
      throw new ConflictException(
        `Cannot publish report from status '${report.reportStatus}'.`,
      );
    }

    const now = new Date();
    const publishedReport = await this.reportRepository.saveReport(
      ClinicalReportSchema.parse({
        ...report,
        interpretationSummary: payload.interpretationSummary,
        narrative: payload.narrative,
        supplementalObservations: payload.supplementalObservations ?? null,
        reportStatus: ClinicalReportStatus.PUBLISHED,
        publishedAt: now,
        updatedAt: now,
      }),
    );

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, publishedReport);
  }

  async amendPublishedReportForDoctor(
    sessionId: string,
    doctorUserId: string,
    payload: AmendReportDto,
  ): Promise<ReportAuthoringState> {
    const scoredSession = await this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const publishedReport = await this.mustFindLatestReportOrThrow(sessionId);

    if (publishedReport.reportStatus !== ClinicalReportStatus.PUBLISHED) {
      throw new ConflictException('Only published reports can be amended.');
    }

    this.assertCanonicalResultBinding(publishedReport, scoredSession.resultSet.id);

    const previousSignature = await this.reportRepository.findLatestSignatureByReportId(publishedReport.id);
    if (previousSignature === null) {
      throw new ConflictException('Published reports must contain a signature before amendment.');
    }

    const now = new Date();
    const amendedAncestor = await this.transitionReport(publishedReport, ClinicalReportStatus.AMENDED);

    const amendedReport = await this.reportRepository.createReport(
      ClinicalReportSchema.parse({
        id: randomUUID(),
        examSessionId: amendedAncestor.examSessionId,
        authorUserId: doctorUserId,
        scoreResultSetId: scoredSession.resultSet.id,
        reportStatus: ClinicalReportStatus.PUBLISHED,
        interpretationSummary: payload.interpretationSummary,
        narrative: payload.narrative,
        supplementalObservations: payload.supplementalObservations ?? null,
        publishedAt: now,
        amendedFromId: amendedAncestor.id,
        createdAt: now,
        updatedAt: now,
      }),
    );

    await this.reportRepository.createSignature({
      id: randomUUID(),
      clinicalReportId: amendedReport.id,
      storagePath: previousSignature.storagePath,
      signedAt: now,
    });

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, amendedReport);
  }

  private async updateEditableReportDraft(
    report: ClinicalReport,
    canonicalResultSetId: string,
    payload: SaveDraftReportDto,
  ): Promise<ClinicalReport> {
    if (report.reportStatus === ClinicalReportStatus.PUBLISHED) {
      throw new ConflictException('Published reports are immutable. Create an amendment instead.');
    }

    if (report.reportStatus === ClinicalReportStatus.AMENDED) {
      throw new ConflictException('Amended report records cannot be edited.');
    }

    this.assertCanonicalResultBinding(report, canonicalResultSetId);

    const targetStatus =
      report.reportStatus === ClinicalReportStatus.PENDING_REVIEW
        ? ClinicalReportStatus.DRAFT
        : report.reportStatus;

    if (targetStatus !== report.reportStatus && !canTransitionReport(report.reportStatus, targetStatus)) {
      throw new ConflictException(
        `Cannot move report from '${report.reportStatus}' back to draft for editing.`,
      );
    }

    return this.reportRepository.saveReport(
      ClinicalReportSchema.parse({
        ...report,
        reportStatus: targetStatus,
        interpretationSummary: payload.interpretationSummary ?? report.interpretationSummary,
        narrative: payload.narrative ?? report.narrative,
        supplementalObservations:
          payload.supplementalObservations ?? report.supplementalObservations,
        updatedAt: new Date(),
      }),
    );
  }

  private async mustGetCanonicalScoredSession(sessionId: string, doctorUserId: string) {
    const scoredSession = await this.scoringService.getLatestScoreForDoctor(sessionId, doctorUserId);

    if (scoredSession.session.doctorUserId !== doctorUserId) {
      throw new ForbiddenException(`Doctor '${doctorUserId}' is not assigned to session '${sessionId}'.`);
    }

    if (scoredSession.resultSet.status !== ScoreResultSetStatus.COMPLETED) {
      throw new ConflictException(
        `Latest scoring result set for session '${sessionId}' is '${scoredSession.resultSet.status}', not publishable.`,
      );
    }

    return scoredSession;
  }

  private async mustFindLatestReportOrThrow(sessionId: string): Promise<ClinicalReport> {
    const report = await this.reportRepository.findLatestReportBySessionId(sessionId);
    if (report === null) {
      throw new NotFoundException(`Clinical report for session '${sessionId}' was not found.`);
    }

    return report;
  }

  private assertCanonicalResultBinding(report: ClinicalReport, canonicalResultSetId: string): void {
    if (report.scoreResultSetId !== canonicalResultSetId) {
      throw new ConflictException(
        `Report '${report.id}' is bound to stale score result set '${report.scoreResultSetId}'.`,
      );
    }
  }

  private async transitionReport(report: ClinicalReport, targetStatus: ClinicalReport['reportStatus']): Promise<ClinicalReport> {
    if (!canTransitionReport(report.reportStatus, targetStatus)) {
      throw new ConflictException(
        `Cannot transition report from '${report.reportStatus}' to '${targetStatus}'.`,
      );
    }

    return this.reportRepository.saveReport(
      ClinicalReportSchema.parse({
        ...report,
        reportStatus: targetStatus,
        updatedAt: new Date(),
      }),
    );
  }

  private async toReportAuthoringState(
    session: ExamSession,
    resultSet: ScoreResultSet,
    report: ClinicalReport | null,
  ): Promise<ReportAuthoringState> {
    if (report === null) {
      return {
        session,
        resultSet,
        report: null,
        signature: null,
      };
    }

    return {
      session,
      resultSet,
      report,
      signature: await this.reportRepository.findLatestSignatureByReportId(report.id),
    };
  }
}
