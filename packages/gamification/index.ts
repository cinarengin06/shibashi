export type FormStep = "watched" | "attempted" | "completed";
export type FormSteps = Record<number, Partial<Record<FormStep, boolean>>>;
export type FormRecord = { order: number; date: string };
export type EarnedMilestone = { id: string; earnedAt: string };

export const milestoneDefinitions = [
  { id: "first-form", icon: "✦", title: "Qi Yolcusu", detail: "İlk formunu tamamladın", message: "İlk formunla yolculuğa başladın. Artık bir Qi Yolcususun." },
  { id: "five-forms", icon: "🌿", title: "Form Kaşifi", detail: "5 farklı form tamamladın", message: "Beş farklı formu bedeninde denedin. Artık bir Form Kaşifisin." },
  { id: "steady-form", icon: "◉", title: "Ritim Koruyucusu", detail: "Aynı formu 3 farklı gün çalıştın", message: "Aynı forma üç ayrı gün döndün. Artık bir Ritim Koruyucususun." },
  { id: "posture-growth", icon: "↗", title: "Beden Gözlemcisi", detail: "İki postür kaydın var", message: "İki postür kaydıyla değişimini izlemeye başladın. Artık bir Beden Gözlemcisisin." },
  { id: "all-forms", icon: "☯", title: "Shibashi Tamamlayıcısı", detail: "18 formu tamamladın", message: "On sekiz formun tamamını çalıştın. Artık bir Shibashi Tamamlayıcısısın." },
] as const;

export const shenDailyCues: Record<"hun" | "shen" | "yi" | "po" | "zhi", string> = {
  hun: "Bugün yeni bir yöne açıl. Bir formu bedeninde dene.",
  shen: "Bugün hareketin içinde kal. Bir formu bedeninde dene.",
  yi: "Bugün dikkatini topla. Bir formu bedeninde dene.",
  po: "Bugün nefesini dinle. Bir formu bedeninde dene.",
  zhi: "Bugün küçük bir adım at. Bir formu bedeninde dene.",
};

export function localDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function completedFormOrders(records: FormRecord[]): number[] {
  return [...new Set(records.map((record) => record.order).filter((order) => Number.isInteger(order) && order >= 1 && order <= 18))];
}

export function personalMilestones(records: FormRecord[], postureCount: number) {
  const completed = completedFormOrders(records);
  const datesByForm = new Map<number, Set<string>>();
  records.forEach(({ order, date }) => {
    const key = localDateKey(date);
    if (!key || !Number.isInteger(order) || order < 1 || order > 18) return;
    const dates = datesByForm.get(order) ?? new Set<string>();
    dates.add(key);
    datesByForm.set(order, dates);
  });
  const earned = [completed.length >= 1, completed.length >= 5, [...datesByForm.values()].some((dates) => dates.size >= 3), postureCount >= 2, completed.length >= 18];
  return milestoneDefinitions.map((item, index) => ({ ...item, earned: earned[index] }));
}
