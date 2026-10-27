"use client";

import { useEffect, useState } from "react";
import type { ShenActivity } from "@/packages/shen-domain";
import type { PracticeSnapshot } from "@/features/practice/types";
import { HomeDashboard } from "./HomeDashboard";
import { isCapturedPracticePhoto } from "../utils/practice-photo";
import { localDayKey, recentDates, recordedPractices } from "../lib/practice-stats";
import type { HomeShenId } from "../types/home";
import { journeyRewards, shenDailyCues, yinYangSummary, type FormSteps, type JourneyRecord } from "@/packages/gamification";
import { loadCompletedMovements, loadMovementCompletionRecords, movementCompletionEvent } from "@/lib/movement-completion";
import { formStepsEvent, loadFormSteps } from "@/lib/form-steps";
import { loadMovementPracticeRecords, markMovementPracticed } from "@/lib/movement-practice";

type PracticeRecord = PracticeSnapshot;

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
  body: string;
  motto: string;
  shortLabel: string;
  title: string;
};

type Props = {
  homeCopy: Record<HomeShenId, ShenCopy>;
  onJournal: () => void;
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
  userId?: string;
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
  homeCopy,
  onJournal,
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
  userId,
}: Props) {
  const [completedMovementOrders, setCompletedMovementOrders] = useState<number[]>([]);
  const [completionRecords, setCompletionRecords] = useState<JourneyRecord[]>([]);
  const [practiceRecords,setPracticeRecords]=useState<JourneyRecord[]>([]);
  const [formSteps, setFormSteps] = useState<FormSteps>({});
  useEffect(() => {
    const refresh = () => { setCompletedMovementOrders(loadCompletedMovements(userId)); setCompletionRecords(loadMovementCompletionRecords(userId)); setFormSteps(loadFormSteps(userId)); };
    refresh();
    window.addEventListener(movementCompletionEvent, refresh);
    window.addEventListener(formStepsEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(movementCompletionEvent, refresh); window.removeEventListener(formStepsEvent, refresh); window.removeEventListener("storage", refresh); };
  }, [userId]);
  useEffect(()=>{practiceGallery.filter(item=>isCapturedPracticePhoto(item.imageData)).forEach(item=>markMovementPracticed(item.movementId,userId,item.createdAt));setPracticeRecords(loadMovementPracticeRecords(userId))},[practiceGallery,userId]);
  const sessions = recordedPractices(practiceGallery, shenActivities);
  const recentDays = recentDates();
  const practiceDays = sessions.map((session) => localDayKey(session.createdAt));
  const postureDays = postureReports.map((report) => localDayKey(report.createdAt));
  const dailyPractices = recentDays.map((day) => practiceDays.filter((key) => key === localDayKey(day)).length);
  const activeDays = recentDays.map((day) => {
    const key = localDayKey(day);
    return practiceDays.includes(key) || postureDays.includes(key);
  });
  const practicePhotos = practiceGallery
    .filter((snapshot) => isCapturedPracticePhoto(snapshot.imageData))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
    .map((snapshot) => ({ date: snapshot.createdAt, id: snapshot.id, image: snapshot.imageData, movementName: snapshot.movementName, score: snapshot.score }));
  const experience = sessions.length * 35 + shenActivities.filter((item) => item.type === "reflection").length * 15;
  const experienceIntoLevel = experience % 240;
  const hasRecordedActivity = sessions.length > 0 || postureDays.some(Boolean);
  const formRecords = practiceGallery.filter((item) => isCapturedPracticePhoto(item.imageData)).map((item) => ({ order: item.movementId, date: item.createdAt }));
  const completedOrders = new Set([...formRecords.map((item) => item.order), ...completedMovementOrders]);
  const completedForms = completedOrders.size;
  const balance = yinYangSummary(completedOrders, [...completionRecords,...practiceRecords]);
  const rewards = journeyRewards(completedOrders, [...completionRecords,...practiceRecords], formSteps, practiceRecords);
  const nextFormOrder = Array.from({ length: 18 }, (_, index) => index + 1).find((order) => !completedOrders.has(order)) ?? 1;

  return <HomeDashboard
    gamification={{ dailyCue: shenDailyCues[selectedShen.id], completedForms, completedOrders: completedMovementOrders, nextFormOrder, balance, rewards }}
    energy={{ score: hasRecordedActivity ? Math.round((activeDays.filter(Boolean).length / 7) * 100) : null, trend: activeDays.map((active) => active ? 100 : 0), dayLabels: recentDays.map((day) => new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day)), dayDescriptions: recentDays.map((day) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long" }).format(day)) }}
    level={{ experience: experienceIntoLevel, level: 1 + Math.floor(experience / 240), nextLevelExperience: 240, progress: Math.round((experienceIntoLevel / 240) * 100) }}
    onHistory={onJournal}
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
      dailyPractices,
      dayDescriptions: recentDays.map((day, index) => `${new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long" }).format(day)}${index === recentDays.length - 1 ? " · Bugün" : ""}`),
      dayLabels: recentDays.map((day) => new Intl.DateTimeFormat("tr-TR", { weekday: "narrow" }).format(day)),
      activeDays: dailyPractices.filter((count) => count > 0).length,
      practiceCount: dailyPractices.reduce((total, count) => total + count, 0),
    }}
  />;
}
