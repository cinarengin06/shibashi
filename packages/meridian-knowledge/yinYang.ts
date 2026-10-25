export type MovementEnergyTag = {
  quality: "Yin" | "Yang";
  action: string;
};

// Teaching labels describe each form's dominant movement character. Every form contains both qualities.
export const movementEnergyTags: readonly MovementEnergyTag[] = [
  { quality: "Yin", action: "merkezlenme" },
  { quality: "Yang", action: "göğsü açma" },
  { quality: "Yang", action: "yana açılma" },
  { quality: "Yin", action: "dairesel toplama" },
  { quality: "Yin", action: "serbest bırakma" },
  { quality: "Yang", action: "ileri uzanma" },
  { quality: "Yin", action: "merkezde tutma" },
  { quality: "Yang", action: "yukarı uzanma" },
  { quality: "Yang", action: "öne itme" },
  { quality: "Yin", action: "yumuşak akış" },
  { quality: "Yang", action: "aşağıdan yükselme" },
  { quality: "Yin", action: "dalgalanma" },
  { quality: "Yang", action: "genişleme" },
  { quality: "Yang", action: "güç aktarımı" },
  { quality: "Yang", action: "hafif yükselme" },
  { quality: "Yin", action: "dairesel denge" },
  { quality: "Yin", action: "ritmik denge" },
  { quality: "Yin", action: "kapanış" },
];

export function getMovementEnergyTag(order: number): MovementEnergyTag {
  return movementEnergyTags[order - 1] ?? movementEnergyTags[0];
}
