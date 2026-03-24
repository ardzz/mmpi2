import {
  describe,
  expect,
  it,
} from 'vitest';
import { buildReportCompositionData } from '../composition/report-composition.js';
import {
  ReportArtifactJobPayloadSchema,
  type ReportArtifactJobPayload,
} from '../jobs/report-artifact-job.js';

function createJobPayload(): ReportArtifactJobPayload {
  return ReportArtifactJobPayloadSchema.parse({
    jobId: 'f0f7f4df-2b17-4ea6-b95b-6096f8fd6670',
    requestedAt: '2026-03-24T08:20:00.000Z',
    artifactType: 'clinical_report_pdf',
    source: {
      report: {
        id: '89c6dc15-598f-483a-966b-15be71f03c44',
        examSessionId: '83fb9ea3-dd84-4e2e-b7f1-5f127581f153',
        authorUserId: '9f7f6b70-bc4a-4ed2-86cc-17c13b6a4e1a',
        scoreResultSetId: '83956e67-e8d8-48d7-9d65-f6f53e1fd6c6',
        reportStatus: 'published',
        interpretationSummary: 'Interpretation summary content.',
        narrative: 'Narrative detail content.',
        supplementalObservations: {
          clinicalProfile: 'Clinical profile notes.',
          conclusion: 'Recommend follow-up interview.',
        },
        publishedAt: '2026-03-24T08:00:00.000Z',
        amendedFromId: null,
        createdAt: '2026-03-24T07:30:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
      },
      scoreResultSet: {
        id: '83956e67-e8d8-48d7-9d65-f6f53e1fd6c6',
        examSessionId: '83fb9ea3-dd84-4e2e-b7f1-5f127581f153',
        scoringConfigVersionId: 'e4f05713-6de8-4f28-bd8e-ef2e2d9cc6e1',
        engineVersion: '0.0.1',
        status: 'completed',
        patientGender: 'female',
        scoredAt: '2026-03-24T07:25:00.000Z',
        createdAt: '2026-03-24T07:25:00.000Z',
      },
      scaleResults: [
        {
          id: '7c6c0f35-5bf4-42c0-b963-9578be6f3b5a',
          scoreResultSetId: '83956e67-e8d8-48d7-9d65-f6f53e1fd6c6',
          scaleDefinitionId: 'aaa4bc82-6118-4f7e-8fce-34465f926ebf',
          scaleCode: 'L',
          groupCode: 'validity',
          rawScore: 6,
          correctedScore: null,
          tScore: 52,
          severityBand: 'normal',
        },
        {
          id: '7c6c0f35-5bf4-42c0-b963-9578be6f3b5b',
          scoreResultSetId: '83956e67-e8d8-48d7-9d65-f6f53e1fd6c6',
          scaleDefinitionId: 'aaa4bc82-6118-4f7e-8fce-34465f926ec0',
          scaleCode: 'F',
          groupCode: 'validity',
          rawScore: 8,
          correctedScore: null,
          tScore: 63,
          severityBand: 'normal',
        },
        {
          id: 'cc4fd40f-748f-4b28-8ed0-0f4412f3e2d2',
          scoreResultSetId: '83956e67-e8d8-48d7-9d65-f6f53e1fd6c6',
          scaleDefinitionId: 'df44423a-b9e8-4ca4-90ce-93f80d508f1a',
          scaleCode: 'D',
          groupCode: 'clinical',
          rawScore: 28,
          correctedScore: null,
          tScore: 72,
          severityBand: 'high',
        },
        {
          id: '8f10611f-907e-4692-a850-a31dfecf8f6f',
          scoreResultSetId: '83956e67-e8d8-48d7-9d65-f6f53e1fd6c6',
          scaleDefinitionId: 'a1042b95-7c42-4441-a51a-4f3dd1389ea2',
          scaleCode: 'Sc',
          groupCode: 'clinical',
          rawScore: 30,
          correctedScore: 31,
          tScore: 76,
          severityBand: 'very_high',
        },
      ],
      validityFlags: [],
      patientProfile: {
        id: '89b4475c-45d8-4ea4-bcd6-231836833f6e',
        userId: '4ecc07d0-e9dd-4be8-8d36-306afb9d58f5',
        fullName: 'Patient One',
        governmentId: 'ID-12345',
        dateOfBirth: '1990-01-02T00:00:00.000Z',
        gender: 'female',
        demographics: null,
        isProfileComplete: true,
        createdAt: '2026-03-24T06:30:00.000Z',
        updatedAt: '2026-03-24T06:30:00.000Z',
      },
      doctorProfile: {
        id: '0d4e173e-5b47-4f19-85ea-8f69db3a0bf7',
        userId: '9f7f6b70-bc4a-4ed2-86cc-17c13b6a4e1a',
        fullName: 'Dr. Clinician',
        licenseNumber: 'PSY-0001',
        specialty: 'Clinical Psychology',
        isActive: true,
        createdAt: '2026-03-24T06:30:00.000Z',
        updatedAt: '2026-03-24T06:30:00.000Z',
      },
      signature: {
        id: '1b7f2ef2-41a0-4cdf-b909-c997dcf81c1a',
        clinicalReportId: '89c6dc15-598f-483a-966b-15be71f03c44',
        storagePath: 'signatures/doctor.png',
        signedAt: '2026-03-24T07:45:00.000Z',
      },
      scoringSummary: {
        isValid: true,
        cannotSayCount: 3,
        notes: ['No critical validity threshold violations.'],
      },
    },
    output: {
      storageKey: 'reports/89c6dc15-598f-483a-966b-15be71f03c44.pdf',
      fileName: 'mmpi2-report-89c6dc15.pdf',
      contentType: 'application/pdf',
    },
  });
}

describe('buildReportCompositionData', () => {
  it('maps report and scoring snapshot into report composition model', () => {
    const payload = createJobPayload();
    const composition = buildReportCompositionData(payload);

    expect(composition.reportId).toBe(payload.source.report.id);
    expect(composition.patientName).toBe('Patient One');
    expect(composition.patientDob).toBe('1990-01-02');
    expect(composition.doctorLicense).toBe('PSY-0001');
    expect(composition.validity.isValid).toBe(true);
    expect(composition.validity.cannotSayCount).toBe(3);
    expect(composition.validityScales.map((row) => row.scaleKey)).toEqual(['L', 'F']);
    expect(composition.clinicalScales.map((row) => row.scaleKey)).toEqual(['D', 'Sc']);
    expect(composition.clinicalScales[0]?.isClinicallySignificant).toBe(true);
    expect(composition.recommendations).toBe('Recommend follow-up interview.');
  });
});
