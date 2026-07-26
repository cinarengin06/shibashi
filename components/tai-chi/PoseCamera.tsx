"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPoseLandmarker } from "@/lib/pose/createPoseLandmarker";
import { PoseCanvas } from "@/components/tai-chi/PoseCanvas";
import type { JointStatus, PoseLandmark } from "@/types/pose";

type CameraStatus = "idle" | "loading-model" | "requesting" | "open" | "denied" | "unsupported" | "error";

const ANALYSIS_INTERVAL_MS = 1000 / 15;
const SMOOTHING_ALPHA = 0.38;

function smoothLandmarks(previous: PoseLandmark[], next: PoseLandmark[]): PoseLandmark[] {
  if (!previous.length || previous.length !== next.length) return next;
  return next.map((point, index) => ({
    x: previous[index].x + (point.x - previous[index].x) * SMOOTHING_ALPHA,
    y: previous[index].y + (point.y - previous[index].y) * SMOOTHING_ALPHA,
    z: previous[index].z + (point.z - previous[index].z) * SMOOTHING_ALPHA,
    visibility: point.visibility,
    presence: point.presence,
  }));
}

export function PoseCamera({
  jointStatus,
  onCameraClosed,
  onLandmarks,
}: {
  jointStatus: Partial<Record<number, JointStatus>>;
  onCameraClosed: () => void;
  onLandmarks: (landmarks: PoseLandmark[] | null, timestamp: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastAnalysisAtRef = useRef(0);
  const smoothedRef = useRef<PoseLandmark[]>([]);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [message, setMessage] = useState("Kamerayı açarak harekete başla.");
  const [landmarks, setLandmarks] = useState<PoseLandmark[]>([]);
  const [size, setSize] = useState({ width: 640, height: 480 });

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    smoothedRef.current = [];
    setLandmarks([]);
    setStatus("idle");
    setMessage("Kamera kapalı.");
    onCameraClosed();
  }, [onCameraClosed]);

  const analyze = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const now = performance.now();
    if (now - lastAnalysisAtRef.current < ANALYSIS_INTERVAL_MS || video.currentTime === lastVideoTimeRef.current) {
      rafRef.current = requestAnimationFrame(() => void analyze());
      return;
    }
    lastAnalysisAtRef.current = now;
    lastVideoTimeRef.current = video.currentTime;

    try {
      const landmarker = await createPoseLandmarker();
      const result = landmarker.detectForVideo(video, now);
      const pose = result.landmarks[0] as PoseLandmark[] | undefined;
      if (pose?.length) {
        const smoothed = smoothLandmarks(smoothedRef.current, pose);
        smoothedRef.current = smoothed;
        setLandmarks(smoothed);
        onLandmarks(smoothed, now);
      } else {
        setLandmarks([]);
        onLandmarks(null, now);
      }
    } catch {
      if (mountedRef.current) {
        setStatus("error");
        setMessage("Poz modeli çalıştırılamadı. Sayfayı yenileyip tekrar dene.");
      }
      return;
    }
    rafRef.current = requestAnimationFrame(() => void analyze());
  }, [onLandmarks]);

  const startCamera = useCallback(async () => {
    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setStatus("error");
      setMessage("Kamera için uygulamayı HTTPS veya localhost üzerinden açmalısın.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      setMessage("Bu tarayıcı kamera erişimini desteklemiyor. Güncel Chrome veya Safari kullan.");
      return;
    }

    try {
      setStatus("requesting");
      setMessage("Kamera izni bekleniyor…");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setStatus("loading-model");
      setMessage("Hareket modeli yükleniyor…");
      await createPoseLandmarker();
      if (!mountedRef.current) return;
      setStatus("open");
      setMessage("Kamera açık. Tüm bedenini kadraja al.");
      rafRef.current = requestAnimationFrame(() => void analyze());
    } catch (error) {
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
      setStatus(denied ? "denied" : "error");
      setMessage(denied
        ? "Kamera izni reddedildi. Adres çubuğundaki kamera simgesinden izin verip tekrar dene."
        : "Kamera açılamadı. Başka bir uygulama kamerayı kullanıyor olabilir.");
    }
  }, [analyze]);

  useEffect(() => {
    mountedRef.current = true;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.round(entry.contentRect.width));
      const height = Math.max(1, Math.round(entry.contentRect.height));
      setSize({ width, height });
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      mountedRef.current = false;
      observer.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const isOpen = status === "open" || status === "loading-model";
  return (
    <div className="tc-camera-shell">
      <div className="tc-camera-viewport" ref={containerRef}>
        <video className="tc-camera-video" muted playsInline ref={videoRef} />
        {isOpen ? <PoseCanvas height={size.height} jointStatus={jointStatus} landmarks={landmarks} width={size.width} /> : null}
        {!isOpen ? (
          <div className="tc-camera-empty">
            <strong>Kolları Yükseltme</strong>
            <span>{message}</span>
            <button className="tc-primary-button" disabled={status === "requesting"} onClick={() => void startCamera()} type="button">
              {status === "requesting" ? "İzin Bekleniyor" : status === "denied" || status === "error" ? "Tekrar Dene" : "Kamerayı Aç"}
            </button>
          </div>
        ) : null}
        {status === "loading-model" ? <div className="tc-model-loading">Hareket modeli yükleniyor…</div> : null}
      </div>
      {isOpen ? (
        <button className="tc-secondary-button" onClick={stopCamera} type="button">Kamerayı Kapat</button>
      ) : null}
    </div>
  );
}
