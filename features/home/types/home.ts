export type HomeShenId = "hun" | "shen" | "yi" | "po" | "zhi";

export type HomeShenSummary = {
  actionLabel: string;
  color: string;
  description: string;
  element: string;
  heroBody: string;
  heroTitle: string;
  id: HomeShenId;
  motto: string;
  name: string;
  organ: string;
  period: string;
  shortLabel: string;
  symbol: string;
  wallpaper: string;
};

export type HomeStreakSummary = {
  activeDays: boolean[];
  current: number;
  longest: number;
};

export type HomeLevelSummary = {
  experience: number;
  level: number;
  nextLevelExperience: number;
  progress: number;
};

export type HomeWeekSummary = {
  dailyMinutes: number[];
  minutes: number;
  practiceCount: number;
};

export type HomeEnergySummary = {
  score: number | null;
  trend: number[];
};

export type HomeFlowSummary = {
  description: string;
  durationMinutes: number;
  focus: string;
  id: string;
  image: string;
  level: string;
  title: string;
};
