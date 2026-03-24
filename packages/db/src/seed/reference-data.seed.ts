import { MMPI2_1989_REFERENCE_CATALOG } from '@mmpi2/config';
import type { PrismaClient } from '../generated/client/index.js';

const ASSESSMENT_TYPE_ID = '00000000-0000-0000-0000-000000000010';

function mapScaleGroup(group: string): string {
  switch (group) {
    case 'Response Inconsistency Scales':
    case 'Validity Scales':
      return 'validity';
    case 'Clinical Scales':
      return 'clinical';
    case 'Koss Butcher Critical Items':
    case 'Lachar Wrobel Critical Items':
      return 'critical';
    default:
      return 'supplementary';
  }
}

export async function seedReferenceData(prisma: PrismaClient) {
  const { versionTriplet, questionBankItems, scaleDefinitions, scaleKeyEntries, normTables } =
    MMPI2_1989_REFERENCE_CATALOG;

  await prisma.assessmentType.upsert({
    where: { code: versionTriplet.instrument.name },
    update: {
      name: versionTriplet.instrument.name,
      description: 'Minnesota Multiphasic Personality Inventory-2',
    },
    create: {
      id: ASSESSMENT_TYPE_ID,
      code: versionTriplet.instrument.name,
      name: versionTriplet.instrument.name,
      description: 'Minnesota Multiphasic Personality Inventory-2',
    },
  });

  await prisma.instrumentVersion.upsert({
    where: { id: versionTriplet.instrument.id },
    update: {
      assessmentTypeId: ASSESSMENT_TYPE_ID,
      versionLabel: versionTriplet.instrument.revision,
      isActive: versionTriplet.instrument.isActive,
      effectiveFrom: new Date(versionTriplet.instrument.publishedAt),
    },
    create: {
      id: versionTriplet.instrument.id,
      assessmentTypeId: ASSESSMENT_TYPE_ID,
      versionLabel: versionTriplet.instrument.revision,
      isActive: versionTriplet.instrument.isActive,
      effectiveFrom: new Date(versionTriplet.instrument.publishedAt),
    },
  });

  await prisma.questionBankVersion.upsert({
    where: { id: versionTriplet.questionBank.id },
    update: {
      instrumentVersionId: versionTriplet.instrument.id,
      versionLabel: versionTriplet.questionBank.version,
      checksum: versionTriplet.questionBank.checksum,
      isActive: versionTriplet.questionBank.isActive,
      effectiveFrom: new Date(versionTriplet.questionBank.releasedAt),
    },
    create: {
      id: versionTriplet.questionBank.id,
      instrumentVersionId: versionTriplet.instrument.id,
      versionLabel: versionTriplet.questionBank.version,
      checksum: versionTriplet.questionBank.checksum,
      isActive: versionTriplet.questionBank.isActive,
      effectiveFrom: new Date(versionTriplet.questionBank.releasedAt),
    },
  });

  await prisma.scoringConfigVersion.upsert({
    where: { id: versionTriplet.scoringConfig.id },
    update: {
      instrumentVersionId: versionTriplet.instrument.id,
      versionLabel: versionTriplet.scoringConfig.version,
      checksum: versionTriplet.scoringConfig.checksum,
      isActive: versionTriplet.scoringConfig.isActive,
      effectiveFrom: new Date(versionTriplet.scoringConfig.releasedAt),
    },
    create: {
      id: versionTriplet.scoringConfig.id,
      instrumentVersionId: versionTriplet.instrument.id,
      versionLabel: versionTriplet.scoringConfig.version,
      checksum: versionTriplet.scoringConfig.checksum,
      isActive: versionTriplet.scoringConfig.isActive,
      effectiveFrom: new Date(versionTriplet.scoringConfig.releasedAt),
    },
  });

  await prisma.questionBankItem.deleteMany({
    where: { questionBankVersionId: versionTriplet.questionBank.id },
  });

  await prisma.questionBankItem.createMany({
    data: questionBankItems.map((item) => ({
      questionBankVersionId: versionTriplet.questionBank.id,
      questionNumber: item.questionNumber,
      itemText: item.itemText,
      isActive: item.isActive,
    })),
  });

  await prisma.scaleDefinition.deleteMany({
    where: { scoringConfigVersionId: versionTriplet.scoringConfig.id },
  });

  await prisma.scaleDefinition.createMany({
    data: scaleDefinitions.map((definition) => ({
      scoringConfigVersionId: versionTriplet.scoringConfig.id,
      scaleCode: definition.key,
      scaleGroup: mapScaleGroup(definition.group),
      displayName: definition.name,
      scoreType: definition.scoreType,
      usesKCorrection: definition.kCorrectionWeight !== undefined,
      kCorrectionWeight: definition.kCorrectionWeight,
    })),
  });

  await prisma.scaleKeyEntry.deleteMany({
    where: { scoringConfigVersionId: versionTriplet.scoringConfig.id },
  });

  await prisma.scaleKeyEntry.createMany({
    data: scaleKeyEntries.map((entry) => ({
      scoringConfigVersionId: versionTriplet.scoringConfig.id,
      scaleCode: entry.scaleKey,
      questionNumber: entry.questionNumber,
      keyedAnswer: entry.keyedAnswer,
      weight: entry.weight,
    })),
  });

  await prisma.normTable.deleteMany({
    where: { scoringConfigVersionId: versionTriplet.scoringConfig.id },
  });

  for (const table of normTables) {
    await prisma.normTable.create({
      data: {
        scoringConfigVersionId: versionTriplet.scoringConfig.id,
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
