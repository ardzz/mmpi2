import {
  describe,
  expect,
  it,
} from 'vitest';
import { buildReportCompositionData } from '../composition/report-composition.js';
import { ReportArtifactJobPayloadSchema } from '../jobs/report-artifact-job.js';
import { renderClinicalReportPdf } from '../pdf/render-clinical-report.js';

describe('renderClinicalReportPdf', () => {
  it('renders a PDF buffer from report composition data', async () => {
    const payload = ReportArtifactJobPayloadSchema.parse({
      jobId: '36ca6fca-42db-45bb-9ec8-3dc76238be95',
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
        signature: null,
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

    const composition = buildReportCompositionData(payload);
    const pdfBytes = await renderClinicalReportPdf(composition);

    expect(pdfBytes.byteLength).toBeGreaterThan(1024);
    expect(Buffer.from(pdfBytes).subarray(0, 4).toString('utf8')).toBe('%PDF');
  });
});
