"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import styles from "./living-learning.module.css";

const landmarkNames = ["nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index"];
const measuredJoints = ["nose", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"];
const completionThreshold = 70;
const practiceDurationMs = 15_000;

type MovementPoint = { name: string; x: number; y: number; score: number };

export function MovementCameraPractice({ active, movementOrder, movementName, retryKey, onComplete }: {
  active: boolean;
  movementOrder: string;
  movementName: string;
  retryKey: number;
  onComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraMessage, setCameraMessage] = useState("Kamera ve hareket modeli hazırlanıyor.");
  const [score, setScore] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [completed, setCompleted] = useState(false);

  useEffect(() => () => {
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) {
      setCameraReady(false);
      return;
    }

    let disposed = false;
    let stream: MediaStream | null = null;
    let animationFrame = 0;
    let completionTimer = 0;
    let startedAt = 0;
    let lastInferenceAt = 0;
    let lastUiUpdateAt = 0;
    let matchedSince = 0;
    let completionStarted = false;
    let targets: MovementPoint[][] = [];

    setCameraReady(false);
    setCameraError("");
    setCameraMessage("Kamera ve hareket modeli hazırlanıyor.");
    setScore(null);
    setSecondsLeft(15);
    setCompleted(false);

    const start = async () => {
      try {
        if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
          throw new Error("Kamera için sayfayı localhost veya HTTPS üzerinden açmalısın.");
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Bu tarayıcı kamera erişimini desteklemiyor.");
        }

        setCameraMessage("Kamera izni bekleniyor.");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) throw new Error("Kamera görüntüsü başlatılamadı.");
        video.srcObject = stream;
        await video.play();

        setCameraMessage("Öğretmen hareketinin pozları ölçüme hazırlanıyor.");
        let landmarker = landmarkerRef.current;
        if (!landmarker) {
          const { createPoseLandmarker } = await import("@/lib/pose/createPoseLandmarker");
          landmarker = await createPoseLandmarker();
        }
        if (disposed) {
          if (landmarker !== landmarkerRef.current) landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        const imagePaths = [
          `/images/body-lines-motion/${movementOrder}.jpg`,
          `/images/body-lines/${movementOrder}.jpg`,
        ];
        const referenceImages = await Promise.all(imagePaths.map(loadReferenceImage));
        if (disposed) return;
        const timestamp = performance.now();
        targets = referenceImages.map((image, index) => toMovementPoints(landmarker.detectForVideo(image, timestamp + index + 1)));
        if (!targets.some((pose) => measuredJoints.filter((name) => pose.find((point) => point.name === name && point.score >= .35)).length >= 9)) {
          throw new Error("Öğretmen pozları ölçülemedi. Yeniden deneyebilirsin.");
        }

        startedAt = performance.now();
        setCameraReady(true);
        setCameraMessage("Tüm bedenini göster; öğretmenin hareketine eşlik et.");

        const detect = (now: number) => {
          if (disposed) return;
          animationFrame = requestAnimationFrame(detect);
          if (now - lastInferenceAt < 120 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
          lastInferenceAt = now;

          const rawPose = landmarker.detectForVideo(video, now).landmarks[0];
          if (!rawPose?.length) {
            matchedSince = 0;
            setScore(null);
            setCameraMessage("Tam bedenin kamerada görünecek şekilde biraz geri çekil.");
            drawMovementSkeleton(canvasRef.current, video, [], false);
            return;
          }

          const userPose = rawPose.map((point, index) => ({ name: landmarkNames[index] ?? `point-${index}`, x: point.x, y: point.y, score: point.visibility ?? 1 }));
          const result = compareMovementPhotoPoses(userPose, targets);
          const elapsed = now - startedAt;
          const nextSecondsLeft = Math.max(0, Math.ceil((practiceDurationMs - elapsed) / 1000));
          const passedTime = elapsed >= practiceDurationMs;

          if (result.score !== null && result.score >= completionThreshold) {
            if (!matchedSince) matchedSince = now;
            setCameraMessage(passedTime ? "Uyum yakalandı; hareket tamamlanıyor." : "Uyum yakalandı; 15 saniyelik akışı tamamla.");
          } else {
            matchedSince = 0;
            setCameraMessage(result.visible ? "Hareket pozunu öğretmeninkiyle eşleştirmeye devam et." : "Tam bedenin görünmüyor; kameradan biraz uzaklaş.");
          }

          drawMovementSkeleton(canvasRef.current, video, userPose, result.score !== null && result.score >= completionThreshold);
          if (now - lastUiUpdateAt > 180) {
            lastUiUpdateAt = now;
            setScore(result.score);
            setSecondsLeft(nextSecondsLeft);
          }

          if (passedTime && matchedSince && now - matchedSince >= 850 && !completionStarted) {
            completionStarted = true;
            setCompleted(true);
            completionTimer = window.setTimeout(() => {
              if (!disposed) onComplete();
            }, 1100);
          }
        };

        animationFrame = requestAnimationFrame(detect);
      } catch (error) {
        if (disposed) return;
        stream?.getTracks().forEach((track) => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        const message = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")
          ? "Kamera izni verilmedi. Site ayarlarından kamera iznini açıp yeniden dene."
          : error instanceof Error ? error.message : "Kamera açılamadı. Kamera izni verip yeniden dene.";
        setCameraError(message);
        setCameraMessage("");
      }
    };

    void start();
    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(completionTimer);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [active, movementOrder, onComplete, retryKey]);

  if (!active) return null;

  return (
    <div className={styles.movementCameraSplit}>
      <div className={styles.movementTeacherPanel}>
        <Image alt={`${movementName} hareketini yapan hoca`} className={`${styles.movementDemoPose} ${styles.movementDemoPoseStart}`} fill sizes="(max-width: 820px) 50vw, 24vw" src={`/images/body-lines-motion/${movementOrder}.jpg`} />
        <Image alt="" aria-hidden="true" className={`${styles.movementDemoPose} ${styles.movementDemoPoseEnd}`} fill sizes="(max-width: 820px) 50vw, 24vw" src={`/images/body-lines/${movementOrder}.jpg`} />
        <span className={styles.practicePanelBadge}>HOCA</span>
        <span className={styles.practicePanelCaption}>Hareketi izle ve eşlik et</span>
      </div>
      <div className={styles.movementUserPanel}>
        <video aria-label="Kamera görüntün" autoPlay className={styles.movementCameraVideo} muted playsInline ref={videoRef} />
        <canvas aria-hidden="true" className={styles.movementPoseCanvas} ref={canvasRef} />
        <span className={styles.practicePanelBadge}>SEN</span>
        {cameraError ? <div className={styles.movementCameraMessage} role="alert"><strong>Kamera açılamadı</strong><span>{cameraError}</span></div> : null}
        {!cameraReady && !cameraError ? <div className={styles.movementCameraMessage}><span>{cameraMessage}</span></div> : null}
        {completed ? <div className={styles.movementCompletedOverlay}><span>✓</span><strong>Tamamlandı</strong><small>%{score} hareket uyumu</small></div> : null}
      </div>
      <div className={styles.movementPracticeHud}>
        <div className={styles.movementScoreBlock}>
          <span>HAREKET UYUMU · HEDEF %70</span>
          <strong aria-live="polite">{score === null ? "—" : `%${score}`}</strong>
        </div>
        <div className={styles.movementScoreTrack} aria-label={`Hareket uyumu yüzde ${score ?? 0}; tamamlanma eşiği yüzde 70`} aria-valuetext={`${score ?? 0}% hareket uyumu; tamamlanma eşiği %70`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score ?? 0}>
          <i style={{ width: `${score ?? 0}%` }} />
          <b style={{ left: `${completionThreshold}%` }} />
        </div>
        <div className={styles.movementPracticeStatus}>
          <span>{completed ? "TAMAMLANDI" : cameraError ? "KAMERA İZNİ GEREKLİ" : cameraReady ? cameraMessage : "ÖLÇÜM HAZIRLANIYOR"}</span>
          <strong>{secondsLeft > 0 ? `00:${String(secondsLeft).padStart(2, "0")}` : score !== null && score >= completionThreshold ? "✓" : "%70 uyum bekleniyor"}</strong>
        </div>
      </div>
    </div>
  );
}

function loadReferenceImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Öğretmen hareket görselleri yüklenemedi."));
    image.src = src;
  });
}

function toMovementPoints(result: PoseLandmarkerResult): MovementPoint[] {
  const landmarks = result.landmarks[0];
  if (!landmarks) return [];
  return landmarks.map((point, index) => ({ name: landmarkNames[index] ?? `point-${index}`, x: point.x, y: point.y, score: point.visibility ?? 1 }));
}

function compareMovementPhotoPoses(user: MovementPoint[], references: MovementPoint[][]) {
  const visibleCount = measuredJoints.filter((name) => user.find((point) => point.name === name && point.score >= .42)).length;
  if (visibleCount < 9) return { score: null, visible: false };
  const bestMatch = references.reduce((best, reference) => {
    const score = scorePoseAgainstReference(user, reference);
    return score === null || (best !== null && best >= score) ? best : score;
  }, null as number | null);
  return { score: bestMatch, visible: true };
}

function scorePoseAgainstReference(user: MovementPoint[], reference: MovementPoint[]) {
  const normalize = (points: MovementPoint[]) => {
    const byName = new Map(points.map((point) => [point.name, point]));
    const leftShoulder = byName.get("left_shoulder"), rightShoulder = byName.get("right_shoulder");
    const leftHip = byName.get("left_hip"), rightHip = byName.get("right_hip");
    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;
    const centerX = (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4;
    const centerY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
    const bodyScale = Math.max(.001, Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y));
    return new Map(points.map((point) => [point.name, { x: (point.x - centerX) / bodyScale, y: (point.y - centerY) / bodyScale, score: point.score }]));
  };
  const current = normalize(user), target = normalize(reference);
  if (!current || !target) return null;
  const weights: Record<string, number> = { nose: .4, left_shoulder: .7, right_shoulder: .7, left_elbow: 1, right_elbow: 1, left_wrist: 1.25, right_wrist: 1.25, left_hip: .8, right_hip: .8, left_knee: .85, right_knee: .85, left_ankle: .65, right_ankle: .65 };
  let weightedError = 0, totalWeight = 0;
  for (const name of measuredJoints) {
    const actual = current.get(name), expected = target.get(name);
    if (!actual || !expected || actual.score < .42 || expected.score < .35) continue;
    const weight = weights[name] ?? 1;
    weightedError += Math.hypot(actual.x - expected.x, actual.y - expected.y) * weight;
    totalWeight += weight;
  }
  if (totalWeight < 7) return null;
  return Math.max(0, Math.min(100, Math.round(100 - (weightedError / totalWeight) * 110)));
}

function drawMovementSkeleton(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, pose: MovementPoint[], matched: boolean) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  if (!pose.length || !video.videoWidth || !video.videoHeight) return;
  const scale = Math.max(rect.width / video.videoWidth, rect.height / video.videoHeight);
  const offsetX = (rect.width - video.videoWidth * scale) / 2;
  const offsetY = (rect.height - video.videoHeight * scale) / 2;
  const coordinates = new Map(pose.map((point) => [point.name, { x: rect.width - (point.x * video.videoWidth * scale + offsetX), y: point.y * video.videoHeight * scale + offsetY, score: point.score }]));
  const links = [["left_shoulder", "right_shoulder"], ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"], ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"], ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"], ["left_hip", "right_hip"], ["left_hip", "left_knee"], ["left_knee", "left_ankle"], ["right_hip", "right_knee"], ["right_knee", "right_ankle"]];
  const color = matched ? "#9ef16f" : "#e3cd91";
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 2.5;
  context.lineCap = "round";
  context.shadowColor = color;
  context.shadowBlur = 10;
  for (const [from, to] of links) {
    const start = coordinates.get(from), end = coordinates.get(to);
    if (!start || !end || start.score < .35 || end.score < .35) continue;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
  for (const name of new Set(links.flat())) {
    const point = coordinates.get(name);
    if (!point || point.score < .35) continue;
    context.beginPath();
    context.arc(point.x, point.y, 3, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;
}
