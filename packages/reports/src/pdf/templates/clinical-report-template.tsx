import {
  Document,
  Page,
  Text,
} from '@react-pdf/renderer';
import React from 'react';
import type { ReactElement } from 'react';
import type { ReportCompositionData } from '../../models/report-model.js';
import {
  KeyValueGrid,
  ScaleTable,
  Section,
  reportStyles,
} from '../primitives.js';

export function createClinicalReportDocument(report: ReportCompositionData): ReactElement {
  return (
    <Document title={`Clinical Report ${report.reportId}`}>
      <Page size="A4" style={reportStyles.page}>
        <Text style={reportStyles.title}>MMPI-2 Clinical Report</Text>
        <Text style={reportStyles.subtitle}>Report ID: {report.reportId}</Text>

        <Section title="Case Overview">
          <KeyValueGrid
            items={[
              {
                key: 'patient_name',
                label: 'Patient Name',
                value: report.patientName,
              },
              {
                key: 'patient_dob',
                label: 'Date of Birth',
                value: report.patientDob,
              },
              {
                key: 'patient_gender',
                label: 'Gender',
                value: report.patientGender,
              },
              {
                key: 'exam_date',
                label: 'Exam Date',
                value: report.examDate,
              },
              {
                key: 'doctor_name',
                label: 'Doctor',
                value: report.doctorName,
              },
              {
                key: 'doctor_license',
                label: 'License',
                value: report.doctorLicense,
              },
              {
                key: 'published_at',
                label: 'Published At',
                value: report.publishedAt,
              },
              {
                key: 'validity',
                label: 'Profile Validity',
                value: report.validity.isValid ? 'Valid' : 'Requires Caution',
              },
            ]}
          />
        </Section>

        <Section title="Validity Summary">
          <Text style={reportStyles.bodyText}>Cannot Say Count: {report.validity.cannotSayCount}</Text>
          <Text style={reportStyles.bodyText}>
            Notes: {report.validity.notes.length === 0 ? 'No critical validity notes.' : report.validity.notes.join(' | ')}
          </Text>
          <ScaleTable rows={report.validityScales} />
        </Section>

        <Section title="Clinical Scale Profile">
          <ScaleTable rows={report.clinicalScales} />
        </Section>

        <Section title="Interpretation Summary">
          <Text style={reportStyles.bodyText}>{report.narrativeSummary}</Text>
          {report.clinicalNotes !== undefined ? (
            <Text style={reportStyles.bodyText}>Clinical Notes: {report.clinicalNotes}</Text>
          ) : null}
          {report.recommendations !== undefined ? (
            <Text style={reportStyles.bodyText}>Recommendations: {report.recommendations}</Text>
          ) : null}
        </Section>
      </Page>
    </Document>
  );
}
