export type OrganRole = "primary" | "secondary";

export interface OrganVisual {
  id: string;
  label: string;
  meridian: string;
  left: number;
  top: number;
  cue: string;
}

export interface ActiveOrganVisual extends OrganVisual {
  role: OrganRole;
}

const organVisuals: OrganVisual[] = [
  { id: "lungs", label: "Akciğerler", meridian: "Akciğer (LU)", left: 50, top: 25, cue: "Nefes alanı" },
  { id: "heart", label: "Kalp", meridian: "Kalp (HT)", left: 54, top: 32, cue: "Göğüs merkezi" },
  { id: "pericardium", label: "Kalp çevresi", meridian: "Perikard (PC)", left: 47, top: 33, cue: "Koruyucu alan" },
  { id: "liver", label: "Karaciğer", meridian: "Karaciğer (LR)", left: 35, top: 46, cue: "Yan beden" },
  { id: "gallbladder", label: "Safra kesesi", meridian: "Safra Kesesi (GB)", left: 39, top: 51, cue: "Dış yan hat" },
  { id: "stomach", label: "Mide", meridian: "Mide (ST)", left: 59, top: 49, cue: "Ön merkez" },
  { id: "spleen", label: "Dalak", meridian: "Dalak (SP)", left: 70, top: 53, cue: "İç merkez" },
  { id: "kidneys", label: "Böbrekler", meridian: "Böbrek (KI)", left: 32, top: 60, cue: "Belin iki yanı" },
  { id: "small-intestine", label: "İnce bağırsak", meridian: "İnce Bağırsak (SI)", left: 51, top: 71, cue: "Alt karın" },
  { id: "large-intestine", label: "Kalın bağırsak", meridian: "Kalın Bağırsak (LI)", left: 51, top: 77, cue: "Karın çevresi" },
  { id: "bladder", label: "Mesane", meridian: "Mesane (BL)", left: 50, top: 90, cue: "Alt merkez" },
  { id: "san-jiao", label: "Üç bölge", meridian: "San Jiao (SJ)", left: 50, top: 55, cue: "Gövde boyunca" },
];

export function getMovementOrganVisuals(
  primaryMeridians: string[],
  secondaryMeridians: string[],
): ActiveOrganVisual[] {
  const roles = new Map<string, OrganRole>();
  primaryMeridians.forEach((name) => roles.set(name, "primary"));
  secondaryMeridians.forEach((name) => {
    if (!roles.has(name)) roles.set(name, "secondary");
  });
  return organVisuals.flatMap((organ) => {
    const role = roles.get(organ.meridian);
    return role ? [{ ...organ, role }] : [];
  });
}
