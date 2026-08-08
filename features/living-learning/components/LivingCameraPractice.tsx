"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { compareLivingMovement, type LivingComparisonResult, type LivingMovementStep, type LivingPosePoint, type LivingPractice, type LivingPracticeResult } from "../../../packages/living-learning";
import { LiveFeedbackCard } from "./LiveFeedbackCard";
import styles from "./living-learning.module.css";

const names = ["nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index"];

export function LivingCameraPractice({ practice, activeStep, elapsedMs, playing, onToggle, onRestart, onComplete, onClose }: { practice: LivingPractice; activeStep: LivingMovementStep; elapsedMs: number; playing: boolean; onToggle: () => void; onRestart: () => void; onComplete: (result: LivingPracticeResult) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStatus, setCameraStatus] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [feedback, setFeedback] = useState("Tam bedenin göründüğünde ölçüm başlayacak."), [liveScore, setLiveScore] = useState<number | null>(null);
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
          if (!raw?.length) { setLiveScore(null); setFeedback("Biraz geri çekil; başından ayaklarına kadar görün."); return; }
          const pose: LivingPosePoint[] = raw.map((item, index) => ({ name: names[index] ?? `point-${index}`, x: item.x, y: item.y, score: item.visibility ?? 1 }));
          const comparison = compareLivingMovement({ landmarks: pose, stepId: stepRef.current.id, elapsedMs: elapsedRef.current });
          if (!comparison) { setLiveScore(null); setFeedback("Omuz, kalça, diz ve ayak bileklerin kadrajda olsun."); return; }
          resultsRef.current.push(comparison);
          if (resultsRef.current.length > 240) resultsRef.current.shift();
          setLiveScore(comparison.movementScore); setFeedback(comparison.feedback);
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
    <div className={styles.cameraTeacher} key={activeStep.id}>
      <span className={styles.teacherHalo} />
      <Image alt={`${activeStep.title} hareketini gösteren öğretmen`} className={styles.cameraTeacherImage} fill priority sizes="(max-width: 820px) 48vw, 34vw" src={ghostTeacherAsset(activeStep.id)} />
      <span className={styles.teacherGround} />
      <small>ÖĞRETMEN</small>
    </div>
    <div aria-hidden="true" className={styles.userFrame}><small>SEN</small></div>
    <div className={styles.cameraTop}><button onClick={onClose} type="button">← Sahneye dön</button><span>{cameraStatus === "ready" ? "● CANLI" : cameraStatus === "loading" ? "Model hazırlanıyor" : cameraStatus === "denied" ? "Kamera izni gerekli" : "Kamera açılamadı"}</span></div>
    <div className={styles.cameraPrompt}><small>{activeStep.title}</small><strong>Öğretmeni taklit et</strong><span>{activeStep.breathingCue}</span></div>
    <LiveFeedbackCard feedback={feedback} score={liveScore} />
    <div className={styles.cameraBottom}><div><span style={{ width: `${Math.min(100, elapsedMs / practice.durationMs * 100)}%` }} /></div><button onClick={onToggle} type="button">{playing ? "Duraklat" : "Sürdür"}</button><time>{Math.ceil((practice.durationMs - elapsedMs) / 1000)} sn</time></div>
  </div>;
}

function ghostTeacherAsset(stepId: LivingMovementStep["id"]) {
  const phase = stepId === "prepare" ? "prepare" : stepId === "lift" ? "lift" : stepId === "push" ? "push" : stepId === "extend" ? "extend" : "release";
  return `/images/living-learning/ghost-teacher/${phase}.png`;
}
