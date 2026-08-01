export type ExperienceLayerId = "arrival" | "practice" | "awareness" | "mastery";

export type ExperienceLayer = {
  id: ExperienceLayerId;
  label: string;
  dayRange: string;
  familiarName: string;
  homeKicker: string;
  homeTitle: string;
  homeBody: string;
};

export const experienceLayers: Record<ExperienceLayerId, ExperienceLayer> = {
  arrival: {
    id: "arrival",
    label: "Arrival",
    dayRange: "1–7",
    familiarName: "Yerleşme",
    homeKicker: "BUGÜN BURADAYIZ",
    homeTitle: "Önce biraz yavaşlayalım.",
    homeBody: "Birkaç sakin nefes ve tek bir yumuşak hareket bugün için yeterli.",
  },
  practice: {
    id: "practice",
    label: "Practice",
    dayRange: "8–20",
    familiarName: "Pratik",
    homeKicker: "RİTMİN OLUŞUYOR",
    homeTitle: "Bedenin yolu hatırlıyor.",
    homeBody: "Bugün hareketi büyütmeden önce nefesi ve ağırlık aktarımını dinle.",
  },
  awareness: {
    id: "awareness",
    label: "Awareness",
    dayRange: "21–60",
    familiarName: "Farkındalık",
    homeKicker: "BEDENİNİ DİNLİYORSUN",
    homeTitle: "İçerideki değişimi fark et.",
    homeBody: "Pratik artık yalnızca hareket değil; günün içinde nasıl durduğunu da gösteriyor.",
  },
  mastery: {
    id: "mastery",
    label: "Mastery",
    dayRange: "60+",
    familiarName: "Ustalık",
    homeKicker: "KENDİ AKIŞIN",
    homeTitle: "Bugün yolu sen seç.",
    homeBody: "Rehber yalnızca ihtiyaç duyduğunda konuşur. Sessizlik de pratiğin bir parçasıdır.",
  },
};

export function getJourneyDay(startedAt?: string | null, now = new Date()) {
  if (!startedAt) return 1;
  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) return 1;
  const elapsed = now.getTime() - started.getTime();
  return Math.max(1, Math.floor(elapsed / 86_400_000) + 1);
}

export function getExperienceLayer(day: number): ExperienceLayer {
  if (day <= 7) return experienceLayers.arrival;
  if (day <= 20) return experienceLayers.practice;
  if (day <= 60) return experienceLayers.awareness;
  return experienceLayers.mastery;
}

export function canRevealFeature(layer: ExperienceLayerId, feature: "posture" | "teacher" | "journal" | "bagua" | "custom-flow") {
  const order: ExperienceLayerId[] = ["arrival", "practice", "awareness", "mastery"];
  const requirement: Record<typeof feature, ExperienceLayerId> = {
    posture: "arrival",
    teacher: "practice",
    journal: "awareness",
    bagua: "awareness",
    "custom-flow": "mastery",
  };
  return order.indexOf(layer) >= order.indexOf(requirement[feature]);
}
