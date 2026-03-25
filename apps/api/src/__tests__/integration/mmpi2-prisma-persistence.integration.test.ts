import {
  MMPI2_1989_REFERENCE_CATALOG,
  MMPI2_ASSESSMENT_TYPE_ID,
} from '@mmpi2/config';
import {
  AssessmentRequestStatus,
  BillingMode,
  ClinicalReportStatus,
  ExamSessionStatus,
  UserRole,
} from '@mmpi2/contracts';
import { prisma } from '@mmpi2/db/client';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { AppModule } from '../../app.module';
import { PaymentService } from '../../payment/payment.service';
import { ProfileService } from '../../profile/profile.service';
import { ReportService } from '../../report/report.service';
import { RequestSessionService } from '../../request-session/request-session.service';
import { ScoringService } from '../../scoring/scoring.service';

const hasDatabase = Boolean(process.env.DATABASE_URL);

const PATIENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const DOCTOR_USER_ID = '22222222-2222-4222-8222-222222222222';

async function resetWorkflowData() {
  await prisma.reportSignature.deleteMany();
  await prisma.clinicalReportAmendment.deleteMany();
  await prisma.clinicalReport.deleteMany();
  await prisma.criticalItemFlag.deleteMany();
  await prisma.validityFlag.deleteMany();
  await prisma.scaleResult.deleteMany();
  await prisma.scoreResultSet.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.sessionEvent.deleteMany();
  await prisma.sessionAnswer.deleteMany();
  await prisma.examSession.deleteMany();
  await prisma.assessmentRequest.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.userRoleAssignment.deleteMany({
    where: {
      userId: {
        in: [PATIENT_USER_ID, DOCTOR_USER_ID],
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [PATIENT_USER_ID, DOCTOR_USER_ID],
      },
    },
  });
}

async function seedUsers() {
  await prisma.user.createMany({
    data: [
      {
        id: PATIENT_USER_ID,
        email: 'patient.one@example.com',
        fullName: 'Patient One',
        passwordHash: 'not-used-in-integration-test',
        accountStatus: 'active',
      },
      {
        id: DOCTOR_USER_ID,
        email: 'doctor.one@example.com',
        fullName: 'Dr. Tester',
        passwordHash: 'not-used-in-integration-test',
        accountStatus: 'active',
      },
    ],
  });
}

async function ensureReferenceData() {
  const catalog = MMPI2_1989_REFERENCE_CATALOG;

  await prisma.appSettings.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      billingMode: BillingMode.DISABLED,
      defaultCurrency: 'IDR',
      defaultAmount: 0,
    },
    update: {
      billingMode: BillingMode.DISABLED,
      defaultCurrency: 'IDR',
      defaultAmount: 0,
    },
  });

  for (const roleCode of [UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]) {
    await prisma.role.upsert({
      where: { roleCode },
      create: {
        roleCode,
        displayName: roleCode.replace('_', ' '),
      },
      update: {
        displayName: roleCode.replace('_', ' '),
      },
    });
  }

  await prisma.assessmentType.upsert({
    where: { id: MMPI2_ASSESSMENT_TYPE_ID },
    create: {
      id: MMPI2_ASSESSMENT_TYPE_ID,
      code: catalog.versionTriplet.instrument.name,
      name: catalog.versionTriplet.instrument.name,
      description: 'Minnesota Multiphasic Personality Inventory-2',
    },
    update: {
      code: catalog.versionTriplet.instrument.name,
      name: catalog.versionTriplet.instrument.name,
      description: 'Minnesota Multiphasic Personality Inventory-2',
    },
  });

  await prisma.instrumentVersion.upsert({
    where: { id: catalog.versionTriplet.instrument.id },
    create: {
      id: catalog.versionTriplet.instrument.id,
      assessmentTypeId: MMPI2_ASSESSMENT_TYPE_ID,
      versionLabel: catalog.versionTriplet.instrument.revision,
      isActive: true,
      effectiveFrom: new Date(catalog.versionTriplet.instrument.publishedAt),
    },
    update: {
      assessmentTypeId: MMPI2_ASSESSMENT_TYPE_ID,
      versionLabel: catalog.versionTriplet.instrument.revision,
      isActive: true,
      effectiveFrom: new Date(catalog.versionTriplet.instrument.publishedAt),
    },
  });

  await prisma.questionBankVersion.upsert({
    where: { id: catalog.versionTriplet.questionBank.id },
    create: {
      id: catalog.versionTriplet.questionBank.id,
      instrumentVersionId: catalog.versionTriplet.instrument.id,
      versionLabel: catalog.versionTriplet.questionBank.version,
      checksum: catalog.versionTriplet.questionBank.checksum,
      isActive: true,
      effectiveFrom: new Date(catalog.versionTriplet.questionBank.releasedAt),
    },
    update: {
      instrumentVersionId: catalog.versionTriplet.instrument.id,
      versionLabel: catalog.versionTriplet.questionBank.version,
      checksum: catalog.versionTriplet.questionBank.checksum,
      isActive: true,
      effectiveFrom: new Date(catalog.versionTriplet.questionBank.releasedAt),
    },
  });

  await prisma.scoringConfigVersion.upsert({
    where: { id: catalog.versionTriplet.scoringConfig.id },
    create: {
      id: catalog.versionTriplet.scoringConfig.id,
      instrumentVersionId: catalog.versionTriplet.instrument.id,
      versionLabel: catalog.versionTriplet.scoringConfig.version,
      checksum: catalog.versionTriplet.scoringConfig.checksum,
      isActive: true,
      effectiveFrom: new Date(catalog.versionTriplet.scoringConfig.releasedAt),
    },
    update: {
      instrumentVersionId: catalog.versionTriplet.instrument.id,
      versionLabel: catalog.versionTriplet.scoringConfig.version,
      checksum: catalog.versionTriplet.scoringConfig.checksum,
      isActive: true,
      effectiveFrom: new Date(catalog.versionTriplet.scoringConfig.releasedAt),
    },
  });

  if ((await prisma.questionBankItem.count()) === 0) {
    await prisma.questionBankItem.createMany({
      data: catalog.questionBankItems.map((item) => ({
        questionBankVersionId: catalog.versionTriplet.questionBank.id,
        questionNumber: item.questionNumber,
        itemText: item.itemText,
        isActive: item.isActive,
      })),
    });
  }

  if ((await prisma.scaleDefinition.count()) === 0) {
    await prisma.scaleDefinition.createMany({
      data: catalog.scaleDefinitions.map((definition) => ({
        scoringConfigVersionId: catalog.versionTriplet.scoringConfig.id,
        scaleCode: definition.key,
        scaleGroup: definition.group,
        displayName: definition.name,
        scoreType: definition.scoreType,
        usesKCorrection: definition.kCorrectionWeight !== undefined,
        kCorrectionWeight: definition.kCorrectionWeight,
      })),
    });
  }

  if ((await prisma.scaleKeyEntry.count()) === 0) {
    await prisma.scaleKeyEntry.createMany({
      data: catalog.scaleKeyEntries.map((entry) => ({
        scoringConfigVersionId: catalog.versionTriplet.scoringConfig.id,
        scaleCode: entry.scaleKey,
        questionNumber: entry.questionNumber,
        keyedAnswer: entry.keyedAnswer,
        weight: entry.weight,
      })),
    });
  }

  if ((await prisma.normTable.count()) === 0) {
    for (const table of catalog.normTables) {
      await prisma.normTable.create({
        data: {
          scoringConfigVersionId: catalog.versionTriplet.scoringConfig.id,
          normCode: table.normCode,
          sexBasis: table.gender,
          ageBand: null,
          description: `${table.scaleKey} ${table.gender} normative table`,
          entries: {
            create: Object.entries(table.rawToTScore).map(([rawScore, tScore]) => ({
              scaleCode: table.scaleKey,
              rawScore: Number(rawScore),
              tScore,
              percentile: null,
            })),
          },
        },
      });
    }
  }
}

describe.runIf(hasDatabase)('MMPI-2 Prisma-backed persistence integration', () => {
  let testingModule: TestingModule;
  let profileService: ProfileService;
  let paymentService: PaymentService;
  let requestSessionService: RequestSessionService;
  let scoringService: ScoringService;
  let reportService: ReportService;

  beforeAll(async () => {
    await ensureReferenceData();

    testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    profileService = testingModule.get(ProfileService);
    paymentService = testingModule.get(PaymentService);
    requestSessionService = testingModule.get(RequestSessionService);
    scoringService = testingModule.get(ScoringService);
    reportService = testingModule.get(ReportService);
  });

  beforeEach(async () => {
    await resetWorkflowData();
    await seedUsers();
    await paymentService.updateBillingMode(BillingMode.DISABLED);
  });

  afterAll(async () => {
    await resetWorkflowData();
    await testingModule.close();
  });

  it('persists the happy path through Prisma-backed repositories', async () => {
    await profileService.upsertPatientProfile(PATIENT_USER_ID, {
      fullName: 'Patient One',
      governmentId: 'ID-12345',
      dateOfBirth: new Date('1990-05-10'),
      gender: 'female',
      demographics: {
        education: 'Bachelor',
        occupation: 'Designer',
        phoneNumber: '0812-0000-0000',
        address: 'Bandung',
      },
    });

    await profileService.upsertDoctorProfile(DOCTOR_USER_ID, {
      fullName: 'Dr. Tester',
      licenseNumber: 'PSY-9001',
      specialty: 'Clinical Psychology',
    });

    const createdRequest = await requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Prisma persistence happy path',
    });
    expect(createdRequest.status).toBe(AssessmentRequestStatus.READY_FOR_ADMIN_REVIEW);

    await requestSessionService.assignDoctor(createdRequest.id, {
      doctorUserId: DOCTOR_USER_ID,
    });

    await requestSessionService.reviewRequest(createdRequest.id, {
      decision: 'approved',
    });

    await requestSessionService.startSessionForPatient(PATIENT_USER_ID, createdRequest.id);

    await requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, createdRequest.id, {
      answers: [
        { questionNumber: 1, answer: 'true' },
        { questionNumber: 2, answer: 'false' },
        { questionNumber: 3, answer: 'true' },
      ],
    });

    const submittedState = await requestSessionService.submitSessionForPatient(
      PATIENT_USER_ID,
      createdRequest.id,
    );
    expect(submittedState.session.status).toBe(ExamSessionStatus.SUBMITTED);

    const scoredView = await scoringService.runScoringForSubmittedSession(submittedState.session.id);
    expect(scoredView.resultSet.examSessionId).toBe(submittedState.session.id);

    await reportService.saveDraftForDoctor(submittedState.session.id, DOCTOR_USER_ID, {
      interpretationSummary: 'Prisma persistence integration draft',
      narrative: 'Draft narrative for persistence integration verification.',
    });

    await reportService.signReportForDoctor(submittedState.session.id, DOCTOR_USER_ID, {
      signatureStoragePath: 'signatures/prisma-integration.png',
    });

    const publishedState = await reportService.publishReportForDoctor(
      submittedState.session.id,
      DOCTOR_USER_ID,
      {
        interpretationSummary: 'Published via Prisma-backed services.',
        narrative: 'The report publish flow persisted through Prisma-backed repositories.',
      },
    );

    expect(publishedState.report?.reportStatus).toBe(ClinicalReportStatus.PUBLISHED);

    const persistedRequest = await prisma.assessmentRequest.findUnique({
      where: { id: createdRequest.id },
    });
    const persistedSession = await prisma.examSession.findUnique({
      where: { assessmentRequestId: createdRequest.id },
    });
    const persistedResultSet = await prisma.scoreResultSet.findFirst({
      where: { examSessionId: submittedState.session.id },
    });
    const persistedReport = await prisma.clinicalReport.findFirst({
      where: { scoreResultSetId: scoredView.resultSet.id },
    });

    expect(persistedRequest?.doctorUserId).toBe(DOCTOR_USER_ID);
    expect(persistedSession?.doctorUserId).toBe(DOCTOR_USER_ID);
    expect(persistedResultSet?.status).toBe('completed');
    expect(persistedReport?.reportStatus).toBe('published');
  });

  it('preserves immutability rules through Prisma-backed repositories', async () => {
    await profileService.upsertPatientProfile(PATIENT_USER_ID, {
      fullName: 'Patient One',
      governmentId: 'ID-12345',
      dateOfBirth: new Date('1990-05-10'),
      gender: 'female',
      demographics: {
        education: 'Bachelor',
        occupation: 'Designer',
        phoneNumber: '0812-0000-0000',
        address: 'Bandung',
      },
    });

    await profileService.upsertDoctorProfile(DOCTOR_USER_ID, {
      fullName: 'Dr. Tester',
      licenseNumber: 'PSY-9001',
      specialty: 'Clinical Psychology',
    });

    const createdRequest = await requestSessionService.createAssessmentRequest(PATIENT_USER_ID, {
      purpose: 'Prisma persistence negative path',
    });
    await requestSessionService.assignDoctor(createdRequest.id, { doctorUserId: DOCTOR_USER_ID });
    await requestSessionService.reviewRequest(createdRequest.id, { decision: 'approved' });
    await requestSessionService.startSessionForPatient(PATIENT_USER_ID, createdRequest.id);
    await requestSessionService.saveAnswersForPatient(PATIENT_USER_ID, createdRequest.id, {
      answers: [{ questionNumber: 1, answer: 'true' }],
    });
    const submitted = await requestSessionService.submitSessionForPatient(PATIENT_USER_ID, createdRequest.id);
    await scoringService.runScoringForSubmittedSession(submitted.session.id);
    await reportService.saveDraftForDoctor(submitted.session.id, DOCTOR_USER_ID, {
      interpretationSummary: 'Initial report draft for amendment',
      narrative: 'Initial narrative before publication.',
    });
    await reportService.signReportForDoctor(submitted.session.id, DOCTOR_USER_ID, {
      signatureStoragePath: 'signatures/prisma-negative.png',
    });
    const published = await reportService.publishReportForDoctor(submitted.session.id, DOCTOR_USER_ID, {
      interpretationSummary: 'Published report before amendment',
      narrative: 'Published narrative before amendment.',
    });

    const publishedReport = published.report;
    if (publishedReport === null) {
      throw new Error('Expected published report.');
    }

    const amended = await reportService.amendPublishedReportForDoctor(submitted.session.id, DOCTOR_USER_ID, {
      interpretationSummary: 'Amended published report',
      narrative: 'Amended narrative.',
      amendmentReason: 'Corrected wording after review.',
    });

    expect(amended.report?.amendedFromId).toBe(publishedReport.id);

    const amendmentLink = await prisma.clinicalReportAmendment.findFirst({
      where: { amendedFromReportId: publishedReport.id },
    });
    const ancestor = await prisma.clinicalReport.findUnique({ where: { id: publishedReport.id } });

    expect(amendmentLink?.clinicalReportId).toBe(amended.report?.id);
    expect(ancestor?.reportStatus).toBe('amended');
  });
});
