import rawQuestions from './assets/raw/mmpi2-1989.questions.json';
import rawScaleGroups from './assets/raw/mmpi2-1989.scales.json';
import type {
  ConsistencyPairRule,
  CriticalItemGroupRecord,
  NormTableRecord,
  QuestionBankItemRecord,
  ReferenceCatalog,
  ScaleDefinitionRecord,
  ScaleKeyEntryRecord,
  ValidityThresholdRecord,
} from './types.js';
import { MMPI2_1989_TRIPLET } from './versions.js';

type RawQuestionList = string[];

type RawSimpleAnswer = [number, boolean];
type RawPairAnswer = [number, boolean, number, boolean, number];
type RawAnswerEntry = RawSimpleAnswer | RawPairAnswer;

interface RawScaleItem {
  name: string;
  title: string;
  text?: string;
  code?: string;
  gender?: 'male' | 'female';
  answers: RawAnswerEntry[];
  tScores?: Partial<Record<'male' | 'female', number[]>>;
  baseScore?: number;
  scoreOffsets?: Partial<Record<'male' | 'female', number>>;
  kCorrection?: number;
  indications?: Record<string, string[] | string>;
  subScales?: RawScaleItem[];
  comment?: string;
}

interface RawScaleGroup {
  title: string;
  items: RawScaleItem[];
}

const QUESTION_BANK = rawQuestions as RawQuestionList;
const SCALE_GROUPS = rawScaleGroups as RawScaleGroup[];

const CRITICAL_GROUP_PREFIXES = ['KB', 'LW'] as const;
const VALIDITY_THRESHOLDS: ValidityThresholdRecord = {
  cannotSayMax: 30,
  vrinMax: 80,
  trinMax: 80,
  fMax: 110,
};

function toAnswerState(value: boolean): 'true' | 'false' {
  return value ? 'true' : 'false';
}

function toQuestionBankItems(questions: RawQuestionList): QuestionBankItemRecord[] {
  return questions.map((itemText, index) => ({
    questionNumber: index + 1,
    itemText,
    isActive: true,
  }));
}

function flattenScaleItems(items: RawScaleItem[]): RawScaleItem[] {
  return items.flatMap((item) => [item, ...(item.subScales ? flattenScaleItems(item.subScales) : [])]);
}

function inferScoreType(item: RawScaleItem): 'raw' | 't_score' {
  return item.tScores ? 't_score' : 'raw';
}

function deriveScaleItems(entries: RawAnswerEntry[]): number[] {
  return [...new Set(entries.flatMap((entry) => (entry.length === 2 ? [entry[0]] : [entry[0], entry[2]])))].sort(
    (left, right) => left - right,
  );
}

function deriveSimpleKeySets(entries: RawAnswerEntry[]) {
  const trueKeyed: number[] = [];
  const falseKeyed: number[] = [];

  for (const entry of entries) {
    if (entry.length !== 2) {
      continue;
    }

    const [questionNumber, expectedAnswer] = entry;
    if (expectedAnswer) {
      trueKeyed.push(questionNumber);
    } else {
      falseKeyed.push(questionNumber);
    }
  }

  return {
    trueKeyed: [...new Set(trueKeyed)].sort((left, right) => left - right),
    falseKeyed: [...new Set(falseKeyed)].sort((left, right) => left - right),
  };
}

function buildScaleDefinitionRecord(groupTitle: string, item: RawScaleItem): ScaleDefinitionRecord {
  const { trueKeyed, falseKeyed } = deriveSimpleKeySets(item.answers);

  return {
    key: item.name,
    name: item.title,
    group: groupTitle,
    scoreType: inferScoreType(item),
    items: deriveScaleItems(item.answers),
    trueKeyed,
    falseKeyed,
    kCorrectionWeight: item.kCorrection,
    gender: item.gender,
    sourceTitle: item.title,
  };
}

function buildScaleKeyEntries(item: RawScaleItem): ScaleKeyEntryRecord[] {
  return item.answers.flatMap((entry) => {
    if (entry.length !== 2) {
      return [];
    }

    const [questionNumber, expectedAnswer] = entry;
    return [
      {
        scaleKey: item.name,
        questionNumber,
        keyedAnswer: toAnswerState(expectedAnswer),
        weight: 1,
      },
    ];
  });
}

function buildConsistencyPairs(item: RawScaleItem): ConsistencyPairRule[] {
  if (item.name !== 'VRIN' && item.name !== 'TRIN') {
    return [];
  }

  const scaleKey: ConsistencyPairRule['scaleKey'] = item.name;

  return item.answers.flatMap((entry) => {
    if (entry.length !== 5) {
      return [];
    }

    const [leftQuestionNumber, leftAnswer, rightQuestionNumber, rightAnswer, weight] = entry;
    return [
      {
        scaleKey,
        leftQuestionNumber,
        leftAnswer: toAnswerState(leftAnswer),
        rightQuestionNumber,
        rightAnswer: toAnswerState(rightAnswer),
        weight,
      },
    ];
  });
}

function buildNormTables(item: RawScaleItem): NormTableRecord[] {
  if (!item.tScores) {
    return [];
  }

  return Object.entries(item.tScores).flatMap(([gender, values]) => {
    if (gender !== 'male' && gender !== 'female') {
      return [];
    }

    const rawToTScore = Object.fromEntries(values.map((value, index) => [index, value]));
    return [
      {
        normCode: `${item.name}-${gender}`,
        scaleKey: item.name,
        gender,
        rawToTScore,
      },
    ];
  });
}

function isCriticalItemGroup(item: RawScaleItem) {
  return CRITICAL_GROUP_PREFIXES.some((prefix) => item.name.startsWith(prefix));
}

function buildCriticalItemGroup(item: RawScaleItem): CriticalItemGroupRecord | null {
  if (!isCriticalItemGroup(item)) {
    return null;
  }

  const { trueKeyed, falseKeyed } = deriveSimpleKeySets(item.answers);
  return {
    key: item.name,
    title: item.title,
    items: deriveScaleItems(item.answers),
    trueKeyed,
    falseKeyed,
  };
}

const flattenedScaleItems = SCALE_GROUPS.flatMap((group) =>
  flattenScaleItems(group.items).map((item) => ({ groupTitle: group.title, item })),
);

export const MMPI2_1989_REFERENCE_CATALOG: ReferenceCatalog = {
  versionTriplet: MMPI2_1989_TRIPLET,
  questionBankItems: toQuestionBankItems(QUESTION_BANK),
  scaleDefinitions: flattenedScaleItems.map(({ groupTitle, item }) =>
    buildScaleDefinitionRecord(groupTitle, item),
  ),
  scaleKeyEntries: flattenedScaleItems.flatMap(({ item }) => buildScaleKeyEntries(item)),
  normTables: flattenedScaleItems.flatMap(({ item }) => buildNormTables(item)),
  consistencyPairs: flattenedScaleItems.flatMap(({ item }) => buildConsistencyPairs(item)),
  criticalItemGroups: flattenedScaleItems
    .map(({ item }) => buildCriticalItemGroup(item))
    .filter((group): group is CriticalItemGroupRecord => group !== null),
  validityThresholds: VALIDITY_THRESHOLDS,
};
