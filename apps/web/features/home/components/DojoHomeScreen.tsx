"use client";

import { calculateShenProgress, toDomainShenId, type ShenActivity } from "@/packages/shen-domain";
import { HomeDashboard } from "./HomeDashboard";
import { isCapturedPracticePhoto } from "../utils/practice-photo";
import type { HomeShenId } from "../types/home";

type PracticeRecord = {
  createdAt: string;
  id: string;
  imageData: string;
  movementName: string;
  score: number;
};

type PostureRecord = {
  createdAt: string;
  id: string;
  score: number;
  summary: string;
};

type ShenOption = {
  color: string;
  dailyName: string;
  dailyPrompt: string;
  element: string;
  id: HomeShenId;
  image: string;
  mapStage: number;
  name: string;
  organ: string;
  symbol: string;
};

type ShenCopy = {
  action: string;
  body: string;
  motto: string;
  shortLabel: string;
  title: string;
};

type Props = {
  energyScores: { shen: number | null };
  homeCopy: Record<HomeShenId, ShenCopy>;
  onJournal: () => void;
  onPractice: () => void;
  onPosture: (reportId?: string) => void;
  onReset: () => void;
  onSelectShen: (shenId: HomeShenId) => void;
  practiceGallery: PracticeRecord[];
  postureCount: number;
  postureReports: PostureRecord[];
  selectedShen: ShenOption;
  shenActivities: ShenActivity[];
  shenOptions: readonly ShenOption[];
  userName: string;
};

export function getPracticeStreak(practiceGallery: Array<Pick<PracticeRecord, "createdAt">>, activities: ShenActivity[]) {
  const dates = new Set<string>();
  const addDate = (value?: string) => {
    if (!value) return;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return;
    dates.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
  };
  practiceGallery.forEach((item) => addDate(item.createdAt));
  activities.filter((item) => item.type === "practice" && item.completed !== false).forEach((item) => addDate(item.createdAt));
  const sorted = [...dates].sort();
  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  sorted.forEach((key) => {
    const day = new Date(`${key}T12:00:00`).getTime();
    run = previous !== null && Math.round((day - previous) / 86400000) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  });
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let current = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    if (dates.has(key)) current += 1;
    else if (offset > 0 || dates.size > 0) break;
  }
  const todayIndex = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - todayIndex);
  const activeDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return dates.has(key);
  });
  return { activeDays, current, longest, todayIndex };
}

function toHomeShen(shen: ShenOption, copy: ShenCopy, period: string) {
  return {
    actionLabel: copy.action,
    color: shen.color,
    description: shen.dailyPrompt,
    element: shen.element.split("•")[0]?.trim() ?? "",
    heroBody: copy.body,
    heroTitle: copy.title,
    icon: `/images/five-shen-icons/${shen.id}.png`,
    id: shen.id,
    motto: copy.motto,
    name: shen.name,
    organ: shen.organ,
    period,
    shortLabel: copy.shortLabel,
    symbol: shen.symbol,
    wallpaper: shen.image,
  };
}

export function DojoHomeScreen({
  energyScores,
  homeCopy,
  onJournal,
  onPractice,
  onPosture,
  onReset,
  onSelectShen,
  practiceGallery,
  postureCount,
  postureReports,
  selectedShen,
  shenActivities,
  shenOptions,
  userName,
}: Props) {
  const progress = calculateShenProgress(shenActivities, toDomainShenId(selectedShen.id));
  const now = new Date();
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(now.getDate() - (6 - index));
    return day;
  });
  const dailyMinutes = recentDays.map((day) => shenActivities
    .filter((item) => item.type === "practice" && new Date(item.createdAt).toDateString() === day.toDateString())
    .reduce((total, item) => total + (item.minutes ?? 0), 0));
  const recentPractices = shenActivities.filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();
    return item.type === "practice" && item.completed !== false && createdAt >= recentDays[0].getTime();
  });
  const practicePhotos = practiceGallery
    .filter((snapshot) => isCapturedPracticePhoto(snapshot.imageData))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
    .map((snapshot) => ({ date: snapshot.createdAt, id: snapshot.id, image: snapshot.imageData, movementName: snapshot.movementName, score: snapshot.score }));
  const experienceIntoLevel = progress.experience % 240;

  return <HomeDashboard
    energy={{ score: energyScores.shen, trend: dailyMinutes.map((value) => Math.min(100, value * 18)) }}
    level={{ experience: experienceIntoLevel, level: progress.level, nextLevelExperience: 240, progress: Math.round((experienceIntoLevel / 240) * 100) }}
    onHistory={onJournal}
    onPractice={onPractice}
    onPosture={onPosture}
    onReset={onReset}
    onSelectShen={onSelectShen}
    postureCount={postureCount}
    postureReports={postureReports.map((report) => ({ date: report.createdAt, id: report.id, score: report.score, summary: report.summary }))}
    practicePhotos={practicePhotos}
    shen={toHomeShen(selectedShen, homeCopy[selectedShen.id], "Bugünün odağı")}
    shenOptions={shenOptions.map((shen) => toHomeShen(shen, homeCopy[shen.id], shen.dailyName))}
    streak={getPracticeStreak(practiceGallery, shenActivities)}
    userName={userName}
    week={{
      dailyMinutes,
      dayDescriptions: recentDays.map((day, index) => `${new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long" }).format(day)}${index === recentDays.length - 1 ? " · Bugün" : ""}`),
      dayLabels: recentDays.map((day) => new Intl.DateTimeFormat("tr-TR", { weekday: "narrow" }).format(day)),
      minutes: recentPractices.reduce((total, item) => total + (item.minutes ?? 0), 0),
      practiceCount: recentPractices.length,
    }}
  />;
}
