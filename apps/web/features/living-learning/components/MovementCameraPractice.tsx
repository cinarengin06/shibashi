"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import type { PracticeSnapshot } from "@/features/practice/types";
import { formatSnapshotDate, formatSnapshotTime } from "@/lib/local-history-storage";
import { canonicalMarkers, compareMarkerMotion, trackTeacherWhiteMarkers, virtualBodyMarkers, type CanonicalMarkers, type MarkerMap, type MovementPoint } from "../lib/teacher-marker-tracking";
import styles from "./living-learning.module.css";

const landmarkNames = ["nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index"];
const measuredJoints = ["nose", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"];
const defaultCompletionThreshold = 70;
const practiceDurationMs = 15_000;
const scoreStorageKey = "shibashi-learning-target-score";
const photoIntervalMs = 3_000;
const celebrations = [{ emoji: "✨", text: "Harika!" }, { emoji: "🌟", text: "Müthiş!" }, { emoji: "🎉", text: "Süpersin!" }];

type PoseComparison = { score: number | null; visible: boolean; fullBody: boolean; jointScores: Record<string, number> };

export function MovementCameraPractice({ active, movementOrder, movementName, retryKey, onComplete, onPhotoCaptured }: {
  active: boolean;
  movementOrder: string;
  movementName: string;
  retryKey: number;
  onComplete: () => void;
  onPhotoCaptured: (snapshot: PracticeSnapshot) => Promise<boolean>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const teacherRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const thresholdRef = useRef(defaultCompletionThreshold);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraMessage, setCameraMessage] = useState("Kamera ve hareket modeli hazırlanıyor.");
  const [score, setScore] = useState<number | null>(null);
  const [targetScore, setTargetScore] = useState(defaultCompletionThreshold);
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [completed, setCompleted] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [celebration, setCelebration] = useState<{ emoji: string; text: string; count: number } | null>(null);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(scoreStorageKey));
    if (saved >= 0 && saved <= 100 && saved % 5 === 0) {
      thresholdRef.current = saved;
      setTargetScore(saved);
    }
  }, []);

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
    let celebrationTimer = 0;
    let startedAt = 0;
    let lastInferenceAt = 0;
    let lastUiUpdateAt = 0;
    let lastDetectionTimestamp = 0;
    const nextTimestamp = () => {
      lastDetectionTimestamp = Math.max(performance.now(), lastDetectionTimestamp + 1);
      return lastDetectionTimestamp;
    };
    let matchedSince = 0;
    let completionStarted = false;
    let smoothedScore: number | null = null;
    let lastValidScoreAt = 0;
    let motionAnchor: { at: number; user: MovementPoint[]; teacher: MovementPoint[] } | null = null;
    let movementScore: number | null = null;
    let markerMotionScore: number | null = null;
    let markerMotionAnchor: { at: number; teacher: CanonicalMarkers; user: CanonicalMarkers } | null = null;
    let previousTeacherMarkers: MarkerMap = {};
    let markerReadErrorShown = false;
    let lastTeacherTime = 0;
    let lastPhotoAt = -Infinity;
    let photoCount = 0;
    let photoPending = false;

    setCameraReady(false);
    setCameraError("");
    setCameraMessage("Kamera ve hareket modeli hazırlanıyor.");
    setScore(null);
    setSecondsLeft(15);
    setCompleted(false);
    setCapturedCount(0);
    setCelebration(null);

    const start = async () => {
      try {
        if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
          throw new Error("Kamera için sayfayı localhost veya HTTPS üzerinden açmalısın.");
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Bu tarayıcı kamera erişimini desteklemiyor.");
        }

        setCameraMessage("Kamera izni bekleniyor.");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 }, aspectRatio: { ideal: .75 } }, audio: false });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) throw new Error("Kamera görüntüsü başlatılamadı.");
        video.srcObject = stream;
        await video.play();

        setCameraMessage("Hoca videosu ve beden analizi hazırlanıyor.");
        const teacher = teacherRef.current;
        if (!teacher) throw new Error("Hoca videosu bulunamadı.");
        await waitForTeacherVideo(teacher);
        const markerCanvas = document.createElement("canvas");
        markerCanvas.width = 360;
        markerCanvas.height = Math.round(360 * teacher.videoHeight / teacher.videoWidth);
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

        startedAt = performance.now();
        setCameraReady(true);
        setCameraMessage("Hoca ile aynı anda hareket et; skorun canlı olarak değişecek.");

        const detect = (now: number) => {
          if (disposed) return;
          animationFrame = requestAnimationFrame(detect);
          if (now - lastInferenceAt < 160 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
          lastInferenceAt = now;

          if (teacher.paused || teacher.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            matchedSince = 0;
            setCameraMessage("Canlı uyum için hoca videosunu oynat.");
            return;
          }
          let rawTeacherPose, rawPose;
          try {
            rawTeacherPose = landmarker.detectForVideo(teacher, nextTimestamp());
            rawPose = landmarker.detectForVideo(video, nextTimestamp()).landmarks[0];
          }
          catch (error) {
            cancelAnimationFrame(animationFrame);
            stream?.getTracks().forEach((track) => track.stop());
            video.srcObject = null;
            setCameraError(error instanceof Error ? error.message : "Hareket analizi durdu. Yeniden deneyebilirsin.");
            return;
          }
          const elapsed = now - startedAt;
          const nextSecondsLeft = Math.max(0, Math.ceil((practiceDurationMs - elapsed) / 1000));
          const passedTime = elapsed >= practiceDurationMs;
          setSecondsLeft(nextSecondsLeft);
          if (!rawPose?.length || !rawTeacherPose.landmarks[0]?.length) {
            matchedSince = 0;
            motionAnchor = null;
            movementScore = null;
            markerMotionAnchor = null;
            markerMotionScore = null;
            previousTeacherMarkers = {};
            if (now - lastValidScoreAt > 1_500) {
              smoothedScore = null;
              setScore(null);
            }
            setCameraMessage(!rawPose?.length ? "Kamerada görünmüyorsun; biraz geri çekil." : "Hocanın bedeni videoda ölçülemedi.");
            drawMovementSkeleton(canvasRef.current, video, [], false);
            return;
          }

          const userPose = rawPose.map((point, index) => ({ name: landmarkNames[index] ?? `point-${index}`, x: point.x, y: point.y, score: point.visibility ?? 1 }));
          const teacherPose = toMovementPoints(rawTeacherPose);
          let teacherMarkers: MarkerMap = {};
          try { teacherMarkers = trackTeacherWhiteMarkers(teacher, teacherPose, markerCanvas, previousTeacherMarkers); }
          catch (error) {
            if (!markerReadErrorShown) console.warn("Hoca videosundaki beyaz işaretler okunamadı:", error);
            markerReadErrorShown = true;
          }
          const userMarkers = virtualBodyMarkers(userPose);
          const teacherMarkerPositions = canonicalMarkers(teacherMarkers, teacherPose, teacher.videoWidth / teacher.videoHeight);
          const userMarkerPositions = canonicalMarkers(userMarkers, userPose, video.videoWidth / video.videoHeight);
          if (teacher.currentTime < lastTeacherTime) {
            motionAnchor = null;
            movementScore = null;
            markerMotionAnchor = null;
            markerMotionScore = null;
            previousTeacherMarkers = {};
          }
          if (Object.keys(teacherMarkers).length) previousTeacherMarkers = teacherMarkers;
          lastTeacherTime = teacher.currentTime;
          if (!motionAnchor) motionAnchor = { at: now, user: userPose, teacher: teacherPose };
          else if (now - motionAnchor.at >= 600) {
            movementScore = comparePoseMotion(userPose, teacherPose, motionAnchor.user, motionAnchor.teacher, video.videoWidth / video.videoHeight, teacher.videoWidth / teacher.videoHeight);
            motionAnchor = { at: now, user: userPose, teacher: teacherPose };
          }
          if (!markerMotionAnchor) markerMotionAnchor = { at: now, teacher: teacherMarkerPositions, user: userMarkerPositions };
          else if (now - markerMotionAnchor.at >= 600) {
            markerMotionScore = compareMarkerMotion(teacherMarkerPositions, markerMotionAnchor.teacher, userMarkerPositions, markerMotionAnchor.user);
            markerMotionAnchor = { at: now, teacher: teacherMarkerPositions, user: userMarkerPositions };
          }
          const result = compareMovementPoses(userPose, teacherPose, video.videoWidth / video.videoHeight, teacher.videoWidth / teacher.videoHeight, movementScore, markerMotionScore);
          if (!result.visible) {
            motionAnchor = null;
            movementScore = null;
            markerMotionAnchor = null;
            markerMotionScore = null;
          }

          if (now - lastUiUpdateAt > 180) {
            lastUiUpdateAt = now;
            if (result.score !== null) {
              lastValidScoreAt = now;
              smoothedScore = smoothedScore === null ? result.score : smoothedScore + Math.max(-5, Math.min(5, result.score - smoothedScore));
              setScore(smoothedScore);
            } else if (now - lastValidScoreAt > 1_500) {
              smoothedScore = null;
              setScore(null);
            }
          }

          const qualified = result.fullBody && result.score !== null && smoothedScore !== null && smoothedScore >= thresholdRef.current;
          if (qualified) {
            if (!matchedSince) matchedSince = now;
            setCameraMessage(photoCount < 3 ? `Hedefe ulaştın; ${3 - photoCount} fotoğraf daha çekilecek.` : passedTime ? "Hedef uyum yakalandı; hareket tamamlanıyor." : "Hedefe ulaştın; hareketi sürdür.");
          } else {
            matchedSince = 0;
            setCameraMessage(result.fullBody ? "Hocanın o anki hareketine eşlik et." : result.visible ? "Canlı skor kısmi kadrajdan geliyor; tamamlamak için ayakların da görünsün." : "Bedenini kamerada göstermek için biraz geri çekil.");
          }

          drawMovementSkeleton(canvasRef.current, video, result.visible ? userPose : [], qualified, result.jointScores, thresholdRef.current);
          if (result.visible) drawUserReferenceMarkers(canvasRef.current, video, userMarkers, teacherMarkers, result.jointScores, thresholdRef.current);

          if (qualified && photoCount < 3 && !photoPending && now - lastPhotoAt >= photoIntervalMs) {
            const snapshot = createMovementPhoto(video, canvasRef.current, Number(movementOrder), movementName, Math.round(smoothedScore ?? 0));
            if (snapshot) {
              photoPending = true;
              lastPhotoAt = now;
              void onPhotoCaptured(snapshot).then((saved) => {
                if (disposed) return;
                if (!saved) {
                  setCameraMessage("Fotoğraf saklanamadı. Tarayıcı depolamasını kontrol et.");
                  return;
                }
                photoCount += 1;
                setCapturedCount(photoCount);
                setCelebration({ ...celebrations[photoCount - 1], count: photoCount });
                window.clearTimeout(celebrationTimer);
                celebrationTimer = window.setTimeout(() => { if (!disposed) setCelebration(null); }, 2_200);
              }).catch(() => {
                if (!disposed) setCameraMessage("Fotoğraf saklanamadı. Tarayıcı depolamasını kontrol et.");
              }).finally(() => { photoPending = false; });
            }
          }

          if (passedTime && photoCount === 3 && matchedSince && now - matchedSince >= 850 && !completionStarted) {
            completionStarted = true;
            setCompleted(true);
            completionTimer = window.setTimeout(() => {
              if (!disposed) onComplete();
            }, 2_400);
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
      window.clearTimeout(celebrationTimer);
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [active, movementOrder, movementName, onComplete, onPhotoCaptured, retryKey]);

  if (!active) return null;

  const scoreColor = score === null ? "#d8c9a6" : `hsl(${Math.round(12 + Math.min(1, score / Math.max(1, targetScore)) * 116)} 77% 62%)`;
  const showFramingWarning = cameraReady && !cameraError && !completed && (
    cameraMessage.startsWith("Bedenini kamerada") ||
    cameraMessage.startsWith("Kamerada görünmüyorsun") ||
    cameraMessage.startsWith("Canlı skor kısmi kadrajdan")
  );

  return (
    <div className={styles.movementCameraSplit}>
      <div className={styles.movementTeacherPanel}>
        <video aria-label={`${movementName} hoca videosu`} autoPlay controls key={movementOrder} loop muted playsInline poster={`/images/shibashi-new/${Number(movementOrder)}.jpg`} ref={teacherRef} src={`/videos/shibashi/${Number(movementOrder)}.mp4`} />
        <span className={styles.practicePanelBadge}>HOCA</span>
        <span className={styles.practicePanelCaption}>Hareketi izle ve eşlik et</span>
      </div>
      <div className={styles.movementUserPanel}>
        <video aria-label="Kamera görüntün" autoPlay className={styles.movementCameraVideo} muted playsInline ref={videoRef} />
        <canvas aria-hidden="true" className={styles.movementPoseCanvas} ref={canvasRef} />
        <span className={styles.practicePanelBadge}>SEN</span>
        {cameraError ? <div className={styles.movementCameraMessage} role="alert"><strong>Kamera açılamadı</strong><span>{cameraError}</span></div> : null}
        {!cameraReady && !cameraError ? <div className={styles.movementCameraMessage}><span>{cameraMessage}</span></div> : null}
        {showFramingWarning ? <div aria-live="polite" className={styles.movementFramingWarning} role="status"><span>↔</span><strong>Bedenini kamerada göstermek için biraz geri çekil.</strong><small>Başın ve ayakların kadrajda görünsün.</small></div> : null}
        {celebration && !completed ? <div aria-live="polite" className={styles.movementCelebration}><span>{celebration.emoji}</span><strong>{celebration.text}</strong><small>Fotoğraf {celebration.count}/3 kaydedildi</small></div> : null}
        {completed ? <div className={styles.movementCompletedOverlay}><span>🎉</span><strong>Süpersin, başardın!</strong><small>%{score} hareket uyumu · 3 fotoğraf kaydedildi</small></div> : null}
      </div>
      <div className={styles.movementPracticeHud} style={{ "--score-color": scoreColor, "--live-progress": `${score ?? 0}%` } as CSSProperties}>
        <div className={styles.movementScoreBlock}>
          <span>CANLI HAREKET UYUMU</span>
          <strong aria-live="polite">{score === null ? "—" : `%${score}`}</strong>
        </div>
        <div className={styles.movementScoreControls}>
          <label className={styles.movementTargetControl}>
            <span>HEDEF UYUM <strong>%{targetScore}</strong></span>
            <input aria-label="Hedef uyum yüzdesi; dolu kısım canlı uyumu gösterir" max={100} min={0} onChange={(event) => { const value = Number(event.target.value); thresholdRef.current = value; setTargetScore(value); window.localStorage.setItem(scoreStorageKey, String(value)); }} step={5} type="range" value={targetScore} />
          </label>
        </div>
        <div className={styles.movementPracticeStatus}>
          <span>{completed ? "TAMAMLANDI" : cameraError ? "KAMERA İZNİ GEREKLİ" : showFramingWarning ? "KADRAJINI DÜZELT" : cameraReady ? cameraMessage : "ÖLÇÜM HAZIRLANIYOR"}</span>
          <strong>{completed ? "✓" : `${capturedCount}/3 fotoğraf · ${secondsLeft > 0 ? `00:${String(secondsLeft).padStart(2, "0")}` : `%${targetScore} hedefi bekleniyor`}`}</strong>
        </div>
      </div>
    </div>
  );
}

function createMovementPhoto(video: HTMLVideoElement, poseCanvas: HTMLCanvasElement | null, movementId: number, movementName: string, score: number): PracticeSnapshot | null {
  if (!video.videoWidth || !video.videoHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
  const panel = video.getBoundingClientRect();
  if (!panel.width || !panel.height) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 540;
  canvas.height = Math.round(540 * panel.height / panel.width);
  const context = canvas.getContext("2d");
  if (!context) return null;
  const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
  const videoWidth = video.videoWidth * scale;
  const videoHeight = video.videoHeight * scale;
  context.save();
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, (canvas.width - videoWidth) / 2, (canvas.height - videoHeight) / 2, videoWidth, videoHeight);
  context.restore();
  if (poseCanvas?.width && poseCanvas.height) context.drawImage(poseCanvas, 0, 0, canvas.width, canvas.height);

  const now = new Date();
  const footerHeight = Math.max(115, canvas.height * .16);
  const gradient = context.createLinearGradient(0, canvas.height - footerHeight, 0, canvas.height);
  gradient.addColorStop(0, "rgba(10, 25, 18, 0)");
  gradient.addColorStop(1, "rgba(10, 25, 18, .9)");
  context.fillStyle = gradient;
  context.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);
  context.fillStyle = "#f5f1e6";
  context.font = "700 24px system-ui, sans-serif";
  context.fillText(movementName, 18, canvas.height - 52, canvas.width - 115);
  context.font = "500 15px system-ui, sans-serif";
  context.fillText(`${formatSnapshotDate(now)} · ${formatSnapshotTime(now)}`, 18, canvas.height - 23, canvas.width - 115);
  context.fillStyle = "#a9efc3";
  context.font = "800 31px system-ui, sans-serif";
  context.textAlign = "right";
  context.fillText(`%${score}`, canvas.width - 18, canvas.height - 29);

  return {
    id: `shibashi18-${movementId}-${now.getTime()}-${Math.round(performance.now())}`,
    dateKey: formatSnapshotDate(now),
    timeLabel: formatSnapshotTime(now),
    createdAt: now.toISOString(),
    movementId,
    movementName,
    score,
    shenName: "Shibashi",
    imageData: canvas.toDataURL("image/jpeg", .82),
    trainerVisible: false,
  };
}

function waitForTeacherVideo(video: HTMLVideoElement): Promise<void> {
  if (video.error) return Promise.reject(new Error("Hoca videosu yüklenemedi."));
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("error", failed);
    };
    const ready = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("Hoca videosu yüklenemedi.")); };
    const timeout = window.setTimeout(failed, 15_000);
    video.addEventListener("loadeddata", ready, { once: true });
    video.addEventListener("error", failed, { once: true });
  });
}

function toMovementPoints(result: PoseLandmarkerResult): MovementPoint[] {
  const landmarks = result.landmarks[0];
  if (!landmarks) return [];
  return landmarks.map((point, index) => ({ name: landmarkNames[index] ?? `point-${index}`, x: point.x, y: point.y, score: point.visibility ?? 1 }));
}

function normalizeMovementPose(points: MovementPoint[], aspectRatio: number) {
  const byName = new Map(points.map((point) => [point.name, point]));
  const left = byName.get("left_shoulder"), right = byName.get("right_shoulder");
  if (!left || !right || left.score < .35 || right.score < .35) return null;
  const centerX = (left.x + right.x) / 2;
  const centerY = (left.y + right.y) / 2;
  const scale = Math.max(.04, Math.hypot((left.x - right.x) * aspectRatio, left.y - right.y));
  return new Map(points.map((point) => [point.name, { x: (point.x - centerX) * aspectRatio / scale, y: (point.y - centerY) / scale, score: point.score }]));
}

const jointWeights: Record<string, number> = { nose: .35, left_shoulder: .5, right_shoulder: .5, left_elbow: 1, right_elbow: 1, left_wrist: 1.3, right_wrist: 1.3, left_hip: .7, right_hip: .7, left_knee: .7, right_knee: .7, left_ankle: .6, right_ankle: .6 };

function compareMovementPoses(user: MovementPoint[], teacher: MovementPoint[], userAspect: number, teacherAspect: number, motionScore: number | null, markerMotionScore: number | null): PoseComparison {
  const current = normalizeMovementPose(user, userAspect), reference = normalizeMovementPose(teacher, teacherAspect);
  const empty: PoseComparison = { score: null, visible: false, fullBody: false, jointScores: {} };
  if (!current || !reference) return empty;
  const userByName = new Map(user.map((point) => [point.name, point]));
  const nose = userByName.get("nose");
  const leftShoulder = userByName.get("left_shoulder"), rightShoulder = userByName.get("right_shoulder");
  const leftHip = userByName.get("left_hip"), rightHip = userByName.get("right_hip");
  const leftKnee = userByName.get("left_knee"), rightKnee = userByName.get("right_knee");
  const leftAnkle = userByName.get("left_ankle"), rightAnkle = userByName.get("right_ankle");
  const shoulderY = ((leftShoulder?.y ?? 0) + (rightShoulder?.y ?? 0)) / 2;
  const hipY = ((leftHip?.y ?? 0) + (rightHip?.y ?? 0)) / 2;
  const kneeY = ((leftKnee?.y ?? 0) + (rightKnee?.y ?? 0)) / 2;
  const ankleY = ((leftAnkle?.y ?? 0) + (rightAnkle?.y ?? 0)) / 2;
  const plausibleUpperBody = Boolean(nose && leftShoulder && rightShoulder && nose.score >= .4 &&
    nose.y + .045 < shoulderY && Math.abs(leftShoulder.x - rightShoulder.x) >= .08 &&
    (!leftHip || !rightHip || Math.min(leftHip.score, rightHip.score) < .4 || hipY > shoulderY + .07));
  if (!plausibleUpperBody) return empty;
  const fullBody = ["nose", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"].every((name) => {
    const point = userByName.get(name);
    return point && point.score >= .4 && point.x > .02 && point.x < .98 && point.y > .02 && point.y < .98;
  }) && Boolean(nose && nose.y < .42 && ankleY > .7 && ankleY - nose.y > .48 &&
    hipY > shoulderY + .09 && kneeY > hipY + .08 && ankleY > kneeY + .08);
  let weightedError = 0;
  let totalWeight = 0;
  let visibleJoints = 0;
  const jointScores: Record<string, number> = {};
  for (const name of measuredJoints) {
    const actual = current.get(name), expected = reference.get(name);
    if (!actual || !expected || actual.score < .35 || expected.score < .35) continue;
    const weight = jointWeights[name] ?? 1;
    const distance = Math.hypot(actual.x - expected.x, actual.y - expected.y);
    weightedError += distance * weight;
    totalWeight += weight;
    visibleJoints++;
    jointScores[name] = Math.max(0, Math.min(100, Math.round(100 - distance * 105)));
  }
  if (visibleJoints < 5 || totalWeight < 3) return { ...empty, jointScores };
  const postureScore = Math.max(0, Math.min(100, 100 - weightedError / totalWeight * 105));
  const poseWeight = motionScore === null ? 0 : .15;
  const markerWeight = markerMotionScore === null ? 0 : .25;
  const postureWeight = 1 - poseWeight - markerWeight;
  const score = Math.round(postureScore * postureWeight + (motionScore ?? 0) * poseWeight + (markerMotionScore ?? 0) * markerWeight);
  return { score, visible: true, fullBody, jointScores };
}

function comparePoseMotion(user: MovementPoint[], teacher: MovementPoint[], previousUser: MovementPoint[], previousTeacher: MovementPoint[], userAspect: number, teacherAspect: number): number | null {
  const current = normalizeMovementPose(user, userAspect), reference = normalizeMovementPose(teacher, teacherAspect);
  const oldUser = normalizeMovementPose(previousUser, userAspect), oldTeacher = normalizeMovementPose(previousTeacher, teacherAspect);
  if (!current || !reference || !oldUser || !oldTeacher) return null;
  let error = 0, teacherMotion = 0, weight = 0;
  for (const name of measuredJoints) {
    const userNow = current.get(name), teacherNow = reference.get(name), userBefore = oldUser.get(name), teacherBefore = oldTeacher.get(name);
    if (!userNow || !teacherNow || !userBefore || !teacherBefore || Math.min(userNow.score, teacherNow.score, userBefore.score, teacherBefore.score) < .4) continue;
    const dx = userNow.x - userBefore.x - (teacherNow.x - teacherBefore.x);
    const dy = userNow.y - userBefore.y - (teacherNow.y - teacherBefore.y);
    const targetDelta = Math.hypot(teacherNow.x - teacherBefore.x, teacherNow.y - teacherBefore.y);
    const jointWeight = jointWeights[name] ?? 1;
    error += Math.hypot(dx, dy) * jointWeight;
    teacherMotion += targetDelta * jointWeight;
    weight += jointWeight;
  }
  if (weight < 3 || teacherMotion / weight < .025) return null;
  return Math.max(0, Math.min(100, Math.round(100 - error / weight * 140)));
}

function drawMovementSkeleton(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, pose: MovementPoint[], matched: boolean, jointScores: Record<string, number> = {}, target = defaultCompletionThreshold) {
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
  const colorFor = (name: string) => {
    const score = jointScores[name];
    if (score === undefined) return "#e3cd91";
    if (matched || score >= target) return "#9ef16f";
    return score >= target * .75 ? "#d8e97b" : "#f49678";
  };
  context.lineWidth = 2.5;
  context.lineCap = "round";
  context.shadowBlur = 10;
  for (const [from, to] of links) {
    const start = coordinates.get(from), end = coordinates.get(to);
    if (!start || !end || start.score < .35 || end.score < .35) continue;
    const color = Math.min(jointScores[from] ?? 0, jointScores[to] ?? 0) >= target ? "#9ef16f" : colorFor(from);
    context.strokeStyle = color;
    context.shadowColor = color;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
  for (const name of new Set(links.flat())) {
    const point = coordinates.get(name);
    if (!point || point.score < .35) continue;
    const color = colorFor(name);
    context.fillStyle = color;
    context.shadowColor = color;
    context.beginPath();
    context.arc(point.x, point.y, 3, 0, Math.PI * 2);
    context.fill();
  }
  context.shadowBlur = 0;
}

function drawUserReferenceMarkers(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, userMarkers: MarkerMap, teacherMarkers: MarkerMap, jointScores: Record<string, number>, target: number) {
  if (!canvas || !video.videoWidth || !video.videoHeight) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  const rect = canvas.getBoundingClientRect();
  const scale = Math.max(rect.width / video.videoWidth, rect.height / video.videoHeight);
  const offsetX = (rect.width - video.videoWidth * scale) / 2;
  const offsetY = (rect.height - video.videoHeight * scale) / 2;
  for (const name of Object.keys(teacherMarkers)) {
    const point = userMarkers[name];
    if (!point || point.confidence < .35) continue;
    const x = rect.width - (point.x * video.videoWidth * scale + offsetX);
    const y = point.y * video.videoHeight * scale + offsetY;
    const jointName = name.replace("_rib", "_hip").replace("_shin", "_knee");
    const color = (jointScores[jointName] ?? 0) >= target ? "#9ef16f" : "#f4a785";
    context.beginPath();
    context.arc(x, y, 7, 0, Math.PI * 2);
    context.strokeStyle = "#f8f8ef";
    context.fillStyle = color;
    context.lineWidth = 2;
    context.shadowColor = color;
    context.shadowBlur = 12;
    context.fill();
    context.stroke();
  }
  context.shadowBlur = 0;
}
