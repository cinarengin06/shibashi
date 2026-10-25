import rawData from "./data.json";

export {
  deepMeridianVisuals,
  movementPointMarkers,
  pointGuidance,
  type DeepMeridianVisual,
  type MovementPointMarker,
  type PointGuidance,
} from "./visual-map";

export {
  getMovementOrganVisuals,
  type ActiveOrganVisual,
  type OrganRole,
  type OrganVisual,
} from "./organ-world";

export type MeridianEvidenceLevel =
  "Doğrudan" | "Güçlü" | "Orta" | "Doğrudan + güçlü";

export interface MeridianMovementKnowledge {
  movementId: string;
  order: number;
  sourceTitle: string;
  appAliases: string[];
  anatomy: string;
  primaryMeridians: string[];
  secondaryMeridians: string[];
  extraordinaryMeridians: string[];
  pointCodes: string[];
  teachingConnection: string;
  evidenceLevel: MeridianEvidenceLevel;
  basis: string;
  bodyCue: string;
}

export interface AcupointKnowledge {
  code: string;
  pinyin: string;
  anatomicalLocation: string;
  classicalSummary: string;
  extraordinaryConnection: string | null;
  source: string;
}

export interface ExtraordinaryMeridianKnowledge {
  id: string;
  name: string;
  teachingSummary: string;
  openingPoint: string;
  pairedPoint: string;
  immortalName: string;
  coachId: "he" | "han" | "li" | "lu" | "zhang" | "lan" | "cao" | "zhongli";
  dominantTheme: string;
}

export interface PracticeMeridianSummary {
  movementCount: number;
  anatomyCues: string[];
  primaryMeridians: string[];
  extraordinaryMeridians: string[];
  pointCodes: string[];
}

type MeridianKnowledgeData = {
  source: {
    title: string;
    workbook: string;
    teachingDocument: string;
    version: string;
  };
  movements: MeridianMovementKnowledge[];
  points: AcupointKnowledge[];
  extraordinaryMeridians: ExtraordinaryMeridianKnowledge[];
};

const data = rawData as MeridianKnowledgeData;

export const meridianKnowledgeSource = data.source;
export const meridianMovements = data.movements;
export { meridianLivingSteps } from "./livingSteps";
export { getMovementEnergyTag, movementEnergyTags, type MovementEnergyTag } from "./yinYang";
export const acupoints = data.points;
export const extraordinaryMeridians = data.extraordinaryMeridians;

export const meridianClinicalBoundary =
  "Bu içerik geleneksel Shibashi öğretimini ve bedensel farkındalığı destekler; tanı veya tedavi önerisi değildir. Bir noktanın klasik kullanım alanı, hareketin tek başına aynı etkiyi sağlayacağı anlamına gelmez.";

export const meridianTeachingMethod =
  "Hareketler tek bir meridyene indirgenmez. Anatomi, beden yüzeyleri, klasik kanal güzergâhları ve öğretim imgeleri birlikte okunur.";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getMovementKnowledge(value: number | string) {
  if (typeof value === "number")
    return meridianMovements.find((item) => item.order === value);
  const idMatch = value.match(/(?:movement-)?(\d+)$/i);
  if (idMatch)
    return meridianMovements.find((item) => item.order === Number(idMatch[1]));
  const target = normalize(value);
  return meridianMovements.find(
    (item) =>
      normalize(item.sourceTitle) === target ||
      item.appAliases.some((alias) => normalize(alias) === target),
  );
}

export function getPoint(code: string) {
  return acupoints.find(
    (point) =>
      point.code.toLocaleUpperCase("tr-TR") === code.toLocaleUpperCase("tr-TR"),
  );
}

export function getPointsForMovement(value: number | string) {
  return (getMovementKnowledge(value)?.pointCodes ?? [])
    .map(getPoint)
    .filter((point): point is AcupointKnowledge => Boolean(point));
}

export function getExtraordinaryMeridian(value: string) {
  const target = normalize(value);
  return extraordinaryMeridians.find(
    (item) => item.id === target || normalize(item.name) === target,
  );
}

export function getMeridianForCoach(
  coachId: ExtraordinaryMeridianKnowledge["coachId"],
) {
  return extraordinaryMeridians.find((item) => item.coachId === coachId);
}

function uniqueByFrequency(values: string[], limit: number) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .sort(
      (left, right) =>
        right[1] - left[1] || left[0].localeCompare(right[0], "tr"),
    )
    .slice(0, limit)
    .map(([value]) => value);
}

export function buildPracticeMeridianSummary(
  movementIds: Array<number | string>,
): PracticeMeridianSummary {
  const matched = movementIds
    .map(getMovementKnowledge)
    .filter((item): item is MeridianMovementKnowledge => Boolean(item));
  return {
    movementCount: matched.length,
    anatomyCues: matched.slice(0, 3).map((item) => item.bodyCue),
    primaryMeridians: uniqueByFrequency(
      matched.flatMap((item) => item.primaryMeridians),
      4,
    ),
    extraordinaryMeridians: uniqueByFrequency(
      matched.flatMap((item) => item.extraordinaryMeridians),
      3,
    ),
    pointCodes: uniqueByFrequency(
      matched.flatMap((item) => item.pointCodes),
      5,
    ),
  };
}

export function getLeastExploredMeridian(
  completedMovementIds: Array<number | string>,
) {
  const counts = new Map(extraordinaryMeridians.map((item) => [item.name, 0]));
  completedMovementIds
    .map(getMovementKnowledge)
    .filter((item): item is MeridianMovementKnowledge => Boolean(item))
    .forEach((item) =>
      item.extraordinaryMeridians.forEach((name) =>
        counts.set(name, (counts.get(name) ?? 0) + 1),
      ),
    );
  const [name] =
    [...counts.entries()].sort((left, right) => left[1] - right[1])[0] ?? [];
  return name ? getExtraordinaryMeridian(name) : extraordinaryMeridians[0];
}

export function getSuggestedMovementForMeridian(
  meridianName: string,
  excludedMovementIds: Array<number | string> = [],
) {
  const excluded = new Set(
    excludedMovementIds
      .map((value) => getMovementKnowledge(value)?.movementId)
      .filter(Boolean),
  );
  return (
    meridianMovements.find(
      (movement) =>
        movement.extraordinaryMeridians.includes(meridianName) &&
        !excluded.has(movement.movementId),
    ) ??
    meridianMovements.find((movement) =>
      movement.extraordinaryMeridians.includes(meridianName),
    )
  );
}
