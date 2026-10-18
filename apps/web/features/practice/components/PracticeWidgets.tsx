"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import {
  compareMovement,
  getGhostSequence,
  getInterpolatedGhostFrame,
  type GhostMode,
  type TraceMode,
} from "@/packages/shen-domain";
import { fiveShen } from "@/features/home/data/shen";
import type { AiCoach } from "@/features/practice/data/coaches";
import { innerJourneyScenes, type InnerJourneyScene } from "@/features/journey/data/scenes";
import { getMovementReferenceImage, movements, warmupLessons, type Movement, type WarmupLesson, type WarmupLessonId } from "@/features/practice/data/movements";
import { poseConnections } from "@/features/posture/lib/pose-canvas";
import { getPoseStatusText } from "@/features/posture/lib/status-labels";
import type { PoseKeypoint } from "@/packages/posture-analysis";
import type { MovementAnalysisWindowResult, MovementAnalysisWindowState } from "../types";

const MovementCoach = dynamic(
  () => import("@/components/tai-chi/MovementCoach").then((module) => module.MovementCoach),
  { ssr: false },
);

export function MovementLibraryShowcase({
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

export function WarmupStudio({
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

export function MovementAnalysisWindow({
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

export function PracticeGuideCompanion({
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

export function WebGhostTeacherOverlay({
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

export function InnerGatePracticeFrame({
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

export function InnerJourneyStatus({
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


