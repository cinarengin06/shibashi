export const GATE_IDS = ["peng", "lu", "ji", "an", "cai", "lie", "zhou", "kao"] as const;
export type GateId = (typeof GATE_IDS)[number];
export const BODY_GATE_ORDER: readonly GateId[] = ["peng", "lu", "kao", "ji", "zhou", "an", "lie", "cai"];

export const gates: Record<GateId, { name: string; cue: string; symbol: string }> = {
  peng: { name: "Peng", cue: "Yumuşakça yükselme ve genişleme", symbol: "↗" },
  lu: { name: "Lü", cue: "Akışa eşlik edip yön verme", symbol: "≈" },
  ji: { name: "Ji", cue: "Merkezden ileriye uzanma", symbol: "➚" },
  an: { name: "An", cue: "Sakin ve dengeli bastırma", symbol: "⌄" },
  cai: { name: "Cai", cue: "Toplayıp merkeze çekme", symbol: "↓" },
  lie: { name: "Lie", cue: "Açılma ve iki yana yayılma", symbol: "⤢" },
  zhou: { name: "Zhou", cue: "Yakın mesafede dönme", symbol: "◌" },
  kao: { name: "Kao", cue: "Bedenin merkezinden yön değiştirme", symbol: "△" },
};

export const gateGuidance: Record<GateId, { focus: string; outcome: string; benefits: readonly string[]; dailyUse: string; microPractice: string }> = {
  peng: { focus: "Akciğerler", outcome: "Göğüs ve kolları zorlamadan genişletmeyi çalışır; nefesle yükselirken duruşunu fark etmene yardımcı olur.", benefits: ["Yumuşak yükselme", "Göğüs açıklığı", "Dengeli duruş"], dailyUse: "Uzun süre oturduktan sonra omuzlarını rahatlatıp dikleşmeyi hatırlatır.", microPractice: "Dizlerini yumuşat; nefes alırken kollarını hafifçe kaldır, verirken omuzlarını bırak." },
  lu: { focus: "Mide", outcome: "Ağırlığını yumuşakça aktarmayı ve gerilmeden yön değiştirmeyi çalışır.", benefits: ["Ağırlık aktarımı", "Akışa eşlik", "Yumuşak dönüş"], dailyUse: "Yön değiştirirken acele etmek yerine dengeni yeniden bulmana yardımcı olur.", microPractice: "Ağırlığını bir ayağına taşı; kolların onu yumuşakça takip etsin." },
  kao: { focus: "Karaciğer", outcome: "Gövde ve ayakların birlikte dönmesini çalışır; hareketin merkezden başladığını fark ettirir.", benefits: ["Merkezden dönüş", "Gövde farkındalığı", "Ayak dengesi"], dailyUse: "Dönerken belini zorlamak yerine bütün bedenini birlikte hareket ettirmeyi hatırlatır.", microPractice: "Ayaklarını yere bas; gövdenle küçük bir dönüş yaparken omuzlarını serbest bırak." },
  ji: { focus: "Kalın bağırsak", outcome: "Merkezden ileri uzanırken kol ve gövde arasındaki bağı hissetmeyi çalışır.", benefits: ["Merkezden uzanma", "Kol ve gövde uyumu", "Yön duygusu"], dailyUse: "Bir işe başlarken acele etmeden yönünü belirlemeyi hatırlatır.", microPractice: "Avuçlarını önünde birleştir; nefes verirken gövdenden destek alarak ileri uzan." },
  zhou: { focus: "Safra kesesi", outcome: "Yakın mesafedeki dönüşlerde dirsek, omuz ve gövdenin birlikte hareket etmesini çalışır.", benefits: ["Yakın dönüş", "Omuz rahatlığı", "Gövde uyumu"], dailyUse: "Dar bir alanda dönerken omuzlarını sıkmadan yön değiştirmeyi hatırlatır.", microPractice: "Dirseklerini gevşek tut; küçük bir gövde dönüşüyle kollarının yönünü değiştir." },
  an: { focus: "Böbrekler", outcome: "Nefesle birlikte sakin biçimde aşağı yönelmeyi ve ayaklarına dengeli basmayı çalışır.", benefits: ["Sakin bastırma", "Ayak dengesi", "Nefes ritmi"], dailyUse: "Hızlandığını fark ettiğinde yavaşlayıp zemine yeniden bağlanmana yardımcı olur.", microPractice: "Nefes verirken avuçlarını yavaşça indir; ağırlığının iki ayağına dağıldığını hisset." },
  lie: { focus: "Kalp çevresi", outcome: "İki yana açılırken göğüs, kollar ve bakışın birlikte yönlenmesini çalışır.", benefits: ["İki yana açılma", "Bakış uyumu", "Göğüs rahatlığı"], dailyUse: "Omuzlarını sıkmadan çevrendeki alanı fark etmeyi hatırlatır.", microPractice: "Kollarını rahatça iki yana aç; bakışın ve nefesin hareketi izlesin." },
  cai: { focus: "Mesane", outcome: "Kolları merkeze toplarken ağırlığını dengede tutmayı ve hareketi tamamlamayı çalışır.", benefits: ["Merkeze toplama", "Dengeli çekiş", "Hareketi tamamlama"], dailyUse: "Dağıldığını hissettiğinde hareketini küçültüp dikkatini merkeze getirmeni hatırlatır.", microPractice: "Avuçlarını kendine doğru yavaşça çek; dirseklerini ve omuzlarını gevşek tut." },
};

// Editorial practice associations. These are symbolic Tai Chi principles,
// not anatomy, meridian measurements or a claim of Taijiquan mastery.
// Every movement can contribute to more than one gate; weights default to 1.
export const movementGateWeights: Record<number, Partial<Record<GateId, number>>> = {
  1: { peng: 1, an: 1 }, 2: { peng: 1, lie: 1 },
  3: { lu: 1, lie: 1 }, 4: { lu: 1, zhou: 1 },
  5: { zhou: 1, kao: 1 }, 6: { cai: 1, lu: 1 },
  7: { peng: 1, an: 1 }, 8: { peng: 1, ji: 1 },
  9: { ji: 1, an: 1 }, 10: { lu: 1, lie: 1 },
  11: { cai: 1, peng: 1 }, 12: { an: 1, lu: 1 },
  13: { peng: 1, lie: 1 }, 14: { ji: 1, kao: 1 },
  15: { peng: 1, zhou: 1 }, 16: { lu: 1, zhou: 1 },
  17: { cai: 1, ji: 1 }, 18: { an: 1, kao: 1 },
};

export function uniqueMovementOrders(values: Iterable<number>): number[] {
  return [...new Set([...values].filter((order) => Number.isInteger(order) && order >= 1 && order <= 18))].sort((a, b) => a - b);
}

export function gateProgress(completedOrders: Iterable<number>) {
  const completed = new Set(uniqueMovementOrders(completedOrders));
  return GATE_IDS.map((id) => {
    const mapped = Object.entries(movementGateWeights)
      .map(([order, weights]) => ({ order: Number(order), weight: weights[id] ?? 0 }))
      .filter(({ weight }) => weight > 0);
    const total = mapped.reduce((sum, item) => sum + item.weight, 0);
    const earned = mapped.reduce((sum, item) => sum + (completed.has(item.order) ? item.weight : 0), 0);
    return { id, ...gates[id], percent: total ? Math.round((earned / total) * 100) : 0, mappedCount: mapped.length, completedCount: mapped.filter((item) => completed.has(item.order)).length };
  });
}
