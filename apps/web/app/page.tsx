"use client";

import NextImage from "next/image";
import dynamic from "next/dynamic";
import type { CSSProperties, Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { JournalScreen } from "@/features/journal/components/JournalScreen";
import { ProfileScreen } from "@/features/profile/components/ProfileScreen";
import { PremiumOnboarding } from "@/features/onboarding/components/PremiumOnboarding";
import { HomeDashboard } from "@/features/home/components/HomeDashboard";
import { AmbientParticles } from "@/features/home/components/AmbientParticles";
import { PostureAssessmentLanding, PostureAutoCaptureScreen, PostureCaptureFlash, PostureCaptureReadyScreen, PostureFeedbackPanel, PostureHistoryScreen, PostureInsightStrip, PostureNeutralReference, PostureProcessingScreen, PostureResultDashboard, PostureSavedReportsGallery, PostureScorePanel, PostureSkeleton2D, PremiumPosturePreview, evaluateWebPostureFrame } from "@/features/posture/components/PostureScreens";
import type { NewPostureArchiveReport } from "@/features/new-posture/components/NewPostureScreen";
import type { HomeFlowSummary } from "@/features/home/types/home";
import type { LivingPracticeResult } from "@/packages/living-learning";
import { getStaticPractice, shortFlowDefinitions } from "@/packages/practice2";
import { ShibashiAuthGate } from "@/components/shibashi-auth-gate";
import { CoachMeridianCard, MeridianExplorer, MovementMeridianCard, PersonalMeridianSuggestion, PracticeMeridianSummaryCard } from "@/components/meridian/MeridianKnowledge";
import {getBrowserSyncCode,setBrowserSyncCode,syncBrowserState} from "@/lib/shibashi-sync-client";
import { useShibashiAuth } from "@/lib/supabase-auth";
import { shenThemes, visualThemes, type VisualThemeId } from "@/packages/design-tokens";
import { getJourneyDay } from "@/packages/experience-design";
import { fiveShenContent, fiveShenTraditionNote } from "@/packages/five-shen-content";
import type { OnboardingProfile } from "@/packages/onboarding";
import {
  breathingPatterns,
  calculateShenProgress,
  compareMovement,
  getGhostSequence,
  getInterpolatedGhostFrame,
  getMasterSentence,
  getPracticeForShen,
  getProgressLabel,
  getQuestionForShen,
  getShenProfile,
  getShenRecommendation,
  masterSentences,
  progressGoals,
  reflectionQuestions,
  shenProfiles,
  soundAtmospheres,
  toDomainShenId,
  type GhostMode,
  type ReflectionEntry as DomainReflectionEntry,
  type SavedMasterSentence,
  type ShenActivity,
  type ShibashiSyncPayload,
  type SyncRecord,
  type SyncStatus,
  type TraceMode,
} from "@/packages/shen-domain";
import {
  analyzePosture,
  getMidpoint,
  getPostureCorrections,
  getPostureMetricList,
  getPostureOverallScore,
  getPostureQualityCounts,
  getPostureRecommendations,
  getPostureReportCompositeAnalysis,
  isVisiblePosePoint,
  type PoseKeypoint,
  type PostureAnalysisSnapshot,
  type PostureView,
} from "@/packages/posture-analysis";

const MovementCoach = dynamic(
  () => import("@/components/tai-chi/MovementCoach").then((module) => module.MovementCoach),
  { ssr: false },
);
const LivingLearningScreen = dynamic(
  () => import("@/components/living-learning/LivingLearningScreen").then((module) => module.LivingLearningScreen),
  { ssr: false },
);
const Practice2Screen = dynamic(
  () => import("@/features/practice2/components/Practice2Screen").then((module) => module.Practice2Screen),
  { ssr: false },
);
const NewPostureScreen = dynamic(
  () => import("@/features/new-posture/components/NewPostureScreen").then((module) => module.NewPostureScreen),
  { ssr: false },
);

type TabId = "home" | "practice" | "practice2" | "posture" | "newPosture" | "journey" | "learning" | "journal" | "profile";
type ShenId = "hun" | "shen" | "yi" | "po" | "zhi";
type PostureRenderMode = "3d" | "2d";
type PostureAssessmentStep = "intro" | "history" | "captured" | "processing" | PostureView | "result";
type PostureScanGuidance = "model-loading" | "find-body" | "wrong-angle" | "reposition" | "hold" | "capturing";
type DomainShenId = (typeof shenProfiles)[number]["id"];

// Geçici arayüz anahtarları: altyapı ve bileşenler yeniden açılmak üzere korunur.
const WEB_GOOGLE_AUTH_UI_ENABLED = false;
const WEB_INTRO_VIDEO_ENABLED = false;
const SHEN_MUSIC_SESSION_KEY = "shibashi-session-music";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type Movement = {
  id: number;
  name: string;
  english: string;
  image: string;
  focus: string;
  cue: string;
};

type WarmupLessonId = "wuji" | "warmup" | "kua";
type PracticeLearningMode = "preparation" | "shibashi";
type PracticeAdaptation = "standing" | "seated" | "gentle";

type WarmupLesson = {
  id: WarmupLessonId;
  order: number;
  title: string;
  shortTitle: string;
  focus: string;
  description: string;
  cameraCue: string;
  breathCue: string;
  videoId: string;
};

type NeijingStage = {
  title: string;
  shenId?: ShenId;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  reward: string;
  depth: number;
  text: string;
  benefits: readonly string[];
  dailyUse: string;
  microPractice: string;
};

type InnerJourneyScene = {
  id: string;
  title: string;
  gate: string;
  bodyHint: string;
  encounter: string;
  ritual: string;
  x: number;
  y: number;
};


type Pose = {
  keypoints?: PoseKeypoint[];
};

type PoseDetector = {
  dispose?: () => void;
  estimatePoses: (input: HTMLVideoElement, config?: { flipHorizontal?: boolean }) => Promise<Pose[]>;
};

const poseConnections: ReadonlyArray<readonly [string, string]> = [
  ["left_ear", "left_eye"],
  ["left_eye", "nose"],
  ["nose", "right_eye"],
  ["right_eye", "right_ear"],
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
  ["left_wrist", "left_pinky"],
  ["left_wrist", "left_index"],
  ["left_wrist", "left_thumb"],
  ["right_wrist", "right_pinky"],
  ["right_wrist", "right_index"],
  ["right_wrist", "right_thumb"],
  ["left_ankle", "left_heel"],
  ["left_heel", "left_foot_index"],
  ["left_ankle", "left_foot_index"],
  ["right_ankle", "right_heel"],
  ["right_heel", "right_foot_index"],
  ["right_ankle", "right_foot_index"],
];

const mediaPipePoseNames = [
  "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer",
  "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow",
  "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index",
  "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle",
  "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index",
] as const;

const postureDisplayPoints = new Set([
  "nose", "left_ear", "right_ear",
  "left_shoulder", "right_shoulder",
  "left_elbow", "right_elbow",
  "left_wrist", "right_wrist",
  "left_hip", "right_hip",
  "left_knee", "right_knee",
  "left_ankle", "right_ankle",
  "left_heel", "right_heel",
  "left_foot_index", "right_foot_index",
]);

type PracticeSnapshot = {
  id: string;
  dateKey: string;
  timeLabel: string;
  createdAt: string;
  movementId: number;
  movementName: string;
  score: number;
  shenName: string;
  imageData: string;
  trainerVisible?: boolean;
  source?: "practice2";
};

type MovementAnalysisWindowState = "idle" | "recording" | "complete";

type MovementAnalysisWindowResult = {
  total: number;
  form: number;
  rhythm: number;
  balance: number;
  samples: number;
};


type PostureAssessmentCapture = {
  analysis: PostureAnalysisSnapshot;
  createdAt: string;
  imageData: string;
  view: PostureView;
};

type PostureReport = {
  asymmetrySignal: "düşük" | "orta" | "yüksek";
  captures: Record<PostureView, PostureAssessmentCapture>;
  createdAt: string;
  dateKey: string;
  flags: string[];
  id: string;
  score: number;
  summary: string;
  timeLabel: string;
  trainerVisible?: boolean;
  trendText: string;
};

function toWebPracticeSnapshot(record:SyncRecord):PracticeSnapshot|null {
 if(typeof record.id!=="string")return null;
 if(typeof record.movementId==="number"&&typeof record.score==="number"){
  const movement=movements.find(item=>item.id===record.movementId)??movements[0];
  const createdAt=typeof record.createdAt==="string"?record.createdAt:typeof record.date==="string"?record.date:new Date().toISOString();
  return{
   ...(record as unknown as PracticeSnapshot),
   id:record.id,
   createdAt,
   dateKey:typeof record.dateKey==="string"?record.dateKey:formatSnapshotDate(new Date(createdAt)),
   timeLabel:typeof record.timeLabel==="string"?record.timeLabel:formatSnapshotTime(new Date(createdAt)),
   movementId:record.movementId,
   movementName:typeof record.movementName==="string"?record.movementName:movement?.name??"App pratiği",
   score:record.score,
   shenName:typeof record.shenName==="string"?record.shenName:"App",
   imageData:portableHistoryImage(record.imageData,""),
  };
 }
 const createdAt=typeof record.date==="string"?record.date:typeof record.createdAt==="string"?record.createdAt:new Date().toISOString();
 const score=Number(record.flowScore??record.postureScore??record.balanceScore??0);
 const movementMatch=String(record.practiceId??"").match(/\d+/);
 const movementId=movementMatch?Number(movementMatch[0]):1;
 const movement=movements.find(item=>item.id===movementId)??movements[0];
 return{
  id:record.id,
  dateKey:formatSnapshotDate(new Date(createdAt)),
  timeLabel:formatSnapshotTime(new Date(createdAt)),
  createdAt,
  movementId,
  movementName:movement?.name??"App pratiği",
  score:Number.isFinite(score)?score:0,
  shenName:"App",
  imageData:"",
 };
}

function toWebPostureReport(record:SyncRecord):PostureReport|null {
 if(typeof record.id!=="string"||typeof record.score!=="number")return null;
 if(record.captures&&!Array.isArray(record.captures))return record as unknown as PostureReport;
 const date=typeof record.date==="string"?record.date:new Date().toISOString();
 const sourceCaptures=Array.isArray(record.captures)?record.captures as Array<Record<string,unknown>>:[];
 const captureFor=(view:PostureView):PostureAssessmentCapture=>{
  const source=sourceCaptures.find(item=>item.view===view);
  const axisScore=Number(source?.axisScore??record.score);
  const shoulderScore=Number(source?.shoulderScore??record.score);
  const hipScore=Number(source?.hipScore??record.score);
  const measurements=(source?.measurements&&typeof source.measurements==="object"?source.measurements:{}) as Record<string,unknown>;
  const sourceConfidence=Number(source?.confidence??0);
  const confidence=Math.round(sourceConfidence<=1?sourceConfidence*100:sourceConfidence);
  const shoulderTilt=Number(view==="side"?measurements.headForwardDegrees:measurements.shoulderTiltDegrees);
  const hipTilt=Number(view==="side"?measurements.legLeanDegrees:measurements.hipTiltDegrees);
  const spineShift=Number(view==="side"?measurements.torsoLeanDegrees:measurements.axisTiltDegrees);
  return{
   view,
   createdAt:date,
   imageData:"",
   analysis:{axisScore,confidence,shoulderScore,hipScore,shoulderTilt:Number.isFinite(shoulderTilt)?shoulderTilt:0,hipTilt:Number.isFinite(hipTilt)?hipTilt:0,spineShift:Number.isFinite(spineShift)?spineShift:0,flags:[],feedback:String(source?.feedback??"App ölçümü senkronize edildi."),view},
  };
 };
 const score=record.score;
 return{
  id:record.id,
  score,
  createdAt:date,
  dateKey:formatSnapshotDate(new Date(date)),
  timeLabel:formatSnapshotTime(new Date(date)),
  captures:{front:captureFor("front"),side:captureFor("side"),back:captureFor("back")},
  asymmetrySignal:score<62?"yüksek":score<78?"orta":"düşük",
  flags:[],
  summary:String(record.summary??"App postür ölçümü senkronize edildi."),
  trendText:"App ile eşitlendi",
 };
}

type AvatarPosePoint = {
  name: string;
  score: number;
  x: number;
  y: number;
};

type AvatarPose = {
  points: Map<string, AvatarPosePoint>;
  visibleCount: number;
};

type EnergyScores = {
  jing: number | null;
  qi: number | null;
  shen: number | null;
};

type CoachCueName = "align" | "calibration" | "ok" | "soft" | "start";

type CoachCueRequest = {
  coach: AiCoach;
  force: boolean;
  name: CoachCueName;
  text: string;
};

const movements: Movement[] = [
  {
    id: 1,
    name: "Açılış Formu",
    english: "Açılış ve hizalanma",
    image: "/images/shibashi/01-acilis-formu.jpg",
    focus: "Duruş",
    cue: "Kollar çabayla değil, nefesin taşıdığı kadar yükselsin.",
  },
  {
    id: 2,
    name: "Bağrını Açmak",
    english: "Göğüs hattını yumuşakça açma",
    image: "/images/shibashi/02-bagrini-acmak.jpg",
    focus: "Nefes",
    cue: "Kaburgaları zorlamadan, göğüs hattını genişlet.",
  },
  {
    id: 3,
    name: "Gökkuşakları ile Dans",
    english: "Yumuşak yan akış",
    image: "/images/shibashi/03-gokkusaklari.jpg",
    focus: "Akış",
    cue: "Ağırlığı yavaş bir dalga gibi taşı.",
  },
  {
    id: 4,
    name: "İçten Dışa",
    english: "Merkezden açılıp merkeze dönme",
    image: "/images/shibashi/04-icten-disa.jpg",
    focus: "Merkez",
    cue: "Daireyi yuvarlak ve sessiz tut.",
  },
  {
    id: 5,
    name: "Maymunu İtekle",
    english: "Merkezden yumuşak itiş",
    image: "/images/shibashi/05-maymunu-itekle.jpg",
    focus: "Denge",
    cue: "İtişi merkezden başlat, omuzları yumuşat.",
  },
  {
    id: 6,
    name: "Kayıkta Kürek Çek",
    english: "Kolları kürek gibi dairesel taşıma",
    image: "/images/shibashi/06-kayikta-kurek.jpg",
    focus: "Koordinasyon",
    cue: "Kollar daire çizerken ağırlığı ayakların arasında sessizce taşı.",
  },
  {
    id: 7,
    name: "Balonla Oyna",
    english: "Topu kaldırma ve merkezi koruma",
    image: "/images/shibashi/07-balonla-oynama.jpg",
    focus: "Merkez",
    cue: "Avuçların arasındaki alanı koru; omuzları yukarı çekme.",
  },
  {
    id: 8,
    name: "Ayı Göğe Gönder",
    english: "Topu göğe taşıma",
    image: "/images/shibashi/08-ayi-goge-gonder.jpg",
    focus: "Uzanma",
    cue: "Kollar yükselirken göğsü sıkıştırmadan omurgayı uzat.",
  },
  {
    id: 9,
    name: "Karnın ile İt",
    english: "Merkezden öne yumuşak itiş",
    image: "/images/shibashi/09-karnin-ile-it.jpg",
    focus: "Dan Tian",
    cue: "Ellerden önce alt karın merkezinin yön değiştirdiğini hisset.",
  },
  {
    id: 10,
    name: "Bulutlarla Dans",
    english: "Bulut elleriyle yan akış",
    image: "/images/shibashi/10-bulut-ile-dans.jpg",
    focus: "Akış",
    cue: "Bakış, bel ve eller aynı sakin dalganın içinde yön değiştirsin.",
  },
  {
    id: 11,
    name: "Okyanustan Suyu Göğe Taşı",
    english: "Aşağıdan yukarı genişleyen akış",
    image: "/images/shibashi/11-okyanustan-suyu-goge-tasi.jpg",
    focus: "Nefes",
    cue: "Aşağı inerken gevşe, yükselirken nefesle birlikte bütün bedeni uzat.",
  },
  {
    id: 12,
    name: "Dalgalarla Oyna",
    english: "Öne ve geriye ağırlık aktarımı",
    image: "/images/shibashi/12-dalgalar-ile-oyna.jpg",
    focus: "Ağırlık",
    cue: "Dizleri kilitlemeden ağırlığı dalga gibi öne ve geriye taşı.",
  },
  {
    id: 13,
    name: "Yaban Kazı Kanatlarını Açıyor",
    english: "Kanatları iki yana açma",
    image: "/images/shibashi/13-yaban-kazi-kanat.jpg",
    focus: "Göğüs",
    cue: "Kollar açılırken kürek kemiklerini sıkıştırmadan göğüste alan bırak.",
  },
  {
    id: 14,
    name: "Yumruklama",
    english: "Merkezden kontrollü yumruk",
    image: "/images/shibashi/14-yumruklama.jpg",
    focus: "Güç",
    cue: "Yumruğu omuzdan değil, ayak ve bel hattından yumuşakça gönder.",
  },
  {
    id: 15,
    name: "Yaban Kazı Yükseliyor",
    english: "Kanatlarla yükselme ve alçalma",
    image: "/images/shibashi/15-yaban-kazi-yukseliyor.jpg",
    focus: "Denge",
    cue: "Yükselirken acele etme; bakışı sabit, ayak tabanını canlı tut.",
  },
  {
    id: 16,
    name: "Değirmeni Döndür",
    english: "Büyük dairesel kol hareketi",
    image: "/images/shibashi/16-degirmeni-dondur.jpg",
    focus: "Daire",
    cue: "Daireyi yalnız kollarla değil, bel ve Kua ile birlikte döndür.",
  },
  {
    id: 17,
    name: "Topu Sektir",
    english: "Ritimli el ve adım koordinasyonu",
    image: "/images/shibashi/17-topu-sektirme.jpg",
    focus: "Ritim",
    cue: "El ve karşı ayağı aynı yumuşak ritimde buluştur.",
  },
  {
    id: 18,
    name: "Kapanış Formu",
    english: "Nefesi ve hareketi merkeze toplama",
    image: "/images/shibashi/18-kapanis.jpg",
    focus: "Bütünleme",
    cue: "Avuçlar alçalırken nefesi doğal bırak ve ağırlığı merkeze topla.",
  },
];

const warmupLessons: readonly WarmupLesson[] = [
  {
    id: "wuji",
    order: 1,
    title: "Wuji: Temel Duruş",
    shortTitle: "Wuji",
    focus: "Hizalanma",
    description: "Baş, omuz, pelvis, diz ve ayak tabanını zorlamadan aynı dikey bütünlükte buluştur.",
    cameraCue: "Baş ve ayaklar kadrajda olsun. Dizleri kilitlemeden iki ayağa eşit yerleş.",
    breathCue: "Nefesi düzeltmeye çalışma; burundan doğal akışını izle.",
    videoId: "9K2yhF0kh1g",
  },
  {
    id: "warmup",
    order: 2,
    title: "Isınma: Eklemleri Aç",
    shortTitle: "Isınma",
    focus: "Hareketlilik",
    description: "Kasları ısıt, eklem çevresini rahatlat ve tendonları ana forma nazikçe hazırla.",
    cameraCue: "Hareket açıklığını zorlamadan videodaki yavaş ritmi takip et.",
    breathCue: "Açılırken nefes al, merkeze dönerken nefes ver.",
    videoId: "WmC0lMoFZnA",
  },
  {
    id: "kua",
    order: 3,
    title: "Pelvis, Kua ve Dan Tian",
    shortTitle: "Kua",
    focus: "Merkez",
    description: "Hareketi belden zorlamak yerine pelvis, kalça kıvrımı ve alt karın merkezinden başlat.",
    cameraCue: "Omuzları sakin tut; yön değişimini kalça ve dizlerle birlikte taşı.",
    breathCue: "Merkez açılırken nefes al, ağırlık yerleşirken nefes ver.",
    videoId: "eem4xQX8mfc",
  },
];

const shibashiFullSetVideoId = "y-S29E23AGE";

const movementReferenceImages: Record<number, string> = {
  1: "/images/shibashi-reference-web/ref-open-gate.jpg",
  2: "/images/shibashi-reference-web/ref-red-arms.jpg",
  3: "/images/shibashi-reference-web/ref-twist.jpg",
  4: "/images/shibashi-reference-web/ref-ball-stance.jpg",
  5: "/images/shibashi-reference-web/ref-push-palms.jpg",
  6: "/images/shibashi-reference/06-kayikta-kurek.jpg",
  7: "/images/shibashi-reference/07-balonla-oynama.jpg",
  8: "/images/shibashi-reference/08-ayi-goge-gonder.jpg",
  9: "/images/shibashi-reference/09-karnin-ile-it.jpg",
  10: "/images/shibashi-reference/10-bulut-ile-dans.jpg",
  11: "/images/shibashi-reference/11-okyanustan-suyu-goge-tasi.jpg",
  12: "/images/shibashi-reference/12-dalgalar-ile-oyna.jpg",
  13: "/images/shibashi-reference/13-yaban-kazi-kanat.jpg",
  14: "/images/shibashi-reference/14-yumruklama.jpg",
  15: "/images/shibashi-reference/15-yaban-kazi-yukseliyor.jpg",
  16: "/images/shibashi-reference/16-degirmeni-dondur.jpg",
  17: "/images/shibashi-reference/17-topu-sektirme.jpg",
  18: "/images/shibashi-reference/18-kapanis.jpg",
};

function getMovementReferenceImage(movement: Movement) {
  return movementReferenceImages[movement.id] ?? movement.image;
}

function getInnerJourneyScene(movementId: number) {
  const index = Math.min(innerJourneyScenes.length - 1, Math.floor(((movementId - 1) / movements.length) * innerJourneyScenes.length));
  return innerJourneyScenes[index] ?? innerJourneyScenes[0];
}

const tabs: { id: TabId | "bodyLines"; label: string; icon: string }[] = [
  { id: "home", label: "Özel Odam", icon: "◉" },
  { id: "practice2", label: "Akışa Gir", icon: "⌁" },
  { id: "practice", label: "Yolculuk", icon: "◎" },
  { id: "posture", label: "Bedenini Gör", icon: "↕" },
  { id: "newPosture", label: "New_posture", icon: "◫" },
  { id: "journey", label: "Haritan", icon: "☯" },
  { id: "bodyLines", label: "Beden Hatları", icon: "⌇" },
  { id: "learning", label: "Yaşayarak Öğren", icon: "✦" },
  { id: "journal", label: "Günlüğüm", icon: "◌" },
  { id: "profile", label: "Gelişimim", icon: "☰" },
];

const coachVoiceVersion = "tr-yelda-20260714";

const fiveShen = [
  {
    id: "hun",
    name: "Hun",
    label: fiveShenContent.hun.familiarName,
    value: 64,
    note: "Bugün geniş bakış açık.",
    organ: "Karaciğer",
    map: "Gözler, yan beden ve yön duygusu",
    point: { x: 41, y: 49 },
    color: shenThemes.hun.primary,
    color2: shenThemes.hun.dark,
    image: "/images/shen-home/hun-web.webp",
    music: "/videos/shen-music-hun.mp4",
    tone: 196,
    hero: fiveShenContent.hun.balancedExpression,
    dailyName: fiveShenContent.hun.familiarName,
    dailyPrompt: fiveShenContent.hun.dailyPrompt,
    recommendation: fiveShenContent.hun.overview,
    bagua: "Zhen",
    baguaText: "Ağaç • Şimşek • Başlatma",
    task: fiveShenContent.hun.practiceCue,
    mapStage: 4,
    mapTitle: "Hun Ormanı",
    world: "Gün doğumu, rüzgâr, açık ufuk ve büyüyen yeşil",
    essence: fiveShenContent.hun.shortMeaning,
    motif: "orman",
    symbol: "木",
    element: "Ağaç • Karaciğer",
    geometry: "Dallanan • asimetrik • yükselen",
    motion: "Büyüme, rüzgâr, esneme",
    sound: "Yaprak, bambu ve hava",
    language: "Keşifçi, vizyoner, esnek",
  },
  {
    id: "shen",
    name: "Shen",
    label: fiveShenContent.shen.familiarName,
    value: 48,
    note: "Sakinleşmeye alan aç.",
    organ: "Kalp",
    map: "Göğüs merkezi, bakış ve temas",
    point: { x: 50, y: 38 },
    color: shenThemes.shen.primary,
    color2: shenThemes.shen.dark,
    image: "/images/shen-home/shen-fire-web.webp",
    music: "/videos/shen-music-shen.mp4",
    tone: 256,
    hero: fiveShenContent.shen.balancedExpression,
    dailyName: fiveShenContent.shen.familiarName,
    dailyPrompt: fiveShenContent.shen.dailyPrompt,
    recommendation: fiveShenContent.shen.overview,
    bagua: "Li",
    baguaText: "Ateş • Işık • Açıklık",
    task: fiveShenContent.shen.practiceCue,
    mapStage: 3,
    mapTitle: "Kalp Tapınağı",
    world: "Bütün elementlerin birleştiği yumuşak altın ışık",
    essence: fiveShenContent.shen.shortMeaning,
    motif: "ates",
    symbol: "火",
    element: "Ateş • Kalp",
    geometry: "Dağılan ışık • radyal • organik",
    motion: "Kıvılcım ve yayılma",
    sound: "Sıcak drone ve hafif çıtırtı",
    language: "Canlı, ilişkisel, cesaretlendirici",
  },
  {
    id: "yi",
    name: "Yi",
    label: fiveShenContent.yi.familiarName,
    value: 72,
    note: "Pratik hedefi net.",
    organ: "Dalak",
    map: "Merkez, karın hattı ve odak",
    point: { x: 50, y: 55 },
    color: shenThemes.yi.primary,
    color2: shenThemes.yi.dark,
    image: "/images/shen-home/yi-web.webp",
    music: "/videos/shen-music-yi.mp4",
    tone: 220,
    hero: fiveShenContent.yi.balancedExpression,
    dailyName: fiveShenContent.yi.familiarName,
    dailyPrompt: fiveShenContent.yi.dailyPrompt,
    recommendation: fiveShenContent.yi.overview,
    bagua: "Kun",
    baguaText: "Dağ • Toprak • Merkez",
    task: fiveShenContent.yi.practiceCue,
    mapStage: 2,
    mapTitle: "Yi Toprağı",
    world: "Sis, yumuşak ışık, dikkat ve sessiz iç denge",
    essence: fiveShenContent.yi.shortMeaning,
    motif: "dag",
    symbol: "土",
    element: "Toprak • Dalak",
    geometry: "Çokgen • nötr • modüler",
    motion: "Düşük hız, sabit ritim",
    sound: "Toprak tonu ve yumuşak vuruş",
    language: "Sade, sıralı, uygulanabilir",
  },
  {
    id: "po",
    name: "Po",
    label: fiveShenContent.po.familiarName,
    value: 58,
    note: "Omuzlarda çözülme bekliyor.",
    organ: "Akciğer",
    map: "Omuzlar, nefes kapısı ve cilt farkındalığı",
    point: { x: 59, y: 42 },
    color: shenThemes.po.primary,
    color2: shenThemes.po.dark,
    image: "/images/shen-home/po-web.webp",
    music: "/videos/shen-music-po.mp4",
    tone: 174,
    hero: fiveShenContent.po.balancedExpression,
    dailyName: fiveShenContent.po.familiarName,
    dailyPrompt: fiveShenContent.po.dailyPrompt,
    recommendation: fiveShenContent.po.overview,
    bagua: "Dui",
    baguaText: "Göl • Metal • Bırakma",
    task: fiveShenContent.po.practiceCue,
    mapStage: 7,
    mapTitle: "Po Gölü",
    world: "Toprak tonları, ağır nefes, güven ve sakin merkez",
    essence: fiveShenContent.po.shortMeaning,
    motif: "gol",
    symbol: "金",
    element: "Metal • Akciğer",
    geometry: "Keskin • metalik • arıtılmış",
    motion: "Net giriş, net çıkış",
    sound: "Metal rezonansı ve boşluk",
    language: "Kısa, bedensel, doğrudan",
  },
  {
    id: "zhi",
    name: "Zhi",
    label: fiveShenContent.zhi.familiarName,
    value: 69,
    note: "Kısa tekrar yeterli.",
    organ: "Böbrek",
    map: "Bel, dizler, ayak tabanı ve kök",
    point: { x: 50, y: 72 },
    color: shenThemes.zhi.primary,
    color2: shenThemes.zhi.dark,
    image: "/images/shen-home/zhi-web.webp",
    music: "/videos/shen-music-zhi.mp4",
    tone: 146,
    hero: fiveShenContent.zhi.balancedExpression,
    dailyName: fiveShenContent.zhi.familiarName,
    dailyPrompt: fiveShenContent.zhi.dailyPrompt,
    recommendation: fiveShenContent.zhi.overview,
    bagua: "Kan",
    baguaText: "Okyanus • Su • Derinlik",
    task: fiveShenContent.zhi.practiceCue,
    mapStage: 0,
    mapTitle: "Zhi Okyanusu",
    world: "Gece, ay ışığı, derin su ve sessiz irade",
    essence: fiveShenContent.zhi.shortMeaning,
    motif: "okyanus",
    symbol: "水",
    element: "Su • Böbrek",
    geometry: "Akışkan • derin • katmanlı",
    motion: "Gelgit, süzülme, derinleşme",
    sound: "Su altı uğultusu ve damla",
    language: "Az, derin, sakin ve kararlı",
  },
] as const satisfies ReadonlyArray<{
  id: ShenId;
  name: string;
  label: string;
  value: number;
  note: string;
  organ: string;
  map: string;
  point: { x: number; y: number };
  color: string;
  color2: string;
  image: string;
  music: string;
  tone: number;
  hero: string;
  dailyName: string;
  dailyPrompt: string;
  recommendation: string;
  bagua: string;
  baguaText: string;
  task: string;
  mapStage: number;
  mapTitle: string;
  world: string;
  essence: string;
  motif: string;
  symbol: string;
  element: string;
  geometry: string;
  motion: string;
  sound: string;
  language: string;
}>;

const shenTodayCopy: Record<ShenId, {
  action: string;
  body: string;
  identity: string;
  motto: string;
  practice: string;
  shortLabel: string;
  title: string;
}> = {
  hun: {
    action: "Yönünü bul",
    body: fiveShenContent.hun.dailyPrompt,
    identity: fiveShenContent.hun.identity,
    motto: "Rüzgâr yönü gösterir; adımı sen seçersin.",
    practice: "Ufuk Açan Akış",
    shortLabel: fiveShenContent.hun.familiarName,
    title: "Ufku genişlet.",
  },
  shen: {
    action: "Berraklığı aç",
    body: fiveShenContent.shen.dailyPrompt,
    identity: fiveShenContent.shen.identity,
    motto: "Kalp yumuşadığında parçalar birbirini duyar.",
    practice: "Kalp Merkezinde Akış",
    shortLabel: fiveShenContent.shen.familiarName,
    title: "Berrak ve ilgili kal.",
  },
  yi: {
    action: "Odağını kur",
    body: fiveShenContent.yi.dailyPrompt,
    identity: fiveShenContent.yi.identity,
    motto: "Bir anda tek şey; bir nefeste tek yön.",
    practice: "Merkezleyen Tekrar",
    shortLabel: fiveShenContent.yi.familiarName,
    title: "Niyetini eyleme taşı.",
  },
  po: {
    action: "Bedene dön",
    body: fiveShenContent.po.dailyPrompt,
    identity: fiveShenContent.po.identity,
    motto: "Beden bıraktığında nefes yerini bulur.",
    practice: "Nefes ve Bırakış",
    shortLabel: fiveShenContent.po.familiarName,
    title: "Nefesi ve bedeni duy.",
  },
  zhi: {
    action: "İradeni koru",
    body: fiveShenContent.zhi.dailyPrompt,
    identity: fiveShenContent.zhi.identity,
    motto: "Derin su acele etmez; yine de yolunu bulur.",
    practice: "Köklenme Akışı",
    shortLabel: fiveShenContent.zhi.familiarName,
    title: "Sessizce devam et.",
  },
};

const neijingStages: readonly NeijingStage[] = [
  {
    title: "Zhi Okyanusu",
    shenId: "zhi",
    x: 50,
    y: 82,
    labelX: 50,
    labelY: 87,
    reward: "Köklenme pratiği",
    depth: 18,
    text: "Köklenme, korkuyla yüzleşme ve devam etme gücü. Pratik burada ayak tabanı, dizler ve bel hattını sakinleştirir.",
    benefits: ["Ayak tabanı farkındalığı", "Bel hattında güven", "Telaş azalınca devam gücü"],
    dailyUse: "Güne başlamadan, toplantı öncesi ya da içinden kaçma isteği geldiğinde zemini yeniden hatırlatır.",
    microPractice: "İki ayağını yere bastır. Dizleri kilitlemeden yumuşat. Üç nefes boyunca ağırlığını topuktan parmaklara gezdir.",
  },
  {
    title: "Alt Dantian",
    x: 50,
    y: 51,
    labelX: 75,
    labelY: 84,
    reward: "Merkez pratiği",
    depth: 31,
    text: "Günlük enerjinin toplandığı merkez. Hareketin alt bedenden doğduğunu ve nefesle güçlendiğini gösterir.",
    benefits: ["Enerjiyi toparlama", "Merkezden hareket etme", "Yorgunlukta sakin güç"],
    dailyUse: "İşten sonra dağılan enerjiyi toplamaya, bedeni yeniden merkeze çağırmaya yarar.",
    microPractice: "Avuçlarını alt karna yaklaştır. Nefes alırken alan genişlesin, verirken omuzlar ağırlaşsın.",
  },
  {
    title: "Yi Toprağı",
    shenId: "yi",
    x: 50,
    y: 42,
    labelX: 52,
    labelY: 69,
    reward: "Odak pratiği",
    depth: 42,
    text: "Niyet, öğrenme ve tekrar alanı. Burada pratik tek seferlik deneme olmaktan çıkıp alışkanlığa dönüşür.",
    benefits: ["Odaklanma", "Planı bitirme", "Zihinsel dağınıklığı sadeleştirme"],
    dailyUse: "Bir işe başlayamıyorsan ya da aynı anda çok şeye bölündüysen zihni tek çizgiye indirir.",
    microPractice: "Bakışını tek noktaya al. Bir sonraki küçük adımı sessizce söyle. Sonra sadece o adıma başla.",
  },
  {
    title: "Kalp Tapınağı",
    shenId: "shen",
    x: 50,
    y: 29,
    labelX: 66,
    labelY: 53,
    reward: "Göğüs açıklığı pratiği",
    depth: 56,
    text: "Kalp farkındalığı, açıklık ve yumuşak temas. Göğüs hattı zorlanmadan açılır, bakış sakinleşir.",
    benefits: ["Göğüs açıklığı", "İlişkide yumuşama", "Neşe ve temas hissi"],
    dailyUse: "Bir konuşmaya girmeden önce tonu yumuşatır; savunmaya geçmeden bağlantıda kalmayı destekler.",
    microPractice: "Dirsekleri gevşet. Göğsü zorlamadan genişlet. Nefes verirken yüz kaslarını serbest bırak.",
  },
  {
    title: "Hun Ormanı",
    shenId: "hun",
    x: 43,
    y: 36,
    labelX: 31,
    labelY: 50,
    reward: "Yön pratiği",
    depth: 67,
    text: "Yön, vizyon ve akış cesareti. Kolların yolu, bakış yönü ve genişleme hissi bu bölgede öne çıkar.",
    benefits: ["Yön duygusu", "Akışa girme", "Karar sonrası hareket"],
    dailyUse: "Önünü göremediğin anlarda bedene rota hissi verir; küçük ama canlı bir ileri hareket başlatır.",
    microPractice: "Bakışını ufka taşı. Kolları yavaşça yana aç. Nefesle birlikte alanın genişlediğini hisset.",
  },
  {
    title: "12 Katlı Pagoda",
    x: 50,
    y: 21,
    labelX: 53,
    labelY: 35,
    reward: "Nefes ritmi pratiği",
    depth: 78,
    text: "Boğaz geçidi nefesin ve ifadenin daralıp açıldığı yerdir. Hareket dili burada sakinleşir.",
    benefits: ["Nefes ritmi", "Sakin ifade", "Boyun ve çene gevşemesi"],
    dailyUse: "Cevap vermeden önce durmak, ses tonunu yumuşatmak ve bedende sıkışan ifadeyi açmak için iyidir.",
    microPractice: "Çeneyi sıkmadan bırak. Nefesi burundan al. Verirken boynun arkasında uzunluk hissi yarat.",
  },
  {
    title: "Kunlun Zirveleri",
    x: 50,
    y: 7,
    labelX: 52,
    labelY: 13,
    reward: "Berraklık pratiği",
    depth: 92,
    text: "Berraklık, üst merkez ve dönüş kapısı. Haritanın zirvesi bitiş değil, daha sakin bir başlangıçtır.",
    benefits: ["Berrak bakış", "Geniş perspektif", "Daha sakin başlangıç"],
    dailyUse: "Yoğun bir günün sonunda olaylara biraz yukarıdan bakmak ve kendini yeniden hizalamak için açılır.",
    microPractice: "Başın tepesinden yukarı hafif bir ip varmış gibi uzan. Omuzları indirmeyi unutma.",
  },
  {
    title: "Po Gölü",
    shenId: "po",
    x: 58,
    y: 30,
    labelX: 26,
    labelY: 72,
    reward: "Bırakma pratiği",
    depth: 84,
    text: "Nefes, beden hafızası ve bırakma alanı. Omuzlar, göğüs kafesi ve cilt farkındalığı yumuşar.",
    benefits: ["Bırakma becerisi", "Omuzlarda hafifleme", "Bedensel sinyalleri duyma"],
    dailyUse: "Fazlalık taşıdığını hissettiğinde, özellikle omuz ve göğüs çevresindeki gerilimi çözmek için çalışır.",
    microPractice: "Omuzları kulaklara doğru kaldır, sonra bırak. Nefes verirken göğüs kafesinin ağırlaştığını hisset.",
  },
];

const innerJourneyScenes: readonly InnerJourneyScene[] = [
  {
    id: "threshold",
    title: "Eşik Koridoru",
    gate: "Kapı 1",
    bodyHint: "Dışarıdan bakınca yalnızca taş bir yol gibi görünür.",
    encounter: "İki altın çizgi nefesin ritmini taşır; yol henüz sana beden olduğunu söylemez.",
    ritual: "Kameradan önce bu eşiğe gir. İlk form sadece yolu açar.",
    x: 18,
    y: 76,
  },
  {
    id: "breath-river",
    title: "Nefes Nehri",
    gate: "Kapı 2",
    bodyHint: "Zemin yumuşar, içeride akan şeyin nefes olduğunu fark etmeye başlarsın.",
    encounter: "Işıklı su hattı göğüs ve karın arasında genişleyip daralır.",
    ritual: "Hareketi büyütmeden önce nefesi büyüt.",
    x: 34,
    y: 64,
  },
  {
    id: "shoulder-arch",
    title: "Omuz Kemerleri",
    gate: "Kapı 3",
    bodyHint: "Tavan kemerleri omuzların eski yüklerini tutan geçitlere dönüşür.",
    encounter: "Kemerlerden geçen ışık, kolların çabayla değil taşıma hissiyle yükselmesini ister.",
    ritual: "Omuzları kaldırmadan kolu kaldır.",
    x: 48,
    y: 53,
  },
  {
    id: "heart-temple",
    title: "Kalp Holü",
    gate: "Kapı 4",
    bodyHint: "Uzakta görünen tapınak artık merkezdeki sıcak alan gibi hissedilir.",
    encounter: "Kapının ardında açıklık, bakış ve yumuşak temas aynı ışıkta toplanır.",
    ritual: "Göğsü zorlamadan alan aç.",
    x: 58,
    y: 43,
  },
  {
    id: "spine-river",
    title: "Omurga Nehri",
    gate: "Kapı 5",
    bodyHint: "Yol yukarı kıvrılır; bunun bir patika değil, iç eksen olduğunu anlarsın.",
    encounter: "Sarmal çizgi ayaktan başa kadar merkezi takip eder.",
    ritual: "Dikleşme çabası değil, eksene dönme hissi.",
    x: 52,
    y: 32,
  },
  {
    id: "mind-lanterns",
    title: "Zihin Fenerleri",
    gate: "Kapı 6",
    bodyHint: "Dağınık ışıklar tek tek hizaya gelir.",
    encounter: "Her fener bir dikkat düğümünü çözer; hareketin sırası netleşir.",
    ritual: "Bir sonraki küçük hareketi seç ve sadece onu tamamla.",
    x: 60,
    y: 24,
  },
  {
    id: "crown-stairs",
    title: "Taç Merdiveni",
    gate: "Kapı 7",
    bodyHint: "Yol artık yukarı değil, içeride derine doğru ilerler.",
    encounter: "Yukarıdaki ışık başın üzerinde değil; sakinleşen bakışın içinde belirir.",
    ritual: "Bakışı sertleştirmeden yön ver.",
    x: 48,
    y: 16,
  },
  {
    id: "inner-sky",
    title: "İç Gökyüzü",
    gate: "Kapı 8",
    bodyHint: "Son kapıda haritanın bedenin içinde yürüyen bir yol olduğu açığa çıkar.",
    encounter: "Nefes, omurga, bakış ve adım tek sahnede birleşir.",
    ritual: "Pratik bittiğinde bir dakika sessiz kal; yolun izini taşı.",
    x: 50,
    y: 8,
  },
];

const aiCoaches = [
  {
    id: "he",
    imageIndex: 0,
    name: "He Xiangu",
    role: "Yumuşak güç ve içsel zarafet",
    shenId: "shen",
    rate: 0.82,
    pitch: 1.13,
    detune: 70,
    filterFrequency: 1450,
    filterGain: 2.4,
    cadenceMs: 15200,
    styleLead: "Yumuşakça.",
    styleClose: "Zarafeti koru.",
  },
  {
    id: "han",
    imageIndex: 1,
    name: "Han Xiangzi",
    role: "Nefes, müzik ve yaratıcı akış",
    shenId: "hun",
    rate: 0.84,
    pitch: 1.06,
    detune: 35,
    filterFrequency: 1180,
    filterGain: 1.4,
    cadenceMs: 14500,
    styleLead: "Nefesi dinle.",
    styleClose: "Akışın sesi yumuşak kalsın.",
  },
  {
    id: "li",
    imageIndex: 2,
    name: "Li Tieguai",
    role: "Dayanıklılık ve şefkatli disiplin",
    shenId: "zhi",
    rate: 0.76,
    pitch: 0.86,
    detune: -120,
    filterFrequency: 760,
    filterGain: 3.2,
    cadenceMs: 16800,
    styleLead: "Sabit kal.",
    styleClose: "Gücünü yere indir.",
  },
  {
    id: "lu",
    imageIndex: 3,
    name: "Lü Dongbin",
    role: "Keskin farkındalık ve ustalık",
    shenId: "po",
    rate: 0.8,
    pitch: 0.98,
    detune: -30,
    filterFrequency: 980,
    filterGain: 2,
    cadenceMs: 15000,
    styleLead: "Net gör.",
    styleClose: "Fazlayı bırak.",
  },
  {
    id: "zhang",
    imageIndex: 4,
    name: "Zhang Guolao",
    role: "Ters bakış ve alışkanlık kırma",
    shenId: "yi",
    rate: 0.74,
    pitch: 0.92,
    detune: -80,
    filterFrequency: 690,
    filterGain: 2.6,
    cadenceMs: 17600,
    styleLead: "Aceleyi tersine çevir.",
    styleClose: "Beklenmeyen yolu seç.",
  },
  {
    id: "lan",
    imageIndex: 5,
    name: "Lan Caihe",
    role: "Özgürlük, oyun ve akış",
    shenId: "hun",
    rate: 0.88,
    pitch: 1.16,
    detune: 105,
    filterFrequency: 1680,
    filterGain: 2.8,
    cadenceMs: 13800,
    styleLead: "Hafifle.",
    styleClose: "Hareket biraz oyun gibi kalsın.",
  },
  {
    id: "cao",
    imageIndex: 6,
    name: "Cao Guojiu",
    role: "Ölçü, etik ve güvenilir yapı",
    shenId: "yi",
    rate: 0.78,
    pitch: 0.94,
    detune: -45,
    filterFrequency: 900,
    filterGain: 1.8,
    cadenceMs: 16200,
    styleLead: "Ölçüyü koru.",
    styleClose: "Form temiz kalsın.",
  },
  {
    id: "zhongli",
    imageIndex: 7,
    name: "Zhongli Quan",
    role: "Sıcak otorite ve dönüşüm",
    shenId: "shen",
    rate: 0.78,
    pitch: 0.88,
    detune: -95,
    filterFrequency: 820,
    filterGain: 3,
    cadenceMs: 15800,
    styleLead: "Sakin güç.",
    styleClose: "Ateşi içeride taşı.",
  },
] as const satisfies ReadonlyArray<{
  cadenceMs: number;
  detune: number;
  filterFrequency: number;
  filterGain: number;
  id: string;
  imageIndex: number;
  name: string;
  pitch: number;
  rate: number;
  role: string;
  shenId: ShenId;
  styleClose: string;
  styleLead: string;
}>;

type AiCoach = (typeof aiCoaches)[number];
type CoachIntent = "scatter" | "courage" | "slow" | "start";

const coachDialogues: Record<AiCoach["id"], { intro:string; lines:Record<CoachIntent,string> }> = {
  he:{intro:"Seni zorlamadan yanında yürüyebilirim. Bugün bedeninde açılmaya hazır olan küçük yeri bulalım.",lines:{scatter:"Önce hiçbir şeyi düzeltme. Zemini hisset ve yalnızca bir nefeslik alan aç.",courage:"Yumuşaklık geri çekilmek değildir. Kökün sakinken hareketin cesur olabilir.",slow:"Bugün başarı, bir hareketin içinde gerçekten kalabilmek.",start:"İlk hareketi nefesin başlatsın, kolların değil."}},
  han:{intro:"Her nefesin içinde henüz çalınmamış bir nota var. Bugün hareketini duymaya ne dersin?",lines:{scatter:"Bütün notaları aynı anda çalma. Birini seç ve ona yer aç.",courage:"Cesaret bazen tek bir temiz notayı sonuna kadar sürdürebilmektir.",slow:"Ritmi yarıya indir; nefes ve hareket aynı cümlede buluşsun.",start:"Önce dinle, sonra kolların nefesi takip etsin."}},
  li:{intro:"Kusursuz olmayı bırak da başlayalım. Küçük bir adım bugün yeter.",lines:{scatter:"Bütün parçaları toplama. En yakındakini eline al.",courage:"Korku bacaklarını titretebilir; yine de bir adım atılır.",slow:"Yorgunsan dinlenerek çalış. Dinlenmek yolun nefesidir.",start:"Omuzları indir, dizleri kilitleme; beden dostluğu anlar."}},
  lu:{intro:"Dikkat kılıç gibidir: savrulursa yorar, doğru tutulursa yolu açar.",lines:{scatter:"Ayak, merkez ve bakış için tek eksen seç.",courage:"Cesaret sonuçtan emin olmak değil, ilkeye sadık kalmaktır.",slow:"Hızı azalt fakat dikkati azaltma.",start:"Duruşunu kur, nefesi izle ve gereksiz olanı bırak."}},
  zhang:{intro:"Belki cevap, aceleyle geçtiğin yerdedir. Bir kez de tersinden bakalım.",lines:{scatter:"Yeni bir şey ekleme. Önce bitir, sonra planla.",courage:"Kapıya koşma; arkasını dolaş ve gerçekten kapı mı bak.",slow:"Yavaşlamak yetmez. Nereye yetiştiğini de sor.",start:"İlk hareketi ilk kez görüyormuş gibi yap."}},
  lan:{intro:"Hareketin düzgün görünmek zorunda değil. Önce canlı olanı bulalım.",lines:{scatter:"Bir dakika seçme; bedenin gitmek istediği yönü izle.",courage:"Oyun alanında hata, yeni bir yolun kapısıdır.",slow:"Bir çiçeği hızlandıramazsın ama ona yer açabilirsin.",start:"Müziği duymasan da ritim var. Ayaklarından başlat."}},
  cao:{intro:"Bugün kendine küçük ama net bir söz verelim.",lines:{scatter:"Görevleri üçe indir: hazırlan, uygula, kapat.",courage:"Kendini kanıtlama; değerlerine uygun bir sonraki adımı at.",slow:"Kısa ve düzenli çalışma iradeyi korur.",start:"Süreyi belirle, alanı hazırla ve pratiğin içinde kal."}},
  zhongli:{intro:"Güç sertleşmek değildir. İyi bir ateş hem dönüştürür hem ısıtır.",lines:{scatter:"Merkezine dön; nefesi karında topla ve bedene dağıt.",courage:"Korkuyu kovalamak yerine sıcaklığı büyüt.",slow:"Ateşi kıs, dinle ve yeniden besle.",start:"Ayaklarını yere ver ve ilk nefeste bedenine yer aç."}},
};

function inferCoachIntent(text:string):CoachIntent {
  const value=text.toLocaleLowerCase("tr-TR");
  if(/kork|cesa|güven|çekin/.test(value))return"courage";
  if(/yavaş|yorgun|dinlen|sakin/.test(value))return"slow";
  if(/dağ|karış|odak|zihin/.test(value))return"scatter";
  return"start";
}

export default function RitimKapisiOS() {
  const auth = useShibashiAuth();
  const [activeTab, setActiveTab] = useState<TabId>("home");

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab") as TabId | null;
    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) setActiveTab(requestedTab);
  }, []);
  const [introVideoVisible, setIntroVideoVisible] = useState(WEB_INTRO_VIDEO_ENABLED);
  const [selectedPractice2FlowId, setSelectedPractice2FlowId] = useState<string>();
  const [selectedHomePostureReportId, setSelectedHomePostureReportId] = useState<string>();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [experienceDay, setExperienceDay] = useState(1);
  const [posturePreviewLive, setPosturePreviewLive] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedShenId, setSelectedShenId] = useState<ShenId>("shen");
  const [visualThemeId, setVisualThemeId] = useState<VisualThemeId>("ink-night");
  const [selectedCoachId, setSelectedCoachId] = useState<AiCoach["id"]>("he");
  const [soundState, setSoundState] = useState<"kapalı" | "açık">("kapalı");
  const [selectedMovement, setSelectedMovement] = useState(0);
  const [practicePhase, setPracticePhase] = useState<"ready" | "calibrate" | "live" | "complete">("ready");
  const [practiceGallery, setPracticeGallery] = useState<PracticeSnapshot[]>([]);
  const [postureReports, setPostureReports] = useState<PostureReport[]>([]);
  const [shenActivities, setShenActivities] = useState<ShenActivity[]>([]);
  const [shenReflections, setShenReflections] = useState<DomainReflectionEntry[]>([]);
  const [savedMasterSentences, setSavedMasterSentences] = useState<SavedMasterSentence[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [syncCode, setSyncCode] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string>();
  const [syncMessage, setSyncMessage] = useState<string>();
  const [syncReady, setSyncReady] = useState(false);
  const [authSkipped, setAuthSkipped] = useState(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<{
    context: AudioContext;
    gain: GainNode;
    sources: AudioScheduledSourceNode[];
  } | null>(null);
  const mediaAudioRef = useRef<HTMLAudioElement | null>(null);
  const mobileFrameRef = useRef<HTMLDivElement | null>(null);
  const movement = movements[selectedMovement];
  const selectedShen = fiveShen.find((shen) => shen.id === selectedShenId) ?? fiveShen[1];
  const selectedCoach = aiCoaches.find((coach) => coach.id === selectedCoachId) ?? aiCoaches[0];
  const completion = useMemo(() => Math.round(((selectedMovement + 1) / 18) * 100), [selectedMovement]);
  const journalUnlocked = true;
  const journeyUnlocked = true;
  const visibleTabs = tabs;
  const energyScores = useMemo(
    () => getEnergyScores({
      completion,
      practiceGallery,
      postureReports,
      selectedShen,
    }),
    [completion, practiceGallery, postureReports, selectedShen],
  );

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const previewMode = new URLSearchParams(window.location.search).get("preview");
    const isPreview =
      previewMode === "home" ||
      previewMode === "posture" ||
      previewMode === "posture-live" ||
      previewMode === "journey" ||
      previewMode === "practice" ||
      previewMode === "practice2";
    if (isPreview) {
      setIntroVideoVisible(false);
      setOnboardingComplete(true);
      if (previewMode === "posture" || previewMode === "posture-live") setActiveTab("posture");
      if (previewMode === "posture-live") setPosturePreviewLive(true);
      if (previewMode === "journey") setActiveTab("journey");
      if (previewMode === "practice") setActiveTab("practice");
      if (previewMode === "practice2") setActiveTab("practice2");
    }
    if (!isPreview) {
      setOnboardingComplete(window.localStorage.getItem("ritim-kapisi-onboarding-complete") === "true");
    }
    try {
      const firstCheckin = JSON.parse(window.localStorage.getItem("ritim-kapisi-first-checkin") ?? "null") as { createdAt?: string } | null;
      setExperienceDay(getJourneyDay(firstCheckin?.createdAt));
    } catch {
      setExperienceDay(1);
    }
    const savedUserName = window.localStorage.getItem("ritim-kapisi-user-name");
    if (savedUserName) setUserName(savedUserName);
    const savedShenId = window.localStorage.getItem("ritim-kapisi-selected-shen") as ShenId | null;
    if (savedShenId && fiveShen.some((shen) => shen.id === savedShenId)) {
      setSelectedShenId(savedShenId);
    }
    const savedVisualThemeId = window.localStorage.getItem("shibashi-visual-theme") as VisualThemeId | null;
    if (savedVisualThemeId && savedVisualThemeId in visualThemes) setVisualThemeId(savedVisualThemeId);
    const savedCoachId = window.localStorage.getItem("ritim-kapisi-selected-coach") as AiCoach["id"] | null;
    if (savedCoachId && aiCoaches.some((coach) => coach.id === savedCoachId)) {
      setSelectedCoachId(savedCoachId);
    }
    const savedGallery = window.localStorage.getItem("ritim-kapisi-practice-gallery");
    if (savedGallery) {
      try {
        const parsedGallery = JSON.parse(savedGallery) as PracticeSnapshot[];
        setPracticeGallery(parsedGallery);
        persistPracticeSnapshotsToLocalStorage(parsedGallery);
      } catch {
        window.localStorage.removeItem("ritim-kapisi-practice-gallery");
      }
    }
    const savedPostureReports = window.localStorage.getItem("ritim-kapisi-posture-reports");
    if (savedPostureReports) {
      try {
        const parsedReports = JSON.parse(savedPostureReports) as PostureReport[];
        setPostureReports(parsedReports);
        persistPostureReportsToLocalStorage(parsedReports);
      } catch {
        window.localStorage.removeItem("ritim-kapisi-posture-reports");
      }
    }
    try {
      setShenActivities(JSON.parse(window.localStorage.getItem("shibashi-shen-activities") ?? "[]") as ShenActivity[]);
      setShenReflections(JSON.parse(window.localStorage.getItem("shibashi-shen-reflections") ?? "[]") as DomainReflectionEntry[]);
      setSavedMasterSentences(JSON.parse(window.localStorage.getItem("shibashi-master-sentences") ?? "[]") as SavedMasterSentence[]);
    } catch {
      window.localStorage.removeItem("shibashi-shen-activities");
      window.localStorage.removeItem("shibashi-shen-reflections");
      window.localStorage.removeItem("shibashi-master-sentences");
    }
    void loadPostureReportsFromIndexedDb().then((storedReports) => {
      if (!storedReports.length) return;
      setPostureReports((current) => {
        const merged = mergePostureReports(current, storedReports);
        persistPostureReportsToLocalStorage(merged);
        return merged;
      });
    });
    void loadPracticeSnapshotsFromIndexedDb().then((storedSnapshots) => {
      if (!storedSnapshots.length) return;
      setPracticeGallery((current) => mergePracticeSnapshots(current, storedSnapshots));
    });
    setSyncCode(getBrowserSyncCode());
    setSyncReady(true);

    return () => {
      mediaAudioRef.current?.pause();
      audioRef.current?.sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          // The source may already be stopped while switching Shen tracks.
        }
      });
      audioRef.current?.context.close();
    };
  }, []);

  useEffect(() => {
    if (!auth.user || userName.trim()) return;
    const googleName =
      typeof auth.user.user_metadata?.full_name === "string"
        ? auth.user.user_metadata.full_name
        : typeof auth.user.user_metadata?.name === "string"
          ? auth.user.user_metadata.name
          : "";
    if (!googleName.trim()) return;
    setUserName(googleName.trim());
    window.localStorage.setItem("ritim-kapisi-user-name", googleName.trim());
  }, [auth.user, userName]);

  function buildWebSyncPayload():ShibashiSyncPayload {
    return {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      profile: {
        authEmail: auth.user?.email,
        authUserId: auth.user?.id,
        name: userName,
        selectedCoachId,
        selectedShenId,
        visualThemeId,
      },
      history: { sessions: practiceGallery as unknown as SyncRecord[], entries: [], postureReports: postureReports as unknown as SyncRecord[] },
      journey: { completedStories: [], shenActivities: shenActivities as unknown as SyncRecord[], reflections: shenReflections as unknown as SyncRecord[], savedMasterSentences: savedMasterSentences as unknown as SyncRecord[] },
      preferences: { soundState },
    };
  }

  function applyWebSyncPayload(payload:ShibashiSyncPayload) {
    const profile = payload.profile as {name?:string;selectedShenId?:ShenId;visualThemeId?:VisualThemeId;selectedCoachId?:AiCoach["id"]};
    if(typeof profile.name==="string")setUserName(profile.name);
    if(profile.selectedShenId&&fiveShen.some(item=>item.id===profile.selectedShenId))setSelectedShenId(profile.selectedShenId);
    const savedVisualTheme=window.localStorage.getItem("shibashi-visual-theme");
    if(!savedVisualTheme&&profile.visualThemeId&&profile.visualThemeId in visualThemes){setVisualThemeId(profile.visualThemeId);window.localStorage.setItem("shibashi-visual-theme",profile.visualThemeId)}
    if(profile.selectedCoachId&&aiCoaches.some(item=>item.id===profile.selectedCoachId))setSelectedCoachId(profile.selectedCoachId);
    const nextGallery=payload.history.sessions.map(record=>toWebPracticeSnapshot(record)).filter((record):record is PracticeSnapshot=>Boolean(record));
    const nextReports=payload.history.postureReports.map(record=>toWebPostureReport(record)).filter((record):record is PostureReport=>Boolean(record));
    const nextActivities=payload.journey.shenActivities as unknown as ShenActivity[];
    const nextReflections=payload.journey.reflections as unknown as DomainReflectionEntry[];
    const nextSentences=payload.journey.savedMasterSentences as unknown as SavedMasterSentence[];
    if(JSON.stringify(nextGallery)!==JSON.stringify(practiceGallery)){const mergedGallery=mergePracticeSnapshots(nextGallery,practiceGallery);setPracticeGallery(mergedGallery);persistPracticeSnapshotsToLocalStorage(mergedGallery)}
    if(JSON.stringify(nextReports)!==JSON.stringify(postureReports)){const mergedReports=mergePostureReports(nextReports,postureReports);setPostureReports(mergedReports);persistPostureReportsToLocalStorage(mergedReports)}
    if(JSON.stringify(nextActivities)!==JSON.stringify(shenActivities)){setShenActivities(nextActivities);window.localStorage.setItem("shibashi-shen-activities",JSON.stringify(nextActivities))}
    if(JSON.stringify(nextReflections)!==JSON.stringify(shenReflections)){setShenReflections(nextReflections);window.localStorage.setItem("shibashi-shen-reflections",JSON.stringify(nextReflections))}
    if(JSON.stringify(nextSentences)!==JSON.stringify(savedMasterSentences)){setSavedMasterSentences(nextSentences);window.localStorage.setItem("shibashi-master-sentences",JSON.stringify(nextSentences))}
  }

  async function syncWebNow(code=syncCode) {
    if(!syncReady||!code)return;
    setSyncStatus("syncing");
    const result=await syncBrowserState(buildWebSyncPayload(),code);
    setSyncStatus(result.status);
    setSyncCode(result.syncCode);
    setSyncMessage(result.message);
    if(result.syncedAt)setLastSyncedAt(result.syncedAt);
    if(result.payload)applyWebSyncPayload(result.payload);
  }

  function connectWebSyncCode(code:string) {
    const normalized=setBrowserSyncCode(code);
    if(!normalized)return false;
    setSyncCode(normalized);
    void syncWebNow(normalized);
    return true;
  }

  useEffect(() => {
    if(!syncReady||!syncCode)return;
    if(syncTimerRef.current)clearTimeout(syncTimerRef.current);
    syncTimerRef.current=setTimeout(()=>void syncWebNow(),1400);
    return()=>{if(syncTimerRef.current)clearTimeout(syncTimerRef.current)};
  },[syncReady,syncCode,userName,selectedShenId,visualThemeId,selectedCoachId,practiceGallery,postureReports,shenActivities,shenReflections,savedMasterSentences,auth.user?.id]);

  useEffect(() => {
    const retry=()=>void syncWebNow();
    window.addEventListener("online",retry);
    const interval=window.setInterval(retry,45_000);
    return()=>{window.removeEventListener("online",retry);window.clearInterval(interval)};
  },[syncReady,syncCode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    mobileFrameRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab, onboardingComplete]);

  function savePracticeSnapshot(snapshot: PracticeSnapshot) {
    void savePracticeSnapshotToIndexedDb(snapshot);
    setShenActivities((current) => {
      const next = [{
        id: `activity-${snapshot.id}`,
        shenId: toDomainShenId(selectedShenId),
        type: "practice" as const,
        createdAt: snapshot.createdAt,
        minutes: 3,
        completed: true,
        movementQuality: snapshot.score,
        breathingAwareness: Math.max(54, Math.min(96, snapshot.score + 3)),
        practiceId: `movement-${snapshot.movementId}`,
      }, ...current].slice(0, 240);
      window.localStorage.setItem("shibashi-shen-activities", JSON.stringify(next));
      return next;
    });
    setPracticeGallery((current) => {
      const nextGallery = [snapshot, ...current].slice(0, 24);
      persistPracticeSnapshotsToLocalStorage(nextGallery);
      return nextGallery;
    });
  }

  function setPracticeSnapshotTrainerVisibility(snapshotId: string, trainerVisible: boolean) {
    setPracticeGallery((current) => {
      const nextGallery = current.map((snapshot) => snapshot.id === snapshotId ? { ...snapshot, trainerVisible } : snapshot);
      const updatedSnapshot = nextGallery.find((snapshot) => snapshot.id === snapshotId);
      if (updatedSnapshot) void savePracticeSnapshotToIndexedDb(updatedSnapshot);
      persistPracticeSnapshotsToLocalStorage(nextGallery);
      return nextGallery;
    });
  }

  useEffect(() => {
    const receiveLivingPractice = (event: Event) => {
      const result = (event as CustomEvent<LivingPracticeResult>).detail;
      if (!result?.id || result.sampleCount < 1) return;
      const createdAt = new Date(result.completedAt);
      savePracticeSnapshot({
        id: result.id,
        dateKey: formatSnapshotDate(createdAt),
        timeLabel: formatSnapshotTime(createdAt),
        createdAt: result.completedAt,
        movementId: 5,
        movementName: "Önden Arkaya İtme",
        score: result.movementScore,
        shenName: "Yaşayarak Öğrenme",
        imageData: "/images/living-learning/yeni-gun.png",
      });
    };
    window.addEventListener("shibashi:living-practice-saved", receiveLivingPractice);
    return () => window.removeEventListener("shibashi:living-practice-saved", receiveLivingPractice);
  }, [selectedShenId]);

  function savePostureReport(report: PostureReport) {
    void savePostureReportToIndexedDb(report);
    setPostureReports((current) => {
      const nextReports = [report, ...current].slice(0, 18);
      persistPostureReportsToLocalStorage(nextReports);
      return nextReports;
    });
  }

  function saveMasterSentenceRecord(masterSentenceId: string, practiceId?: string) {
    setSavedMasterSentences((current) => {
      if (current.some((item) => item.masterSentenceId === masterSentenceId)) return current;
      const next = [{ id: `saved-${Date.now()}`, masterSentenceId, practiceId, savedAt: new Date().toISOString() }, ...current];
      window.localStorage.setItem("shibashi-master-sentences", JSON.stringify(next));
      return next;
    });
  }

  function deletePostureReport(reportId: string) {
    setPostureReports((current) => {
      const nextReports = current.filter((report) => report.id !== reportId);
      persistPostureReportsToLocalStorage(nextReports);
      return nextReports;
    });
    void deletePostureReportFromIndexedDb(reportId);
  }

  function setPostureReportTrainerVisibility(reportId: string, trainerVisible: boolean) {
    setPostureReports((current) => {
      const nextReports = current.map((report) => report.id === reportId ? { ...report, trainerVisible } : report);
      const updatedReport = nextReports.find((report) => report.id === reportId);
      if (updatedReport) void savePostureReportToIndexedDb(updatedReport);
      persistPostureReportsToLocalStorage(nextReports);
      return nextReports;
    });
  }

  function selectShen(shenId: ShenId) {
    setSelectedShenId(shenId);
    if ("vibrate" in navigator) navigator.vibrate(12);
    window.localStorage.setItem("ritim-kapisi-selected-shen", shenId);
    const nextShen = fiveShen.find((shen) => shen.id === shenId);
    const musicExplicitlyMuted = window.sessionStorage.getItem(SHEN_MUSIC_SESSION_KEY) === "off";
    if ((soundState === "açık" || !musicExplicitlyMuted) && nextShen) {
      void startShenMusic(nextShen);
    }
  }

  function selectVisualTheme(themeId: VisualThemeId) {
    setVisualThemeId(themeId);
    window.localStorage.setItem("shibashi-visual-theme", themeId);
  }

  function selectCoach(coachId: AiCoach["id"]) {
    const coach = aiCoaches.find((item) => item.id === coachId);
    if (!coach) return;

    setSelectedCoachId(coach.id);
    window.localStorage.setItem("ritim-kapisi-selected-coach", coach.id);
  }

  function stopShenMusic() {
    mediaAudioRef.current?.pause();
    stopGeneratedShenMusic();
    window.sessionStorage.setItem(SHEN_MUSIC_SESSION_KEY, "off");
    setSoundState("kapalı");
  }

  function playSelectedShenMusic() {
    window.sessionStorage.setItem(SHEN_MUSIC_SESSION_KEY, "on");
    void startShenMusic(selectedShen);
  }

  function toggleShenMusic() {
    if (soundState === "açık") stopShenMusic();
    else playSelectedShenMusic();
  }

  function completeOnboarding(profile?: OnboardingProfile, destination: "home" | "practice2" = "home") {
    const recommendedShen = profile?.firstJourneyPlan?.recommendedShen;
    if (recommendedShen && fiveShen.some((shen) => shen.id === recommendedShen)) {
      setSelectedShenId(recommendedShen);
      window.localStorage.setItem("ritim-kapisi-selected-shen", recommendedShen);
    }
    const trimmedName = profile?.name.trim() || userName.trim();
    if (trimmedName) setUserName(trimmedName);
    if (trimmedName) window.localStorage.setItem("ritim-kapisi-user-name", trimmedName);
    window.localStorage.setItem("ritim-kapisi-onboarding-complete", "true");
    setExperienceDay(1);
    setOnboardingComplete(true);
    if (destination === "practice2") setSelectedPractice2FlowId(undefined);
    setActiveTab(destination);
  }

  function restartOnboarding() {
    window.localStorage.removeItem("ritim-kapisi-onboarding-complete");
    setIntroVideoVisible(true);
    setOnboardingComplete(false);
    setActiveTab("home");
  }

  async function resetLocalExperience() {
    const confirmed = window.confirm("Tüm yerel Shibashi verileri silinecek ve onboarding yeniden başlayacak. Devam edilsin mi?");
    if (!confirmed) return;
    stopShenMusic();
    const prefixes = ["ritim-kapisi-", "shibashi-"];
    [window.localStorage, window.sessionStorage].forEach((storage) => {
      Object.keys(storage).forEach((key) => {
        if (prefixes.some((prefix) => key.startsWith(prefix))) storage.removeItem(key);
      });
    });
    await clearLocalShibashiDatabase();
    window.location.replace(window.location.pathname);
  }

  async function startShenMusic(shen: (typeof fiveShen)[number]): Promise<boolean> {
    stopGeneratedShenMusic();
    const audio = mediaAudioRef.current ?? new Audio();
    mediaAudioRef.current = audio;

    audio.loop = true;
    audio.muted = false;
    audio.preload = "auto";
    audio.volume = 0.46;

    if (!audio.src.endsWith(shen.music)) {
      audio.pause();
      audio.src = shen.music;
      audio.currentTime = 0;
    }

    try {
      await audio.play();
      window.sessionStorage.setItem(SHEN_MUSIC_SESSION_KEY, "on");
      setSoundState("açık");
      return true;
    } catch {
      try {
        const generatedStarted = await startGeneratedShenMusic(shen);
        if (generatedStarted) window.sessionStorage.setItem(SHEN_MUSIC_SESSION_KEY, "on");
        setSoundState(generatedStarted ? "açık" : "kapalı");
        return generatedStarted;
      } catch {
        setSoundState("kapalı");
        return false;
      }
    }
  }

  function stopGeneratedShenMusic() {
    audioRef.current?.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // The source may already be stopped while switching Shen tracks.
      }
    });
    audioRef.current?.context.close();
    audioRef.current = null;
  }

  async function startGeneratedShenMusic(shen: (typeof fiveShen)[number]): Promise<boolean> {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    const context = new AudioContextClass();
    if (context.state === "suspended") {
      await context.resume().catch(() => undefined);
    }
    if (context.state !== "running") {
      await context.close().catch(() => undefined);
      return false;
    }
    const masterGain = context.createGain();
    const now = context.currentTime;
    const config = getShenSoundConfig(shen.id);
    const sources: AudioScheduledSourceNode[] = [];

    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(config.volume, now + 1.4);
    masterGain.connect(context.destination);

    config.layers.forEach((layer, index) => {
      const oscillator = context.createOscillator();
      const layerGain = context.createGain();
      const filter = context.createBiquadFilter();
      const pan = context.createStereoPanner();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();

      oscillator.type = layer.wave;
      oscillator.frequency.value = shen.tone * layer.ratio;
      oscillator.detune.value = layer.detune ?? 0;
      filter.type = layer.filterType;
      filter.frequency.value = layer.filter;
      filter.Q.value = layer.q;
      pan.pan.value = layer.pan;
      layerGain.gain.setValueAtTime(layer.gain, now);

      lfo.type = "sine";
      lfo.frequency.value = config.swellRate * (1 + index * 0.18);
      lfoGain.gain.value = layer.gain * config.swellDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(layerGain.gain);

      oscillator.connect(filter);
      filter.connect(layerGain);
      layerGain.connect(pan);
      pan.connect(masterGain);
      oscillator.start(now);
      lfo.start(now);
      sources.push(oscillator, lfo);
    });

    if (config.noise > 0) {
      const noise = createNoiseSource(context);
      const noiseFilter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = config.noiseFrequency;
      noiseFilter.Q.value = config.noiseQ;
      noiseGain.gain.setValueAtTime(config.noise, now);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      sources.push(noise);
    }

    audioRef.current = { context, gain: masterGain, sources };
    return true;
  }

  return (
    <main
      className={`app-shell shen-theme-${selectedShen.id} device-mode-desktop active-tab-${activeTab}`}
      data-shen={selectedShen.id}
      data-visual-theme={visualThemeId}
      style={{ "--shen-accent": selectedShen.color, "--shen-accent-2": selectedShen.color2 } as CSSProperties}
    >
      <div aria-hidden="true" className="shen-image-stack shen-app-background">
        {fiveShen.map((shen) => (
          <span
            className={`shen-image-layer ${selectedShen.id === shen.id ? "shen-image-layer-active" : ""}`}
            key={shen.id}
            style={{ backgroundImage: `url(${shen.image})` }}
          />
        ))}
      </div>
      <div className="ambient-field">
        <div className="ambient-line" />
      </div>
      <AmbientParticles color={selectedShen.color} selectedShenId={selectedShen.id} />
      {WEB_INTRO_VIDEO_ENABLED && introVideoVisible ? (
        <IntroGateVideo
          onClose={() => setIntroVideoVisible(false)}
        />
      ) : null}
      {WEB_GOOGLE_AUTH_UI_ENABLED &&
      !introVideoVisible &&
      !authSkipped &&
      (!auth.ready || !auth.user) ? (
        <ShibashiAuthGate
          configured={auth.configured}
          loading={!auth.ready}
          onContinueWithoutAccount={() => setAuthSkipped(true)}
          onGoogle={auth.signInWithGoogle}
        />
      ) : null}
      <div className={`device-shell ${onboardingComplete ? "" : "onboarding-device-shell"}`}>
        <div className="mobile-frame" ref={mobileFrameRef}>
          <div className="phone-hardware">
            <div className="phone-speaker" />
            <span className="phone-camera" />
          </div>
        {!onboardingComplete ? (
          <PremiumOnboarding
            embedded
            musicState={soundState}
            onComplete={completeOnboarding}
            onShenRevealed={(shenId) => {
              const shen = fiveShen.find((item) => item.id === shenId);
              if (!shen) return;
              setSelectedShenId(shenId);
              window.localStorage.setItem("ritim-kapisi-selected-shen", shenId);
              window.sessionStorage.setItem(SHEN_MUSIC_SESSION_KEY, "on");
              void startShenMusic(shen);
            }}
            onToggleMusic={toggleShenMusic}
          />
        ) : null}
        {onboardingComplete && activeTab === "home" ? (
          <DojoHomeScreen
            energyScores={energyScores}
            onJournal={() => setActiveTab("journal")}
            onPractice={() => setActiveTab("practice")}
            onPractice2={(flowId) => {
              setSelectedPractice2FlowId(flowId);
              setActiveTab("practice2");
            }}
            onPosture={(reportId) => {
              setSelectedHomePostureReportId(reportId);
              setActiveTab("posture");
            }}
            onReset={() => void resetLocalExperience()}
            onSelectShen={selectShen}
            practiceGallery={practiceGallery}
            postureCount={postureReports.length}
            postureReports={postureReports}
            selectedShen={selectedShen}
            shenActivities={shenActivities}
            userName={userName}
          />
        ) : null}
        {onboardingComplete && activeTab === "practice" ? (
          <PracticeScreen
            completedMovementIds={shenActivities.map((activity) => activity.practiceId).filter((id): id is string => Boolean(id?.startsWith("movement-")))}
            completion={completion}
            movement={movement}
            musicState={soundState}
            phase={practicePhase}
            selectedCoach={selectedCoach}
            selectedShen={selectedShen}
            onNext={() => {
              setSelectedMovement((current) => (current + 1) % movements.length);
              setPracticePhase("calibrate");
            }}
            onSelectMovement={(movementId) => {
              setSelectedMovement(Math.max(0, Math.min(movements.length - 1, movementId - 1)));
              setPracticePhase("calibrate");
            }}
            onPlayMusic={playSelectedShenMusic}
            onPostureReportCaptured={savePostureReport}
            onReflect={() => setActiveTab("journey")}
            onSaveMasterSentence={saveMasterSentenceRecord}
            onSnapshotCaptured={savePracticeSnapshot}
            onStopMusic={stopShenMusic}
            onStart={() => setPracticePhase(practicePhase === "ready" ? "calibrate" : "live")}
            onComplete={() => {
              const createdAt = new Date().toISOString();
              setPracticePhase("complete");
              setShenActivities((current) => {
                const next = [{ id: `activity-complete-${Date.now()}`, shenId: toDomainShenId(selectedShenId), type: "practice" as const, createdAt, minutes: 3, completed: true, practiceId: `movement-${movement.id}` }, ...current];
                window.localStorage.setItem("shibashi-shen-activities", JSON.stringify(next));
                return next;
              });
            }}
            latestPostureReport={postureReports[0]}
          />
        ) : null}
        {onboardingComplete && activeTab === "practice2" ? <Practice2Screen embedded initialFlowId={selectedPractice2FlowId} onSnapshotCaptured={savePracticeSnapshot} selectedShenName={selectedShen.name} /> : null}
        {onboardingComplete && activeTab === "posture" ? (
          <PostureScreen
            onDeletePostureReport={deletePostureReport}
            latestPostureReport={postureReports[0]}
            onPostureReportCaptured={savePostureReport}
            onSetTrainerVisibility={setPostureReportTrainerVisibility}
            onStopMusic={stopShenMusic}
            postureReports={postureReports}
            initialReportId={selectedHomePostureReportId}
            previewLive={posturePreviewLive}
            selectedShen={selectedShen}
          />
        ) : null}
        {onboardingComplete && activeTab === "newPosture" ? (
          <NewPostureScreen
            onNavigateToPractice={() => setActiveTab("practice")}
            onReportCaptured={(report: NewPostureArchiveReport) => savePostureReport(report as PostureReport)}
          />
        ) : null}
        {onboardingComplete && activeTab === "journey" ? (
          <FiveShenJourneyWeb
            activities={shenActivities}
            onNavigate={setActiveTab}
            onSelectCoach={setSelectedCoachId}
            onSelectShen={(id) => selectShen(id === "xin" ? "shen" : id)}
            reflections={shenReflections}
            savedSentences={savedMasterSentences}
            selectedShenId={toDomainShenId(selectedShenId)}
            selectedCoachId={selectedCoachId}
            setActivities={setShenActivities}
            setReflections={setShenReflections}
            setSavedSentences={setSavedMasterSentences}
            userName={userName}
          />
        ) : null}
        {onboardingComplete && activeTab === "learning" ? <LivingLearningScreen embedded /> : null}
        {onboardingComplete && activeTab === "journal" ? (
          <JournalScreen
            gallery={practiceGallery}
            onSetTrainerVisibility={setPracticeSnapshotTrainerVisibility}
            postureReports={postureReports}
            selectedShen={selectedShen}
          />
        ) : null}
        {onboardingComplete && activeTab === "profile" ? (
          <ProfileScreen
            lastSyncedAt={lastSyncedAt}
            authEmail={auth.user?.email}
            musicState={soundState}
            onConnectSyncCode={connectWebSyncCode}
            onRestartOnboarding={restartOnboarding}
            onSelectShen={selectShen}
            onSelectVisualTheme={selectVisualTheme}
            onSignOut={auth.user ? () => void auth.signOut() : undefined}
            onToggleMusic={soundState === "açık" ? stopShenMusic : playSelectedShenMusic}
            onSyncNow={()=>void syncWebNow()}
            postureReports={postureReports}
            selectedShen={selectedShen}
            selectedShenId={selectedShenId}
            visualThemeId={visualThemeId}
            syncCode={syncCode}
            syncMessage={syncMessage}
            syncStatus={syncStatus}
            userName={userName}
            shens={fiveShen}
            googleAuthEnabled={WEB_GOOGLE_AUTH_UI_ENABLED}
          />
        ) : null}
        {onboardingComplete ? <footer className="web-page-credit">Ayhan Güler</footer> : null}
        </div>

        {onboardingComplete ? (
          <nav className="bottom-nav" aria-label="Ana gezinme" style={{ "--nav-count": visibleTabs.length } as CSSProperties}>
            <button className="web-nav-brand" aria-label="Shibashi EFE ana sayfasını aç" onClick={() => setActiveTab("home")} type="button">
              <i aria-hidden="true" />
              <span>SHIBASHI EFE</span>
            </button>
            {visibleTabs.map((tab) => (
              <button
                className={`nav-button nav-tab-${tab.id} ${activeTab === tab.id ? "nav-button-active" : ""}`}
                key={tab.id}
                onClick={() => tab.id === "bodyLines" ? window.location.assign("/beden-hatlari") : setActiveTab(tab.id)}
                type="button"
              >
                <strong>{tab.icon}</strong>
                {tab.label}
              </button>
            ))}
            <div className="web-nav-account" aria-label="Kullanıcı özeti">
              <span className="web-nav-streak" title="Güncel seri">♨ {getPracticeStreak(practiceGallery, shenActivities).current}</span>
              <button aria-label={`Müziği ${soundState === "açık" ? "kapat" : "aç"}`} aria-pressed={soundState === "açık"} className={`web-nav-music ${soundState === "açık" ? "is-playing" : ""}`} onClick={toggleShenMusic} title={`Shen müziği ${soundState}`} type="button"><span aria-hidden="true">{soundState === "açık" ? "♪" : "♪̸"}</span></button>
              <button aria-label="Bildirimler" className="web-nav-bell" type="button">♢</button>
              <button className="web-nav-profile" onClick={() => setActiveTab("profile")} type="button"><i>{(userName || "Ç").slice(0, 1).toLocaleUpperCase("tr-TR")}</i><span>{userName || "Çınar"}</span><b>⌄</b></button>
            </div>
          </nav>
        ) : null}
      </div>
    </main>
  );
}

function IntroGateVideo({
  onClose,
}: {
  onClose: () => void;
}) {
  const INTRO_VIDEO_PLAYBACK_RATE = 0.72;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tryPlay = async () => {
      const video = videoRef.current;
      if (!video) return;
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.defaultPlaybackRate = INTRO_VIDEO_PLAYBACK_RATE;
      video.playbackRate = INTRO_VIDEO_PLAYBACK_RATE;
      try {
        await video.play();
        if (!cancelled) {
          setIsReady(true);
          setNeedsTap(false);
        }
      } catch {
        if (!cancelled) setNeedsTap(true);
      }
    };
    void tryPlay();
    const retryTimer = window.setTimeout(() => void tryPlay(), 420);
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, [onClose]);

  const playVideo = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    video.defaultPlaybackRate = INTRO_VIDEO_PLAYBACK_RATE;
    video.playbackRate = INTRO_VIDEO_PLAYBACK_RATE;
    await video.play().then(() => {
      setIsReady(true);
      setNeedsTap(false);
    }).catch(() => setNeedsTap(true));
  };

  const closeVideo = () => {
    if (isClosing) return;
    setIsClosing(true);
    videoRef.current?.pause();
    window.setTimeout(onClose, 900);
  };

  return (
    <div
      aria-label="Shibashi Efe onboarding videosu"
      className={`intro-gate intro-video-gate ${isReady ? "intro-gate-ready" : ""} ${isClosing ? "intro-video-gate-closing" : ""}`}
      role="dialog"
    >
      <div className="intro-device-frame">
        <div className="intro-phone-speaker" />
        <img
          alt=""
          aria-hidden="true"
          className="intro-video-poster-background"
          src="/images/shibashi/intro-gate-poster-hq-v2.png"
        />
        <div className="intro-video-stage">
          <video
            autoPlay
            className="intro-gate-video"
            muted
            onCanPlayThrough={() => {
              void playVideo();
            }}
            onEnded={closeVideo}
            onError={() => setNeedsTap(true)}
            onLoadedMetadata={() => void playVideo()}
            onPlaying={() => setIsReady(true)}
            playsInline
            preload="auto"
            ref={videoRef}
            src="/videos/intro-gate-smooth.mp4"
          />
        </div>
        <div className="intro-gate-shade" />
        <div className="intro-gate-content intro-video-copy">
          <span className="eyebrow">İÇSEL YOLCULUK</span>
          <h1>Günün ritmine yaklaş.</h1>
          <p>Suyu, nefesi ve hareketin doğal hızını izle. Birazdan sana uygun ilk adımı birlikte seçeceğiz.</p>
          {needsTap ? (
            <button className="secondary-action intro-sound-action" onClick={playVideo} type="button">
              Videoyu oynat
            </button>
          ) : null}
          <button className="primary-action intro-gate-action" onClick={closeVideo} type="button">
            Yolculuğa başla <span>→</span>
          </button>
        </div>
        <div className="intro-video-credit"><span>Ayhan Güler</span><small>ile</small></div>
      </div>
    </div>
  );
}

function getPracticeStreak(practiceGallery: PracticeSnapshot[], activities: ShenActivity[]) {
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

function DojoHomeScreen({
  energyScores,
  onJournal,
  onPractice,
  onPractice2,
  onPosture,
  onReset,
  onSelectShen,
  practiceGallery,
  postureCount,
  postureReports,
  selectedShen,
  shenActivities,
  userName,
}: {
  energyScores: EnergyScores;
  onJournal: () => void;
  onPractice: () => void;
  onPractice2: (flowId?: string) => void;
  onPosture: (reportId?: string) => void;
  onReset: () => void;
  onSelectShen: (shenId: ShenId) => void;
  practiceGallery: PracticeSnapshot[];
  postureCount: number;
  postureReports: PostureReport[];
  selectedShen: (typeof fiveShen)[number];
  shenActivities: ShenActivity[];
  userName: string;
}) {
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
  const flowCards: HomeFlowSummary[] = shortFlowDefinitions.map((flow) => {
    const reference = getStaticPractice(flow.steps[Math.min(1, flow.steps.length - 1)]?.practiceId ?? flow.steps[0]?.practiceId);
    return {
      description: flow.description,
      durationMinutes: flow.durationMinutes,
      focus: flow.focus,
      id: flow.id,
      image: reference.referenceImage,
      level: flow.level,
      title: flow.title,
    };
  });
  const recommendedFlow = flowCards[selectedShen.mapStage % flowCards.length] ?? flowCards[0];
  const practicePhotos = practiceGallery
    .filter((snapshot) => isCapturedPracticePhoto(snapshot.imageData))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
    .map((snapshot) => ({ date: snapshot.createdAt, id: snapshot.id, image: snapshot.imageData, movementName: snapshot.movementName, score: snapshot.score }));
  const experienceIntoLevel = progress.experience % 240;

  return <HomeDashboard
    energy={{ score: energyScores.shen, trend: dailyMinutes.map((value) => Math.min(100, value * 18)) }}
    flows={flowCards}
    level={{ experience: experienceIntoLevel, level: progress.level, nextLevelExperience: 240, progress: Math.round((experienceIntoLevel / 240) * 100) }}
    onFlows={onPractice2}
    onFlowSelect={onPractice2}
    onHistory={onJournal}
    onPractice={onPractice}
    onPosture={onPosture}
    onReset={onReset}
    onSelectShen={onSelectShen}
    postureCount={postureCount}
    postureReports={postureReports.map((report) => ({ date: report.createdAt, id: report.id, score: report.score, summary: report.summary }))}
    practicePhotos={practicePhotos}
    recommendedFlow={recommendedFlow}
    shen={{ actionLabel: shenTodayCopy[selectedShen.id].action, color: selectedShen.color, description: selectedShen.dailyPrompt, element: selectedShen.element.split("•")[0]?.trim() ?? "", heroBody: shenTodayCopy[selectedShen.id].body, heroTitle: shenTodayCopy[selectedShen.id].title, icon: `/images/five-shen-icons/${selectedShen.id}.png`, id: selectedShen.id, motto: shenTodayCopy[selectedShen.id].motto, name: selectedShen.name, organ: selectedShen.organ, period: "Bugünün odağı", shortLabel: shenTodayCopy[selectedShen.id].shortLabel, symbol: selectedShen.symbol, wallpaper: selectedShen.image }}
    shenOptions={fiveShen.map((shen) => ({ actionLabel: shenTodayCopy[shen.id].action, color: shen.color, description: shen.dailyPrompt, element: shen.element.split("•")[0]?.trim() ?? "", heroBody: shenTodayCopy[shen.id].body, heroTitle: shenTodayCopy[shen.id].title, icon: `/images/five-shen-icons/${shen.id}.png`, id: shen.id, motto: shenTodayCopy[shen.id].motto, name: shen.name, organ: shen.organ, period: shen.dailyName, shortLabel: shenTodayCopy[shen.id].shortLabel, symbol: shen.symbol, wallpaper: shen.image }))}
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


function PostureScreen({
  initialReportId,
  latestPostureReport,
  onDeletePostureReport,
  onPostureReportCaptured,
  onSetTrainerVisibility,
  onStopMusic,
  postureReports,
  previewLive = false,
  selectedShen,
}: {
  initialReportId?: string;
  latestPostureReport?: PostureReport;
  onDeletePostureReport: (reportId: string) => void;
  onPostureReportCaptured: (report: PostureReport) => void;
  onSetTrainerVisibility: (reportId: string, trainerVisible: boolean) => void;
  onStopMusic: () => void;
  postureReports: PostureReport[];
  previewLive?: boolean;
  selectedShen: (typeof fiveShen)[number];
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const postureCameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const scoreTimerRef = useRef<number | null>(null);
  const targetScoreRef = useRef(0);
  const postureStableSinceRef = useRef<number | null>(null);
  const posturePreviousPointsRef = useRef<PoseKeypoint[]>([]);
  const postureSampleAnalysesRef = useRef<PostureAnalysisSnapshot[]>([]);
  const postureAutoCaptureLockRef = useRef(false);
  const postureReadyAtRef = useRef(0);
  const postureAnnouncedStepRef = useRef<PostureAssessmentStep | null>(null);
  const postureAudioRef = useRef<HTMLAudioElement | null>(null);
  const postureSmoothedPointsRef = useRef<PoseKeypoint[]>([]);
  const postureLastVoiceCueRef = useRef("");
  const postureLastVoiceAtRef = useRef(0);
  const postureStepRef = useRef<PostureAssessmentStep>("intro");
  const poseStatusRef = useRef<"bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata">("bekliyor");
  const lastPoseUiUpdateRef = useRef(0);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "ready" | "denied" | "unsupported">("idle");
  const [keypoints, setKeypoints] = useState<PoseKeypoint[]>([]);
  const [movementScore, setMovementScore] = useState(0);
  const [poseStatus, setPoseStatus] = useState<"bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata">("bekliyor");
  const [postureMode, setPostureMode] = useState<PostureRenderMode>("3d");
  const [postureView, setPostureView] = useState<PostureView>("front");
  const [postureStep, setPostureStep] = useState<PostureAssessmentStep>("intro");
  const [postureCaptures, setPostureCaptures] = useState<Partial<Record<PostureView, PostureAssessmentCapture>>>({});
  const [postureResult, setPostureResult] = useState<PostureReport | null>(null);
  const [viewingSavedReport, setViewingSavedReport] = useState(false);
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0);
  const [captureFlash, setCaptureFlash] = useState(false);
  const [capturedView, setCapturedView] = useState<PostureView | null>(null);
  const [postureVoiceEnabled, setPostureVoiceEnabled] = useState(true);
  const [postureZoom, setPostureZoom] = useState<{ min: number; max: number; step: number; value: number } | null>(null);

  useEffect(() => {
    if (!initialReportId) return;
    const report = postureReports.find((item) => item.id === initialReportId);
    if (!report) return;
    setPostureCaptures(report.captures);
    setPostureResult(report);
    setPostureView("front");
    setViewingSavedReport(true);
    setPostureStep("result");
  }, [initialReportId, postureReports]);
  const captureTransitionRef = useRef<number | null>(null);
  postureStepRef.current = postureStep;
  const activeScanView = postureStep === "front" || postureStep === "side" || postureStep === "back" ? postureStep : postureView;
  const postureFrameReadiness = evaluateWebPostureFrame(
    keypoints,
    activeScanView,
    videoRef.current?.videoWidth,
    videoRef.current?.videoHeight,
  );
  const scanGuidance: PostureScanGuidance =
    poseStatus === "yükleniyor"
      ? "model-loading"
      : !postureFrameReadiness.bodyReady
        ? "find-body"
        : !postureFrameReadiness.angleReady
          ? "wrong-angle"
          : !postureFrameReadiness.positionReady
            ? "reposition"
          : autoCaptureProgress >= 100
            ? "capturing"
            : "hold";
  const postureCoachCue =
    postureStep === "front" || postureStep === "side" || postureStep === "back"
      ? getPostureLiveCoachCue(
          postureStep,
          postureFrameReadiness,
          analyzePosture(keypoints, movementScore, selectedShen.id, postureStep),
          keypoints,
        )
      : "Tam bedenini kadraja al.";

  useEffect(() => {
    if (previewLive) setPostureStep("front");
  }, [previewLive]);

  useEffect(() => {
    scoreTimerRef.current = window.setInterval(() => {
      setMovementScore((current) => {
        const target = targetScoreRef.current;
        const difference = target - current;
        if (Math.abs(difference) < 1) return target;
        return Math.max(0, Math.min(100, current + Math.sign(difference) * Math.min(Math.abs(difference), 3)));
      });
    }, 220);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (scoreTimerRef.current) window.clearInterval(scoreTimerRef.current);
      if (captureTransitionRef.current) window.clearTimeout(captureTransitionRef.current);
      detectorRef.current?.dispose?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraStatus !== "ready") {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      setKeypoints([]);
      postureSmoothedPointsRef.current = [];
      if (poseStatusRef.current !== "bekliyor") {
        poseStatusRef.current = "bekliyor";
        setPoseStatus("bekliyor");
      }
      targetScoreRef.current = 0;
      setMovementScore(0);
      drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
      return;
    }

    let cancelled = false;
    void startPostureMoveNetLoop(() => cancelled);

    return () => {
      cancelled = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [cameraStatus, selectedShen.color]);

  useEffect(() => {
    postureStableSinceRef.current = null;
    posturePreviousPointsRef.current = [];
    postureSmoothedPointsRef.current = [];
    postureSampleAnalysesRef.current = [];
    postureAutoCaptureLockRef.current = false;
    postureReadyAtRef.current = Date.now() + (postureStep === "front" ? 0 : 1200);
    setAutoCaptureProgress(0);
    window.scrollTo({ top: 0 });
    document.querySelector<HTMLElement>(".mobile-frame")?.scrollTo({ top: 0 });
  }, [postureStep]);

  useEffect(() => {
    if (
      cameraStatus !== "ready" ||
      poseStatus !== "aktif" ||
      (postureStep !== "front" && postureStep !== "side" && postureStep !== "back")
    ) {
      postureStableSinceRef.current = null;
      posturePreviousPointsRef.current = keypoints;
      postureSampleAnalysesRef.current = [];
      setAutoCaptureProgress(0);
      return;
    }
    const frameReadiness = evaluateWebPostureFrame(
      keypoints,
      postureStep,
      videoRef.current?.videoWidth,
      videoRef.current?.videoHeight,
    );
    if (!frameReadiness.bodyReady || !frameReadiness.angleReady || !frameReadiness.positionReady) {
      postureStableSinceRef.current = null;
      posturePreviousPointsRef.current = keypoints;
      postureSampleAnalysesRef.current = [];
      setAutoCaptureProgress(0);
      return;
    }

    const previousPoints = posturePreviousPointsRef.current;
    posturePreviousPointsRef.current = keypoints;
    if (Date.now() < postureReadyAtRef.current) {
      setAutoCaptureProgress(0);
      return;
    }
    if (!previousPoints.length || getPoseStabilityDistance(previousPoints, keypoints) > 18) {
      postureStableSinceRef.current = Date.now();
      postureSampleAnalysesRef.current = [];
      setAutoCaptureProgress(0);
      return;
    }

    postureStableSinceRef.current ??= Date.now();
    const sample = toPostureAnalysisSnapshot(analyzePosture(keypoints, 0, selectedShen.id, postureStep));
    if (sample.confidence >= 50) {
      postureSampleAnalysesRef.current = [...postureSampleAnalysesRef.current.slice(-119), sample];
    }
    const progress = Math.min(100, ((Date.now() - postureStableSinceRef.current) / 2000) * 100);
    setAutoCaptureProgress(progress);

    if (progress >= 100 && !postureAutoCaptureLockRef.current) {
      postureAutoCaptureLockRef.current = true;
      window.setTimeout(captureCurrentPosture, 80);
    }
  }, [cameraStatus, keypoints, poseStatus, postureStep, selectedShen.id]);

  useEffect(() => {
    if (postureStep !== "front" && postureStep !== "side" && postureStep !== "back") return;
    if (postureAnnouncedStepRef.current === postureStep) return;

    postureAnnouncedStepRef.current = postureStep;
    const orientationCue = getPostureOrientationCue(postureStep);
    const timer = window.setTimeout(() => {
      postureAudioRef.current?.pause();
      if (postureVoiceEnabled) speakCoach(orientationCue);
    }, 300);
    return () => {
      window.clearTimeout(timer);
      postureAudioRef.current?.pause();
    };
  }, [postureStep, postureVoiceEnabled]);

  useEffect(() => {
    if (postureStep !== "front" && postureStep !== "side" && postureStep !== "back") return;
    if (!postureVoiceEnabled || scanGuidance === "model-loading" || scanGuidance === "capturing") return;
    const now = Date.now();
    if (postureCoachCue === postureLastVoiceCueRef.current || now - postureLastVoiceAtRef.current < 6500) return;
    postureLastVoiceCueRef.current = postureCoachCue;
    postureLastVoiceAtRef.current = now;
    speakCoach(postureCoachCue);
  }, [postureCoachCue, postureStep, postureVoiceEnabled, scanGuidance]);

  useEffect(() => {
    if (postureStep !== "processing" || !postureResult) return;
    const timer = window.setTimeout(() => setPostureStep("result"), 2600);
    return () => window.clearTimeout(timer);
  }, [postureResult, postureStep]);

  async function startPostureMoveNetLoop(isCancelled: () => boolean) {
    const video = videoRef.current;
    if (!video) return;

    try {
      poseStatusRef.current = "yükleniyor";
      setPoseStatus("yükleniyor");
      detectorRef.current ??= await createMoveNetDetector();
      poseStatusRef.current = "aktif";
      setPoseStatus("aktif");

      const detect = async () => {
        if (isCancelled() || !videoRef.current || cameraStatus !== "ready") return;
        try {
          const poses = await detectorRef.current?.estimatePoses(videoRef.current, { flipHorizontal: false });
          if (isCancelled()) return;
          const pose = poses?.[0];
          syncPoseCanvasSize(canvasRef.current, videoRef.current);

          if (!pose?.keypoints?.length) {
            if (poseStatusRef.current !== "beden-yok") {
              poseStatusRef.current = "beden-yok";
              setPoseStatus("beden-yok");
              setKeypoints([]);
            }
            drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
            targetScoreRef.current = 0;
          } else {
            const smoothedKeypoints = smoothPoseKeypoints(postureSmoothedPointsRef.current, pose.keypoints, 0.24);
            postureSmoothedPointsRef.current = smoothedKeypoints;
            const importantVisible = [
              "nose",
              "left_shoulder",
              "right_shoulder",
              "left_hip",
              "right_hip",
              "left_knee",
              "right_knee",
              "left_ankle",
              "right_ankle",
            ].filter((name) => (smoothedKeypoints.find((point) => point.name === name)?.score ?? 0) > 0.28);
            const nextStatus=importantVisible.length>=6?"aktif":"beden-yok";
            if(poseStatusRef.current!==nextStatus){
              poseStatusRef.current=nextStatus;
              setPoseStatus(nextStatus);
            }
            const now=performance.now();
            if(now-lastPoseUiUpdateRef.current>=100){
              lastPoseUiUpdateRef.current=now;
              setKeypoints(smoothedKeypoints);
            }
            const currentView =
              postureStepRef.current === "front" || postureStepRef.current === "side" || postureStepRef.current === "back"
                ? postureStepRef.current
                : "front";
            const liveAnalysis = analyzePosture(smoothedKeypoints, 0, selectedShen.id, currentView);
            drawPoseCanvas(canvasRef.current, { ...pose, keypoints: smoothedKeypoints }, selectedShen.color, liveAnalysis);
            targetScoreRef.current = nextStatus === "aktif" ? getPostureOverallScore(liveAnalysis) : 0;
          }
        } catch (error) {
          if (isCancelled() || isPostureDetectorAbort(error)) return;
          poseStatusRef.current = "yükleniyor";
          setPoseStatus("yükleniyor");
          targetScoreRef.current = 0;
        }

        if (!isCancelled()) rafRef.current = window.requestAnimationFrame(detect);
      };

      rafRef.current = window.requestAnimationFrame(detect);
    } catch (error) {
      if (isCancelled() || isPostureDetectorAbort(error)) return;
      poseStatusRef.current = "hata";
      setPoseStatus("hata");
    }
  }

  async function startPostureCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      return false;
    }

    if (streamRef.current) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
      return true;
    }

    try {
      setCameraStatus("requesting");
      onStopMusic();
      const desktopCamera = window.matchMedia("(min-width: 900px)").matches;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: desktopCamera ? 1280 : 720 },
          height: { ideal: desktopCamera ? 960 : 1280 },
          // Most laptop sensors expose more vertical field of view in 4:3.
          // Requesting 16:9 can crop that sensor before the frame reaches us.
          aspectRatio: { ideal: desktopCamera ? 4 / 3 : 0.75 },
          frameRate: { ideal: desktopCamera ? 30 : 60, max: 60 },
        },
      });

      const cameraTrack = stream.getVideoTracks()[0];
      const capabilities = cameraTrack?.getCapabilities() as MediaTrackCapabilities & {
        zoom?: { min: number; max: number; step: number };
      };
      if (cameraTrack && capabilities?.zoom && Number.isFinite(capabilities.zoom.min)) {
        const minimumZoom = capabilities.zoom.min;
        postureCameraTrackRef.current = cameraTrack;
        setPostureZoom({
          min: minimumZoom,
          max: capabilities.zoom.max,
          step: Math.max(capabilities.zoom.step || 0.1, 0.1),
          value: minimumZoom,
        });
        await cameraTrack.applyConstraints({
          advanced: [{ zoom: minimumZoom }],
        } as unknown as MediaTrackConstraints).catch(() => undefined);
      } else {
        postureCameraTrackRef.current = cameraTrack ?? null;
        setPostureZoom(null);
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
      return true;
    } catch {
      setCameraStatus("denied");
      return false;
    }
  }

  function shutdownPostureCamera() {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    postureCameraTrackRef.current = null;
    setPostureZoom(null);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
    setCameraStatus("idle");
    setKeypoints([]);
    postureSmoothedPointsRef.current = [];
    setPoseStatus("bekliyor");
    targetScoreRef.current = 0;
    setMovementScore(0);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  async function changePostureZoom(direction: -1 | 1) {
    const track = postureCameraTrackRef.current;
    if (!track || !postureZoom) return;
    const nextValue = Math.max(
      postureZoom.min,
      Math.min(postureZoom.max, postureZoom.value + postureZoom.step * direction),
    );
    await track.applyConstraints({ advanced: [{ zoom: nextValue }] } as unknown as MediaTrackConstraints).catch(() => undefined);
    setPostureZoom((current) => current ? { ...current, value: nextValue } : current);
  }

  function togglePostureVoice() {
    if (postureVoiceEnabled) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    } else {
      postureLastVoiceCueRef.current = "";
      postureLastVoiceAtRef.current = 0;
      speakCoach(postureCoachCue);
    }
    setPostureVoiceEnabled((enabled) => !enabled);
  }

  async function openPostureCamera() {
    setViewingSavedReport(false);
    setPostureResult(null);
    setPostureCaptures({});
    setCaptureFlash(false);
    setCapturedView(null);
    setPostureView("front");
    setPostureStep("front");
    const cameraStarted = await startPostureCamera();
    if (!cameraStarted) {
      setPostureStep("intro");
    }
  }

  function openPostureHistory() {
    shutdownPostureCamera();
    setPostureStep("history");
  }

  function captureCurrentPosture() {
    if (postureStep !== "front" && postureStep !== "side" && postureStep !== "back") return;
    const view = postureStep;
    const frameReadiness = evaluateWebPostureFrame(
      keypoints,
      view,
      videoRef.current?.videoWidth,
      videoRef.current?.videoHeight,
    );
    if (!frameReadiness.bodyReady || !frameReadiness.angleReady || !frameReadiness.positionReady) {
      postureAutoCaptureLockRef.current = false;
      postureStableSinceRef.current = null;
      setAutoCaptureProgress(0);
      return;
    }
    if (postureSampleAnalysesRef.current.length < 4) {
      postureAutoCaptureLockRef.current = false;
      postureStableSinceRef.current = null;
      setAutoCaptureProgress(0);
      return;
    }
    const analysis = aggregatePostureAnalysisSnapshots(postureSampleAnalysesRef.current);
    const capture = createPostureCapture(videoRef.current, keypoints, view, analysis, selectedShen.color);
    if (!capture) return;

    const nextCaptures = { ...postureCaptures, [view]: capture };
    setPostureCaptures(nextCaptures);
    setCapturedView(view);
    setCaptureFlash(true);
    if (captureTransitionRef.current) window.clearTimeout(captureTransitionRef.current);
    captureTransitionRef.current = window.setTimeout(() => {
      setCaptureFlash(false);

      if (view === "front") {
        setPostureView("side");
        setPostureStep("side");
        return;
      }

      if (view === "side") {
        setPostureView("back");
        setPostureStep("back");
        return;
      }

      if (nextCaptures.front && nextCaptures.side && nextCaptures.back) {
        const report = buildPostureReport(nextCaptures as Record<PostureView, PostureAssessmentCapture>, latestPostureReport);
        setViewingSavedReport(false);
        setPostureResult(report);
        setPostureStep("processing");
        shutdownPostureCamera();
      }
    }, 1400);
  }

  function completePostureAnalysis() {
    if (!postureResult) return;
    setPostureStep("processing");
  }

  function saveCurrentPostureReport() {
    if (!postureResult) return;
    if (viewingSavedReport) {
      resetPostureAssessment();
      return;
    }
    onPostureReportCaptured(postureResult);
    setPostureStep("intro");
    setPostureResult(null);
    setPostureCaptures({});
    setViewingSavedReport(false);
  }

  function resetPostureAssessment() {
    shutdownPostureCamera();
    if (captureTransitionRef.current) window.clearTimeout(captureTransitionRef.current);
    setCaptureFlash(false);
    setCapturedView(null);
    setPostureStep("intro");
    setPostureResult(null);
    setPostureCaptures({});
    setPostureView("front");
    setViewingSavedReport(false);
  }

  function openSavedPostureReport(report: PostureReport) {
    shutdownPostureCamera();
    setPostureCaptures(report.captures);
    setPostureResult(report);
    setPostureView("front");
    setViewingSavedReport(true);
    setPostureStep("result");
  }

  return (
    <PostureAssessmentScreen
      cameraStatus={cameraStatus}
      canvasRef={canvasRef}
      captureFlash={captureFlash}
      captures={postureCaptures}
      capturedView={capturedView}
      keypoints={keypoints}
      mode={postureMode}
      movementScore={movementScore}
      autoCaptureProgress={autoCaptureProgress}
      scanGuidance={scanGuidance}
      coachCue={postureCoachCue}
      frameReadiness={postureFrameReadiness}
      onCapture={captureCurrentPosture}
      onClose={resetPostureAssessment}
      onCompleteAnalysis={completePostureAnalysis}
      onModeChange={setPostureMode}
      onOpenCamera={openPostureCamera}
      onRetake={() => void openPostureCamera()}
      onSaveReport={saveCurrentPostureReport}
      onOpenSavedReport={openSavedPostureReport}
      onDeleteSavedReport={onDeletePostureReport}
      onSetTrainerVisibility={onSetTrainerVisibility}
      onShowHistory={openPostureHistory}
      onViewChange={setPostureView}
      poseStatus={poseStatus}
      report={postureResult}
      reportIsSaved={viewingSavedReport}
      savedReports={postureReports}
      selectedShen={selectedShen}
      voiceEnabled={postureVoiceEnabled}
      onVoiceToggle={togglePostureVoice}
      onZoomChange={(direction) => void changePostureZoom(direction)}
      zoom={postureZoom}
      step={postureStep}
      videoRef={videoRef}
      view={postureView}
    />
  );
}

function PracticeScreen({
  completedMovementIds,
  completion,
  latestPostureReport,
  movement,
  musicState,
  phase,
  selectedCoach,
  selectedShen,
  onComplete,
  onNext,
  onPlayMusic,
  onPostureReportCaptured,
  onReflect,
  onSaveMasterSentence,
  onSelectMovement,
  onSnapshotCaptured,
  onStart,
  onStopMusic,
}: {
  completedMovementIds: string[];
  completion: number;
  latestPostureReport?: PostureReport;
  movement: Movement;
  musicState: "kapalı" | "açık";
  phase: "ready" | "calibrate" | "live" | "complete";
  selectedCoach: AiCoach;
  selectedShen: (typeof fiveShen)[number];
  onComplete: () => void;
  onNext: () => void;
  onPlayMusic: () => void;
  onPostureReportCaptured: (report: PostureReport) => void;
  onReflect: () => void;
  onSaveMasterSentence: (masterSentenceId: string, practiceId?: string) => void;
  onSelectMovement: (movementId: number) => void;
  onSnapshotCaptured: (snapshot: PracticeSnapshot) => void;
  onStart: () => void;
  onStopMusic: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coachVoiceEngineRef = useRef<{
    buffers: Map<string, AudioBuffer>;
    context: AudioContext;
    current: AudioBufferSourceNode | null;
    gain: GainNode;
  } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const rafRef = useRef<number | null>(null);
  const scoreTimerRef = useRef<number | null>(null);
  const coachCueQueueRef = useRef<CoachCueRequest[]>([]);
  const coachCuePlayingRef = useRef(false);
  const coachCueCooldownTimerRef = useRef<number | null>(null);
  const coachCueNextAllowedAtRef = useRef(0);
  const stopMusicRef = useRef(onStopMusic);
  const targetScoreRef = useRef(0);
  const movementScoreRef = useRef(0);
  const practiceLearningModeRef = useRef<PracticeLearningMode>("preparation");
  const activeWarmupIdRef = useRef<WarmupLessonId>("wuji");
  const movementIdRef = useRef(movement.id);
  const movementReferenceStartedAtRef = useRef(0);
  const capturedMovementRef = useRef<string | null>(null);
  const previousPoseRef = useRef<{ keypoints: PoseKeypoint[]; at: number } | null>(null);
  const analysisWindowStateRef = useRef<MovementAnalysisWindowState>("idle");
  const analysisWindowSamplesRef = useRef<LiveMovementMatch[]>([]);
  const analysisWindowStartedAtRef = useRef<number | null>(null);
  const analysisWindowTimerRef = useRef<number | null>(null);
  const [liveFeedback, setLiveFeedback] = useState("Tam bedenini kadraja al ve öğretmeni aynala.");
  const [scoreBreakdown, setScoreBreakdown] = useState({ form: 0, rhythm: 0, balance: 0 });
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "ready" | "denied" | "unsupported">("idle");
  const [keypoints, setKeypoints] = useState<PoseKeypoint[]>([]);
  const [movementScore, setMovementScore] = useState(0);
  const [poseStatus, setPoseStatus] = useState<"bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata">("bekliyor");
  const [snapshotState, setSnapshotState] = useState<"bekliyor" | "kaydedildi">("bekliyor");
  const [voiceStatus, setVoiceStatus] = useState<"sessiz" | "aktif">("sessiz");
  const [coachLine, setCoachLine] = useState("Kamera hazır olunca koçun kısa yönlendirmeler verecek.");
  const [postureMode, setPostureMode] = useState<PostureRenderMode>("3d");
  const [postureView, setPostureView] = useState<PostureView>("front");
  const [postureStep, setPostureStep] = useState<"idle" | "intro" | PostureView | "result">("idle");
  const [postureCaptures, setPostureCaptures] = useState<Partial<Record<PostureView, PostureAssessmentCapture>>>({});
  const [postureResult, setPostureResult] = useState<PostureReport | null>(null);
  const [practiceLearningMode, setPracticeLearningMode] = useState<PracticeLearningMode>("preparation");
  const [activeWarmupId, setActiveWarmupId] = useState<WarmupLessonId>("wuji");
  const [completedWarmups, setCompletedWarmups] = useState<WarmupLessonId[]>([]);
  const [practiceAdaptation, setPracticeAdaptation] = useState<PracticeAdaptation>("standing");
  const [analysisWindowState, setAnalysisWindowState] = useState<MovementAnalysisWindowState>("idle");
  const [analysisWindowProgress, setAnalysisWindowProgress] = useState(0);
  const [analysisWindowResult, setAnalysisWindowResult] = useState<MovementAnalysisWindowResult | null>(null);
  const [ghostMode, setGhostMode] = useState<GhostMode>("follow");
  const [traceMode, setTraceMode] = useState<TraceMode>("compare");
  const [ghostOpacity, setGhostOpacity] = useState(0.58);
  const cueIndexRef = useRef(0);
  const ghostSequence = getGhostSequence(`movement-${movement.id}`);
  const movementLocked = !ghostSequence;
  const masterSentence = getMasterSentence(selectedShen.id, movement.id - 1);
  const referenceImage = getMovementReferenceImage(movement);
  const innerScene = getInnerJourneyScene(movement.id);
  const isCameraReady = cameraStatus === "ready";
  const activeWarmup = warmupLessons.find((lesson) => lesson.id === activeWarmupId) ?? warmupLessons[0];
  practiceLearningModeRef.current = practiceLearningMode;
  activeWarmupIdRef.current = activeWarmupId;
  movementIdRef.current = movement.id;

  useEffect(() => {
    stopMusicRef.current = onStopMusic;
  }, [onStopMusic]);

  useEffect(() => {
    if (practiceLearningMode === "preparation") {
      stopMusicRef.current();
    }
  }, [activeWarmupId, practiceLearningMode]);

  useEffect(() => {
    scoreTimerRef.current = window.setInterval(() => {
      setMovementScore((current) => {
        const target = targetScoreRef.current;
        const difference = target - current;
        if (Math.abs(difference) < 1) {
          movementScoreRef.current = target;
          return target;
        }
        const step = Math.sign(difference) * Math.min(Math.abs(difference), 2);
        const nextScore = Math.max(0, Math.min(100, current + step));
        movementScoreRef.current = nextScore;
        return nextScore;
      });
    }, 240);

    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      if (scoreTimerRef.current) window.clearInterval(scoreTimerRef.current);
      detectorRef.current?.dispose?.();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      coachVoiceEngineRef.current?.current?.stop();
      if (coachCueCooldownTimerRef.current) window.clearTimeout(coachCueCooldownTimerRef.current);
      if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);
      coachVoiceEngineRef.current?.context.close();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const savedWarmups = window.localStorage.getItem("ritim-kapisi-warmup-completed");
    if (!savedWarmups) return;

    try {
      const parsed = JSON.parse(savedWarmups) as WarmupLessonId[];
      setCompletedWarmups(parsed.filter((id) => warmupLessons.some((lesson) => lesson.id === id)));
    } catch {
      window.localStorage.removeItem("ritim-kapisi-warmup-completed");
    }
  }, []);

  useEffect(() => {
    movementReferenceStartedAtRef.current = performance.now();
    targetScoreRef.current = 0;
    movementScoreRef.current = 0;
    capturedMovementRef.current = null;
    setMovementScore(0);
    setSnapshotState("bekliyor");
    previousPoseRef.current = null;
    setLiveFeedback("Tam bedenini kadraja al ve öğretmeni aynala.");
    setScoreBreakdown({ form: 0, rhythm: 0, balance: 0 });
    analysisWindowStateRef.current = "idle";
    analysisWindowSamplesRef.current = [];
    analysisWindowStartedAtRef.current = null;
    if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);
    setAnalysisWindowState("idle");
    setAnalysisWindowProgress(0);
    setAnalysisWindowResult(null);
  }, [activeWarmupId, movement.id, practiceLearningMode]);

  useEffect(() => {
    if (practiceLearningMode === "shibashi" && phase === "live" && voiceStatus === "aktif") {
      window.setTimeout(() => {
        playCoachCue("start", `Canlı pratik başladı. Şimdi ${movement.name}. ${movement.cue} ${getMovementBreathCue(movement.id)}`);
      }, 900);
    }
  }, [movement.cue, movement.id, movement.name, phase, practiceLearningMode, voiceStatus]);

  useEffect(() => {
    if (practiceLearningMode !== "shibashi" || phase !== "live" || voiceStatus !== "aktif") return;

    let index = 0;
    const speakMovementCue = () => {
      const currentScore = movementScoreRef.current;
      const cues = [
        "Çok iyi. Nefesi yumuşat. Hareketi acele ettirme.",
        "Omuzları bırak. Dizler kilitlenmesin. Ağırlığı sessizce taşı.",
        `${movement.name}. Referans görsele bak. Aynı akışı yavaşça yakala.`,
        currentScore >= 80 ? "Harika. Yüzde seksenin üstündesin. Bu form kabul." : "Güzel gidiyor. Biraz daha yavaşla ve merkezi koru.",
      ];
      const cueFile = currentScore >= 80 ? "ok" : cueIndexRef.current % 2 === 0 ? "soft" : "align";
      playCoachCue(cueFile, cues[index % cues.length]);
      cueIndexRef.current += 1;
      index += 1;
    };
    const firstCueTimer = window.setTimeout(speakMovementCue, 8600);
    const timer = window.setInterval(speakMovementCue, selectedCoach.cadenceMs);

    return () => {
      window.clearTimeout(firstCueTimer);
      window.clearInterval(timer);
    };
  }, [movement.name, phase, practiceLearningMode, selectedCoach.cadenceMs, selectedCoach.id, voiceStatus]);

  useEffect(() => {
    if (cameraStatus !== "ready") {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      targetScoreRef.current = 0;
      movementScoreRef.current = 0;
      setMovementScore(0);
      setKeypoints([]);
      drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
      setPoseStatus("bekliyor");
      setSnapshotState("bekliyor");
      analysisWindowStateRef.current = "idle";
      analysisWindowSamplesRef.current = [];
      analysisWindowStartedAtRef.current = null;
      if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);
      setAnalysisWindowState("idle");
      setAnalysisWindowProgress(0);
      setAnalysisWindowResult(null);
      return;
    }

    let cancelled = false;
    void startMoveNetLoop(() => cancelled);

    return () => {
      cancelled = true;
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [cameraStatus]);

  useEffect(() => {
    if (practiceLearningMode !== "shibashi" || cameraStatus !== "ready" || movementScore < 80) return;
    const captureKey = `${movement.id}-${new Date().toLocaleDateString("tr-TR")}`;
    if (capturedMovementRef.current === captureKey) return;

    capturedMovementRef.current = captureKey;
    const snapshot = createPracticeSnapshot(videoRef.current, movement, movementScore, selectedShen.name);
    if (snapshot) {
      onSnapshotCaptured(snapshot);
      setSnapshotState("kaydedildi");
      playCoachCue("ok", "Harika. Yüzde seksenin üstündesin. Bu form kabul edildi ve galeriye kaydedildi.");
    }
  }, [cameraStatus, movement, movementScore, onSnapshotCaptured, practiceLearningMode, selectedShen.name]);

  async function startMoveNetLoop(isCancelled: () => boolean) {
    const video = videoRef.current;
    if (!video) return;

    try {
      setPoseStatus("yükleniyor");
      detectorRef.current ??= await createMoveNetDetector();
      setPoseStatus("aktif");

      const detect = async () => {
        if (isCancelled() || !videoRef.current || cameraStatus !== "ready") return;

        const poses = await detectorRef.current?.estimatePoses(videoRef.current, { flipHorizontal: false });
        const pose = poses?.[0];
        syncPoseCanvasSize(canvasRef.current, videoRef.current);

        if (!pose?.keypoints?.length) {
          setPoseStatus("beden-yok");
          setKeypoints([]);
          drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
          targetScoreRef.current = 0;
          movementScoreRef.current = 0;
          setScoreBreakdown({ form: 0, rhythm: 0, balance: 0 });
          previousPoseRef.current = null;
          setLiveFeedback("Puanlama için başından ayaklarına kadar tam bedenini kadraja al.");
        } else {
          const poseKeypoints = pose.keypoints;
          setKeypoints(poseKeypoints);
          drawPoseCanvas(canvasRef.current, pose, selectedShen.color);
          const requiredPointNames = [
            "left_shoulder",
            "right_shoulder",
            "left_elbow",
            "right_elbow",
            "left_wrist",
            "right_wrist",
            "left_hip",
            "right_hip",
            "left_knee",
            "right_knee",
            "left_ankle",
            "right_ankle",
          ];
          const visiblePointCount = requiredPointNames.filter((name) => {
            const point = poseKeypoints.find((candidate) => candidate.name === name);
            return Boolean(point && (point.score ?? 0) >= 0.35);
          }).length;

          if (visiblePointCount < requiredPointNames.length) {
            setPoseStatus("beden-yok");
            targetScoreRef.current = 0;
            movementScoreRef.current = 0;
            previousPoseRef.current = null;
            setScoreBreakdown({ form: 0, rhythm: 0, balance: 0 });
            setLiveFeedback(`Puanlama bekliyor: gerekli ${requiredPointNames.length} eklemden ${visiblePointCount} tanesi net görünüyor.`);
            rafRef.current = window.requestAnimationFrame(detect);
            return;
          }

          setPoseStatus("aktif");
          const now = performance.now();
          const match =
            practiceLearningModeRef.current === "shibashi"
              ? scoreMovementAgainstReference(
                  poseKeypoints,
                  videoRef.current,
                  movementIdRef.current,
                  now - movementReferenceStartedAtRef.current,
                )
              : scoreLiveMovementMatch(poseKeypoints, previousPoseRef.current, activeWarmupIdRef.current);
          previousPoseRef.current = { keypoints: poseKeypoints, at: now };
          if (analysisWindowStateRef.current === "recording") {
            analysisWindowSamplesRef.current.push(match);
          }
          targetScoreRef.current = match.total;
          setLiveFeedback(match.feedback);
          setScoreBreakdown({ form: match.form, rhythm: match.rhythm, balance: match.balance });
        }

        rafRef.current = window.requestAnimationFrame(detect);
      };

      rafRef.current = window.requestAnimationFrame(detect);
    } catch {
      setPoseStatus("hata");
    }
  }

  function startMovementAnalysisWindow() {
    if (!isCameraReady || poseStatus !== "aktif") {
      setLiveFeedback("Önce kamerada tam bedenini görünür hale getir.");
      return;
    }

    if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);
    analysisWindowStateRef.current = "recording";
    analysisWindowSamplesRef.current = [];
    analysisWindowStartedAtRef.current = performance.now();
    setAnalysisWindowState("recording");
    setAnalysisWindowProgress(0);
    setAnalysisWindowResult(null);
    setLiveFeedback("Üç saniye başladı. Referans hareketi yavaşça aynala.");

    analysisWindowTimerRef.current = window.setInterval(() => {
      const startedAt = analysisWindowStartedAtRef.current ?? performance.now();
      const progress = Math.min(100, ((performance.now() - startedAt) / 3000) * 100);
      setAnalysisWindowProgress(progress);
      if (progress >= 100) finishMovementAnalysisWindow();
    }, 80);
  }

  function finishMovementAnalysisWindow() {
    if (analysisWindowStateRef.current !== "recording") return;
    if (analysisWindowTimerRef.current) window.clearInterval(analysisWindowTimerRef.current);

    const samples = analysisWindowSamplesRef.current;
    analysisWindowStateRef.current = "complete";
    analysisWindowStartedAtRef.current = null;
    setAnalysisWindowProgress(100);

    if (!samples.length) {
      analysisWindowStateRef.current = "idle";
      setAnalysisWindowState("idle");
      setLiveFeedback("Bu üç saniyede bedenin görünmedi. Biraz geri çekilip tekrar dene.");
      return;
    }

    const result = {
      total: Math.round(samples.reduce((sum, item) => sum + item.total, 0) / samples.length),
      form: Math.round(samples.reduce((sum, item) => sum + item.form, 0) / samples.length),
      rhythm: Math.round(samples.reduce((sum, item) => sum + item.rhythm, 0) / samples.length),
      balance: Math.round(samples.reduce((sum, item) => sum + item.balance, 0) / samples.length),
      samples: samples.length,
    } satisfies MovementAnalysisWindowResult;

    setAnalysisWindowResult(result);
    setAnalysisWindowState("complete");
    setLiveFeedback(result.total >= 80 ? "Üç saniyelik akışın referans formuyla iyi buluştu." : "Akışın temeli var. Biraz daha yavaşla ve merkezi koru.");
    playCoachCue(
      result.total >= 80 ? "ok" : "soft",
      `Üç saniyelik analiz tamamlandı. Hareket uyumun yüzde ${result.total}.`,
    );
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      return false;
    }

    if (streamRef.current) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }
      setCameraStatus("ready");
      return true;
    }

    try {
      setCameraStatus("requesting");
      onStopMusic();

      // Some embedded browsers reject the portrait/framerate hints even though
      // they can open the camera. Retry with progressively simpler constraints.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 720 },
            height: { ideal: 1280 },
            aspectRatio: { ideal: 0.75 },
            frameRate: { ideal: 30, max: 30 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((resolve) => {
          const video = videoRef.current;
          if (!video) return resolve();
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            resolve();
            return;
          }
          video.onloadedmetadata = () => resolve();
          window.setTimeout(resolve, 1500);
        });
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraStatus("ready");
      targetScoreRef.current = 0;
      movementScoreRef.current = 0;
      setMovementScore(0);
      setSnapshotState("bekliyor");
      setVoiceStatus("aktif");
      setCoachLine("Kamera açık. Sesli rehber seni 2-3 metre mesafeden yönlendirecek.");
      return true;
    } catch (error) {
      setCameraStatus("denied");
      const errorName = error instanceof DOMException ? error.name : "";
      const message = errorName === "NotAllowedError"
        ? "Kamera izni kapalı. Tarayıcı adres çubuğundaki kamera simgesinden izin verip tekrar dene."
        : "Kamera açılamadı. Başka bir uygulama kamerayı kullanıyor olabilir; tekrar dene.";
      setCoachLine(message);
      speakCoach(message);
      return false;
    }
  }

  async function handlePracticeStart() {
    if (cameraStatus !== "ready") {
      const cameraStarted = await startCamera();
      if (!cameraStarted) return;
      if (phase === "ready") {
        playCoachCueForCoach(
          "calibration",
          "Kalibrasyon başladı. İki-üç metre mesafede dur. Başını ve ayaklarını kadraja al. Hazır olduğunda Canlı Başlat düğmesine bas.",
          selectedCoach,
          true,
        );
        onStart();
      }
      return;
    }

    onStart();
    if (phase === "calibrate") {
      playCoachCueForCoach(
        "start",
        "Canlı başlatıldı. Çok iyi. İki-üç metre mesafeyi koru. Yavaş hareket et; nefesin hareketi taşısın.",
        selectedCoach,
        true,
      );
    }
  }

  function shutdownCamera(completePractice: boolean) {
    if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    drawPoseCanvas(canvasRef.current, undefined, selectedShen.color);
    setCameraStatus("idle");
    setKeypoints([]);
    targetScoreRef.current = 0;
    movementScoreRef.current = 0;
    setMovementScore(0);
    setPoseStatus("bekliyor");
    setSnapshotState("bekliyor");
    setVoiceStatus("sessiz");
    stopCoachVoice();
    if (completePractice) {
      onComplete();
    }
  }

  function stopCamera() {
    shutdownCamera(true);
  }

  function beginPostureAssessment() {
    setPostureCaptures({});
    setPostureResult(null);
    setPostureMode("3d");
    setPostureView("front");
    setPostureStep("intro");
    setCoachLine("Önce postür analizi alınacak. Kamerada bütün beden görünmeli.");
  }

  async function openPostureCamera() {
    setPostureStep("front");
    setPostureView("front");
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      setPostureStep("intro");
      return;
    }
    setCoachLine("Ön görünüm hazır. Ayaklar dahil tam beden kadrajda kalsın.");
    playCoachCueForCoach(
      "calibration",
      "Postür analizi başladı. Kameradan iki-üç metre uzaklaş. Başın ve ayakların aynı anda görünsün.",
      selectedCoach,
      true,
    );
  }

  function captureCurrentPosture() {
    if (postureStep !== "front" && postureStep !== "side" && postureStep !== "back") return;
    const view = postureStep;
    const analysis = toPostureAnalysisSnapshot(analyzePosture(keypoints, movementScore, selectedShen.id, view));
    const capture = createPostureCapture(videoRef.current, keypoints, view, analysis, selectedShen.color);
    if (!capture) {
      setCoachLine("Görüntü alınamadı. Kamerada bütün beden göründüğünde tekrar dene.");
      return;
    }

    const nextCaptures = { ...postureCaptures, [view]: capture };
    setPostureCaptures(nextCaptures);

    if (view === "front") {
      setPostureView("side");
      setPostureStep("side");
      setCoachLine("Şimdi yan görünüm. Telefona yan dön, baş-göğüs-pelvis aynı eksende kalsın.");
      speakPostureTransition("Şimdi yana dön. Başın, göğsün ve pelvisin aynı eksende kalsın.");
      return;
    }

    if (view === "side") {
      setPostureView("back");
      setPostureStep("back");
      setCoachLine("Son kayıt: arka görünüm. Sağ-sol yük dağılımını eşitle ve sabit dur.");
      speakPostureTransition("Şimdi arkanı dön. Başın ve ayakların kadrajda kalsın; iki saniye sabit dur.");
      return;
    }

    if (nextCaptures.front && nextCaptures.side && nextCaptures.back) {
      const report = buildPostureReport(nextCaptures as Record<PostureView, PostureAssessmentCapture>, latestPostureReport);
      setPostureResult(report);
      setPostureStep("result");
      shutdownCamera(false);
      setCoachLine("Postür raporu hazır. Kaydedersen tarihsel gelişim çizgisine eklenecek.");
    }
  }

  function saveCurrentPostureReport() {
    if (!postureResult) return;
    onPostureReportCaptured(postureResult);
    setPostureStep("idle");
    setPostureResult(null);
    setPostureCaptures({});
  }

  function closePostureAssessment() {
    shutdownCamera(false);
    setPostureStep("idle");
    setPostureResult(null);
    setPostureCaptures({});
  }

  function togglePracticeMusic() {
    if (musicState === "açık") {
      onStopMusic();
      return;
    }

    onPlayMusic();
  }

  async function startWarmupTracking() {
    const cameraStarted = await startCamera();
    if (!cameraStarted) return;
    setCoachLine(`${activeWarmup.title} takibi başladı. ${activeWarmup.cameraCue}`);
    playCoachCueForCoach(
      "start",
      `${activeWarmup.title} başladı. İki-üç metre mesafede, başın ve ayakların kadrajda kalsın. ${activeWarmup.cameraCue} ${activeWarmup.breathCue}`,
      selectedCoach,
      true,
    );
  }

  function completeWarmupLesson() {
    const nextCompleted = completedWarmups.includes(activeWarmup.id)
      ? completedWarmups
      : [...completedWarmups, activeWarmup.id];
    setCompletedWarmups(nextCompleted);
    window.localStorage.setItem("ritim-kapisi-warmup-completed", JSON.stringify(nextCompleted));

    const nextLesson = warmupLessons.find((lesson) => !nextCompleted.includes(lesson.id));
    if (nextLesson) {
      setActiveWarmupId(nextLesson.id);
      return;
    }

    setPracticeLearningMode("shibashi");
    setCoachLine("Hazırlık tamam. Şimdi 18 hareketlik Shibashi akışına geçiyoruz.");
  }

  function stopCoachVoice() {
    coachCueQueueRef.current = [];
    coachCuePlayingRef.current = false;
    if (coachCueCooldownTimerRef.current) {
      window.clearTimeout(coachCueCooldownTimerRef.current);
      coachCueCooldownTimerRef.current = null;
    }
    try {
      coachVoiceEngineRef.current?.current?.stop();
    } catch {
      // Source may already be stopped by the browser.
    }
    if (coachVoiceEngineRef.current) {
      coachVoiceEngineRef.current.current = null;
    }
    window.speechSynthesis?.cancel();
  }

  function toggleVoiceCommands() {
    if (voiceStatus === "aktif") {
      setVoiceStatus("sessiz");
      stopCoachVoice();
      setCoachLine("Sesli komutlar kapalı. İstersen tekrar açabilirsin.");
      return;
    }

    setVoiceStatus("aktif");
    playCoachCueForCoach(
      "start",
      `Sesli komutlar açık. ${selectedCoach.name} hazır. Şimdi ${movement.name}: ${movement.cue}`,
      selectedCoach,
      true,
    );
  }

  function playCoachCue(_name: CoachCueName, fallbackText: string) {
    playCoachCueForCoach(_name, fallbackText, selectedCoach);
  }

  function speakPostureTransition(text: string) {
    if (voiceStatus !== "aktif") return;

    coachCueQueueRef.current = [];
    coachVoiceEngineRef.current?.current?.stop();
    window.speechSynthesis?.cancel();
    setCoachLine(`${selectedCoach.name}: ${text}`);
    coachCuePlayingRef.current = true;
    void speakCoachCue(text, selectedCoach).finally(() => {
      coachCuePlayingRef.current = false;
      coachCueNextAllowedAtRef.current = Date.now() + 1800;
    });
  }

  function playCoachCueForCoach(
    name: CoachCueName,
    fallbackText: string,
    coach: AiCoach,
    force = false,
  ) {
    const styledText = styleCoachCue(fallbackText, coach);
    const text = `${coach.name}: ${styledText}`;
    setCoachLine(text);
    if (voiceStatus !== "aktif" && !force) return;

    if (force) {
      coachCueQueueRef.current = [];
      coachCueNextAllowedAtRef.current = Date.now();
    }

    coachCueQueueRef.current = [...coachCueQueueRef.current, { coach, force, name, text: styledText }].slice(-2);
    void pumpCoachCueQueue();
  }

  async function pumpCoachCueQueue() {
    if (coachCuePlayingRef.current) return;
    const nextCue = coachCueQueueRef.current.shift();
    if (!nextCue) return;

    const waitMs = Math.max(0, coachCueNextAllowedAtRef.current - Date.now());
    if (waitMs > 0) {
      coachCueQueueRef.current.unshift(nextCue);
      if (!coachCueCooldownTimerRef.current) {
        coachCueCooldownTimerRef.current = window.setTimeout(() => {
          coachCueCooldownTimerRef.current = null;
          void pumpCoachCueQueue();
        }, waitMs);
      }
      return;
    }

    coachCuePlayingRef.current = true;
    const playedAudio = await playCoachAudioFile(nextCue.name, nextCue.coach);
    if (!playedAudio) {
      await speakCoachCue(nextCue.text, nextCue.coach);
    }
    coachCuePlayingRef.current = false;
    coachCueNextAllowedAtRef.current = Date.now() + getCoachSilenceMs(nextCue.coach, nextCue.name);

    if (coachCueQueueRef.current.length) {
      coachCueCooldownTimerRef.current = window.setTimeout(() => {
        coachCueCooldownTimerRef.current = null;
        void pumpCoachCueQueue();
      }, getCoachSilenceMs(nextCue.coach, nextCue.name));
    }
  }

  async function playCoachAudioFile(name: CoachCueName, coach: AiCoach) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    try {
      if (!coachVoiceEngineRef.current) {
        const context = new AudioContextClass();
        const gain = context.createGain();
        gain.gain.value = 1;
        gain.connect(context.destination);
        coachVoiceEngineRef.current = {
          buffers: new Map(),
          context,
          current: null,
          gain,
        };
      }

      const engine = coachVoiceEngineRef.current;
      if (engine.context.state === "suspended") {
        await engine.context.resume();
      }

      const src = `/audio/coach/tr/${name}.m4a?v=${coachVoiceVersion}`;
      let buffer = engine.buffers.get(src);
      if (!buffer) {
        const response = await fetch(src);
        const data = await response.arrayBuffer();
        buffer = await engine.context.decodeAudioData(data.slice(0));
        engine.buffers.set(src, buffer);
      }

      engine.current?.stop();
      const source = engine.context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = Math.max(0.68, Math.min(0.94, coach.rate));
      if ("detune" in source) {
        source.detune.value = coach.detune;
      }
      const toneFilter = engine.context.createBiquadFilter();
      toneFilter.type = "peaking";
      toneFilter.frequency.value = coach.filterFrequency;
      toneFilter.Q.value = 0.72;
      toneFilter.gain.value = coach.filterGain;
      source.connect(toneFilter);
      toneFilter.connect(engine.gain);
      source.start();
      engine.current = source;
      await new Promise<void>((resolve) => {
        const fallbackTimer = window.setTimeout(resolve, Math.min(9000, ((buffer?.duration ?? 3) / source.playbackRate.value) * 1000 + 900));
        source.onended = () => {
          window.clearTimeout(fallbackTimer);
          if (engine.current === source) engine.current = null;
          resolve();
        };
      });
      return true;
    } catch {
      return false;
    }
  }

  if (phase === "complete" && postureStep === "idle") {
    return (
      <section className="screen practice-complete-screen">
        <div className="practice-complete-card">
          <span className="eyebrow">Pratik tamamlandı</span>
          <h1>Hareketin sende bıraktığı izi dinle.</h1>
          <blockquote>“{masterSentence.text}”</blockquote>
          <p>{liveFeedback}</p>
          <div className="practice-complete-actions">
            <button className="primary-action" onClick={() => onSaveMasterSentence(masterSentence.id, `movement-${movement.id}`)} type="button">Defterime ekle</button>
            <button className="secondary-action" onClick={onReflect} type="button">Bugün bende ne ifade etti?</button>
            <button className="secondary-action" onClick={onNext} type="button">Sıradaki hareket</button>
          </div>
        </div>
      </section>
    );
  }

  if (postureStep !== "idle") {
    return (
      <PostureAssessmentScreen
        cameraStatus={cameraStatus}
        canvasRef={canvasRef}
        captures={postureCaptures}
        keypoints={keypoints}
        mode={postureMode}
        movementScore={movementScore}
        onCapture={captureCurrentPosture}
        onClose={closePostureAssessment}
        onModeChange={setPostureMode}
        onOpenCamera={openPostureCamera}
        onRetake={() => {
          setPostureCaptures({});
          setPostureResult(null);
          setPostureStep("intro");
          setPostureView("front");
        }}
        onSaveReport={saveCurrentPostureReport}
        onViewChange={setPostureView}
        poseStatus={poseStatus}
        report={postureResult}
        selectedShen={selectedShen}
        step={postureStep}
        videoRef={videoRef}
        view={postureView}
      />
    );
  }

  if (practiceLearningMode === "preparation") {
    return (
      <WarmupStudio
        activeLesson={activeWarmup}
        cameraStatus={cameraStatus}
        canvasRef={canvasRef}
        completedLessons={completedWarmups}
        movementScore={movementScore}
        liveFeedback={liveFeedback}
        analysisWindowProgress={analysisWindowProgress}
        analysisWindowResult={analysisWindowResult}
        analysisWindowState={analysisWindowState}
        scoreBreakdown={scoreBreakdown}
        onCompleteLesson={completeWarmupLesson}
        onEnterShibashi={() => setPracticeLearningMode("shibashi")}
        onOpenCamera={startWarmupTracking}
        onSelectLesson={setActiveWarmupId}
        poseStatus={poseStatus}
        onStartMovementAnalysis={startMovementAnalysisWindow}
        selectedShen={selectedShen}
        videoRef={videoRef}
      />
    );
  }

  return (
    <section className="screen practice-screen">
      <div className={`movement-card ${isCameraReady ? "movement-card-live" : "movement-card-prep"}`}>
        <div className={`camera-stage ${isCameraReady ? "camera-stage-live" : "camera-stage-prep"}`}>
          {!isCameraReady ? (
            <InnerGatePracticeFrame
              completion={completion}
              movement={movement}
              referenceImage={referenceImage}
              scene={innerScene}
              selectedShen={selectedShen}
            />
          ) : null}
          <video
            className={`camera-preview ${isCameraReady ? "camera-preview-active" : ""}`}
            muted
            playsInline
            ref={videoRef}
          />
          {isCameraReady ? (
            <WebGhostTeacherOverlay
              ghostMode={ghostMode}
              keypoints={keypoints}
              opacity={ghostOpacity}
              sequence={ghostSequence}
              traceMode={traceMode}
              videoHeight={videoRef.current?.videoHeight || 1280}
              videoWidth={videoRef.current?.videoWidth || 720}
            />
          ) : null}
          <canvas className="camera-pose-canvas" ref={canvasRef} />
          {isCameraReady ? (
              <div className="camera-overlay">
                <div className="scan-frame" />
                <div className="camera-framing-guide">
                  <strong>Baş + ayaklar</strong>
                  <span>2-3 metre • tam beden</span>
                </div>
                <div className="camera-pill">{getCameraStatus(cameraStatus, phase)}</div>
              <div className="pose-pill">{getPoseStatusText(poseStatus)}</div>
              <div className={`score-badge ${movementScore >= 80 ? "score-badge-ok" : ""}`}>
                <strong>{movementScore}%</strong>
                <span>{movementScore >= 80 ? "UYUMLU" : "HAREKET UYUMU"}</span>
              </div>
              <div className="practice-live-feedback">{liveFeedback}</div>
              <div className="practice-score-breakdown">
                <span>Form <b>{scoreBreakdown.form}</b></span>
                <span>Ritim <b>{scoreBreakdown.rhythm}</b></span>
                <span>Denge <b>{scoreBreakdown.balance}</b></span>
              </div>
              {snapshotState === "kaydedildi" ? <div className="snapshot-pill">Galeriye kaydedildi</div> : null}
              <div className="distance-pill">Boydan kadraj için 2-3 metre geri çekil</div>
              <div className="practice-ghost-controls">
                <button onClick={() => setGhostMode((current) => current === "follow" ? "mirror" : current === "mirror" ? "trace" : "follow")} type="button">Ghost · {ghostMode === "follow" ? "Takip" : ghostMode === "mirror" ? "Ayna" : "İz"}</button>
                <button onClick={() => setTraceMode((current) => current === "off" ? "teacher" : current === "teacher" ? "user" : current === "user" ? "compare" : "off")} type="button">İz · {traceMode === "off" ? "Kapalı" : traceMode === "teacher" ? "Öğretmen" : traceMode === "user" ? "Ben" : "İkisi"}</button>
                <button onClick={() => setGhostOpacity((current) => current >= .72 ? .42 : current + .16)} type="button">Yoğunluk %{Math.round(ghostOpacity * 100)}</button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="movement-body">
          <div className="practice-mode-row">
            <button onClick={() => setPracticeLearningMode("preparation")} type="button">Hazırlığa dön</button>
            <a href={`https://www.youtube.com/watch?v=${shibashiFullSetVideoId}`} onClick={onStopMusic} rel="noreferrer" target="_blank">Tam set videosu ↗</a>
          </div>
          <div>
            <span className="eyebrow">Hareket {movement.id} / 18</span>
            <h1 className="hero-title" style={{ fontSize: "1.9rem" }}>
              {movement.name}
            </h1>
            <p className="hero-copy">{movement.english}</p>
          </div>
          <div className="practice-master-intent">
            <span>Bu pratiğin niyeti</span>
            <strong>“{masterSentence.text}”</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
          {!isCameraReady ? (
            <InnerJourneyStatus completion={completion} scene={innerScene} selectedShen={selectedShen} />
          ) : null}
          {isCameraReady ? (
            <div className="reference-panel practice-reference-panel">
              <img src={referenceImage} alt={`${movement.name} referans hareketi`} />
              <div>
                <span className="eyebrow">Foto Referans</span>
                <h2>{movement.name}</h2>
                <p>{movement.cue}</p>
                <div className="reference-meta">
                  <span>{movement.focus}</span>
                  <span>{movementScore >= 80 ? "OK için yeterli" : "%80 hedef"}</span>
                </div>
              </div>
            </div>
          ) : null}
          <div className="breath-sync-card">
            <span>Nefes • hareket senkronu</span>
            <strong>{getMovementBreathCue(movement.id)}</strong>
          </div>
          {isCameraReady ? (
            <div className="practice-status-card">
              <div>
                <span className="eyebrow">Canlı Takip</span>
                <strong>{getPracticeMessage(phase)}</strong>
              </div>
              <span>{movementScore}%</span>
            </div>
          ) : null}
          {isCameraReady ? (
            <MovementAnalysisWindow
              onStart={startMovementAnalysisWindow}
              progress={analysisWindowProgress}
              result={analysisWindowResult}
              state={analysisWindowState}
            />
          ) : null}
          {isCameraReady ? <PracticeGuideCompanion coach={selectedCoach} coachLine={coachLine} voiceStatus={voiceStatus} /> : null}
          <div className={`practice-actions ${isCameraReady ? "practice-actions-live" : "practice-actions-ready"}`}>
            <button disabled={movementLocked} className={`${isCameraReady ? "secondary-action" : "primary-action"} practice-control-button practice-camera-button`} onClick={handlePracticeStart} type="button">
              {movementLocked ? "Kilitli · İlk 3 hareket hazır" : cameraStatus === "requesting" ? "İzin Bekleniyor" : isCameraReady && phase !== "ready" ? "Canlı Başlat" : "Kamerayı Aç"}
            </button>
            {!isCameraReady ? (
              <button className="secondary-action practice-control-button practice-music-button" onClick={togglePracticeMusic} type="button">
                Müzik {musicState === "açık" ? "Kapat" : "Aç"}
              </button>
            ) : null}
            {isCameraReady ? (
              <>
                <button className={`secondary-action ${voiceStatus === "aktif" ? "voice-action-active" : ""}`} onClick={toggleVoiceCommands} type="button">
                  {voiceStatus === "aktif" ? "Sesli Komut Kapat" : "Sesli Komut Aç"}
                </button>
                <button className="secondary-action" onClick={stopCamera} type="button">
                  Tamamla
                </button>
                <button className="primary-action practice-next-action" onClick={onNext} type="button">
                  Sıradaki Hareket
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {phase === "complete" ? <PracticeMeridianSummaryCard movementIds={[movement.id]} accent={selectedShen.color} /> : null}
      <PersonalMeridianSuggestion completedMovementIds={completedMovementIds} accent={selectedShen.color} onSelectMovement={onSelectMovement} />
      <MovementMeridianCard movementId={movement.id} accent={selectedShen.color} />
      <MovementLibraryShowcase activeMovementId={movement.id} onSelectMovement={onSelectMovement} />
    </section>
  );
}

function MovementLibraryShowcase({
  activeMovementId,
  onSelectMovement,
}: {
  activeMovementId: number;
  onSelectMovement: (movementId: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "beginner" | "flow" | "balance">("all");
  const visibleMovements = movements.filter((item) => {
    if (filter === "beginner") return item.id <= 6;
    if (filter === "flow") return [3, 6, 7, 10, 11, 12, 16, 17].includes(item.id);
    if (filter === "balance") return [4, 5, 9, 13, 15, 18].includes(item.id);
    return true;
  });

  return (
    <section className="movement-library-showcase">
      <div className="section-heading movement-library-heading">
        <div>
          <span className="eyebrow">Hareket Kütüphanesi</span>
          <h2>18 hareket, tek bir akış.</h2>
        </div>
        <span>{visibleMovements.length} hareket</span>
      </div>
      <div className="movement-library-filters" aria-label="Hareket filtreleri">
        {([
          ["all", "Tümü"],
          ["beginner", "Başlangıç"],
          ["flow", "Akış"],
          ["balance", "Denge"],
        ] as const).map(([id, label]) => (
          <button className={filter === id ? "active" : ""} key={id} onClick={() => setFilter(id)} type="button">{label}</button>
        ))}
      </div>
      <div className="movement-library-row">
        {visibleMovements.map((item) => (
          <button
            className={`movement-library-card ${activeMovementId === item.id ? "movement-library-card-active" : ""} ${item.id > 3 ? "movement-library-card-locked" : ""}`}
            key={item.id}
            disabled={item.id > 3}
            onClick={() => onSelectMovement(item.id)}
            type="button"
          >
            <img src={getMovementReferenceImage(item)} alt="" />
            <span className="movement-library-shade" />
            <div>
              <small>{String(item.id).padStart(2, "0")} · {item.focus}</small>
              <strong>{item.name}</strong>
              <em>{item.english}</em>
              {item.id > 3 ? <b>Kilitli</b> : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function WarmupStudio({
  activeLesson,
  cameraStatus,
  canvasRef,
  completedLessons,
  movementScore,
  liveFeedback,
  analysisWindowProgress,
  analysisWindowResult,
  analysisWindowState,
  scoreBreakdown,
  onCompleteLesson,
  onEnterShibashi,
  onOpenCamera,
  onSelectLesson,
  onStartMovementAnalysis,
  poseStatus,
  selectedShen,
  videoRef,
}: {
  activeLesson: WarmupLesson;
  cameraStatus: "idle" | "requesting" | "ready" | "denied" | "unsupported";
  canvasRef: RefObject<HTMLCanvasElement | null>;
  completedLessons: WarmupLessonId[];
  movementScore: number;
  liveFeedback: string;
  analysisWindowProgress: number;
  analysisWindowResult: MovementAnalysisWindowResult | null;
  analysisWindowState: MovementAnalysisWindowState;
  scoreBreakdown: { form: number; rhythm: number; balance: number };
  onCompleteLesson: () => void;
  onEnterShibashi: () => void;
  onOpenCamera: () => void;
  onSelectLesson: (id: WarmupLessonId) => void;
  onStartMovementAnalysis: () => void;
  poseStatus: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata";
  selectedShen: (typeof fiveShen)[number];
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const isCameraReady = cameraStatus === "ready";
  const allWarmupsComplete = completedLessons.length === warmupLessons.length;
  return (
    <section className="screen warmup-studio">
      <header className="warmup-header">
        <div>
          <span className="eyebrow">Shibashi Öncesi Hazırlık</span>
          <h1>Önce bedeni forma hazırla.</h1>
          <p>Sana önerdiğimiz sırada ilerle: Wuji duruşu, eklem ısınması ve Kua merkezi. Sonra 18 harekete geç.</p>
        </div>
        <div className="warmup-progress">
          <strong>{completedLessons.length}/3</strong>
          <span>hazırlık tamam</span>
        </div>
      </header>

      <div className="warmup-layout">
        <nav className="warmup-lesson-rail" aria-label="Hazırlık dersleri">
          {warmupLessons.map((lesson) => (
            <button
              className={activeLesson.id === lesson.id ? "warmup-lesson-active" : ""}
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              type="button"
            >
              <span>{completedLessons.includes(lesson.id) ? "✓" : lesson.order}</span>
              <div>
                <strong>{lesson.shortTitle}</strong>
                <small>{lesson.focus}</small>
              </div>
            </button>
          ))}
          <button className="warmup-skip" onClick={onEnterShibashi} type="button">
            <span>18</span>
            <div>
              <strong>Shibashi</strong>
              <small>Ana form</small>
            </div>
          </button>
        </nav>

        <main className="warmup-main">
          <div className="warmup-title-row">
            <div>
              <span className="eyebrow">Ders {activeLesson.order} • {activeLesson.focus}</span>
              <h2>{activeLesson.title}</h2>
              <p>{activeLesson.description}</p>
            </div>
            <span className="warmup-shen-chip">Bugün: {selectedShen.dailyName}</span>
          </div>

          <div className="warmup-follow-grid">
            <div className="warmup-video-stage">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                src={`https://www.youtube-nocookie.com/embed/${activeLesson.videoId}?rel=0&modestbranding=1`}
                title={`${activeLesson.title} - Qigong İzmir`}
              />
              <span>Qigong İzmir • Öğretmen videosu</span>
            </div>

            {activeLesson.id === "warmup" ? (
              <div className="warmup-camera-stage warmup-camera-stage-coach">
                <MovementCoach />
              </div>
            ) : (
              <div className={`warmup-camera-stage ${isCameraReady ? "warmup-camera-live" : ""}`}>
                <video className={`camera-preview ${isCameraReady ? "camera-preview-active" : ""}`} muted playsInline ref={videoRef} />
                <canvas className="camera-pose-canvas" ref={canvasRef} />
                {!isCameraReady ? (
                  <div className="warmup-camera-placeholder">
                    <strong>Videoyu izle, sonra aynala.</strong>
                    <span>
                      {cameraStatus === "denied"
                        ? "Kamera izni kapalı ya da kamera başka bir uygulamada kullanılıyor. İzni açıp tekrar dene."
                        : cameraStatus === "unsupported"
                          ? "Bu tarayıcı kamera erişimini desteklemiyor. Safari veya Chrome ile tekrar aç."
                          : "Kamerayı açınca bedenin videonun yanında canlı olarak takip edilir."}
                    </span>
                    <button onClick={onOpenCamera} type="button">
                      {cameraStatus === "requesting" ? "Kamera izni bekleniyor" : cameraStatus === "denied" ? "Tekrar Dene" : "Kamerayı Aç"}
                    </button>
                  </div>
                ) : (
                  <div className="warmup-camera-overlay">
                    <div className="warmup-camera-distance">2-3 metre • baş ve ayaklar kadrajda</div>
                    <div className={`warmup-live-score ${movementScore >= 80 ? "warmup-live-score-ok" : ""}`}>
                      <strong>{movementScore}</strong>
                      <span>/100 uyum</span>
                    </div>
                    <span>{getPoseStatusText(poseStatus)}</span>
                    <div className="live-match-feedback">{liveFeedback}</div>
                    <div className="live-match-breakdown">
                      <span>Form <b>{scoreBreakdown.form}</b></span>
                      <span>Ritim <b>{scoreBreakdown.rhythm}</b></span>
                      <span>Denge <b>{scoreBreakdown.balance}</b></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="warmup-guidance-row">
            <div>
              <span>BEDEN İPUCU</span>
              <strong>{activeLesson.cameraCue}</strong>
            </div>
            <div>
              <span>NEFES İPUCU</span>
              <strong>{activeLesson.breathCue}</strong>
            </div>
          </div>

          {isCameraReady ? (
            <MovementAnalysisWindow
              onStart={onStartMovementAnalysis}
              progress={analysisWindowProgress}
              result={analysisWindowResult}
              state={analysisWindowState}
            />
          ) : null}

          <div className="warmup-actions warmup-actions-end">
            <button onClick={onCompleteLesson} type="button">
              {allWarmupsComplete ? "18 Harekete Geç" : completedLessons.includes(activeLesson.id) ? "Sonraki Derse Geç" : "Dersi Tamamla"}
            </button>
          </div>
        </main>
      </div>
    </section>
  );
}

function MovementAnalysisWindow({
  onStart,
  progress,
  result,
  state,
}: {
  onStart: () => void;
  progress: number;
  result: MovementAnalysisWindowResult | null;
  state: MovementAnalysisWindowState;
}) {
  const isRecording = state === "recording";
  const isComplete = state === "complete" && result;

  return (
    <section className={`movement-analysis-window movement-analysis-window-compact movement-analysis-window-${state}`}>
      <div className="movement-analysis-window-copy">
        <span className="eyebrow">Canlı hareket karşılaştırması</span>
        <strong>
          {isRecording ? "Hareketi şimdi aynala." : isComplete ? "Kısa hareket tamamlandı." : "Kısa hareketi aynala."}
        </strong>
        <small>
          {isRecording
            ? "Form, ritim ve denge ölçülüyor. Akışı yavaş ve kesintisiz tut."
            : "Videodaki hareketi izlerken üç saniyelik akışını seçili referansla karşılaştır."}
        </small>
      </div>
      <button disabled={isRecording} onClick={onStart} type="button">
        {isRecording ? `${Math.max(1, Math.ceil(3 - (progress / 100) * 3))} sn ölçülüyor` : isComplete ? "Tekrar analiz" : "3 sn analiz et"}
      </button>
      {isRecording ? (
        <div className="movement-analysis-window-progress" aria-label="Analiz ilerlemesi">
          <i style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {isComplete ? (
        <div className="movement-analysis-window-result">
          <strong>%{result.total}</strong>
          <span>Form {result.form} · Ritim {result.rhythm} · Denge {result.balance}</span>
        </div>
      ) : null}
    </section>
  );
}

function PracticeGuideCompanion({
  coach,
  coachLine,
  voiceStatus,
}: {
  coach: AiCoach;
  coachLine: string;
  voiceStatus: "sessiz" | "aktif";
}) {
  return (
    <div className="practice-guide-companion">
      <span className={`coach-portrait coach-portrait-${coach.imageIndex}`} />
      <div>
        <span className="eyebrow">Yolculuk Rehberi</span>
        <strong>{coach.name} sana eşlik ediyor.</strong>
        <small>{voiceStatus === "aktif" ? coachLine : `${coach.role}. Sesli komutları açınca bu tonla yönlendirecek.`}</small>
      </div>
    </div>
  );
}

function WebGhostTeacherOverlay({
  ghostMode,
  keypoints,
  opacity,
  sequence,
  traceMode,
  videoHeight,
  videoWidth,
}: {
  ghostMode: GhostMode;
  keypoints: PoseKeypoint[];
  opacity: number;
  sequence: ReturnType<typeof getGhostSequence>;
  traceMode: TraceMode;
  videoHeight: number;
  videoWidth: number;
}) {
  const visibleOpacity = Math.max(.52, opacity);
  const [elapsed, setElapsed] = useState(0);
  const userTrailsRef = useRef<Record<"left" | "right" | "center", Array<{ x: number; y: number; at: number }>>>({ left: [], right: [], center: [] });
  useEffect(() => {
    if (!sequence) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => setElapsed(performance.now() - startedAt), 90);
    return () => window.clearInterval(timer);
  }, [sequence]);
  useEffect(() => {
    if (!keypoints.length) return;
    const now = performance.now();
    const byName = new Map(keypoints.map((point) => [point.name, point]));
    const add = (key: "left" | "right" | "center", point?: { x: number; y: number }) => {
      if (!point) return;
      userTrailsRef.current[key] = [...userTrailsRef.current[key], { x: point.x / videoWidth, y: point.y / videoHeight, at: now }].filter((item) => now - item.at <= 2500).slice(-28);
    };
    add("left", byName.get("left_wrist"));
    add("right", byName.get("right_wrist"));
    const leftHip = byName.get("left_hip");
    const rightHip = byName.get("right_hip");
    if (leftHip && rightHip) add("center", { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 });
  }, [keypoints, videoHeight, videoWidth]);
  if (!sequence) return <div className="ghost-reference-unavailable">Bu hareket için Ghost Teacher henüz hazırlanıyor.</div>;
  const time = elapsed % sequence.durationMs;
  const frame = getInterpolatedGhostFrame(sequence, time)!;
  const mirror = ghostMode === "mirror";
  const teacherHistory = sequence.frames.filter((item) => item.timestampMs <= time && time - item.timestampMs <= 2500);
  const frameByName = new Map(frame.keypoints.map((point) => [point.name, point]));
  const comparison = compareMovement(
    keypoints.flatMap((point) => point.name ? [{ name: point.name, x: point.x / videoWidth, y: point.y / videoHeight, score: point.score }] : []),
    frame.keypoints,
  );
  const ghostConnections = poseConnections.filter(([start, end]) => frameByName.has(start) && frameByName.has(end));
  const transformX = (x: number) => (mirror ? 1 - x : x) * 100;
  const trailPoints = (items: Array<{ x: number; y: number }>, flip = false) => items.map((item) => `${(flip ? 1 - item.x : item.x) * 100},${item.y * 100}`).join(" ");
  const teacherTrail = (name: string) => teacherHistory.flatMap((item) => item.keypoints.filter((point) => point.name === name));
  return (
    <svg className="web-ghost-teacher" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Ghost Teacher referans katmanı">
      {ghostConnections.map(([startName, endName]) => {
        const start = frameByName.get(startName)!;
        const end = frameByName.get(endName)!;
        return <line key={`${startName}-${endName}`} x1={transformX(start.x)} y1={start.y * 100} x2={transformX(end.x)} y2={end.y * 100} style={{ opacity: visibleOpacity }} />;
      })}
      {ghostMode !== "trace" ? frame.keypoints.map((point) => <circle key={point.name} cx={transformX(point.x)} cy={point.y * 100} r=".78" style={{ opacity: visibleOpacity }} />) : null}
      {(ghostMode === "trace" || traceMode === "teacher" || traceMode === "compare") ? <>
        <polyline className="teacher-trace" points={trailPoints(teacherTrail("left_wrist"), mirror)} />
        <polyline className="teacher-trace" points={trailPoints(teacherTrail("right_wrist"), mirror)} />
      </> : null}
      {(traceMode === "user" || traceMode === "compare") ? <>
        <polyline className="user-trace" points={trailPoints(userTrailsRef.current.left, true)} />
        <polyline className="user-trace" points={trailPoints(userTrailsRef.current.right, true)} />
        <polyline className="user-center-trace" points={trailPoints(userTrailsRef.current.center, true)} />
      </> : null}
      {keypoints.length ? <text className="ghost-comparison-text" x="4" y="95">{comparison.feedback[0]}</text> : null}
    </svg>
  );
}

function InnerGatePracticeFrame({
  completion,
  movement,
  referenceImage,
  scene,
  selectedShen,
}: {
  completion: number;
  movement: Movement;
  referenceImage: string;
  scene: InnerJourneyScene;
  selectedShen: (typeof fiveShen)[number];
}) {
  return (
    <div
      className="inner-gate-frame"
      style={
        {
          "--inner-progress": `${completion}%`,
          "--inner-node-x": `${scene.x}%`,
          "--inner-node-y": `${scene.y}%`,
          "--shen-card-accent": selectedShen.color,
        } as CSSProperties
      }
    >
      <img className="inner-gate-image" src="/images/inner-gate-path.png" alt="İç yol kapısı" />
      <div className="inner-gate-shade" />
      <div className="inner-gate-path-glow">
        <span />
      </div>
      <div className="inner-gate-node">
        <i />
      </div>
      <div className="inner-gate-copy">
        <span className="eyebrow">Bugünkü İç Yol</span>
        <h2>{scene.title}</h2>
        <p>{scene.encounter}</p>
      </div>
      <div className="inner-gate-form-card">
        <img src={referenceImage} alt={`${movement.name} form referansı`} />
        <div>
          <span className="eyebrow">İlk Form</span>
          <strong>{movement.name}</strong>
          <small>{movement.cue}</small>
        </div>
      </div>
      <div className="inner-gate-meta">
        <span>{scene.gate}</span>
        <strong>{completion}%</strong>
      </div>
    </div>
  );
}

function InnerJourneyStatus({
  completion,
  scene,
  selectedShen,
}: {
  completion: number;
  scene: InnerJourneyScene;
  selectedShen: (typeof fiveShen)[number];
}) {
  return (
    <div className="inner-journey-status">
      <div>
        <span className="eyebrow">Kapıya Giriş</span>
        <strong>{scene.gate}: {scene.title}</strong>
        <p>{scene.bodyHint}</p>
      </div>
      <div className="inner-journey-mini-map" aria-hidden="true">
        {innerJourneyScenes.map((item) => (
          <span
            className={item.id === scene.id ? "inner-mini-active" : ""}
            key={item.id}
            style={{ "--dot-accent": item.id === scene.id ? selectedShen.color : "rgba(246, 239, 228, 0.38)" } as CSSProperties}
          />
        ))}
      </div>
      <div className="inner-journey-ritual">
        <span>{completion}% yol</span>
        <p>{scene.ritual}</p>
      </div>
    </div>
  );
}

function PostureAssessmentScreen({
  autoCaptureProgress,
  cameraStatus,
  canvasRef,
  coachCue = "Tam bedenini kadraja al.",
  captureFlash = false,
  captures,
  capturedView = null,
  keypoints,
  mode,
  movementScore,
  onCapture,
  onClose,
  onCompleteAnalysis,
  onModeChange,
  onOpenCamera,
  onVoiceToggle = () => undefined,
  onZoomChange = () => undefined,
  onDeleteSavedReport,
  onOpenSavedReport,
  onRetake,
  onSaveReport,
  onSetTrainerVisibility,
  onShowHistory,
  onViewChange,
  poseStatus,
  report,
  reportIsSaved = false,
  savedReports = [],
  scanGuidance = "find-body",
  selectedShen,
  step,
  videoRef,
  view,
  voiceEnabled = true,
  zoom,
  frameReadiness,
}: {
  autoCaptureProgress?: number;
  cameraStatus: "idle" | "requesting" | "ready" | "denied" | "unsupported";
  canvasRef: RefObject<HTMLCanvasElement | null>;
  coachCue?: string;
  captureFlash?: boolean;
  captures: Partial<Record<PostureView, PostureAssessmentCapture>>;
  capturedView?: PostureView | null;
  keypoints: PoseKeypoint[];
  mode: PostureRenderMode;
  movementScore: number;
  onCapture: () => void;
  onClose: () => void;
  onCompleteAnalysis?: () => void;
  onModeChange: (mode: PostureRenderMode) => void;
  onOpenCamera: () => void;
  onVoiceToggle?: () => void;
  onZoomChange?: (direction: -1 | 1) => void;
  onDeleteSavedReport?: (reportId: string) => void;
  onOpenSavedReport?: (report: PostureReport) => void;
  onRetake: () => void;
  onSaveReport: () => void;
  onSetTrainerVisibility?: (reportId: string, trainerVisible: boolean) => void;
  onShowHistory?: () => void;
  onViewChange: (view: PostureView) => void;
  poseStatus: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata";
  report: PostureReport | null;
  reportIsSaved?: boolean;
  savedReports?: PostureReport[];
  scanGuidance?: PostureScanGuidance;
  selectedShen: (typeof fiveShen)[number];
  step: PostureAssessmentStep;
  videoRef: RefObject<HTMLVideoElement | null>;
  view: PostureView;
  voiceEnabled?: boolean;
  zoom?: { min: number; max: number; step: number; value: number } | null;
  frameReadiness?: ReturnType<typeof evaluateWebPostureFrame>;
}) {
  const activeView = step === "front" || step === "side" || step === "back" ? step : view;
  const activeLabel = activeView === "front" ? "Ön" : activeView === "side" ? "Yan" : "Arka";
  const captureCount = (["front", "side", "back"] as const).filter((item) => captures[item]).length;
  const canCapture = cameraStatus === "ready" && poseStatus === "aktif";
  const liveAnalysis = analyzePosture(keypoints, movementScore, selectedShen.id, activeView);
  const postureScore = getPostureOverallScore(liveAnalysis);
  const postureReady = cameraStatus === "ready" && poseStatus === "aktif";
  const autoCaptureInstruction =
    activeView === "front" ? "Kameraya dön ve düz dur" : activeView === "side" ? "Şimdi yan dön" : "Şimdi arkanı dön";
  const guidanceText =
    step === "intro"
      ? "Kamerayı açınca tam beden kadrajına geçeceğiz. Ayaklar ve baş aynı anda görünmeli."
      : activeView === "front"
        ? "Kameraya dön. Ayaklar paralel, kollar rahat, gözler karşıda."
        : activeView === "side"
          ? "Yan dön. Baş, göğüs ve pelvis aynı dikey hatta kalsın."
          : "Arkanı dön. Sağ-sol yükünü eşitle ve sabit kal.";

  if (step === "intro") {
    return (
      <PostureAssessmentLanding
        hasReports={savedReports.length > 0}
        onClose={onClose}
        onShowHistory={onShowHistory}
        onStart={onOpenCamera}
      />
    );
  }

  if (step === "history") {
    return (
      <PostureHistoryScreen
        onBack={onClose}
        onDeleteReport={onDeleteSavedReport}
        onOpenReport={onOpenSavedReport}
        onSetTrainerVisibility={onSetTrainerVisibility}
        onStart={onOpenCamera}
        reports={savedReports}
      />
    );
  }

  if (
    autoCaptureProgress !== undefined &&
    (step === "front" || step === "side" || step === "back")
  ) {
    return (
      <PostureAutoCaptureScreen
        activeView={activeView}
        analysis={liveAnalysis}
        autoCaptureProgress={autoCaptureProgress}
        cameraStatus={cameraStatus}
        canvasRef={canvasRef}
        captureCount={captureCount}
        captureFlash={captureFlash}
        capturedView={capturedView}
        coachCue={coachCue}
        frameReadiness={frameReadiness ?? evaluateWebPostureFrame(keypoints, activeView, videoRef.current?.videoWidth, videoRef.current?.videoHeight)}
        onCapture={onCapture}
        onClose={onClose}
        onRestart={onRetake}
        onVoiceToggle={onVoiceToggle}
        onZoomChange={onZoomChange}
        poseStatus={poseStatus}
        scanGuidance={scanGuidance}
        score={postureScore}
        selectedShen={selectedShen}
        videoRef={videoRef}
        voiceEnabled={voiceEnabled}
        zoom={zoom}
      />
    );
  }

  if (step === "captured" && report) {
    return (
      <PostureCaptureReadyScreen
        onClose={onClose}
        onComplete={onCompleteAnalysis ?? (() => undefined)}
        onRetake={onRetake}
        report={report}
      />
    );
  }

  if (step === "processing" && report) {
    return <PostureProcessingScreen report={report} />;
  }

  if (step === "result" && report) {
    return (
      <PostureResultDashboard
        onClose={onClose}
        onRetake={onRetake}
        onSave={onSaveReport}
        report={report}
        reportIsSaved={reportIsSaved}
        selectedShen={selectedShen}
      />
    );
  }

  return (
    <section className="screen posture-assessment-screen posture-analysis-screen">
      <div className="posture-analysis-shell">
        <header className="posture-analysis-topbar">
          <button className="posture-back-button" onClick={onClose} type="button" aria-label="Postür analizinden çık">
            ‹
          </button>
          <div>
            <h1>Postür Analizi</h1>
            <p>Tai Chi 24 Form - Hareket 3</p>
          </div>
          <button className="posture-save-button" disabled={autoCaptureProgress !== undefined || !canCapture} onClick={onCapture} type="button">
            {autoCaptureProgress !== undefined ? "Otomatik Çekim" : `${activeLabel} Kaydet`}
            <span aria-hidden="true">{autoCaptureProgress !== undefined ? "●" : "↓"}</span>
          </button>
        </header>

        <div className="posture-analysis-grid">
          <PostureScorePanel analysis={liveAnalysis} ready={postureReady} score={postureScore} selectedShen={selectedShen} />

          <main className="posture-analysis-stage-card">
            <div className="posture-stage-tabs" aria-label="Postür kayıt adımları">
              {([
                ["front", "Ön Görünüm"],
                ["side", "Yan Görünüm"],
                ["back", "Arka Görünüm"],
              ] as const).map(([item, label]) => (
                <button
                  className={`${activeView === item ? "posture-tab-active" : ""} ${captures[item] ? "posture-tab-done" : ""}`}
                  key={item}
                  onClick={() => onViewChange(item)}
                  disabled={autoCaptureProgress !== undefined}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="posture-camera-full posture-analysis-stage">
              <video
                className={`camera-preview ${cameraStatus === "ready" ? "camera-preview-active" : ""}`}
                muted
                playsInline
                ref={videoRef}
              />
              <canvas className="camera-pose-canvas" ref={canvasRef} />
              <PostureCaptureFlash visible={captureFlash} capturedView={capturedView} />
              {cameraStatus === "ready" || cameraStatus === "requesting" ? (
                <div className="camera-overlay posture-analysis-overlay">
                  <div className="scan-frame posture-scan-frame" />
                  <div className="camera-pill">{cameraStatus === "requesting" ? "Kamera izni bekleniyor" : getCameraStatus(cameraStatus, "calibrate")}</div>
                  <div className="pose-pill">{getPoseStatusText(poseStatus)}</div>
                  <div className="distance-pill">Baş, eller ve ayaklar kadrajda</div>
                </div>
              ) : null}
              {cameraStatus !== "ready" && cameraStatus !== "requesting" ? (
                <div className="posture-camera-placeholder posture-analysis-placeholder">
                  <span className="eyebrow">Postür Kurulumu</span>
                  <h2>Laptop ekranını sabitle ve kameraya tam karşıdan bak.</h2>
                  <p>Ön, yan ve arka görünümden ayrı kayıt alacağız. Bu ekran teşhis değil; postür gelişimini takip eden bir ayna.</p>
                  <button className="posture-placeholder-action" onClick={onOpenCamera} type="button">
                    Kamerayı Aç
                  </button>
                  <PostureSkeleton2D analysis={liveAnalysis} selectedShen={selectedShen} view={activeView} />
                </div>
              ) : null}
              {cameraStatus === "ready" ? (
                <div className="posture-quality-legend">
                  <span><i className="legend-good" /> İyi {getPostureQualityCounts(liveAnalysis).good}</span>
                  <span><i className="legend-mid" /> Orta {getPostureQualityCounts(liveAnalysis).mid}</span>
                  <span><i className="legend-fix" /> Düzelt {getPostureQualityCounts(liveAnalysis).fix}</span>
                </div>
              ) : null}
              {cameraStatus === "ready" && autoCaptureProgress !== undefined ? (
                <div className="posture-auto-capture-card">
                  <div
                    className="posture-auto-capture-ring"
                    style={{ "--capture-progress": `${Math.max(2, autoCaptureProgress) * 3.6}deg` } as CSSProperties}
                  >
                    <strong>{autoCaptureProgress >= 100 ? "✓" : Math.max(1, Math.ceil(3 - autoCaptureProgress / (100 / 3)))}</strong>
                  </div>
                  <span>{poseStatus === "aktif" ? autoCaptureInstruction : "Tam bedenini kadraja al"}</span>
                  <small>{autoCaptureProgress >= 100 ? "Görüntü alındı" : "3 saniye sabit durunca otomatik çekilecek"}</small>
                </div>
              ) : null}
              <button className="posture-stage-mode-button" onClick={() => onModeChange(mode === "3d" ? "2d" : "3d")} type="button">
                {mode.toUpperCase()}
              </button>
            </div>

            <div className="posture-stage-controls">
              {autoCaptureProgress === undefined ? (
                <button className="posture-play-button" onClick={onCapture} disabled={!canCapture} type="button">
                  {activeLabel} Görünümü Al
                </button>
              ) : null}
              <div className="posture-stage-progress">
                <span>{captureCount}/3 görünüm</span>
                <i>
                  <b style={{ width: `${Math.max(8, ((captureCount + (autoCaptureProgress ?? 0) / 100) / 3) * 100)}%` }} />
                </i>
                <small>{`${activeLabel} kayıt`}</small>
              </div>
              <button className="posture-minor-button" onClick={onClose} type="button">
                Kapat
              </button>
            </div>
          </main>

          <PostureFeedbackPanel analysis={liveAnalysis} guidanceText={guidanceText} ready={postureReady} selectedShen={selectedShen} view={activeView} />
        </div>

        <PostureInsightStrip analysis={liveAnalysis} ready={postureReady} selectedShen={selectedShen} />
      </div>
    </section>
  );
}





function HumanMap({
  selectedShen,
  sidePanel,
}: {
  selectedShen: (typeof fiveShen)[number];
  sidePanel?: ReactNode;
}) {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(selectedShen.mapStage);
  const [gateInfoOpen, setGateInfoOpen] = useState(false);
  const activeStage = neijingStages[activeStageIndex] ?? neijingStages[selectedShen.mapStage];
  const currentGateIndex = selectedShen.mapStage;
  const mapProgress = Math.round(((currentGateIndex + 1) / neijingStages.length) * 100);
  const personalFeedback = getPersonalMapFeedback(activeStage, selectedShen, activeStageIndex, true);
  const activeGateTone = activeStage.shenId ? getShenById(activeStage.shenId) : selectedShen;

  useEffect(() => {
    setActiveStageIndex(selectedShen.mapStage);
    setGateInfoOpen(false);
  }, [selectedShen.mapStage]);

  function selectStage(index: number, openInfo = true) {
    setActiveStageIndex(index);
    if (openInfo) {
      setGateInfoOpen(true);
    }
  }

  function moveGate(direction: 1 | -1) {
    const nextIndex = (activeStageIndex + direction + neijingStages.length) % neijingStages.length;
    selectStage(nextIndex);
  }

  return (
    <>
    <div className="glass-card human-map-card neijing-card cut-safe-card">
      <div className="section-heading cut-safe-heading" style={{ margin: "0 0 12px" }}>
        <h2>8 Kapılı Beden Haritan</h2>
        <span>Şu anki kapın · {selectedShen.mapTitle}</span>
      </div>
      <div className="neijing-map-shell neijing-map-shell-with-panel">
        <div
          className="neijing-map"
          aria-label={`Sekiz kapılı beden haritası. Şu anki kapın ${selectedShen.mapTitle}`}
          style={
            {
              "--journey-progress": `${mapProgress}%`,
            } as CSSProperties
          }
        >
          <NextImage
            alt="Bedenin iç dünyasını ve sekiz kapıyı gösteren özgün insan haritası"
            className="neijing-map-image"
            fill
            priority
            sizes="(min-width: 1024px) 460px, (min-width: 700px) 55vw, 340px"
            src="/images/neijing-map.jpg"
          />
          <div className="neijing-current-gate-badge" aria-live="polite">
            <span>ŞU ANKİ KAPIN</span>
            <strong>{selectedShen.mapTitle}</strong>
            <small>{selectedShen.dailyName}</small>
          </div>
          {neijingStages.map((stage, index) => (
            <div key={stage.title}>
              <button
                aria-label={`${stage.title} bölgesini seç`}
                aria-current={currentGateIndex === index ? "step" : undefined}
                className={`neijing-hotspot ${activeStageIndex === index ? "neijing-hotspot-active" : ""} ${currentGateIndex === index ? "neijing-hotspot-current" : ""}`}
                onClick={() => selectStage(index)}
                style={{ left: `${stage.x}%`, top: `${stage.y}%` }}
                type="button"
              >
                {index + 1}
              </button>
            </div>
          ))}
          <div className="neijing-map-hint">Bir kapıya dokun · açıklamasını aç</div>
          {gateInfoOpen ? (
            <div className="gate-info-card" role="dialog" aria-label={`${activeStage.title} bilgileri`}>
              <div className="gate-info-topline">
                <span className="eyebrow">Kapı {activeStageIndex + 1}</span>
                <button className="gate-info-close" onClick={() => setGateInfoOpen(false)} type="button" aria-label="Kapı bilgisini kapat">
                  ×
                </button>
              </div>
              <div className="gate-info-title-row">
                <div>
                  <h3>{activeStage.title}</h3>
                  <p>{activeGateTone.dailyName} · {activeGateTone.name}</p>
                </div>
                <strong>{activeStage.reward}</strong>
              </div>
              <p className="gate-info-text">{activeStage.text}</p>
              <div className="gate-benefit-grid">
                {activeStage.benefits.map((benefit) => (
                  <span key={benefit}>{benefit}</span>
                ))}
              </div>
              <div className="gate-life-note">
                <span>Günlük hayatta</span>
                <p>{activeStage.dailyUse}</p>
              </div>
              <div className="gate-life-note gate-practice-note">
                <span>Mini pratik</span>
                <p>{activeStage.microPractice}</p>
              </div>
              <div className="gate-info-actions">
                <button className="secondary-action compact-action" onClick={() => moveGate(-1)} type="button">
                  Önceki
                </button>
                <button className="primary-action compact-action" onClick={() => moveGate(1)} type="button">
                  Sonraki Kapı
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="neijing-side-stack">
          {sidePanel}
          <div className="human-map-copy neijing-copy">
            <div className="neijing-detail-head">
              <span className="eyebrow">{activeStageIndex === currentGateIndex ? "Şu an bulunduğun kapı" : "İncelediğin kapı"}</span>
              <span className="neijing-reward">{activeStage.reward}</span>
            </div>
            <div className="item-title">{activeStage.title}</div>
            <div className="map-journey-strip">
              <span>Şu an</span>
              <strong>{currentGateIndex + 1}</strong>
              <span>incelediğin</span>
              <strong>{activeStageIndex + 1}</strong>
            </div>
            <div className="item-subtitle">{personalFeedback}</div>
            <div className={`map-reveal-note ${activeStageIndex === currentGateIndex ? "map-reveal-note-open" : ""}`}>
              {activeStageIndex === currentGateIndex
                ? `Bugün ${selectedShen.dailyName} seni bu kapıya getiriyor. Altın halkalı işaret haritadaki mevcut konumun.`
                : `Şu anki kapın ${selectedShen.mapTitle}. Bu alanı bilgi edinmek için inceliyorsun; altın halkalı işaret mevcut konumunu gösterir.`}
            </div>
            <div className="map-progress-meta">
              <span>İncelenen kapı {activeStageIndex + 1} / {neijingStages.length}</span>
              <strong>Mevcut kapı {currentGateIndex + 1}</strong>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${mapProgress}%` }} />
            </div>
            <button className="secondary-action map-action" onClick={() => selectStage((activeStageIndex + 1) % neijingStages.length)} type="button">
              Sonraki Kapı
            </button>
          </div>
        </div>
      </div>
    </div>
    <MeridianExplorer accent={selectedShen.color} />
    </>
  );
}

function getPersonalMapFeedback(stage: NeijingStage, selectedShen: (typeof fiveShen)[number], stageIndex: number, bodyRevealed: boolean) {
  const tone = stage.shenId ? getShenById(stage.shenId) : selectedShen;
  const nextStep = stageIndex < neijingStages.length - 1 ? neijingStages[stageIndex + 1]?.title : "üst kapı";
  const gateCue = stageIndex <= selectedShen.mapStage
    ? "Bu kapıda gereken temel beceriyi kazanmış görünüyorsun."
    : "Bu kapı henüz hazırlık istiyor; önce nefes, ritim ve dikkat hattını sakinleştir.";

  if (!bodyRevealed) {
    return `${gateCue} Bugünkü ${selectedShen.dailyName} içinde ${tone.label.toLocaleLowerCase("tr-TR")} becerisi üzerinden ilerliyorsun. Geleneksel karşılığı: ${selectedShen.name}. Bir sonraki geçiş: ${nextStep}.`;
  }

  return `${gateCue} ${stage.text} Artık bu kapının bedenindeki karşılığını da görüyorsun. Bugünkü ${selectedShen.dailyName}, 5 Shen içinde ${selectedShen.name} hattına denk geliyor. Bir sonraki geçiş: ${nextStep}.`;
}


function FiveShenJourneyWeb({
  activities,
  onNavigate,
  onSelectCoach,
  onSelectShen,
  reflections,
  savedSentences,
  selectedShenId,
  selectedCoachId,
  setActivities,
  setReflections,
  setSavedSentences,
  userName,
}: {
  activities: ShenActivity[];
  onNavigate: (tab: TabId) => void;
  onSelectCoach: (coachId: AiCoach["id"]) => void;
  onSelectShen: (id: DomainShenId) => void;
  reflections: DomainReflectionEntry[];
  savedSentences: SavedMasterSentence[];
  selectedShenId: DomainShenId;
  selectedCoachId: AiCoach["id"];
  setActivities: Dispatch<SetStateAction<ShenActivity[]>>;
  setReflections: Dispatch<SetStateAction<DomainReflectionEntry[]>>;
  setSavedSentences: Dispatch<SetStateAction<SavedMasterSentence[]>>;
  userName: string;
}) {
  const [selected, setSelected] = useState<DomainShenId>(selectedShenId);
  const [view, setView] = useState<"overview" | "map" | "journey" | "directions" | "guides" | "detail" | "notebook">("map");
  const [directionIndex, setDirectionIndex] = useState(0);
  const [reflectionText, setReflectionText] = useState("");
  const [feeling, setFeeling] = useState("");
  const [sentenceFilter, setSentenceFilter] = useState<"all" | DomainShenId>("all");
  const progresses = useMemo(() => shenProfiles.map((profile) => calculateShenProgress(activities, profile.id)), [activities]);
  const profile = getShenProfile(selected);
  const selectedMapShen = getShenById(selected === "xin" ? "shen" : selected);
  const progress = progresses.find((item) => item.shenId === selected) ?? progresses[0];
  const practices = getPracticeForShen(selected);
  const practice = practices[0];
  const question = getQuestionForShen(selected, reflections.length);
  const sentence = getMasterSentence(selected, progress.completedPractices);
  const breathing = breathingPatterns.find((item) => item.id === practice.breathingPatternId);
  const atmosphere = soundAtmospheres.find((item) => item.id === profile.soundAtmosphereId);
  const activeDirection = baguaDirections[directionIndex] ?? baguaDirections[0];
  const recommendedDirectionIndex = Math.max(0, shenProfiles.findIndex((item) => item.id === selected)) % baguaDirections.length;
  const journeyCoach = aiCoaches.find((item) => item.id === selectedCoachId) ?? aiCoaches[0];
  const goals = progressGoals.filter((item) => item.shenId === selected);
  const savedSentenceItems = savedSentences
    .map((record) => ({ record, sentence: masterSentences.find((item) => item.id === record.masterSentenceId) }))
    .filter((item) => item.sentence && (sentenceFilter === "all" || item.sentence.shenId === sentenceFilter));
  const select = (id: DomainShenId) => {
    setSelected(id);
    onSelectShen(id);
  };
  const saveSentence = () => {
    if (savedSentences.some((item) => item.masterSentenceId === sentence.id)) return;
    setSavedSentences((current) => {
      const next = [{ id: `saved-${Date.now()}`, masterSentenceId: sentence.id, savedAt: new Date().toISOString(), practiceId: practice.id }, ...current];
      window.localStorage.setItem("shibashi-master-sentences", JSON.stringify(next));
      return next;
    });
  };
  const saveReflection = () => {
    if (!reflectionText.trim() && !feeling) return;
    const createdAt = new Date().toISOString();
    setActivities((current) => {
      const next = [{ id: `activity-reflection-${Date.now()}`, shenId: selected, type: "reflection" as const, createdAt, practiceId: practice.id }, ...current];
      window.localStorage.setItem("shibashi-shen-activities", JSON.stringify(next));
      return next;
    });
    setReflections((current) => {
      const next = [{
        id: `reflection-${Date.now()}`,
        userId: "local-web-user",
        shenId: selected,
        practiceId: practice.id,
        questionId: question.id,
        responseText: reflectionText.trim() || undefined,
        selectedFeeling: feeling || undefined,
        masterSentenceId: sentence.id,
        createdAt,
      }, ...current];
      window.localStorage.setItem("shibashi-shen-reflections", JSON.stringify(next));
      return next;
    });
    setReflectionText("");
    setFeeling("");
  };

  if (view === "map") {
    return (
      <section className="screen shen-journey-screen journey-framework-screen">
        <header className="shen-journey-header">
          <div><span className="eyebrow">Haritan · Sekiz beden kapısı</span><h1>Bedenindeki kapıları gör.</h1><p>Kapılara dokun; beden bölgesini, günlük karşılığını ve mini pratiğini aç. Altın halka şu an bulunduğun kapıyı gösterir.</p></div>
          <button className="secondary-action" onClick={() => setView("overview")} type="button">Kişisel pusulaya geç</button>
        </header>
        <HumanMap selectedShen={selectedMapShen} />
      </section>
    );
  }

  if (view === "overview") {
    return (
      <section className="screen shen-journey-screen journey-framework-screen">
        <header className="journey-framework-hero">
          <span className="eyebrow">Kişisel pusulan</span>
          <h1>Önce halini tanı. Sonra yönünü seç. Rehberinle yürü.</h1>
          <p>Üç kadim anlatı, üç ayrı soru. Terimleri bilmek zorunda değilsin; bugün ihtiyacın olan yerden başlayabilirsin.</p>
        </header>
        <div className="journey-framework-flow" aria-label="İç durumdan rehberliğe üç aşamalı yolculuk">
          <button className="journey-framework-card journey-framework-card-map" onClick={() => setView("map")} style={{ "--journey-accent": profile.primaryColor } as CSSProperties} type="button">
            <span className="journey-framework-number">00</span><span className="journey-framework-symbol">身</span>
            <small>BEDEN HARİTAN</small><h2>8 Kapı</h2><p>Bedenimde şu an hangi kapı açık?</p>
            <strong>{selectedMapShen.mapTitle}</strong><em>Haritayı aç →</em>
          </button>
          <span className="journey-framework-connector" aria-hidden="true">→</span>
          <button className="journey-framework-card journey-framework-card-shen" onClick={() => setView("journey")} style={{ "--journey-accent": profile.primaryColor } as CSSProperties} type="button">
            <span className="journey-framework-number">01</span><span className="journey-framework-symbol">神</span>
            <small>İÇ DÜNYA</small><h2>5 Shen</h2><p>Şu an içimde ne oluyor?</p>
            <strong>{profile.name} · {profile.shortMeaning}</strong><em>Halini tanı →</em>
          </button>
          <span className="journey-framework-connector" aria-hidden="true">→</span>
          <button className="journey-framework-card journey-framework-card-direction" onClick={() => setView("directions")} style={{ "--journey-accent": activeDirection.accent } as CSSProperties} type="button">
            <span className="journey-framework-number">02</span><span className="journey-framework-symbol">{activeDirection.trigram}</span>
            <small>YÖN VE EYLEM</small><h2>8 Yön · Bagua</h2><p>Bugün nereye yönelmeliyim?</p>
            <strong>{activeDirection.title} · {activeDirection.module}</strong><em>Yönünü seç →</em>
          </button>
          <span className="journey-framework-connector" aria-hidden="true">→</span>
          <button className="journey-framework-card journey-framework-card-guide" onClick={() => setView("guides")} type="button">
            <span className="journey-framework-number">03</span><span className="journey-framework-symbol">八仙</span>
            <small>HİKÂYE VE REHBERLİK</small><h2>8 Ölümsüz</h2><p>Bu yolda hangi ses bana iyi gelir?</p>
            <strong>{journeyCoach.name} · {journeyCoach.role}</strong><em>Rehberini seç →</em>
          </button>
        </div>
        <article className="journey-today-synthesis">
          <div><span className="eyebrow">Bugünkü birleşimin</span><h2>{profile.name} iç dünyan · {activeDirection.title} yönün · {journeyCoach.name} rehberin</h2></div>
          <button className="primary-action" onClick={() => onNavigate("practice")} type="button">Bu birleşimle pratiğe başla →</button>
        </article>
        <p className="journey-framework-note">Bu üç gelenek tarihsel olarak bire bir eşleştirilmiş tek bir sistem değildir. Shibashi EFE onları iç durum, yön ve rehberlik katmanları olarak birlikte kullanır.</p>
      </section>
    );
  }

  if (view === "directions") {
    return (
      <section className="screen shen-journey-screen journey-framework-screen">
        <header className="shen-journey-header"><div><span className="eyebrow">02 · Yön ve eylem</span><h1>8 Yön · Bagua</h1><p>Sekiz trigram, değişimin sekiz niteliğini anlatır. Bugün harekete geçmek istediğin yönü seç.</p></div><button className="secondary-action" onClick={() => setView("overview")} type="button">Pusulaya dön</button></header>
        <div className="bagua-layout">
          <div className="bagua-stage" style={{ "--bagua-accent": activeDirection.accent } as CSSProperties}><BaguaWheel activeDirection={activeDirection} activeIndex={directionIndex} recommendedIndex={recommendedDirectionIndex} onSelect={setDirectionIndex} /></div>
          <aside className="bagua-insight-panel"><span className="eyebrow">Seçtiğin yön</span><h2>{activeDirection.trigram} {activeDirection.name} · {activeDirection.title}</h2><p>{activeDirection.cue}</p><div className="bagua-energy-strip"><div><span>İç durumun</span><strong>{profile.name}</strong></div><div><span>Çalışma alanın</span><strong>{activeDirection.module}</strong></div></div><button className="bagua-primary-action" onClick={() => onNavigate(activeDirection.tab)} type="button">{activeDirection.module} alanına geç <span>→</span></button><small className="journey-term-note">“8 Yön”, Bagua’nın sekiz trigramından gelir. Beden Haritası ise uygulamanın ayrı çalışma modelidir.</small></aside>
        </div>
      </section>
    );
  }

  if (view === "guides") {
    return <section className="screen shen-journey-screen journey-framework-screen"><header className="shen-journey-header"><div><span className="eyebrow">03 · Hikâye ve rehberlik</span><h1>8 Ölümsüz · Sekiz rehberlik tonu</h1><p>Daoist anlatıların sekiz efsanevi figüründen ilham alan rehberler, pratiğin dilini ve ritmini kişiselleştirir.</p></div><button className="secondary-action" onClick={() => setView("overview")} type="button">Pusulaya dön</button></header><JourneyGuideSelector onSelectCoach={onSelectCoach} selectedCoach={journeyCoach} selectedCoachId={selectedCoachId} /><p className="journey-framework-note">Bu karakterler tanı veya kader belirlemez; geleneksel anlatılardan uyarlanmış pratik eşlikçileridir.</p></section>;
  }

  if (view === "notebook") {
    return (
      <section className="screen shen-journey-screen">
        <header className="shen-journey-header">
          <div><span className="eyebrow">Ustanın Defteri</span><h1>Yanında taşımak istediğin cümleler.</h1></div>
          <button className="secondary-action" onClick={() => setView("journey")} type="button">Yolculuğa dön</button>
        </header>
        <div className="master-filter-row">
          <button className={sentenceFilter === "all" ? "active" : ""} onClick={() => setSentenceFilter("all")} type="button">Tümü</button>
          {shenProfiles.map((item) => <button className={sentenceFilter === item.id ? "active" : ""} key={item.id} onClick={() => setSentenceFilter(item.id)} type="button">{item.name}</button>)}
        </div>
        <div className="master-notebook-grid">
          {savedSentenceItems.length ? savedSentenceItems.map(({ record, sentence: saved }) => (
            <article className="master-notebook-card" key={record.id}>
              <small>{new Date(record.savedAt).toLocaleDateString("tr-TR")} · {saved?.shenId === "xin" ? "Shen" : saved?.shenId}</small>
              <blockquote>“{saved?.text}”</blockquote>
              <button onClick={() => setSavedSentences((current) => {
                const next = current.filter((item) => item.id !== record.id);
                window.localStorage.setItem("shibashi-master-sentences", JSON.stringify(next));
                return next;
              })} type="button">Defterden çıkar</button>
            </article>
          )) : <div className="empty-state-card">Defterin henüz sessiz. Pratik sonunda bir cümleyi buraya ekleyebilirsin.</div>}
        </div>
      </section>
    );
  }

  if (view === "detail") {
    return (
      <section className="screen shen-journey-screen">
        <header className="shen-journey-header">
          <div><span className="eyebrow">Beş Shen detayı</span><h1>{profile.name} · {profile.shortMeaning}</h1><p>{profile.description}</p></div>
          <button className="secondary-action" onClick={() => setView("journey")} type="button">Beş alana dön</button>
        </header>
        <div className="shen-detail-layout">
          <article className="shen-detail-primary" style={{ "--shen-detail-accent": profile.primaryColor } as CSSProperties}>
            <span className="eyebrow">Bugünkü pratik</span><h2>{practice.title}</h2><p>{practice.description}</p>
            <div className="shen-detail-tags">{practice.movementQualityIds.map((item) => <span key={item}>{item}</span>)}</div>
            <button className="primary-action" onClick={() => onNavigate("practice")} type="button">Pratiği başlat →</button>
          </article>
          <div className="shen-detail-grid">
            <Info title="Nefes ritmi" body={breathing?.instruction ?? ""} />
            <Info title="Hareket kalitesi" body={profile.movementQualities.join(" · ")} />
            <Info title="Günlük sorusu" body={question.text} />
            <Info title="Ses atmosferi" body={`${atmosphere?.name ?? ""} · Katman kaynakları placeholder`} />
            <Info title="30 günlük gelişim" body={`${getProgressLabel(progress)} · ${progress.completedPractices} pratik · ${progress.practiceMinutes} dakika`} />
            <Info title="Tamamlanan pratikler" body={progress.completedPractices ? `${progress.completedPractices} kayıt` : "İlk kayıt için bugünkü pratiği başlat."} />
          </div>
          <div className="shen-goals-panel"><span className="eyebrow">İlerleme hedefleri</span>{goals.map((goal) => <div key={goal.id}><strong>{goal.title}</strong><small>{goal.description}</small></div>)}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen shen-journey-screen">
      <header className="shen-journey-header">
        <div><span className="eyebrow">01 · İç dünya</span><h1>{userName || "Sen"}, şu an içinde ne oluyor?</h1><p>5 Shen, zihinsel ve duygusal işleyişini beş ayrı pencereden fark etmene yardım eder. {getShenRecommendation([...progresses])}</p></div>
        <div className="journey-header-actions"><button className="secondary-action" onClick={() => setView("overview")} type="button">Pusulaya dön</button><button className="secondary-action" onClick={() => setView("notebook")} type="button">Ustanın Defteri</button></div>
      </header>
      <div className="shen-journey-rail">
        {shenProfiles.map((item) => {
          const itemProgress = progresses.find((value) => value.shenId === item.id)!;
          return <button className={item.id === selected ? "active" : ""} key={item.id} onClick={() => select(item.id)} style={{ "--shen-card-accent": item.primaryColor } as CSSProperties} type="button"><strong>{item.name}</strong><span>{item.shortMeaning}</span><small>{getProgressLabel(itemProgress)}</small></button>;
        })}
      </div>
      <div className="shen-journey-main">
        <article className="shen-journey-focus" style={{ "--shen-card-accent": profile.primaryColor } as CSSProperties}>
          <span className="eyebrow">Bugünün alanı</span><h2>{profile.name} · {profile.shortMeaning}</h2><p>{profile.description}</p>
          <div className="shen-progress-line"><span>{getProgressLabel(progress)}</span><b style={{ width: `${Object.values(progress.dimensions).reduce((a, b) => a + b, 0) / 6}%` }} /></div>
          <div className="shen-progress-mini"><div><strong>{progress.completedPractices}</strong><span>pratik</span></div><div><strong>{progress.practiceMinutes}</strong><span>dakika</span></div><div><strong>{progress.reflectionCount}</strong><span>yansıma</span></div></div>
          <button className="secondary-action" onClick={() => setView("detail")} type="button">Alanı ayrıntılı aç</button>
        </article>
        <div className="shen-journey-stack">
          <article className="shen-practice-card"><span className="eyebrow">Önerilen pratik</span><h3>{practice.title}</h3><p>{practice.durationMinutes} dk · {practice.movementQualityIds.join(" · ")}</p><button onClick={() => onNavigate("practice")} type="button">Bugünkü pratiği başlat →</button></article>
          <article className="master-sentence-card"><span className="eyebrow">Ustadan bir cümle</span><blockquote>“{sentence.text}”</blockquote><button onClick={saveSentence} type="button">{savedSentences.some((item) => item.masterSentenceId === sentence.id) ? "Defterinde ✓" : "Defterime ekle"}</button></article>
        </div>
      </div>
      <div className="shen-reflection-card">
        <div><span className="eyebrow">Bugünün sorusu</span><h3>{question.text}</h3><div className="feeling-row">{["Daha açık", "Daha sakin", "Daha merkezde", "Daha hafif", "Hâlâ gergin", "Enerjik", "Sessiz"].map((item) => <button className={feeling === item ? "active" : ""} key={item} onClick={() => setFeeling(item)} type="button">{item}</button>)}</div></div>
        <div><textarea onChange={(event) => setReflectionText(event.target.value)} placeholder="Tek cümle yeterli…" value={reflectionText} /><button className="primary-action" onClick={saveReflection} type="button">Yansımayı kaydet</button></div>
      </div>
    </section>
  );
}

function Info({ body, title }: { body: string; title: string }) {
  return <article className="shen-info-card"><span>{title}</span><p>{body}</p></article>;
}

const baguaDirections = [
  { id: "qian", trigram: "☰", name: "Qian", title: "Gök", module: "AI Koç", tab: "practice" as TabId, cue: "Vizyonunu netleştir; rehberinle bugünün pratiğini seç.", accent: "#f3cf8b", image: "/images/shen-universe.jpg" },
  { id: "dui", trigram: "☱", name: "Dui", title: "Göl", module: "Paylaşım", tab: "journal" as TabId, cue: "Deneyimini adlandır; bugünün yansımasını kaydet.", accent: "#d9bd80", image: "/images/shen-river-yi.jpg" },
  { id: "li", trigram: "☲", name: "Li", title: "Ateş", module: "Pratik", tab: "practice" as TabId, cue: "Canlılığı harekete geçir; kısa bir Shibashi akışı başlat.", accent: "#ff7a18", image: "/images/shen-mode-hun.jpg" },
  { id: "zhen", trigram: "☳", name: "Zhen", title: "Gök Gürültüsü", module: "Postür", tab: "posture" as TabId, cue: "Uyan ve hizalan; beden eksenini yeniden kontrol et.", accent: "#f4a340", image: "/images/shen-river-hun.jpg" },
  { id: "xun", trigram: "☴", name: "Xun", title: "Rüzgâr", module: "Günlük", tab: "journal" as TabId, cue: "İçgörünün sessizce yayılmasına izin ver; bir reflection yaz.", accent: "#79d6ad", image: "/images/shen-mode-yi.jpg" },
  { id: "kan", trigram: "☵", name: "Kan", title: "Su", module: "Nefes", tab: "practice" as TabId, cue: "Akışı zorlamadan sürdür; nefes ritmine dön.", accent: "#5eb7d8", image: "/images/shen-river-zhi.jpg" },
  { id: "gen", trigram: "☶", name: "Gen", title: "Dağ", module: "Denge", tab: "posture" as TabId, cue: "Dur, köklen ve merkezini dinle; postür taraması yap.", accent: "#b6a982", image: "/images/shen-mode-po.jpg" },
  { id: "kun", trigram: "☷", name: "Kun", title: "Toprak", module: "Toparlanma", tab: "home" as TabId, cue: "Temele dön; bugünkü enerjini ve ritmini gözden geçir.", accent: "#c89962", image: "/images/inner-gate-path.png" },
] as const;

function BaguaWheel({
  activeDirection,
  activeIndex,
  onSelect,
  recommendedIndex,
}: {
  activeDirection: (typeof baguaDirections)[number];
  activeIndex: number;
  onSelect: (index: number) => void;
  recommendedIndex: number;
}) {
  return (
    <div className="bagua-v2-wheel-shell" style={{ "--bagua-v2-accent": activeDirection.accent } as CSSProperties}>
      <div className="bagua-v2-orbit bagua-v2-orbit-outer" aria-hidden="true" />
      <div className="bagua-v2-orbit bagua-v2-orbit-inner" aria-hidden="true" />
      <div className="bagua-v2-rotor" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="bagua-v2-disc" role="img" aria-label="Sekiz yönlü hareketli Bagua çarkı">
        <div className="bagua-v2-sector-glow" aria-hidden="true" />
        {baguaDirections.map((direction, index) => {
          const angle = index * 45 - 90;
          const radians = (angle * Math.PI) / 180;
          const orbitRadius = 39;
          return (
            <button
              aria-label={`${direction.name} ${direction.title}: ${direction.module}`}
              className={`bagua-v2-node ${index === activeIndex ? "is-active" : ""} ${index === recommendedIndex ? "is-recommended" : ""}`}
              key={direction.id}
              onClick={() => onSelect(index)}
              style={{
                left: `${50 + Math.cos(radians) * orbitRadius}%`,
                top: `${50 + Math.sin(radians) * orbitRadius}%`,
                "--node-accent": direction.accent,
              } as CSSProperties}
              type="button"
            >
              <span className="bagua-v2-node-inner">
                <strong>{direction.trigram}</strong>
                <small>{direction.name}</small>
                <em>{direction.title}</em>
              </span>
            </button>
          );
        })}
        <div className="bagua-v2-center">
          <span>☯</span>
          <small>{activeDirection.name} · {activeDirection.title}</small>
          <strong>{activeDirection.module}</strong>
          <em>Seçili yön</em>
        </div>
      </div>
      <div className="bagua-v2-pointer" aria-hidden="true" />
    </div>
  );
}

function JourneyGuideSelector({
  onSelectCoach,
  selectedCoach,
  selectedCoachId,
}: {
  onSelectCoach: (coachId: AiCoach["id"]) => void;
  selectedCoach: AiCoach;
  selectedCoachId: AiCoach["id"];
}) {
  type GuideMessage = { id: string; from: "coach" | "user"; text: string };
  const dialogue=coachDialogues[selectedCoach.id];
  const [input,setInput]=useState("");
  const [messages,setMessages]=useState<GuideMessage[]>([{id:"intro",from:"coach",text:dialogue.intro}]);
  useEffect(()=>setMessages([{id:`intro-${selectedCoach.id}`,from:"coach",text:dialogue.intro}]),[dialogue.intro,selectedCoach.id]);
  const send=(text:string,intent?:CoachIntent)=>{
    const clean=text.trim();if(!clean)return;
    const reply=dialogue.lines[intent??inferCoachIntent(clean)];
    const stamp = Date.now();
    const additions: GuideMessage[] = [
      { id: `u-${stamp}`, from: "user", text: clean },
      { id: `c-${stamp}`, from: "coach", text: reply },
    ];
    setMessages(current=>[...current,...additions].slice(-8));
    setInput("");
  };
  const lastCoachMessage=[...messages].reverse().find(item=>item.from==="coach")?.text??dialogue.intro;
  return (
    <div className="glass-card journey-guide-card">
      <div className="journey-guide-hero">
        <span className={`coach-portrait coach-portrait-${selectedCoach.imageIndex}`} />
        <div>
          <span className="eyebrow">Yolculuk Rehberini Seç</span>
          <h2>{selectedCoach.name}</h2>
          <p>{selectedCoach.role}. Seçimin kaydedilir; canlı komutların tonu ve ritmi bundan sonra bu rehberden gelir.</p>
        </div>
      </div>
      <div className="journey-guide-grid" aria-label="Sekiz Ölümsüz yolculuk rehberi seçimi">
        {aiCoaches.map((coach) => {
          const coachShen = getShenById(coach.shenId);
          return (
            <button
              className={`journey-guide-option ${coach.id === selectedCoachId ? "journey-guide-option-active" : ""}`}
              key={coach.id}
              onClick={() => onSelectCoach(coach.id)}
              style={{ "--shen-card-accent": coachShen.color } as CSSProperties}
              type="button"
            >
              <span className={`coach-portrait coach-portrait-${coach.imageIndex}`} />
              <strong>{coach.name}</strong>
              <small>{coach.role}</small>
            </button>
          );
        })}
      </div>
      <CoachMeridianCard coachId={selectedCoach.id} accent={getShenById(selectedCoach.shenId).color} />
      <div className="journey-guide-chat">
        <div className="journey-guide-chat-head"><span className="eyebrow">REHBERLE KONUŞ</span><button onClick={()=>speakCoach(lastCoachMessage,selectedCoach)} type="button">Sesi dinle ♪</button></div>
        <div className="journey-guide-chat-log">{messages.map(message=><p className={`journey-guide-message journey-guide-message-${message.from}`} key={message.id}>{message.text}</p>)}</div>
        <div className="journey-guide-intents">
          {([["scatter","Bugün dağınığım"],["courage","Cesaret lazım"],["slow","Yavaşlamak istiyorum"],["start","Pratiğe başla"]] as const).map(([id,label])=><button key={id} onClick={()=>send(label,id)} type="button">{label}</button>)}
        </div>
        <form className="journey-guide-input" onSubmit={event=>{event.preventDefault();send(input)}}>
          <input value={input} onChange={event=>setInput(event.target.value)} placeholder="Bugün nasıl hissettiğini yaz…" maxLength={180}/>
          <button type="submit" aria-label="Mesajı gönder">→</button>
        </form>
      </div>
    </div>
  );
}


const energyMetricLearning: Record<string, { summary: string; detail: string }> = {
  Jing: {
    summary: "Bedeninin temel kaynağı ve dayanıklılık rezervi.",
    detail: "Tai Chi dilinde Jing, aceleyle tüketilmeyen öz kaynak gibi düşünülür; dinlenme, köklenme ve düzenli pratikle korunur.",
  },
  Qi: {
    summary: "Nefesinle ve hareketinle dolaşan yaşam enerjisi.",
    detail: "Qi, Tai Chi’de beden, nefes ve niyetin birlikte akmasıdır; yumuşak ve kesintisiz hareket bu akışı destekler.",
  },
  Shen: {
    summary: "Farkındalığın, canlılığın ve iç açıklığın.",
    detail: "Shen, kalbin ve zihnin uyanık tarafıdır; sakin bakış, nefes ve çevrenle kurduğun temasla beslenir.",
  },
};

type EnergyMetricLabel = "Jing" | "Qi" | "Shen";

function getShenById(id: ShenId): (typeof fiveShen)[number] {
  return fiveShen.find((shen) => shen.id === id) ?? fiveShen[1];
}

function getEnergyScores({
  practiceGallery,
  postureReports,
}: {
  completion: number;
  practiceGallery: PracticeSnapshot[];
  postureReports: PostureReport[];
  selectedShen: (typeof fiveShen)[number];
}): EnergyScores {
  const recentPractice = practiceGallery.slice(0, 5);
  const measuredDays = new Set([...practiceGallery.map((item) => item.dateKey), ...postureReports.map((item) => item.dateKey)]);
  const recentDayCount = [...Array(7)].filter((_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return measuredDays.has(formatSnapshotDate(date));
  }).length;

  return {
    jing: postureReports[0]?.score ?? null,
    qi: recentPractice.length ? clampScore(recentPractice.reduce((sum, snapshot) => sum + snapshot.score, 0) / recentPractice.length) : null,
    shen: measuredDays.size ? clampScore((recentDayCount / 7) * 100) : null,
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

type ShenSoundLayer = {
  detune?: number;
  filter: number;
  filterType: BiquadFilterType;
  gain: number;
  pan: number;
  q: number;
  ratio: number;
  wave: OscillatorType;
};

type ShenSoundConfig = {
  layers: ShenSoundLayer[];
  noise: number;
  noiseFrequency: number;
  noiseQ: number;
  swellDepth: number;
  swellRate: number;
  volume: number;
};

function getShenSoundConfig(id: ShenId): ShenSoundConfig {
  const configs: Record<ShenId, ShenSoundConfig> = {
    hun: {
      volume: 0.72,
      swellRate: 0.055,
      swellDepth: 0.42,
      noise: 0.012,
      noiseFrequency: 1400,
      noiseQ: 0.9,
      layers: [
        { wave: "triangle", ratio: 1, detune: -5, gain: 0.12, filter: 1150, filterType: "lowpass", q: 0.72, pan: -0.38 },
        { wave: "sine", ratio: 1.25, detune: 7, gain: 0.08, filter: 1600, filterType: "lowpass", q: 0.6, pan: 0.34 },
        { wave: "sine", ratio: 2, gain: 0.05, filter: 2200, filterType: "bandpass", q: 1.1, pan: 0.12 },
      ],
    },
    shen: {
      volume: 0.68,
      swellRate: 0.038,
      swellDepth: 0.34,
      noise: 0.004,
      noiseFrequency: 900,
      noiseQ: 0.6,
      layers: [
        { wave: "sine", ratio: 1, gain: 0.12, filter: 950, filterType: "lowpass", q: 0.5, pan: -0.14 },
        { wave: "triangle", ratio: 1.5, detune: -4, gain: 0.08, filter: 1200, filterType: "lowpass", q: 0.58, pan: 0.22 },
        { wave: "sine", ratio: 2.5, gain: 0.04, filter: 1800, filterType: "bandpass", q: 0.85, pan: 0.04 },
      ],
    },
    yi: {
      volume: 0.74,
      swellRate: 0.13,
      swellDepth: 0.5,
      noise: 0.006,
      noiseFrequency: 420,
      noiseQ: 1.4,
      layers: [
        { wave: "triangle", ratio: 0.5, gain: 0.13, filter: 520, filterType: "lowpass", q: 1.1, pan: -0.06 },
        { wave: "sine", ratio: 1, gain: 0.09, filter: 850, filterType: "lowpass", q: 0.75, pan: 0.18 },
        { wave: "square", ratio: 1.333, gain: 0.026, filter: 620, filterType: "lowpass", q: 1.8, pan: -0.22 },
      ],
    },
    po: {
      volume: 0.66,
      swellRate: 0.028,
      swellDepth: 0.62,
      noise: 0.022,
      noiseFrequency: 1250,
      noiseQ: 0.45,
      layers: [
        { wave: "sine", ratio: 1, gain: 0.09, filter: 780, filterType: "lowpass", q: 0.42, pan: -0.2 },
        { wave: "sine", ratio: 1.2, detune: 9, gain: 0.07, filter: 1350, filterType: "bandpass", q: 0.74, pan: 0.28 },
        { wave: "triangle", ratio: 0.75, gain: 0.055, filter: 500, filterType: "lowpass", q: 0.6, pan: 0 },
      ],
    },
    zhi: {
      volume: 0.76,
      swellRate: 0.022,
      swellDepth: 0.28,
      noise: 0.018,
      noiseFrequency: 260,
      noiseQ: 0.8,
      layers: [
        { wave: "sine", ratio: 0.5, gain: 0.14, filter: 420, filterType: "lowpass", q: 0.9, pan: -0.12 },
        { wave: "triangle", ratio: 1, detune: -8, gain: 0.09, filter: 620, filterType: "lowpass", q: 0.72, pan: 0.24 },
        { wave: "sine", ratio: 1.5, gain: 0.04, filter: 360, filterType: "bandpass", q: 1.3, pan: 0.02 },
      ],
    },
  };

  return configs[id];
}

function createNoiseSource(context: AudioContext): AudioBufferSourceNode {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.22;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function getPracticeMessage(phase: "ready" | "calibrate" | "live" | "complete"): string {
  const messages = {
    ready: "Beden kadrajını hazırla.",
    calibrate: "Omuzlar ve dizler kalibre ediliyor.",
    live: "Canlı düzeltme seni dinliyor.",
    complete: "Pratik kapandı. Sırada günlük var.",
  };

  return messages[phase];
}

function getCameraStatus(
  status: "idle" | "requesting" | "ready" | "denied" | "unsupported",
  phase: "ready" | "calibrate" | "live" | "complete",
): string {
  if (status === "requesting") return "Kamera izni bekleniyor";
  if (status === "denied") return "Kamera izni verilmedi";
  if (status === "unsupported") return "Bu tarayıcı kamera desteklemiyor";
  if (status === "ready" && phase === "live") return "Canlı pratik aktif";
  if (status === "ready") return "Kamera açık, kalibrasyon hazır";
  return "Kamera kapalı";
}

async function createMoveNetDetector(): Promise<PoseDetector> {
  const { createPoseLandmarker } = await import("@/lib/pose/createPoseLandmarker");
  const landmarker = await createPoseLandmarker();
  let lastTimestamp = 0;

  return {
    dispose: () => landmarker.close(),
    estimatePoses: async (input) => {
      const timestamp = Math.max(performance.now(), lastTimestamp + 0.01);
      lastTimestamp = timestamp;
      const result = landmarker.detectForVideo(input, timestamp);
      const landmarks = result.landmarks[0];
      if (!landmarks?.length) return [];

      return [{
        keypoints: landmarks.map((landmark, index) => ({
          name: mediaPipePoseNames[index],
          score: landmark.visibility ?? 1,
          x: landmark.x * input.videoWidth,
          y: landmark.y * input.videoHeight,
        })),
      }];
    },
  };
}

function syncPoseCanvasSize(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null) {
  if (!canvas || !video || video.videoWidth === 0 || video.videoHeight === 0) return;

  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
  }

  if (canvas.height !== video.videoHeight) {
    canvas.height = video.videoHeight;
  }
}

function drawPoseCanvas(canvas: HTMLCanvasElement | null, pose: Pose | undefined, accent: string, analysis?: PostureAnalysisSnapshot) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!pose?.keypoints?.length) return;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowBlur = 0;
  if (analysis) {
    drawPostureReferenceGuides(context, pose.keypoints, analysis);
    drawPostureQualityConnections(context, pose.keypoints, analysis);
  } else {
    drawPoseConnections(context, pose.keypoints, "#7FB46B");
  }
  if (analysis) drawPostureQualityKeypoints(context, pose.keypoints, analysis);
  else drawPoseKeypoints(context, pose.keypoints, "#A9D977");
  context.restore();
}

function drawPoseConnections(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], accent: string, visibleNames?:Set<string>) {
  context.strokeStyle = colorWithAlpha(accent, 0.82);
  context.lineWidth = 3;

  for (const [startName, endName] of poseConnections) {
    if(visibleNames&&(!visibleNames.has(startName)||!visibleNames.has(endName)))continue;
    const start = findVisiblePosePoint(keypoints, startName);
    const end = findVisiblePosePoint(keypoints, endName);

    if (!start || !end) continue;

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
}

function drawPoseKeypoints(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], accent: string, visibleNames?:Set<string>) {
  for (const keypoint of keypoints) {
    if(visibleNames&&(!keypoint.name||!visibleNames.has(keypoint.name)))continue;
    if (!isVisiblePosePoint(keypoint)) continue;

    context.fillStyle = "rgba(242, 238, 231, 0.88)";
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 7, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = accent;
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 4.4, 0, Math.PI * 2);
    context.fill();
  }
}

function drawPostureQualityKeypoints(
  context: CanvasRenderingContext2D,
  keypoints: PoseKeypoint[],
  analysis: PostureAnalysisSnapshot,
) {
  for (const keypoint of keypoints) {
    if (!keypoint.name || !postureDisplayPoints.has(keypoint.name) || !isVisiblePosePoint(keypoint)) continue;

    const color = getPostureQualityColor(getPosturePointScore(keypoint.name, analysis));

    context.strokeStyle = color;
    context.fillStyle = colorWithAlpha(color, 0.26);
    context.lineWidth = 3;
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 12, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 9, 0, Math.PI * 2);
    context.stroke();
  }
}

function getPosturePointScore(name: string, analysis: PostureAnalysisSnapshot) {
  if (["nose", "left_ear", "right_ear", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist"].includes(name)) return analysis.shoulderScore;
  if (name === "left_hip" || name === "right_hip") return analysis.hipScore;
  return analysis.axisScore;
}

function getPostureQualityColor(score: number) {
  return score >= 70 ? "#72E08C" : "#FF5B57";
}

function drawPostureQualityConnections(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], analysis: PostureAnalysisSnapshot) {
  for (const [startName, endName] of poseConnections) {
    if (!postureDisplayPoints.has(startName) || !postureDisplayPoints.has(endName)) continue;
    const start = findVisiblePosePoint(keypoints, startName);
    const end = findVisiblePosePoint(keypoints, endName);
    if (!start || !end) continue;
    const score = Math.min(getPosturePointScore(startName, analysis), getPosturePointScore(endName, analysis));
    const color = getPostureQualityColor(score);
    context.strokeStyle = colorWithAlpha(color, 0.9);
    context.shadowColor = colorWithAlpha(color, score < 62 ? 0.55 : 0.28);
    context.shadowBlur = score < 62 ? 12 : 6;
    context.lineWidth = score < 62 ? 5 : 4;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
  context.shadowBlur = 0;
}

function drawPostureReferenceGuides(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], analysis: PostureAnalysisSnapshot) {
  const leftAnkle = findVisiblePosePoint(keypoints, "left_ankle");
  const rightAnkle = findVisiblePosePoint(keypoints, "right_ankle");
  const shoulderCenter = getMidpoint(findVisiblePosePoint(keypoints, "left_shoulder"), findVisiblePosePoint(keypoints, "right_shoulder"));
  const hipCenter = getMidpoint(findVisiblePosePoint(keypoints, "left_hip"), findVisiblePosePoint(keypoints, "right_hip"));
  const ankleCenter = getMidpoint(leftAnkle, rightAnkle);
  const sideAnkle = [leftAnkle, rightAnkle].filter((point): point is PoseKeypoint => Boolean(point)).sort((first, second) => (second.score ?? 0) - (first.score ?? 0))[0];
  const plumbX = analysis.view === "side" ? sideAnkle?.x : ankleCenter?.x;
  context.save();
  context.setLineDash([10, 9]);
  context.lineWidth = 1.5;
  context.strokeStyle = "rgba(126, 200, 212, 0.62)";
  context.beginPath();
  context.moveTo(plumbX ?? context.canvas.width / 2, context.canvas.height * 0.06);
  context.lineTo(plumbX ?? context.canvas.width / 2, context.canvas.height * 0.95);
  context.stroke();
  if (analysis.view !== "side") {
    context.strokeStyle = "rgba(242, 238, 231, 0.28)";
    for (const point of [shoulderCenter, hipCenter]) {
      if (!point) continue;
      context.beginPath();
      context.moveTo(context.canvas.width * 0.12, point.y);
      context.lineTo(context.canvas.width * 0.88, point.y);
      context.stroke();
    }
  }
  context.restore();
}

function findVisiblePosePoint(keypoints: PoseKeypoint[], name: string): PoseKeypoint | undefined {
  const keypoint = keypoints.find((point) => point.name === name);
  return isVisiblePosePoint(keypoint) ? keypoint : undefined;
}


function colorWithAlpha(color: string, alpha: number) {
  if (!color.startsWith("#") || color.length !== 7) return `rgba(140, 207, 178, ${alpha})`;

  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}


type LiveMovementMatch = {
  total: number;
  form: number;
  rhythm: number;
  balance: number;
  feedback: string;
};

function scoreMovementAgainstReference(
  keypoints: PoseKeypoint[],
  video: HTMLVideoElement,
  movementId: number,
  now: number,
): LiveMovementMatch {
  const sequence = getGhostSequence(`movement-${movementId}`);
  if (!sequence || !video.videoWidth || !video.videoHeight) {
    return { total: 0, form: 0, rhythm: 0, balance: 0, feedback: "Bu hareketin referans ölçümü hazırlanıyor." };
  }
  const frame = getInterpolatedGhostFrame(sequence, now % sequence.durationMs);
  if (!frame) {
    return { total: 0, form: 0, rhythm: 0, balance: 0, feedback: "Referans karesi bekleniyor." };
  }
  const normalizedPose = keypoints.flatMap((point) =>
    point.name
      ? [{
          name: point.name,
          score: point.score,
          x: point.x / video.videoWidth,
          y: point.y / video.videoHeight,
        }]
      : [],
  );
  const comparison = compareMovement(normalizedPose, frame.keypoints);
  const form = Math.round((comparison.shoulderLevel + comparison.torsoDirection + comparison.kneeAngle) / 3);
  const rhythm = comparison.timing;
  const balance = comparison.centerTransfer;
  const total = Math.round(form * 0.5 + rhythm * 0.25 + balance * 0.25);
  return {
    total,
    form,
    rhythm,
    balance,
    feedback: comparison.feedback[0] ?? "Hareket referansıyla karşılaştırılıyor.",
  };
}

function scoreLiveMovementMatch(
  keypoints: PoseKeypoint[],
  previous: { keypoints: PoseKeypoint[]; at: number } | null,
  target: number | WarmupLessonId,
): LiveMovementMatch {
  const byName = new Map(keypoints.map((point) => [point.name, point]));
  const visibleNames = [
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
    "left_wrist", "right_wrist", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle",
  ];
  const visibleCount = visibleNames.filter((name) => (byName.get(name)?.score ?? 0) >= 0.35).length;
  if (visibleCount < visibleNames.length) {
    return { total: 0, form: 0, rhythm: 0, balance: 0, feedback: "Biraz geriye geç; başın, ellerin ve ayakların kadrajda olsun." };
  }

  const leftShoulder = byName.get("left_shoulder");
  const rightShoulder = byName.get("right_shoulder");
  const leftWrist = byName.get("left_wrist");
  const rightWrist = byName.get("right_wrist");
  const leftHip = byName.get("left_hip");
  const rightHip = byName.get("right_hip");
  const leftKnee = byName.get("left_knee");
  const rightKnee = byName.get("right_knee");

  const shoulderWidth = leftShoulder && rightShoulder ? Math.max(40, Math.abs(leftShoulder.x - rightShoulder.x)) : 120;
  const wristSpread = leftWrist && rightWrist ? Math.abs(leftWrist.x - rightWrist.x) / shoulderWidth : 0;
  const wristHeight = leftWrist && rightWrist && leftShoulder && rightShoulder
    ? (((leftShoulder.y + rightShoulder.y) / 2) - ((leftWrist.y + rightWrist.y) / 2)) / shoulderWidth
    : 0;
  const kneeSoftness = leftHip && rightHip && leftKnee && rightKnee
    ? (((leftKnee.y + rightKnee.y) / 2) - ((leftHip.y + rightHip.y) / 2)) / shoulderWidth
    : 2.2;

  const numericTarget = typeof target === "number" ? target : target === "wuji" ? 1 : target === "warmup" ? 3 : 4;
  const phase = (numericTarget - 1) % 6;
  const targetSpread = [0.8, 1.5, 1.15, 1.8, 1.35, 0.95][phase];
  const targetHeight = [-0.85, -0.15, 0.35, 0.05, 0.55, -0.45][phase];
  const spreadError = Math.abs(wristSpread - targetSpread);
  const heightError = Math.abs(wristHeight - targetHeight);
  const form = Math.round(Math.max(0, Math.min(100, 100 - spreadError * 28 - heightError * 34)));

  const shoulderBalance = getPairBalanceScore(leftShoulder, rightShoulder, 50);
  const hipBalance = getPairBalanceScore(leftHip, rightHip, 40);
  const center = getCenteringScore(byName) * 1.4;
  const balance = Math.round(Math.max(0, Math.min(100, shoulderBalance + hipBalance + center)));

  let rhythm = 0;
  if (previous && performance.now() - previous.at < 700) {
    const previousByName = new Map(previous.keypoints.map((point) => [point.name, point]));
    const tracked = ["left_wrist", "right_wrist", "left_elbow", "right_elbow", "left_shoulder", "right_shoulder"];
    const deltas = tracked.flatMap((name) => {
      const current = byName.get(name);
      const before = previousByName.get(name);
      if (!current || !before || (current.score ?? 0) < 0.35 || (before.score ?? 0) < 0.35) return [];
      return [Math.hypot(current.x - before.x, current.y - before.y) / shoulderWidth];
    });
    const motion = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : 0;
    // Shibashi should flow: completely frozen or abrupt movement both lower rhythm quality.
    rhythm = Math.round(Math.max(0, Math.min(100, 100 - Math.abs(motion - 0.035) * 950)));
  }

  const total = Math.round(form * 0.55 + rhythm * 0.25 + balance * 0.20);
  let feedback = "Akış iyi; nefesi hareketle birlikte sürdür.";
  if (balance < 62) feedback = "Omuzlarını ve kalçanı aynı hizada tut; merkezini koru.";
  else if (heightError > 0.65) feedback = wristHeight < targetHeight ? "Ellerini biraz daha yukarı taşı." : "Ellerini biraz daha aşağı ve yumuşak bırak.";
  else if (spreadError > 0.7) feedback = wristSpread < targetSpread ? "Kollarını biraz daha aç." : "Kollarını merkeze biraz yaklaştır.";
  else if (rhythm < 58) feedback = "Hareketi yavaşlat; kesintisiz ve yumuşak ak.";
  else if (total >= 85) feedback = "Çok iyi; öğretmenin ritmini ve formunu yakaladın.";

  return { total: Math.max(0, Math.min(100, total)), form, rhythm, balance, feedback };
}

function getMovementBreathCue(movementId: number): string {
  const cues = [
    "Kollar yükselirken nefes al; alçalırken nefesi ver.",
    "Göğüs açılırken nefes al; eller merkeze dönerken nefes ver.",
    "Ağırlık merkeze gelirken nefes al; yana akarken nefes ver.",
    "Daire açılırken nefes al; avuçlar merkeze yaklaşırken nefes ver.",
    "Eller hazırlanırken nefes al; itiş merkezden çıkarken nefes ver.",
    "Kürek geriye gelirken nefes al; öne uzanırken nefes ver.",
    "Top yükselirken nefes al; ağırlık yerleşirken nefes ver.",
    "Kollar göğe çıkarken nefes al; merkeze inerken nefes ver.",
    "Avuçlar yaklaşırken nefes al; merkezden iterken nefes ver.",
    "Eller yön değiştirirken doğal nefesi kesmeden akışı sürdür.",
    "Aşağı inerken nefes ver; suyu göğe taşırken nefes al.",
    "Dalga geriye çekilirken nefes al; öne gelirken nefes ver.",
    "Kanatlar açılırken nefes al; kapanırken nefes ver.",
    "Yumruk hazırlanırken nefes al; kontrollü uzarken nefes ver.",
    "Yükselirken nefes al; yumuşakça alçalırken nefes ver.",
    "Daire yükselirken nefes al; aşağı tamamlanırken nefes ver.",
    "Top yükselirken nefes al; el ve ayak alçalırken nefes ver.",
    "Eller merkeze inerken nefesi uzat; sonra doğal nefese dön.",
  ];

  return cues[movementId - 1] ?? "Nefesi tutmadan hareketin doğal ritmini izle.";
}

function getPairBalanceScore(left?: PoseKeypoint, right?: PoseKeypoint, maxScore = 16): number {
  if (!left || !right || (left.score ?? 0) < 0.3 || (right.score ?? 0) < 0.3) return 0;

  const verticalDifference = Math.abs(left.y - right.y);
  return Math.max(0, maxScore - verticalDifference / 5);
}

function getCenteringScore(keypoints: Map<string | undefined, PoseKeypoint>): number {
  const shoulders = [keypoints.get("left_shoulder"), keypoints.get("right_shoulder")].filter(Boolean) as PoseKeypoint[];
  const hips = [keypoints.get("left_hip"), keypoints.get("right_hip")].filter(Boolean) as PoseKeypoint[];
  const points = [...shoulders, ...hips].filter((point) => (point.score ?? 0) > 0.3);

  if (!points.length) return 0;

  const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const idealCenter = 360;
  const distance = Math.abs(centerX - idealCenter);
  return Math.max(0, 14 - distance / 22);
}

function createPracticeSnapshot(
  video: HTMLVideoElement | null,
  movement: Movement,
  score: number,
  shenName: string,
): PracticeSnapshot | null {
  if (!video || video.readyState < 2) return null;

  const width = video.videoWidth || 720;
  const height = video.videoHeight || 1280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(video, 0, 0, width, height);
  const now = new Date();
  const dateKey = formatSnapshotDate(now);
  const timeLabel = formatSnapshotTime(now);

  const overlayHeight = Math.max(118, height * 0.16);
  const gradient = context.createLinearGradient(0, height - overlayHeight, 0, height);
  gradient.addColorStop(0, "rgba(5, 12, 10, 0)");
  gradient.addColorStop(1, "rgba(5, 12, 10, 0.86)");
  context.fillStyle = gradient;
  context.fillRect(0, height - overlayHeight, width, overlayHeight);

  const pad = Math.max(28, width * 0.045);
  context.fillStyle = "rgba(246, 239, 228, 0.96)";
  context.font = `700 ${Math.max(24, width * 0.045)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText(movement.name, pad, height - overlayHeight + pad + 12);
  context.font = `600 ${Math.max(17, width * 0.028)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText(`${dateKey} • ${timeLabel} • ${shenName}`, pad, height - pad - 28);

  const badgeWidth = Math.max(110, width * 0.18);
  const badgeHeight = Math.max(52, height * 0.05);
  context.fillStyle = "rgba(140, 207, 178, 0.92)";
  context.roundRect(width - pad - badgeWidth, height - pad - badgeHeight, badgeWidth, badgeHeight, 22);
  context.fill();
  context.fillStyle = "rgba(5, 12, 10, 0.92)";
  context.font = `800 ${Math.max(22, width * 0.036)}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
  context.fillText(`%${score}`, width - pad - badgeWidth + 22, height - pad - 17);

  return {
    id: `${movement.id}-${now.getTime()}`,
    createdAt: now.toISOString(),
    dateKey,
    imageData: canvas.toDataURL("image/jpeg", 0.86),
    movementId: movement.id,
    movementName: movement.name,
    score,
    shenName,
    timeLabel,
  };
}

function toPostureAnalysisSnapshot(analysis: ReturnType<typeof analyzePosture>): PostureAnalysisSnapshot {
  return {
    axisScore: analysis.axisScore,
    confidence: analysis.confidence,
    feedback: analysis.feedback,
    flags: analysis.flags,
    hipScore: analysis.hipScore,
    hipTilt: analysis.hipTilt,
    shoulderScore: analysis.shoulderScore,
    shoulderTilt: analysis.shoulderTilt,
    spineShift: analysis.spineShift,
    view: analysis.view,
  };
}

function aggregatePostureAnalysisSnapshots(samples: PostureAnalysisSnapshot[]): PostureAnalysisSnapshot {
  const median = (values: number[]) => {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const latest = samples[samples.length - 1];
  return {
    ...latest,
    axisScore: Math.round(median(samples.map((sample) => sample.axisScore))),
    confidence: Math.round(median(samples.map((sample) => sample.confidence))),
    hipScore: Math.round(median(samples.map((sample) => sample.hipScore))),
    hipTilt: median(samples.map((sample) => sample.hipTilt)),
    sampleCount: samples.length,
    shoulderScore: Math.round(median(samples.map((sample) => sample.shoulderScore))),
    shoulderTilt: median(samples.map((sample) => sample.shoulderTilt)),
    spineShift: median(samples.map((sample) => sample.spineShift)),
  };
}

function createPostureCapture(
  video: HTMLVideoElement | null,
  keypoints: PoseKeypoint[],
  view: PostureView,
  analysis: PostureAnalysisSnapshot,
  accent: string,
): PostureAssessmentCapture | null {
  if (!video || video.readyState < 2) return null;

  const width = video.videoWidth || 720;
  const height = video.videoHeight || 1280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, width, height);
  context.restore();

  const mirroredKeypoints = keypoints.map((keypoint) => ({
    ...keypoint,
    x: width - keypoint.x,
  }));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = colorWithAlpha(accent, 0.38);
  context.shadowBlur = 14;
  drawPostureReferenceGuides(context, mirroredKeypoints, analysis);
  drawPostureQualityConnections(context, mirroredKeypoints, analysis);
  drawPoseKeypoints(context, mirroredKeypoints, accent, postureDisplayPoints);
  drawPostureQualityKeypoints(context, mirroredKeypoints, analysis);
  context.restore();

  return {
    analysis,
    createdAt: new Date().toISOString(),
    imageData: canvas.toDataURL("image/jpeg", 0.84),
    view,
  };
}

function smoothPoseKeypoints(previous: PoseKeypoint[], current: PoseKeypoint[], alpha = 0.24): PoseKeypoint[] {
  if (!previous.length) return current;
  const previousByName = new Map(previous.map((point) => [point.name, point]));
  return current.map((point) => {
    const before = previousByName.get(point.name);
    if (!before || (point.score ?? 0) < 0.2 || (before.score ?? 0) < 0.2) return point;
    return {
      ...point,
      x: before.x + (point.x - before.x) * alpha,
      y: before.y + (point.y - before.y) * alpha,
      score: (before.score ?? 0) * (1 - alpha) + (point.score ?? 0) * alpha,
    };
  });
}

function getPostureOrientationCue(view: PostureView) {
  if (view === "front") return "Ön görünüm. Kameraya dön. Ayaklarını kalça genişliğinde aç ve kollarını rahat bırak.";
  if (view === "side") return "Şimdi sağ yanını kameraya dön. Başını doğal konumda tut ve kollarını rahat bırak.";
  return "Şimdi arkanı kameraya dön. Ağırlığını iki ayağına eşit dağıt ve doğal dur.";
}

function isPostureDetectorAbort(error: unknown) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return /abort(?:ed)?|deleted object|not found/i.test(message);
}

function getPostureLiveCoachCue(
  view: PostureView,
  readiness: ReturnType<typeof evaluateWebPostureFrame>,
  analysis: PostureAnalysisSnapshot,
  keypoints: PoseKeypoint[],
) {
  if (!readiness.bodyReady) return "Laptop ekranını sabitle. Başınla ayakların aynı karede görünene kadar biraz geri çekil.";
  if (!readiness.angleReady) return getPostureOrientationCue(view);
  if (!readiness.positionReady) return readiness.positionCue;

  if (view === "side") {
    if (analysis.shoulderScore < 70) return "Çeneni hafifçe geriye al. Başını omuzunun üzerinde tut.";
    if (analysis.axisScore < 70) return "Göğsünü kaldırmadan gövdeni dikey hatta getir.";
    if (analysis.hipScore < 70) return "Kalçanı ayak bileğinin üzerinde hizala.";
  } else {
    if (analysis.shoulderScore < 70) {
      const left = keypoints.find((point) => point.name === "left_shoulder");
      const right = keypoints.find((point) => point.name === "right_shoulder");
      if (left && right) return left.y < right.y ? "Sol omzunu biraz indir." : "Sağ omzunu biraz indir.";
      return "Omuzlarını aynı yüksekliğe getir.";
    }
    if (analysis.hipScore < 70) return "Ağırlığını iki ayağına eşit dağıt.";
    if (analysis.axisScore < 70) return analysis.spineShift > 0 ? "Gövdeni hafifçe sola taşı." : "Gövdeni hafifçe sağa taşı.";
  }
  return "Duruşun dengeli. Nefesini değiştirmeden sabit kal.";
}

function getPoseStabilityDistance(previous: PoseKeypoint[], current: PoseKeypoint[]): number {
  const trackedNames = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
  ];
  const previousByName = new Map(previous.map((point) => [point.name, point]));
  const distances = current.flatMap((point) => {
    if (!point.name || !trackedNames.includes(point.name) || (point.score ?? 0) < 0.35) return [];
    const before = previousByName.get(point.name);
    if (!before || (before.score ?? 0) < 0.35) return [];
    return [Math.hypot(point.x - before.x, point.y - before.y)];
  });
  if (distances.length < 6) return Number.POSITIVE_INFINITY;
  return distances.reduce((sum, distance) => sum + distance, 0) / distances.length;
}

function buildPostureReport(captures: Record<PostureView, PostureAssessmentCapture>, previous?: PostureReport): PostureReport {
  const analyses = [captures.front.analysis, captures.side.analysis, captures.back.analysis];
  const score = Math.round(
    analyses.reduce((sum, analysis) => sum + analysis.axisScore + analysis.shoulderScore + analysis.hipScore, 0) / (analyses.length * 3),
  );
  const strongestSignal = Math.max(
    ...analyses.flatMap((analysis) => [Math.abs(analysis.shoulderTilt), Math.abs(analysis.hipTilt), Math.abs(analysis.spineShift)]),
  );
  const asymmetrySignal: PostureReport["asymmetrySignal"] =
    strongestSignal > 15 || score < 62 ? "yüksek" : strongestSignal > 8 || score < 78 ? "orta" : "düşük";
  const flags = Array.from(new Set(analyses.flatMap((analysis) => analysis.flags))).slice(0, 6);
  const now = new Date();
  const trendDelta = previous ? score - previous.score : 0;
  const trendText = previous
    ? trendDelta > 2
      ? `${trendDelta} puan iyileşme`
      : trendDelta < -2
        ? `${Math.abs(trendDelta)} puan gerileme sinyali`
        : "önceki rapora yakın"
    : "baz çizgi oluşturuldu";
  const summary =
    asymmetrySignal === "yüksek"
      ? "Omuz, kalça veya merkez hattında belirgin asimetri sinyali var. Ağrı ya da şüphe varsa profesyonel değerlendirme önerilir."
      : asymmetrySignal === "orta"
        ? "Bazı açılarda takip edilmesi gereken postür asimetrisi görünüyor. Düzenli tekrar ile trendi izle."
        : "Postür hattı sakin görünüyor. Bu rapor ilerideki iyileşme kıyası için baz olarak saklanabilir.";

  return {
    asymmetrySignal,
    captures,
    createdAt: now.toISOString(),
    dateKey: formatSnapshotDate(now),
    flags,
    id: `posture-${now.getTime()}`,
    score,
    summary,
    timeLabel: formatSnapshotTime(now),
    trendText,
  };
}

const postureReportDatabaseName = "ritim-kapisi-posture-library";
const postureReportStoreName = "reports";
const practiceSnapshotStoreName = "practice-snapshots";

function openPostureReportDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB desteklenmiyor"));
      return;
    }

    const request = window.indexedDB.open(postureReportDatabaseName, 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(postureReportStoreName)) {
        database.createObjectStore(postureReportStoreName, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(practiceSnapshotStoreName)) {
        database.createObjectStore(practiceSnapshotStoreName, { keyPath: "id" });
      }
    };
  });
}

async function savePostureReportToIndexedDb(report: PostureReport) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(postureReportStoreName, "readwrite");
      transaction.objectStore(postureReportStoreName).put(report);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // Local storage remains as a lightweight fallback when IndexedDB is unavailable.
  }
}

async function savePracticeSnapshotToIndexedDb(snapshot: PracticeSnapshot) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(practiceSnapshotStoreName, "readwrite");
      transaction.objectStore(practiceSnapshotStoreName).put(snapshot);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // Lightweight localStorage metadata remains available as a fallback.
  }
}

async function deletePostureReportFromIndexedDb(reportId: string) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(postureReportStoreName, "readwrite");
      transaction.objectStore(postureReportStoreName).delete(reportId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // The in-memory list is still updated when persistent storage is unavailable.
  }
}

async function clearLocalShibashiDatabase() {
  if (!window.indexedDB) return;
  await new Promise<void>((resolve) => {
    const request = window.indexedDB.deleteDatabase(postureReportDatabaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

async function loadPostureReportsFromIndexedDb(): Promise<PostureReport[]> {
  try {
    const database = await openPostureReportDatabase();
    const reports = await new Promise<PostureReport[]>((resolve, reject) => {
      const request = database.transaction(postureReportStoreName, "readonly").objectStore(postureReportStoreName).getAll();
      request.onsuccess = () => resolve(request.result as PostureReport[]);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return reports.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

async function loadPracticeSnapshotsFromIndexedDb(): Promise<PracticeSnapshot[]> {
  try {
    const database = await openPostureReportDatabase();
    const snapshots = await new Promise<PracticeSnapshot[]>((resolve, reject) => {
      const request = database.transaction(practiceSnapshotStoreName, "readonly").objectStore(practiceSnapshotStoreName).getAll();
      request.onsuccess = () => resolve(request.result as PracticeSnapshot[]);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return snapshots.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

function mergePostureReports(...collections: PostureReport[][]): PostureReport[] {
  const reports = new Map<string, PostureReport>();
  collections.flat().forEach((report) => {
    const current = reports.get(report.id);
    if (!current) {
      reports.set(report.id, report);
      return;
    }
    reports.set(report.id, mergePostureReportCopies(current, report));
  });
  return Array.from(reports.values())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 18);
}

function mergePostureReportCopies(first: PostureReport, second: PostureReport): PostureReport {
  const imageWeight = (report: PostureReport) =>
    (["front", "side", "back"] as const).reduce((total, view) => total + (report.captures?.[view]?.imageData?.length ?? 0), 0);
  const full = imageWeight(second) > imageWeight(first) ? second : first;
  const metadata = full === first ? second : first;
  return {
    ...metadata,
    ...full,
    trainerVisible: metadata.trainerVisible ?? full.trainerVisible,
    captures: Object.fromEntries(
      (["front", "side", "back"] as const).map((view) => {
        const primary = full.captures?.[view];
        const fallback = metadata.captures?.[view];
        return [view, {
          ...fallback,
          ...primary,
          imageData: primary?.imageData || fallback?.imageData || "",
        }];
      }),
    ) as PostureReport["captures"],
  };
}

function mergePracticeSnapshots(...collections: PracticeSnapshot[][]): PracticeSnapshot[] {
  const snapshots = new Map<string, PracticeSnapshot>();
  collections.flat().forEach((snapshot) => {
    const current = snapshots.get(snapshot.id);
    if (!current) {
      snapshots.set(snapshot.id, snapshot);
      return;
    }
    snapshots.set(snapshot.id, {
      ...current,
      ...snapshot,
      imageData: isCapturedPracticePhoto(snapshot.imageData) ? snapshot.imageData : current.imageData,
    });
  });
  return Array.from(snapshots.values())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 24);
}

function persistPostureReportsToLocalStorage(reports: PostureReport[]) {
  const lightweightReports = reports.slice(0, 18).map((report, reportIndex) => ({
    ...report,
    captures: Object.fromEntries(
      (["front", "side", "back"] as const).map((view) => {
        const capture = report.captures?.[view];
        const imageData = portableHistoryImage(capture?.imageData, "");
        return [
          view,
          {
            ...capture,
            imageData: reportIndex < 2 && typeof capture?.imageData === "string" ? capture.imageData : imageData,
          },
        ];
      }),
    ) as PostureReport["captures"],
  }));
  writeLightweightHistory("ritim-kapisi-posture-reports", lightweightReports);
}

function persistPracticeSnapshotsToLocalStorage(snapshots: PracticeSnapshot[]) {
  const lightweightSnapshots = snapshots.slice(0, 24).map((snapshot) => ({
    ...snapshot,
    imageData: portableHistoryImage(snapshot.imageData, ""),
  }));
  writeLightweightHistory("ritim-kapisi-practice-gallery", lightweightSnapshots);
}

function portableHistoryImage(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return /^(?:data:|blob:)/i.test(value) || value.length > 64_000 ? fallback : value;
}

function isCapturedPracticePhoto(value: unknown): value is string {
  return typeof value === "string" && /^(?:data:image\/|blob:|https?:\/\/)/i.test(value.trim());
}

function writeLightweightHistory(key: string, value: unknown) {
  const serialized = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    try {
      window.localStorage.removeItem(key);
      window.localStorage.setItem(key, serialized);
    } catch {
      // The full-resolution source remains in IndexedDB or current memory.
    }
  }
}

function formatSnapshotDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSnapshotTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPoseStatusText(status: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata"): string {
  const labels = {
    bekliyor: "MediaPipe bekliyor",
    yükleniyor: "MediaPipe yükleniyor",
    aktif: "MediaPipe aktif",
    "beden-yok": "Beden kadrajda değil",
    hata: "MediaPipe başlatılamadı",
  };

  return labels[status];
}

function speakCoach(text: string, voiceProfile?: Pick<AiCoach, "pitch" | "rate">, retryIfVoicesLoad = true) {
  if (!("speechSynthesis" in window)) return;

  const currentVoices = window.speechSynthesis.getVoices();
  if (!currentVoices.length && retryIfVoicesLoad) {
    window.setTimeout(() => speakCoach(text, voiceProfile, false), 320);
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = getBestCoachVoice();

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.lang = preferredVoice?.lang ?? "tr-TR";
  utterance.pitch = voiceProfile?.pitch ?? 1.02;
  utterance.rate = voiceProfile?.rate ?? (preferredVoice?.lang.toLocaleLowerCase("tr-TR").startsWith("tr") ? 0.94 : 0.88);
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function styleCoachCue(text: string, coach: AiCoach): string {
  const normalized = text.trim();
  const lead = coach.styleLead.trim();
  const close = coach.styleClose.trim();
  const withLead = normalized.startsWith(lead) ? normalized : `${lead} ${normalized}`;

  return withLead.endsWith(close) ? withLead : `${withLead} ${close}`;
}

function getCoachSilenceMs(coach: AiCoach, name: CoachCueName): number {
  const cuePause = name === "ok" ? 2400 : name === "start" || name === "calibration" ? 1800 : 900;

  return Math.max(5600, Math.round(coach.cadenceMs * 0.45) + cuePause);
}

function speakCoachCue(text: string, coach: AiCoach): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.resolve();

  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      window.setTimeout(() => {
        void speakCoachCue(text, coach).then(resolve);
      }, 320);
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    const preferredVoice = getBestCoachVoice();

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.lang = preferredVoice?.lang ?? "tr-TR";
    utterance.pitch = coach.pitch;
    utterance.rate = coach.rate;
    utterance.volume = 1;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    window.setTimeout(finish, Math.min(12000, Math.max(4200, text.length * 95)));
  });
}

function getBestCoachVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();

  return voices
    .map((voice) => ({ score: scoreCoachVoice(voice), voice }))
    .sort((first, second) => second.score - first.score)[0]?.voice;
}

function scoreCoachVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLocaleLowerCase("tr-TR");
  const lang = voice.lang.toLocaleLowerCase("tr-TR");
  let score = 0;

  if (lang.startsWith("tr")) score += 120;
  if (voice.localService) score += 18;
  if (/google|microsoft|apple|siri|enhanced|premium|natural|neural|online/.test(name)) score += 35;
  if (/yelda|eda|seda|zeynep|filiz|emel|ayşe|female|woman|samantha|victoria|zira|susan|aria|jenny/.test(name)) score += 28;
  if (/compact|low quality|robot|espeak|basic/.test(name)) score -= 45;
  if (!lang.startsWith("tr") && /en-us|en-gb/.test(lang)) score += 8;

  return score;
}
