export const palette = {
  background: "#0A0F0C",
  backgroundSecondary: "#111713",
  card: "#171D19",
  pressed: "#1C241F",
  border: "rgba(255,255,255,0.08)",
  text: "#F2EEE7",
  textSecondary: "#A7ADA6",
  divider: "#2B332E",
  gold: "#C6A56A",
  success: "#7FB46B",
  posePoint: "#A9D977",
  warning: "#D7A85B",
  destructive: "#A96352",
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
  quick: 240,
  standard: 560,
  slow: 820,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const typography = {
  display: "DM Serif Display",
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
    primary: "#708A5E",
    dark: "#40503B",
    light: "#B8C7A8",
    backgroundImage: "/images/shen-river-hun.jpg",
    backgroundOverlay: "rgba(10,15,12,0.78)",
    icon: "leaf-outline",
    shortDescription: "Vizyon, yön ve içsel büyüme",
    ambientMotion: "mist",
    accentUsage: "selected-control",
  },
  yi: {
    id: "yi",
    name: "Yi",
    element: "Toprak",
    primary: "#B08D5C",
    dark: "#6F5A3E",
    light: "#D8C4A2",
    backgroundImage: "/images/shen-river-yi.jpg",
    backgroundOverlay: "rgba(10,15,12,0.8)",
    icon: "ellipse-outline",
    shortDescription: "Merkez, kararlılık ve denge",
    ambientMotion: "still",
    accentUsage: "selected-control",
  },
  po: {
    id: "po",
    name: "Po",
    element: "Metal",
    primary: "#9CA4A6",
    dark: "#5D676C",
    light: "#D7DBD9",
    backgroundImage: "/images/shen-river-po.jpg",
    backgroundOverlay: "rgba(10,15,12,0.82)",
    icon: "moon-outline",
    shortDescription: "Nefes, sadelik ve bırakma",
    ambientMotion: "fog",
    accentUsage: "selected-control",
  },
  zhi: {
    id: "zhi",
    name: "Zhi",
    element: "Su",
    primary: "#5A7483",
    dark: "#22333E",
    light: "#AFC2CB",
    backgroundImage: "/images/shen-river-zhi.jpg",
    backgroundOverlay: "rgba(10,15,12,0.82)",
    icon: "water-outline",
    shortDescription: "Derinlik, sessizlik ve içsel irade",
    ambientMotion: "water",
    accentUsage: "selected-control",
  },
  shen: {
    id: "shen",
    name: "Xin",
    element: "Ateş",
    primary: "#B66B58",
    dark: "#6E3E37",
    light: "#DDB3A5",
    backgroundImage: "/images/shen-river-shen.jpg",
    backgroundOverlay: "rgba(10,15,12,0.8)",
    icon: "heart-outline",
    shortDescription: "Sıcaklık, farkındalık ve bağ",
    ambientMotion: "warm-light",
    accentUsage: "selected-control",
  },
} as const;

export type SharedShenId = keyof typeof shenThemes;

export const designTokens = {
  palette,
  spacing,
  radii,
  motion,
  typography,
  shenThemes,
} as const;
