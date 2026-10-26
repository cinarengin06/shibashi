import { getMovementEnergyTag } from "../meridian-knowledge/yinYang";

export type FormStep = "watched" | "attempted" | "completed" | "videoCompleted";
export type FormSteps = Record<number, Partial<Record<FormStep, boolean>>>;
export type FormRecord = { order: number; date: string };
export type EarnedMilestone = { id: string; earnedAt: string };

export const milestoneDefinitions = [
  { id: "first-form", icon: "✦", title: "Qi Yolcusu", detail: "İlk formunu tamamladın", message: "İlk formunla yolculuğa başladın. Artık bir Qi Yolcususun." },
  { id: "five-forms", icon: "🌿", title: "Form Kaşifi", detail: "5 farklı form tamamladın", message: "Beş farklı formu bedeninde denedin. Artık bir Form Kaşifisin." },
  { id: "steady-form", icon: "◉", title: "Ritim Koruyucusu", detail: "Aynı formu 3 farklı gün çalıştın", message: "Aynı forma üç ayrı gün döndün. Artık bir Ritim Koruyucususun." },
  { id: "posture-growth", icon: "↗", title: "Beden Gözlemcisi", detail: "İki postür kaydın var", message: "İki postür kaydıyla değişimini izlemeye başladın. Artık bir Beden Gözlemcisisin." },
  { id: "all-forms", icon: "☯", title: "Shibashi Tamamlayıcısı", detail: "18 formu tamamladın", message: "On sekiz formun tamamını çalıştın. Artık bir Shibashi Tamamlayıcısısın." },
  { id: "yin-yang-discovery", icon: "☯", title: "İki Yolun Kaşifi", detail: "İlk Yin ve Yang formlarını tamamladın", message: "Yin ve Yang yönlerini keşfettin. Artık İki Yolun Kaşifisin." },
  { id: "yin-yang-balance", icon: "◐", title: "Denge Bahçıvanı", detail: "En az dört Yin ve dört Yang formunu tamamladın", message: "İki yönde de ilerledin. Artık bir Denge Bahçıvanısın." },
  { id: "gate-explorer", icon: "⛩", title: "Kapı Kaşifi", detail: "Sekiz Kapıdan birinin içeriğini keşfettin", message: "Bir beden kapısını açıp ilgili formları keşfettin. Artık bir Kapı Kaşifisin." },
] as const;

export const xpRewards = { firstForm: 20, repeatOnNewDay: 5, dailyTask: 10, teacherVideo: 5 } as const;

export type JourneyRecord = { order: number; date: string };

export function yinYangSummary(completedOrders: Iterable<number>, todayRecords: JourneyRecord[] = [], now = new Date()) {
  const valid = (order: number) => Number.isInteger(order) && order >= 1 && order <= 18;
  const completed = [...new Set([...completedOrders].filter(valid))];
  const yin = completed.filter(order => getMovementEnergyTag(order).quality === "Yin").length;
  const yang = completed.length - yin;
  const todayKey = localDateKey(now);
  const todayOrders = [...new Set(todayRecords.filter(record => valid(record.order) && localDateKey(record.date) === todayKey).map(record => record.order))];
  const todayYin = todayOrders.filter(order => getMovementEnergyTag(order).quality === "Yin").length;
  const todayYang = todayOrders.length - todayYin;
  const nextQuality = yin === yang ? null : yin < yang ? "Yin" : "Yang";
  return { yin, yang, total: completed.length, todayYin, todayYang, todayTotal: todayOrders.length,
    todayYinPercent: todayOrders.length ? Math.round(todayYin / todayOrders.length * 100) : 0,
    todayYangPercent: todayOrders.length ? Math.round(todayYang / todayOrders.length * 100) : 0,
    suggestion: nextQuality ? `Şimdi ${nextQuality} formlarını keşfetmeye ne dersin?` : "Yin ve Yang formlarını birlikte keşfet." };
}

export function journeyRewards(completedOrders: Iterable<number>, records: JourneyRecord[], formSteps: FormSteps, dailyTaskRecords: JourneyRecord[] = records) {
  const uniqueOrders = [...new Set([...completedOrders].filter(order => Number.isInteger(order) && order >= 1 && order <= 18))];
  const recordDays = new Map<number, Set<string>>();
  const dailyTaskDays = new Set<string>();
  records.forEach(({order,date}) => {
    if (!uniqueOrders.includes(order)) return;
    const day = localDateKey(date);
    if (!day) return;
    const days = recordDays.get(order) ?? new Set<string>();
    days.add(day); recordDays.set(order, days);
  });
  dailyTaskRecords.forEach(({order,date}) => { if (uniqueOrders.includes(order)) { const day=localDateKey(date); if (day) dailyTaskDays.add(day); } });
  const repeatDays = [...recordDays.values()].reduce((sum, days) => sum + Math.max(0, days.size - 1), 0);
  const videos = Object.values(formSteps).filter(step => step?.videoCompleted).length;
  const xp = uniqueOrders.length * xpRewards.firstForm + repeatDays * xpRewards.repeatOnNewDay + dailyTaskDays.size * xpRewards.dailyTask + videos * xpRewards.teacherVideo;
  const garden = [
    { id: "seed", icon: "🌱", title: "İlk filiz", unlocked: uniqueOrders.length >= 1 },
    { id: "stone", icon: "🪨", title: "Bahçe taşı", unlocked: uniqueOrders.length >= 3 },
    { id: "water", icon: "💧", title: "Su halkası", unlocked: dailyTaskDays.size >= 5 },
    { id: "lantern", icon: "🏮", title: "Bahçe feneri", unlocked: uniqueOrders.length >= 10 },
    { id: "bamboo", icon: "🎋", title: "Bambu", unlocked: uniqueOrders.length >= 15 },
  ];
  return { xp, firstForms: uniqueOrders.length, repeatDays, dailyTasks: dailyTaskDays.size, videos, garden };
}

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
  const balance = yinYangSummary(completed);
  const earned = [completed.length >= 1, completed.length >= 5, [...datesByForm.values()].some((dates) => dates.size >= 3), postureCount >= 2, completed.length >= 18, balance.yin >= 1 && balance.yang >= 1, balance.yin >= 4 && balance.yang >= 4];
  return milestoneDefinitions.map((item, index) => ({ ...item, earned: earned[index] }));
}
