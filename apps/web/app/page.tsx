"use client";
import { DailyShenCheckin } from "@/features/home/components/DailyShenCheckin";
import { MilestoneCelebration } from "@/features/home/components/MilestoneCelebration";

import NextImage from "next/image";
import dynamic from "next/dynamic";
import type { CSSProperties, Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { JournalScreen } from "@/features/journal/components/JournalScreen";
import { ProfileScreen } from "@/features/profile/components/ProfileScreen";
import { PremiumOnboarding } from "@/features/onboarding/components/PremiumOnboarding";
import { DojoHomeScreen, getPracticeStreak } from "@/features/home/components/DojoHomeScreen";
import { isCapturedPracticePhoto } from "@/features/home/utils/practice-photo";
import { fiveShen, shenTodayCopy, type ShenId } from "@/features/home/data/shen";
import { PostureAssessmentScreen } from "@/features/posture/components/PostureAssessmentScreen";
import { getCameraStatus, getPoseStatusText } from "@/features/posture/lib/status-labels";
import { aggregatePostureAnalysisSnapshots, buildPostureReport, createPostureCapture, getPostureLiveCoachCue, getPostureOrientationCue, getPoseStabilityDistance, isPostureDetectorAbort, smoothPoseKeypoints, toPostureAnalysisSnapshot } from "@/features/posture/lib/posture-session";
import type { PostureAssessmentCapture, PostureAssessmentStep, PostureRenderMode, PostureReport, PostureScanGuidance } from "@/features/posture/types";
import { innerJourneyScenes, neijingStages, type InnerJourneyScene, type NeijingStage } from "@/features/journey/data/scenes";
import { FiveShenJourneyWeb } from "@/features/journey/components/FiveShenJourneyScreen";
import { LessonVideosScreen } from "@/features/practice/components/LessonVideosScreen";
import type { TabId } from "@/types/navigation";
import { AmbientParticles } from "@/features/home/components/AmbientParticles";
import { colorWithAlpha, drawPoseCanvas, drawPoseConnections, drawPoseKeypoints, drawPostureQualityConnections, drawPostureQualityKeypoints, drawPostureReferenceGuides, poseConnections, postureDisplayPoints, syncPoseCanvasSize } from "@/features/posture/lib/pose-canvas";
import { createMoveNetDetector } from "@/features/posture/lib/movenet-detector";
import type { PoseDetector } from "@/features/posture/types";
import { mediaPipePoseNames } from "@/features/posture/lib/pose-names";
import { aiCoaches, coachDialogues, coachVoiceVersion, inferCoachIntent, type AiCoach, type CoachIntent } from "@/features/practice/data/coaches";
import { getCoachSilenceMs, speakCoach, speakCoachCue, styleCoachCue } from "@/features/practice/lib/coach-audio";
import type { CoachCueName } from "@/features/practice/lib/coach-audio";
import { getInnerJourneyScene, getMovementReferenceImage, movements, shibashiFullSetVideoId, warmupLessons, type Movement, type PracticeAdaptation, type PracticeLearningMode, type WarmupLesson, type WarmupLessonId } from "@/features/practice/data/movements";
import { PostureSavedReportsGallery, evaluateWebPostureFrame } from "@/features/posture/components/PostureScreens";
import { ShibashiAuthGate } from "@/components/shibashi-auth-gate";
import { ShibashiBrandMark } from "@/components/web/ShibashiBrandMark";
import { WebNotificationBell } from "@/components/web/WebNotificationBell";
import { CoachMeridianCard, MeridianExplorer, MovementMeridianCard, PersonalMeridianSuggestion, PracticeMeridianSummaryCard } from "@/components/meridian/MeridianKnowledge";
import {getBrowserSyncCode,syncBrowserState} from "@/lib/shibashi-sync-client";
import { useShibashiAuth } from "@/lib/supabase-auth";
import { toWebPostureReport, toWebPracticeSnapshot } from "@/lib/sync-record-adapters";
import {
  clearLocalShibashiDatabase,
  deletePostureReportFromIndexedDb,
  loadPostureReportsFromIndexedDb,
  loadPracticeSnapshotsFromIndexedDb,
  mergePostureReports,
  mergePracticeSnapshots,
  persistPostureReportsToLocalStorage,
  persistPracticeSnapshotsToLocalStorage,
  portableHistoryImage,
  savePostureReportToIndexedDb,
  savePracticeSnapshotToIndexedDb,
  writeLightweightHistory,
} from "@/lib/local-history-storage";
import type { PracticeSnapshot } from "@/features/practice/types";
import { visualThemes, type VisualThemeId } from "@/packages/design-tokens";
import { getJourneyDay } from "@/packages/experience-design";
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
  type TraceMode,
} from "@/packages/shen-domain";
import {
  analyzePosture,
  getPostureCorrections,
  getPostureMetricList,
  getPostureOverallScore,
  getPostureQualityCounts,
  getPostureRecommendations,
  getPostureReportCompositeAnalysis,
  type PoseKeypoint,
  type PostureAnalysisSnapshot,
  type PostureView,
} from "@/packages/posture-analysis";



// Geçici arayüz anahtarları: altyapı ve bileşenler yeniden açılmak üzere korunur.
const WEB_GOOGLE_AUTH_UI_ENABLED = false;
const WEB_INTRO_VIDEO_ENABLED = false;
const SHEN_MUSIC_SESSION_KEY = "shibashi-session-music";

function hasCompletedWebOnboarding() {
  if (window.localStorage.getItem("ritim-kapisi-onboarding-complete") !== "true") return false;
  try {
    const result = JSON.parse(window.localStorage.getItem("shibashi-onboarding-result-v9") ?? "null") as Partial<OnboardingProfile> | null;
    return Boolean(result && result.name?.trim() && result.firstJourneyPlan);
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
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

type CoachCueRequest = {
  coach: AiCoach;
  force: boolean;
  name: CoachCueName;
  text: string;
};

const tabs: { id: TabId | "bodyLines" | "mainMap"; label: string; icon: string }[] = [
  { id: "home", label: "Odam", icon: "◉" },
  { id: "mainMap", label: "Gelişim Haritam", icon: "◌" },
  { id: "lessons", label: "Isınma Dersleri", icon: "▶" },
  { id: "bodyLines", label: "18 Form", icon: "✦" },
  { id: "posture", label: "Postür", icon: "↕" },
  { id: "journey", label: "Beden Haritam", icon: "☯" },
  { id: "journal", label: "Kayıtlarım", icon: "◌" },
  { id: "profile", label: "Ayarlar", icon: "☰" },
];

export default function RitimKapisiOS() {
  const auth = useShibashiAuth();
  const [activeTab, setActiveTab] = useState<TabId>("home");

  useEffect(() => {
    const queryTab = new URLSearchParams(window.location.search).get("tab");
    if (queryTab && queryTab !== "bodyLines" && queryTab !== "mainMap" && tabs.some((tab) => tab.id === queryTab)) setActiveTab(queryTab as TabId);
  }, []);
  const [introVideoVisible, setIntroVideoVisible] = useState(WEB_INTRO_VIDEO_ENABLED);
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
  const [syncCode, setSyncCode] = useState("");
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
  const journalUnlocked = true;
  const journeyUnlocked = true;
  const visibleTabs = tabs;

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const previewMode = new URLSearchParams(window.location.search).get("preview");
    const isPreview =
      previewMode === "home" ||
      previewMode === "posture" ||
      previewMode === "posture-live" ||
      previewMode === "journey" ||
      previewMode === "practice";
    if (isPreview) {
      setIntroVideoVisible(false);
      setOnboardingComplete(true);
      if (previewMode === "posture" || previewMode === "posture-live") setActiveTab("posture");
      if (previewMode === "posture-live") setPosturePreviewLive(true);
      if (previewMode === "journey") setActiveTab("journey");
      if (previewMode === "practice") setActiveTab("lessons");
    }
    if (!isPreview) {
      setOnboardingComplete(hasCompletedWebOnboarding());
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
        const visibleGallery = mergePracticeSnapshots(parsedGallery);
        setPracticeGallery(visibleGallery);
        persistPracticeSnapshotsToLocalStorage(visibleGallery);
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
    const result=await syncBrowserState(buildWebSyncPayload(),code);
    setSyncCode(result.syncCode);
    if(result.payload)applyWebSyncPayload(result.payload);
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

  function setPracticeSnapshotTrainerVisibility(snapshotId: string, trainerVisible: boolean) {
    setPracticeGallery((current) => {
      const nextGallery = current.map((snapshot) => snapshot.id === snapshotId ? { ...snapshot, trainerVisible } : snapshot);
      const updatedSnapshot = nextGallery.find((snapshot) => snapshot.id === snapshotId);
      if (updatedSnapshot) void savePracticeSnapshotToIndexedDb(updatedSnapshot);
      persistPracticeSnapshotsToLocalStorage(nextGallery);
      return nextGallery;
    });
  }

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
    window.dispatchEvent(new Event("shibashi-theme-change"));
    const nextShen = fiveShen.find((shen) => shen.id === shenId);
    const musicExplicitlyMuted = window.sessionStorage.getItem(SHEN_MUSIC_SESSION_KEY) === "off";
    if ((soundState === "açık" || !musicExplicitlyMuted) && nextShen) {
      void startShenMusic(nextShen);
    }
  }

  function selectVisualTheme(themeId: VisualThemeId) {
    setVisualThemeId(themeId);
    window.localStorage.setItem("shibashi-visual-theme", themeId);
    window.dispatchEvent(new Event("shibashi-theme-change"));
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

  function completeOnboarding(profile?: OnboardingProfile) {
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
    setActiveTab("home");
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
    <>{onboardingComplete ? <DailyShenCheckin onSelect={selectShen} /> : null}
    {onboardingComplete && auth.ready ? <MilestoneCelebration records={practiceGallery.filter((item) => isCapturedPracticePhoto(item.imageData)).map((item) => ({ order: item.movementId, date: item.createdAt }))} postureCount={postureReports.length} userId={auth.user?.id} /> : null}
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
            homeCopy={shenTodayCopy}
            onJournal={() => setActiveTab("journal")}
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
            shenOptions={fiveShen}
            userName={userName}
          />
        ) : null}
        {onboardingComplete && activeTab === "lessons" ? <LessonVideosScreen /> : null}
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
        {onboardingComplete && activeTab === "journey" ? (
          <FiveShenJourneyWeb
            userId={auth.user?.id}
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
        {onboardingComplete && activeTab === "journal" ? (
          <JournalScreen
            gallery={practiceGallery}
            onSetTrainerVisibility={setPracticeSnapshotTrainerVisibility}
            postureReports={postureReports}
            selectedShen={selectedShen}
            userId={auth.user?.id}
          />
        ) : null}
        {onboardingComplete && activeTab === "profile" ? (
          <ProfileScreen
            authEmail={auth.user?.email}
            musicState={soundState}
            onRestartOnboarding={restartOnboarding}
            onSelectShen={selectShen}
            onSelectVisualTheme={selectVisualTheme}
            onSignOut={auth.user ? () => void auth.signOut() : undefined}
            onToggleMusic={soundState === "açık" ? stopShenMusic : playSelectedShenMusic}
            postureReports={postureReports}
            selectedShen={selectedShen}
            selectedShenId={selectedShenId}
            visualThemeId={visualThemeId}
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
              <ShibashiBrandMark />
              <span>SHIBASHI EFE</span>
            </button>
            <div className="web-nav-links">
              {visibleTabs.map((tab) => (
                <button
                  className={`nav-button nav-tab-${tab.id} ${activeTab === tab.id ? "nav-button-active" : ""}`}
                  key={tab.id}
                  onClick={() => tab.id === "bodyLines" ? window.location.assign("/beden-hatlari") : tab.id === "mainMap" ? window.location.assign("/ana-haritam") : setActiveTab(tab.id)}
                  type="button"
                >
                  <strong>{tab.icon}</strong>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="web-nav-account" aria-label="Kullanıcı özeti">
              <span className="web-nav-streak" title="Güncel seri">♨ {getPracticeStreak(practiceGallery, shenActivities).current}</span>
              <button aria-label={`Müziği ${soundState === "açık" ? "kapat" : "aç"}`} aria-pressed={soundState === "açık"} className={`web-nav-music ${soundState === "açık" ? "is-playing" : ""}`} onClick={toggleShenMusic} title={`Shen müziği ${soundState}`} type="button"><span aria-hidden="true">{soundState === "açık" ? "♪" : "♪̸"}</span></button>
              <WebNotificationBell className="web-nav-bell" />
              <button className="web-nav-profile" onClick={() => setActiveTab("profile")} type="button"><i>{(userName || "Ç").slice(0, 1).toLocaleUpperCase("tr-TR")}</i><span>{userName || "Çınar"}</span><b>⌄</b></button>
            </div>
          </nav>
        ) : null}
      </div>
    </main></>
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
      step={postureStep}
      videoRef={videoRef}
      view={postureView}
    />
  );
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
