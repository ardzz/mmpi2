import type { ScaleResult } from '@mmpi2/contracts';
import type {
  ReportArtifactJobPayload,
} from '../jobs/report-artifact-job.js';
import type {
  ReportCompositionData,
  ScaleDisplayRow,
} from '../models/report-model.js';

const SCALE_NAME_BY_CODE: Record<string, string> = {
  L: 'Lie (L)',
  F: 'Infrequency (F)',
  K: 'Correction (K)',
  VRIN: 'Variable Response Inconsistency (VRIN)',
  TRIN: 'True Response Inconsistency (TRIN)',
  Fb: 'Back Infrequency (Fb)',
  Fp: 'Infrequency-Psychopathology (Fp)',
  Hs: 'Hypochondriasis (Hs)',
  D: 'Depression (D)',
  Hy: 'Hysteria (Hy)',
  Pd: 'Psychopathic Deviate (Pd)',
  Mf: 'Masculinity-Femininity (Mf)',
  Pa: 'Paranoia (Pa)',
  Pt: 'Psychasthenia (Pt)',
  Sc: 'Schizophrenia (Sc)',
  Ma: 'Hypomania (Ma)',
  Si: 'Social Introversion (Si)',
};

const VALIDITY_SCALE_ORDER = ['L', 'F', 'K', 'VRIN', 'TRIN', 'Fb', 'Fp'] as const;
const CLINICAL_SCALE_ORDER = ['Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'] as const;

const VALIDITY_SCALE_SET = new Set<string>(VALIDITY_SCALE_ORDER);
const CLINICAL_SCALE_SET = new Set<string>(CLINICAL_SCALE_ORDER);

export function buildReportCompositionData(
  payload: ReportArtifactJobPayload,
): ReportCompositionData {
  const { source } = payload;
  const publishedAt = source.report.publishedAt;

  if (publishedAt === null) {
    throw new Error('Published report must include publishedAt before composition.');
  }

  const validityScales = source.scaleResults
    .filter((scaleResult) => VALIDITY_SCALE_SET.has(scaleResult.scaleCode))
    .sort((left, right) => compareByDefinedOrder(left.scaleCode, right.scaleCode, VALIDITY_SCALE_ORDER))
    .map((scaleResult) => toScaleDisplayRow(scaleResult));

  const clinicalScales = source.scaleResults
    .filter((scaleResult) => CLINICAL_SCALE_SET.has(scaleResult.scaleCode))
    .sort((left, right) => compareByDefinedOrder(left.scaleCode, right.scaleCode, CLINICAL_SCALE_ORDER))
    .map((scaleResult) => toScaleDisplayRow(scaleResult));

  return {
    reportId: source.report.id,
    patientName: source.patientProfile.fullName,
    patientDob: toDateOnly(source.patientProfile.dateOfBirth),
    patientGender: source.patientProfile.gender,
    examDate: toDateOnly(source.scoreResultSet.scoredAt ?? source.report.createdAt),
    doctorName: source.doctorProfile.fullName,
    doctorLicense: source.doctorProfile.licenseNumber,
    publishedAt: publishedAt.toISOString(),
    validity: {
      isValid: source.scoringSummary.isValid,
      cannotSayCount: source.scoringSummary.cannotSayCount,
      notes: source.scoringSummary.notes,
    },
    clinicalScales,
    validityScales,
    narrativeSummary: source.report.interpretationSummary ?? source.report.narrative ?? '',
    clinicalNotes: toOptionalString(source.report.supplementalObservations?.clinicalProfile),
    recommendations: toOptionalString(source.report.supplementalObservations?.conclusion),
    amendedFromId: source.report.amendedFromId ?? undefined,
  };
}

function toScaleDisplayRow(scaleResult: ScaleResult): ScaleDisplayRow {
  const tScore = scaleResult.tScore;
  const severityBand = scaleResult.severityBand;

  return {
    scaleKey: scaleResult.scaleCode,
    scaleName: SCALE_NAME_BY_CODE[scaleResult.scaleCode] ?? scaleResult.scaleCode,
    rawScore: scaleResult.rawScore,
    tScore,
    isElevated: tScore !== null ? tScore >= 65 : severityBand === 'moderate' || severityBand === 'high' || severityBand === 'very_high',
    isClinicallySignificant:
      tScore !== null ? tScore >= 70 : severityBand === 'high' || severityBand === 'very_high',
  };
}

function compareByDefinedOrder(
  leftCode: string,
  rightCode: string,
  order: readonly string[],
): number {
  const leftIndex = order.indexOf(leftCode);
  const rightIndex = order.indexOf(rightCode);

  if (leftIndex === -1 && rightIndex === -1) {
    return leftCode.localeCompare(rightCode);
  }

  if (leftIndex === -1) {
    return 1;
  }

  if (rightIndex === -1) {
    return -1;
  }

  return leftIndex - rightIndex;
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
