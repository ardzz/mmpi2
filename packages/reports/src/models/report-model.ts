/**
 * Report composition models — consumed by PDF templates.
 * These are presentation-layer types derived from canonical ScoreResultSet.
 */

export interface ScaleDisplayRow {
  scaleKey: string;
  scaleName: string;
  rawScore: number;
  tScore: number | null;
  isElevated: boolean;
  isClinicallySignificant: boolean;
}

export interface ReportCompositionData {
  reportId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  examDate: string;
  doctorName: string;
  doctorLicense: string;
  publishedAt: string;
  validity: {
    isValid: boolean;
    cannotSayCount: number;
    notes: string[];
  };
  clinicalScales: ScaleDisplayRow[];
  validityScales: ScaleDisplayRow[];
  narrativeSummary: string;
  clinicalNotes?: string;
  recommendations?: string;
  amendedFromId?: string;
}
