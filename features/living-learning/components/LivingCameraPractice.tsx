"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compareLivingMovement, type LivingComparisonResult, type LivingMovementStep, type LivingPosePoint, type LivingPractice, type LivingPracticeResult } from "../../../packages/living-learning";
import { GhostTeacherOverlay } from "./GhostTeacherOverlay";
import { LiveFeedbackCard } from "./LiveFeedbackCard";
import styles from "./living-learning.module.css";

const names = ["nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index"];
const connections: ReadonlyArray<readonly [string, string]> = [["left_shoulder", "right_shoulder"], ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"], ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"], ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"], ["left_hip", "right_hip"], ["left_hip", "left_knee"], ["left_knee", "left_ankle"], ["right_hip", "right_knee"], ["right_knee", "right_ankle"]];

export function LivingCameraPractice({ practice, activeStep, elapsedMs, playing, onToggle, onRestart, onComplete, onClose }: { practice: LivingPractice; activeStep: LivingMovementStep; elapsedMs: number; playing: boolean; onToggle: () => void; onRestart: () => void; onComplete: (result: LivingPracticeResult) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null), canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStatus, setCameraStatus] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [ghostVisible, setGhostVisible] = useState(true), [feedback, setFeedback] = useState("Tam bedenin göründüğünde ölçüm başlayacak."), [liveScore, setLiveScore] = useState<number | null>(null), [sampleCount, setSampleCount] = useState(0);
  const resultsRef = useRef<LivingComparisonResult[]>([]), completedRef = useRef(false), stepRef = useRef(activeStep), elapsedRef = useRef(elapsedMs), playingRef = useRef(playing);
  stepRef.current = activeStep; elapsedRef.current = elapsedMs; playingRef.current = playing;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    const samples = resultsRef.current;
    if (samples.length < 5) { setFeedback("Ölçümü tamamlamak için tam bedeninle birkaç nefes daha kal."); onRestart(); return; }
    completedRef.current = true;
    const average = (key: "movementScore" | "rhythmScore") => Math.round(samples.reduce((sum, item) => sum + item[key], 0) / samples.length);
    const best = [...samples].sort((a, b) => b.movementScore - a.movementScore)[0];
    const last = samples[samples.length - 1];
    onComplete({ id: `living-${Date.now()}`, practiceId: practice.id, sceneId: practice.sceneId, completedAt: new Date().toISOString(), durationSeconds: Math.round(practice.durationMs / 1000), sampleCount: samples.length, movementScore: average("movementScore"), breathRhythmScore: average("rhythmScore"), bestSection: best.bestMetric, improvement: last.feedback === "Güzel, akışı koru." ? "Aynı yumuşaklığı hareketin başlangıcına da taşı." : last.feedback, masterSentence: `${practice.title}; gücü zorlamadan, merkezinden yön ver.`, analysisSource: "mediapipe-33" });
  }, [onComplete, onRestart, practice]);

  useEffect(() => { if (elapsedMs >= practice.durationMs) finish(); }, [elapsedMs, finish, practice.durationMs]);

  useEffect(() => {
    let stream: MediaStream | undefined, cancelled = false, animation = 0, lastRun = 0;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        const video = videoRef.current;
        if (!video || cancelled) return;
        video.srcObject = stream;
        await video.play();
        const { createPoseLandmarker } = await import("@/lib/pose/createPoseLandmarker");
        const landmarker = await createPoseLandmarker();
        if (cancelled) return;
        setCameraStatus("ready");
        onRestart();
        const detect = (now: number) => {
          if (cancelled) return;
          animation = requestAnimationFrame(detect);
          if (!playingRef.current || now - lastRun < 110 || video.readyState < 2) return;
          lastRun = now;
          const result = landmarker.detectForVideo(video, now), raw = result.landmarks[0];
          if (!raw?.length) { setLiveScore(null); setFeedback("Biraz geri çekil; başından ayaklarına kadar görün."); drawPose(canvasRef.current, [], video); return; }
          const pose: LivingPosePoint[] = raw.map((item, index) => ({ name: names[index] ?? `point-${index}`, x: item.x, y: item.y, score: item.visibility ?? 1 }));
          drawPose(canvasRef.current, pose, video);
          const comparison = compareLivingMovement({ landmarks: pose, stepId: stepRef.current.id, elapsedMs: elapsedRef.current });
          if (!comparison) { setLiveScore(null); setFeedback("Omuz, kalça, diz ve ayak bileklerin kadrajda olsun."); return; }
          resultsRef.current.push(comparison);
          if (resultsRef.current.length > 240) resultsRef.current.shift();
          setSampleCount(resultsRef.current.length); setLiveScore(comparison.movementScore); setFeedback(comparison.feedback);
        };
        animation = requestAnimationFrame(detect);
      } catch (error) {
        if (cancelled) return;
        setCameraStatus(error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") ? "denied" : "error");
      }
    };
    void start();
    return () => { cancelled = true; cancelAnimationFrame(animation); stream?.getTracks().forEach((track) => track.stop()); };
  }, [onRestart]);

  return <div className={styles.cameraStage}>
    <video className={styles.cameraVideo} muted playsInline ref={videoRef} />
    <canvas className={styles.poseCanvas} ref={canvasRef} />
    {ghostVisible ? <div className={styles.cameraGhost}><GhostTeacherOverlay step={activeStep} /></div> : null}
    <div className={styles.cameraTop}><button onClick={onClose} type="button">← Sahneye dön</button><span>{cameraStatus === "ready" ? "● CANLI · MediaPipe 33" : cameraStatus === "loading" ? "Model hazırlanıyor" : cameraStatus === "denied" ? "Kamera izni gerekli" : "Kamera açılamadı"}</span><button onClick={() => setGhostVisible((value) => !value)} type="button">Ghost {ghostVisible ? "açık" : "kapalı"}</button></div>
    <div className={styles.cameraPrompt}><small>{activeStep.title}</small><strong>{activeStep.breathingCue}</strong></div>
    <LiveFeedbackCard feedback={feedback} samples={sampleCount} score={liveScore} />
    <div className={styles.cameraBottom}><div><span style={{ width: `${Math.min(100, elapsedMs / practice.durationMs * 100)}%` }} /></div><button onClick={onToggle} type="button">{playing ? "Duraklat" : "Sürdür"}</button><time>{Math.ceil((practice.durationMs - elapsedMs) / 1000)} sn</time></div>
  </div>;
}

function drawPose(canvas: HTMLCanvasElement | null, pose: readonly LivingPosePoint[], video: HTMLVideoElement) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const context = canvas.getContext("2d"); if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, rect.width, rect.height);
  const sourceWidth = video.videoWidth || rect.width, sourceHeight = video.videoHeight || rect.height;
  const scale = Math.max(rect.width / sourceWidth, rect.height / sourceHeight), offsetX = (rect.width - sourceWidth * scale) / 2, offsetY = (rect.height - sourceHeight * scale) / 2;
  const xy = (name: string) => { const item = pose.find((entry) => entry.name === name && (entry.score ?? 1) >= .38); return item ? { x: rect.width - (item.x * sourceWidth * scale + offsetX), y: item.y * sourceHeight * scale + offsetY } : null; };
  context.lineCap = "round"; context.strokeStyle = "rgba(169,217,119,.82)"; context.lineWidth = 2;
  for (const [aName, bName] of connections) { const a = xy(aName), b = xy(bName); if (!a || !b) continue; context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke(); }
  for (const name of new Set(connections.flat())) { const item = xy(name); if (!item) continue; context.fillStyle = "rgba(242,238,231,.92)"; context.beginPath(); context.arc(item.x, item.y, 4.2, 0, Math.PI * 2); context.fill(); context.fillStyle = "#A9D977"; context.beginPath(); context.arc(item.x, item.y, 2.8, 0, Math.PI * 2); context.fill(); }
}
