import { randomUUID } from 'node:crypto';
import {
  canTransitionReport,
  ClinicalReportSchema,
  ClinicalReportStatus,
  ScoreResultSetStatus,
  type AmendReportDto,
  type ClinicalReport,
  type ExamSession,
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
    @Inject(ScoringService)
    private readonly scoringService: ScoringService,
  ) {}

  getReportStateForDoctor(sessionId: string, doctorUserId: string): ReportAuthoringState {
    const scoredSession = this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const latestReport = this.reportRepository.findLatestReportBySessionId(sessionId);

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, latestReport);
  }

  saveDraftForDoctor(
    sessionId: string,
    doctorUserId: string,
    payload: SaveDraftReportDto,
  ): ReportAuthoringState {
    const scoredSession = this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const existingReport = this.reportRepository.findLatestReportBySessionId(sessionId);
    const now = new Date();

    const report =
      existingReport === null
        ? this.reportRepository.createReport(
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
        : this.updateEditableReportDraft(existingReport, scoredSession.resultSet.id, payload);

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, report);
  }

  signReportForDoctor(sessionId: string, doctorUserId: string, payload: SignReportDto): ReportAuthoringState {
    const scoredSession = this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const existingReport = this.mustFindLatestReportOrThrow(sessionId);
    this.assertCanonicalResultBinding(existingReport, scoredSession.resultSet.id);

    if (existingReport.reportStatus === ClinicalReportStatus.PUBLISHED) {
      throw new ConflictException('Published reports are immutable. Use amendment workflow instead.');
    }

    if (existingReport.reportStatus === ClinicalReportStatus.AMENDED) {
      throw new ConflictException('Amended report revisions cannot be signed.');
    }

    const signedReport =
      existingReport.reportStatus === ClinicalReportStatus.DRAFT
        ? this.transitionReport(existingReport, ClinicalReportStatus.PENDING_REVIEW)
        : existingReport;

    this.reportRepository.createSignature({
      id: randomUUID(),
      clinicalReportId: signedReport.id,
      storagePath: payload.signatureStoragePath,
      signedAt: new Date(),
    });

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, signedReport);
  }

  publishReportForDoctor(
    sessionId: string,
    doctorUserId: string,
    payload: PublishReportDto,
  ): ReportAuthoringState {
    const scoredSession = this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const report = this.mustFindLatestReportOrThrow(sessionId);
    this.assertCanonicalResultBinding(report, scoredSession.resultSet.id);

    if (report.reportStatus === ClinicalReportStatus.PUBLISHED) {
      throw new ConflictException('Report is already published. Use amendment workflow for changes.');
    }

    if (report.reportStatus === ClinicalReportStatus.AMENDED) {
      throw new ConflictException('Amended records cannot be republished directly.');
    }

    const signature = this.reportRepository.findLatestSignatureByReportId(report.id);
    if (signature === null) {
      throw new ConflictException('Publishing requires explicit doctor sign-off first.');
    }

    if (!canTransitionReport(report.reportStatus, ClinicalReportStatus.PUBLISHED)) {
      throw new ConflictException(
        `Cannot publish report from status '${report.reportStatus}'.`,
      );
    }

    const now = new Date();
    const publishedReport = this.reportRepository.saveReport(
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

  amendPublishedReportForDoctor(
    sessionId: string,
    doctorUserId: string,
    payload: AmendReportDto,
  ): ReportAuthoringState {
    const scoredSession = this.mustGetCanonicalScoredSession(sessionId, doctorUserId);
    const publishedReport = this.mustFindLatestReportOrThrow(sessionId);

    if (publishedReport.reportStatus !== ClinicalReportStatus.PUBLISHED) {
      throw new ConflictException('Only published reports can be amended.');
    }

    this.assertCanonicalResultBinding(publishedReport, scoredSession.resultSet.id);

    const previousSignature = this.reportRepository.findLatestSignatureByReportId(publishedReport.id);
    if (previousSignature === null) {
      throw new ConflictException('Published reports must contain a signature before amendment.');
    }

    const now = new Date();
    const amendedAncestor = this.transitionReport(publishedReport, ClinicalReportStatus.AMENDED);

    const amendedReport = this.reportRepository.createReport(
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

    this.reportRepository.createSignature({
      id: randomUUID(),
      clinicalReportId: amendedReport.id,
      storagePath: previousSignature.storagePath,
      signedAt: now,
    });

    return this.toReportAuthoringState(scoredSession.session, scoredSession.resultSet, amendedReport);
  }

  private updateEditableReportDraft(
    report: ClinicalReport,
    canonicalResultSetId: string,
    payload: SaveDraftReportDto,
  ): ClinicalReport {
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

  private mustGetCanonicalScoredSession(sessionId: string, doctorUserId: string) {
    const scoredSession = this.scoringService.getLatestScoreForDoctor(sessionId, doctorUserId);

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

  private mustFindLatestReportOrThrow(sessionId: string): ClinicalReport {
    const report = this.reportRepository.findLatestReportBySessionId(sessionId);
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

  private transitionReport(report: ClinicalReport, targetStatus: ClinicalReport['reportStatus']): ClinicalReport {
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

  private toReportAuthoringState(
    session: ExamSession,
    resultSet: ScoreResultSet,
    report: ClinicalReport | null,
  ): ReportAuthoringState {
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
      signature: this.reportRepository.findLatestSignatureByReportId(report.id),
    };
  }
}
