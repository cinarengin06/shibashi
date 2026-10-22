export const GATE_IDS = ["peng", "lu", "ji", "an", "cai", "lie", "zhou", "kao"] as const;
export type GateId = (typeof GATE_IDS)[number];

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
