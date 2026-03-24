import {
  renderToBuffer,
} from '@react-pdf/renderer';
import type { ReportCompositionData } from '../models/report-model.js';
import { createClinicalReportDocument } from './templates/clinical-report-template.js';

export async function renderClinicalReportPdf(report: ReportCompositionData): Promise<Uint8Array> {
  return renderToBuffer(createClinicalReportDocument(report));
}
