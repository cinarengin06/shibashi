export type HomeShenId = "hun" | "shen" | "yi" | "po" | "zhi";

export type HomeShenSummary = {
  color: string;
  description: string;
  element: string;
  heroBody: string;
  heroTitle: string;
  icon: string;
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
  todayIndex: number;
};

export type HomeLevelSummary = {
  experience: number;
  level: number;
  nextLevelExperience: number;
  progress: number;
};

export type HomeWeekSummary = {
  dayDescriptions: string[];
  dayLabels: string[];
  dailyMinutes: number[];
  minutes: number;
  practiceCount: number;
};

export type HomeEnergySummary = {
  score: number | null;
  trend: number[];
};

export type HomePostureSummary = {
  date: string;
  id: string;
  score: number;
  summary: string;
};

export type HomePracticePhoto = {
  date: string;
  id: string;
  image: string;
  movementName: string;
  score: number;
};
