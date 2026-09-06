export type MeridianLabelSide = "left" | "right";

export interface MovementPointMarker {
  code: string;
  left: number;
  top: number;
  side: MeridianLabelSide;
}

export interface DeepMeridianVisual {
  color: string;
  glow: string;
  labelLeft: number;
  labelTop: number;
  path: string;
}

export interface PointGuidance {
  instruction: string;
  title: string;
}

export const pointGuidance: Record<string, PointGuidance> = {
  BL23: { title: "Belin iki yanı", instruction: "Belini sıkmadan iki yana doğru genişlet." },
  BL62: { title: "Dış ayak bileği", instruction: "Dış ayak bileğini sabit ama yumuşak tut." },
  DU4: { title: "Bel merkezi", instruction: "Belini çökertmeden omurganı uzun tut." },
  DU20: { title: "Başın tepesi", instruction: "Başının tepesini hafifçe göğe doğru uzat." },
  GB20: { title: "Ense kökü", instruction: "Çeneni sıkmadan enseni uzun bırak." },
  GB21: { title: "Omuz tepesi", instruction: "Omzunu kulağından uzaklaştır." },
  GB26: { title: "Bel çevresi", instruction: "Bel çevreni sıkmadan gövdenle birlikte dön." },
  GB41: { title: "Ayağın dış hattı", instruction: "Ayağının dış kenarını dengeli biçimde yere yay." },
  HT7: { title: "Bilek çizgisi", instruction: "Bileğini sıkma; avucuna alan bırak." },
  KI1: { title: "Ayak tabanı", instruction: "Ayak tabanını bütünüyle yere bırak." },
  KI3: { title: "İç ayak bileği", instruction: "İç ayak bileğini çökertmeden dengede tut." },
  KI6: { title: "İç topuk hattı", instruction: "Topuğunu yere bırak, ayak bileğini sıkıştırma." },
  LI4: { title: "El kökü", instruction: "Başparmakla işaret parmağı arasını gevşet." },
  LI11: { title: "Dirsek dışı", instruction: "Dirseğini kilitlemeden yuvarlak tut." },
  LR3: { title: "Ayak üstü", instruction: "Başparmak kökünü yere bağla ve ayağını yumuşat." },
  LU1: { title: "Üst göğüs", instruction: "Köprücük kemiklerinin altına nefes alanı aç." },
  LU7: { title: "Bileğin dış yanı", instruction: "Bileğini serbest bırak; parmaklarını sıkma." },
  PC6: { title: "İç ön kol", instruction: "Ön kolunu uzun ve yumuşak tut." },
  PC8: { title: "Avuç merkezi", instruction: "Avucunu canlı tut ama parmaklarını kasma." },
  REN6: { title: "Alt merkez", instruction: "Alt karnını yumuşat ve nefesi zorlamadan bırak." },
  REN12: { title: "Üst karın", instruction: "Üst karnını sıkmadan rahatça nefes al." },
  REN17: { title: "Göğüs merkezi", instruction: "Göğsünü şişirmeden ön bedenine alan aç." },
  SI3: { title: "Elin dış kenarı", instruction: "Serçe parmak tarafını sertleştirmeden uzat." },
  SI11: { title: "Kürek kemiği", instruction: "Kürek kemiğini bastırmadan sırtını genişlet." },
  SJ5: { title: "Dış ön kol", instruction: "Bilekten dirseğe uzanan hattı serbest bırak." },
  SP4: { title: "İç ayak kavsi", instruction: "Ayağının iç kavisini sakin biçimde yere bağla." },
  SP6: { title: "İç bacak hattı", instruction: "İç bacağını sıkmadan dizini ayağınla hizala." },
  ST36: { title: "Diz altı", instruction: "Dizini kilitleme; ağırlığı ayağına doğru bırak." },
};

export const movementPointMarkers: Record<number, MovementPointMarker[]> = {
  1: [
    { code: "LU7", left: 33, top: 58, side: "left" },
    { code: "KI6", left: 58, top: 85, side: "right" },
    { code: "REN6", left: 50, top: 52, side: "right" },
    { code: "ST36", left: 43, top: 72, side: "left" },
    { code: "KI1", left: 43, top: 87, side: "left" },
  ],
  2: [
    { code: "REN17", left: 50, top: 38, side: "right" },
    { code: "LU1", left: 43, top: 36, side: "left" },
    { code: "LU7", left: 22, top: 43, side: "right" },
    { code: "PC6", left: 69, top: 42, side: "left" },
    { code: "HT7", left: 78, top: 43, side: "left" },
  ],
  3: [
    { code: "GB41", left: 45, top: 86, side: "left" },
    { code: "SJ5", left: 77, top: 37, side: "left" },
    { code: "GB21", left: 58, top: 32, side: "right" },
    { code: "PC8", left: 36, top: 22, side: "right" },
    { code: "DU20", left: 50, top: 17, side: "left" },
  ],
  4: [
    { code: "PC6", left: 44, top: 53, side: "right" },
    { code: "PC8", left: 39, top: 56, side: "left" },
    { code: "SJ5", left: 36, top: 25, side: "right" },
    { code: "LU7", left: 66, top: 39, side: "left" },
    { code: "DU20", left: 50, top: 17, side: "right" },
  ],
  5: [
    { code: "GB26", left: 51, top: 50, side: "right" },
    { code: "GB41", left: 65, top: 86, side: "right" },
    { code: "LR3", left: 36, top: 86, side: "left" },
    { code: "SJ5", left: 38, top: 34, side: "left" },
    { code: "REN6", left: 50, top: 52, side: "left" },
  ],
  6: [
    { code: "SI3", left: 34, top: 53, side: "left" },
    { code: "BL62", left: 62, top: 86, side: "right" },
    { code: "DU4", left: 52, top: 50, side: "right" },
    { code: "BL23", left: 58, top: 48, side: "right" },
    { code: "KI3", left: 45, top: 84, side: "left" },
  ],
  7: [
    { code: "SP4", left: 41, top: 86, side: "left" },
    { code: "PC6", left: 44, top: 38, side: "left" },
    { code: "LR3", left: 60, top: 86, side: "right" },
    { code: "REN12", left: 50, top: 43, side: "right" },
    { code: "PC8", left: 42, top: 50, side: "left" },
  ],
  8: [
    { code: "GB41", left: 66, top: 86, side: "right" },
    { code: "SI3", left: 62, top: 24, side: "right" },
    { code: "DU20", left: 50, top: 17, side: "left" },
    { code: "GB20", left: 50, top: 23, side: "right" },
    { code: "BL23", left: 47, top: 50, side: "left" },
  ],
  9: [
    { code: "LI4", left: 39, top: 39, side: "left" },
    { code: "LI11", left: 38, top: 43, side: "left" },
    { code: "LU7", left: 65, top: 39, side: "right" },
    { code: "LR3", left: 37, top: 86, side: "left" },
    { code: "GB26", left: 50, top: 50, side: "right" },
  ],
  10: [
    { code: "SP6", left: 46, top: 77, side: "left" },
    { code: "ST36", left: 58, top: 69, side: "right" },
    { code: "PC6", left: 45, top: 36, side: "left" },
    { code: "SJ5", left: 39, top: 34, side: "left" },
    { code: "GB41", left: 64, top: 86, side: "right" },
  ],
  11: [
    { code: "KI1", left: 38, top: 87, side: "left" },
    { code: "KI3", left: 64, top: 84, side: "right" },
    { code: "REN6", left: 50, top: 51, side: "right" },
    { code: "DU4", left: 50, top: 48, side: "left" },
    { code: "DU20", left: 50, top: 17, side: "right" },
  ],
  12: [
    { code: "ST36", left: 43, top: 70, side: "left" },
    { code: "KI1", left: 62, top: 87, side: "right" },
    { code: "KI3", left: 58, top: 84, side: "left" },
    { code: "LU7", left: 37, top: 38, side: "left" },
    { code: "LI4", left: 36, top: 34, side: "left" },
  ],
  13: [
    { code: "REN17", left: 50, top: 38, side: "right" },
    { code: "LU1", left: 44, top: 35, side: "left" },
    { code: "HT7", left: 20, top: 43, side: "right" },
    { code: "PC6", left: 70, top: 43, side: "left" },
    { code: "SI11", left: 58, top: 36, side: "right" },
  ],
  14: [
    { code: "LI4", left: 38, top: 36, side: "left" },
    { code: "LI11", left: 44, top: 41, side: "right" },
    { code: "LU7", left: 58, top: 47, side: "right" },
    { code: "PC6", left: 55, top: 46, side: "left" },
    { code: "GB41", left: 38, top: 86, side: "left" },
  ],
  15: [
    { code: "SJ5", left: 20, top: 40, side: "right" },
    { code: "GB21", left: 42, top: 34, side: "left" },
    { code: "GB41", left: 60, top: 86, side: "right" },
    { code: "BL62", left: 42, top: 86, side: "left" },
    { code: "DU20", left: 50, top: 17, side: "right" },
  ],
  16: [
    { code: "SI3", left: 42, top: 22, side: "left" },
    { code: "SJ5", left: 41, top: 28, side: "left" },
    { code: "GB41", left: 61, top: 86, side: "right" },
    { code: "LR3", left: 38, top: 86, side: "left" },
    { code: "GB26", left: 52, top: 51, side: "right" },
  ],
  17: [
    { code: "ST36", left: 49, top: 69, side: "right" },
    { code: "SP6", left: 50, top: 79, side: "right" },
    { code: "BL62", left: 35, top: 82, side: "left" },
    { code: "KI6", left: 38, top: 82, side: "right" },
    { code: "KI1", left: 52, top: 87, side: "right" },
  ],
  18: [
    { code: "PC8", left: 49, top: 51, side: "right" },
    { code: "PC6", left: 44, top: 50, side: "left" },
    { code: "REN6", left: 50, top: 52, side: "right" },
    { code: "KI1", left: 42, top: 87, side: "left" },
    { code: "ST36", left: 42, top: 70, side: "left" },
  ],
};

export const deepMeridianVisuals: Record<string, DeepMeridianVisual> = {
  "Ren Mai": {
    color: "#f4c873",
    glow: "rgba(244,200,115,.9)",
    labelLeft: 53,
    labelTop: 43,
    path: "M50 20 C50 34 50 48 50 62 C50 68 50 73 50 77",
  },
  "Chong Mai": {
    color: "#9ee0ba",
    glow: "rgba(158,224,186,.9)",
    labelLeft: 64,
    labelTop: 78,
    path: "M39 91 C42 78 45 65 47 54 C48 48 49 42 50 36 M61 91 C58 78 55 65 53 54 C52 48 51 42 50 36",
  },
  "Yin Wei Mai": {
    color: "#d7a7ed",
    glow: "rgba(215,167,237,.9)",
    labelLeft: 57,
    labelTop: 35,
    path: "M29 58 C36 51 42 44 50 37 C58 44 64 51 71 58",
  },
  "Dai Mai": {
    color: "#e6a55b",
    glow: "rgba(230,165,91,.9)",
    labelLeft: 64,
    labelTop: 51,
    path: "M31 51 C40 46 60 46 69 51 C60 57 40 57 31 51 Z",
  },
  "Yang Wei Mai": {
    color: "#f0cf78",
    glow: "rgba(240,207,120,.9)",
    labelLeft: 70,
    labelTop: 40,
    path: "M24 88 C22 70 24 52 31 37 C36 29 42 23 49 18 M76 88 C78 70 76 52 69 37 C64 29 58 23 51 18",
  },
  "Du Mai": {
    color: "#77c8ef",
    glow: "rgba(119,200,239,.9)",
    labelLeft: 53,
    labelTop: 30,
    path: "M50 78 C51 61 52 45 51 30 C51 24 50 20 50 17",
  },
  "Yang Qiao Mai": {
    color: "#74b9f3",
    glow: "rgba(116,185,243,.9)",
    labelLeft: 67,
    labelTop: 69,
    path: "M64 91 C68 78 70 65 70 53 C70 41 64 30 53 18",
  },
  "Yin Qiao Mai": {
    color: "#c9a7ec",
    glow: "rgba(201,167,236,.9)",
    labelLeft: 57,
    labelTop: 68,
    path: "M42 91 C44 78 47 67 49 56 C50 46 50 37 50 29",
  },
};
