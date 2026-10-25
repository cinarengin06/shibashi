export const palette = {
  background: "#0B0E12",
  backgroundSecondary: "#14181C",
  card: "#20252B",
  pressed: "#292E34",
  border: "rgba(232,222,205,0.12)",
  text: "#F2EEE7",
  textSecondary: "#A7ADA6",
  divider: "#343A40",
  gold: "#C8A56A",
  bronze: "#A67C52",
  ivory: "#E8DECD",
  mist: "#9EA7AA",
  success: "#84A96C",
  posePoint: "#A9D977",
  warning: "#D49A58",
  destructive: "#B76555",
} as const;

export const spacing = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x6: 24,
  x8: 32,
  x12: 48,
  x16: 64,
} as const;

export const radii = {
  control: 16,
  card: 20,
  cardLarge: 24,
  round: 999,
} as const;

export const motion = {
  quick: 600,
  standard: 900,
  slow: 1200,
  ritual: 1600,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const typography = {
  display: "Cormorant Garamond",
  ui: "Inter",
  metric: "Manrope",
  mobileDisplayMax: 44,
  desktopDisplayMax: 64,
} as const;

export const shenThemes = {
  hun: {
    id: "hun",
    name: "Hun",
    element: "Ağaç",
    primary: "#91A867",
    dark: "#46543D",
    light: "#D1DAAD",
    backgroundImage: "/images/shen-home/hun-web.webp",
    backgroundOverlay: "rgba(10,15,12,0.78)",
    icon: "leaf-outline",
    shortDescription: "Gün doğumu, yön ve umut",
    ambientMotion: "mist",
    accentUsage: "selected-control",
    surface: "#172019",
    surfaceRaised: "#233025",
    button: "#B9CF78",
    buttonInk: "#11170F",
    controlRadius: 18,
    headingWeight: "500",
    headingTracking: "0.01em",
    transitionMs: 520,
  },
  yi: {
    id: "yi",
    name: "Yi",
    element: "Dikkat",
    primary: "#C7BFAE",
    dark: "#6F6A62",
    light: "#EEE8DC",
    backgroundImage: "/images/shen-home/yi-web.webp",
    backgroundOverlay: "rgba(10,15,12,0.8)",
    icon: "ellipse-outline",
    shortDescription: "Sis, dikkat ve iç denge",
    ambientMotion: "fog",
    accentUsage: "selected-control",
    surface: "#202120",
    surfaceRaised: "#2C2D2B",
    button: "#EEE8DC",
    buttonInk: "#171817",
    controlRadius: 12,
    headingWeight: "500",
    headingTracking: "-0.02em",
    transitionMs: 420,
  },
  po: {
    id: "po",
    name: "Po",
    element: "Toprak",
    primary: "#B69268",
    dark: "#604D3C",
    light: "#DCC7AA",
    backgroundImage: "/images/shen-home/po-web.webp",
    backgroundOverlay: "rgba(10,15,12,0.82)",
    icon: "moon-outline",
    shortDescription: "Güven, merkez ve sakin güç",
    ambientMotion: "still",
    accentUsage: "selected-control",
    surface: "#221D19",
    surfaceRaised: "#312820",
    button: "#D9B47D",
    buttonInk: "#1C140E",
    controlRadius: 8,
    headingWeight: "600",
    headingTracking: "0em",
    transitionMs: 360,
  },
  zhi: {
    id: "zhi",
    name: "Zhi",
    element: "Su",
    primary: "#688AA1",
    dark: "#263846",
    light: "#B9D0DA",
    backgroundImage: "/images/shen-home/zhi-web.webp",
    backgroundOverlay: "rgba(10,15,12,0.82)",
    icon: "water-outline",
    shortDescription: "Derinlik, sessizlik ve içsel irade",
    ambientMotion: "water",
    accentUsage: "selected-control",
    surface: "#121C23",
    surfaceRaised: "#1C2B35",
    button: "#9CC3D4",
    buttonInk: "#0C151B",
    controlRadius: 28,
    headingWeight: "400",
    headingTracking: "0.025em",
    transitionMs: 620,
  },
  shen: {
    id: "shen",
    name: "Shen",
    element: "Birlik",
    primary: "#D1AE68",
    dark: "#6C5638",
    light: "#F0D9A6",
    backgroundImage: "/images/shen-home/shen-fire-web.webp",
    backgroundOverlay: "rgba(10,15,12,0.8)",
    icon: "heart-outline",
    shortDescription: "Altın ışık, huzur ve birlik",
    ambientMotion: "golden-light",
    accentUsage: "selected-control",
    surface: "#211C15",
    surfaceRaised: "#30271B",
    button: "#E4BE70",
    buttonInk: "#191208",
    controlRadius: 999,
    headingWeight: "600",
    headingTracking: "0.045em",
    transitionMs: 460,
  },
} as const;

export type SharedShenId = keyof typeof shenThemes;

export const visualThemes = {
  "ink-night": {id:"ink-night",name:"Mürekkep Gecesi",shortName:"Mürekkep",description:"Siyah mürekkep, kömür yüzeyler ve sıcak altın ışık.",background:"#090C0D",backgroundSecondary:"#111619",surface:"#1B2125",surfaceRaised:"#252C31",navigation:"#070A0B",text:"#F2EEE7",textSecondary:"#A7ADA6",border:"rgba(232,222,205,0.13)",glow:"#C8A56A"},
  "jade-garden": {id:"jade-garden",name:"Yeşim Bahçesi",shortName:"Yeşim",description:"Zümrüt yeşili, yeşim vurgular ve yumuşak sans yazı.",background:"#071B16",backgroundSecondary:"#0D2A21",surface:"#164034",surfaceRaised:"#205446",navigation:"#061610",text:"#F3F8EF",textSecondary:"#B8D2C3",border:"rgba(153,224,187,0.28)",glow:"#85E0B2"},
  "moon-water": {id:"moon-water",name:"Ay Suyu",shortName:"Ay Suyu",description:"Gece mavisi, buz mavisi vurgular ve zarif serif yazı.",background:"#080F26",backgroundSecondary:"#101D39",surface:"#1B2C50",surfaceRaised:"#294169",navigation:"#060B1D",text:"#F3F7FF",textSecondary:"#B4C4E1",border:"rgba(153,190,247,0.28)",glow:"#8CC9FF"},
  "lotus-dusk": {id:"lotus-dusk",name:"Lotus Alacakaranlığı",shortName:"Lotus",description:"Mürdüm ve lavanta, şiirsel serif başlıklar.",background:"#1C1025",backgroundSecondary:"#2B1936",surface:"#392445",surfaceRaised:"#503159",navigation:"#160C1F",text:"#FAF0FA",textSecondary:"#D5BED9",border:"rgba(225,170,232,0.28)",glow:"#DEA7E9"},
  "terra-day": {id:"terra-day",name:"Toprak Günü",shortName:"Toprak",description:"Açık kil ve mercan tonları, sıcak ve okunaklı yazı.",background:"#F6E6D8",backgroundSecondary:"#EED7C4",surface:"#FFF5EC",surfaceRaised:"#E9C7AE",navigation:"#FFF1E5",text:"#382A24",textSecondary:"#76584C",border:"rgba(136,78,54,0.24)",glow:"#CC6F52"},
  "morning-light": {id:"morning-light",name:"Sabah Işığı · Açık",shortName:"Açık",description:"Sıcak fildişi zemin, açık taş kartlar ve Shen vurguları.",background:"#F7F3E9",backgroundSecondary:"#F0EBDF",surface:"#FFFCF5",surfaceRaised:"#EAE3D4",navigation:"#FFFDF8",text:"#202A25",textSecondary:"#58635A",border:"rgba(52,74,60,0.18)",glow:"#B88B45"},
} as const;

export type VisualThemeId = keyof typeof visualThemes;

export const visualThemeFonts: Record<VisualThemeId, { label: string; web: string }> = {
  "ink-night": { label: "Modern", web: "Arial, sans-serif" },
  "jade-garden": { label: "Yumuşak", web: "'Trebuchet MS', sans-serif" },
  "moon-water": { label: "Zarif", web: "Georgia, serif" },
  "lotus-dusk": { label: "Klasik", web: "Georgia, serif" },
  "terra-day": { label: "Sıcak", web: "'Trebuchet MS', sans-serif" },
  "morning-light": { label: "Editoryal", web: "Georgia, serif" },
};

export function normalizeVisualThemeId(value: string | null | undefined): VisualThemeId {
  return value && value in visualThemes ? value as VisualThemeId : "ink-night";
}

function blendHex(first: string, second: string, secondWeight: number) {
  const channel = (value: string, offset: number) => parseInt(value.slice(offset, offset + 2), 16);
  return `#${[1, 3, 5].map(offset => Math.round(channel(first, offset) * (1 - secondWeight) + channel(second, offset) * secondWeight).toString(16).padStart(2, "0")).join("")}`;
}

export function getShenVisualTheme(shenId: SharedShenId, selectedMode: VisualThemeId) {
  const mode = normalizeVisualThemeId(selectedMode);
  const base = visualThemes[mode];
  const shen = shenThemes[shenId];
  const light = mode === "morning-light" || mode === "terra-day";
  const tint = light ? shen.primary : shen.surface;
  return {
    ...base,
    background: blendHex(base.background, tint, light ? .025 : .08),
    backgroundSecondary: blendHex(base.backgroundSecondary, tint, light ? .04 : .1),
    surface: blendHex(base.surface, tint, light ? .035 : .12),
    surfaceRaised: blendHex(base.surfaceRaised, light ? tint : shen.surfaceRaised, light ? .045 : .13),
    navigation: blendHex(base.navigation, tint, light ? .02 : .06),
    glow: blendHex(base.glow, shen.primary, .16),
  };
}

export const designTokens = {
  palette,
  spacing,
  radii,
  motion,
  typography,
  shenThemes,
  visualThemes,
} as const;
