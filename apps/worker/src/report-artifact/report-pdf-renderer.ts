import {
  renderClinicalReportPdf,
  type ReportCompositionData,
} from '@mmpi2/reports';
import { Injectable } from '@nestjs/common';

export abstract class ReportPdfRenderer {
  abstract render(report: ReportCompositionData): Promise<Uint8Array>;
}

@Injectable()
export class ReactPdfReportRenderer extends ReportPdfRenderer {
  render(report: ReportCompositionData): Promise<Uint8Array> {
    return renderClinicalReportPdf(report);
  }
}
