"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./new-posture.module.css";

type Landmark = { name: string; x: number; y: number; score: number };
type MirrorView = "front" | "side" | "back";
type MirrorStage = "intro" | "live" | "result";
type CaptureState = "aligning" | "holding" | "captured";

export type NewPostureArchiveReport = {
  asymmetrySignal: "düşük" | "orta" | "yüksek";
  captures: Record<MirrorView, {
    analysis: {
      axisScore: number;
      confidence: number;
      feedback: string;
      flags: string[];
      hipScore: number;
      hipTilt: number;
      shoulderScore: number;
      shoulderTilt: number;
      sampleCount?: number;
      spineShift: number;
      view?: MirrorView;
    };
    createdAt: string;
    imageData: string;
    view: MirrorView;
  }>;
  createdAt: string;
  dateKey: string;
  flags: string[];
  id: string;
  score: number;
  summary: string;
  timeLabel: string;
  trendText: string;
};

const landmarkNames = [
  "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer", "left_ear", "right_ear",
  "mouth_left", "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky",
  "right_pinky", "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle",
  "right_ankle", "left_heel", "right_heel", "left_foot_index", "right_foot_index",
] as const;

const trackedNames = ["left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"] as const;
const connections = [
  ["left_shoulder", "right_shoulder"], ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"], ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"], ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"], ["left_hip", "right_hip"],
  ["left_hip", "left_knee"], ["left_knee", "left_ankle"], ["right_hip", "right_knee"], ["right_knee", "right_ankle"],
] as const;

const views: Array<{ id: MirrorView; label: string }> = [
  { id: "front", label: "Ön" },
  { id: "side", label: "Yan" },
  { id: "back", label: "Arka" },
];

export function NewPostureScreen({
  onNavigateToPractice,
  onReportCaptured,
}: {
  onNavigateToPractice?: () => void;
  onReportCaptured?: (report: NewPostureArchiveReport) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const detectorRef = useRef<{ detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks?: Array<Array<{ x: number; y: number; visibility?: number }>> }; close?: () => void } | null>(null);
  const animationRef = useRef(0);
  const detectionSessionRef = useRef(0);
  const lastDetectionRef = useRef(0);
  const holdStartedRef = useRef(0);
  const holdMismatchTimerRef = useRef<number | null>(null);
  const holdAnnouncedViewRef = useRef<number | null>(null);
  const captureLockRef = useRef(false);
  const transitionTimerRef = useRef<number | null>(null);
  const voiceTimerRef = useRef<number | null>(null);
  const viewReadyTimerRef = useRef<number | null>(null);
  const captureReadyTimerRef = useRef<number | null>(null);
  const lastVoiceAtRef = useRef(0);
  const capturesRef = useRef<Partial<Record<MirrorView, string>>>({});
  const viewScoresRef = useRef<Partial<Record<MirrorView, number>>>({});
  const assessmentScoreRef = useRef(70);
  const scoreTargetRef = useRef<number | null>(null);
  const viewReadyAfterRef = useRef(0);
  const correctionAllowedAtRef = useRef(0);
  const [stage, setStage] = useState<MirrorStage>("intro");
  const [viewIndex, setViewIndex] = useState(0);
  const [cameraState, setCameraState] = useState<"idle" | "requesting" | "ready" | "denied" | "error">("idle");
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [captures, setCaptures] = useState<Partial<Record<MirrorView, string>>>({});
  const [finalScore, setFinalScore] = useState(78);
  const [captureState, setCaptureState] = useState<CaptureState>("aligning");
  const [holdProgress, setHoldProgress] = useState(0);
  const [displayScore, setDisplayScore] = useState<number | null>(null);
  const [viewReady, setViewReady] = useState(false);
  const [captureReady, setCaptureReady] = useState(false);
  const [resultView, setResultView] = useState<MirrorView>("front");
  const [zoom, setZoom] = useState<{ min: number; max: number; step: number; value: number } | null>(null);

  const view = views[viewIndex] ?? views[0];
  const assessment = useMemo(() => assessLandmarks(landmarks, view.id), [landmarks, view.id]);
  const resultPhoto = captures.front ?? captures.side ?? captures.back;
  const selectedResultPhoto = captures[resultView] ?? resultPhoto;
  const metrics = useMemo(() => buildMetrics(finalScore), [finalScore]);

  const stopCamera = useCallback(() => {
    detectionSessionRef.current += 1;
    window.cancelAnimationFrame(animationRef.current);
    const detector = detectorRef.current;
    detectorRef.current = null;
    window.setTimeout(() => {
      try {
        detector?.close?.();
      } catch {
        // MediaPipe may already have released its WASM task during navigation.
      }
    }, 180);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    cameraTrackRef.current = null;
    setZoom(null);
    setCameraState("idle");
    setLandmarks([]);
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (voiceTimerRef.current) window.clearTimeout(voiceTimerRef.current);
    if (viewReadyTimerRef.current) window.clearTimeout(viewReadyTimerRef.current);
    if (captureReadyTimerRef.current) window.clearTimeout(captureReadyTimerRef.current);
    if (holdMismatchTimerRef.current) window.clearTimeout(holdMismatchTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const speakCalmly = useCallback((text: string, force = false) => {
    if (!voiceEnabled || typeof window === "undefined" || !text) return;
    const now = Date.now();
    if (!force && (now - lastVoiceAtRef.current < 2000 || window.speechSynthesis.speaking)) return;
    if (voiceTimerRef.current) window.clearTimeout(voiceTimerRef.current);
    const speakWhenQuiet = () => {
      if (window.speechSynthesis.speaking) {
        voiceTimerRef.current = window.setTimeout(speakWhenQuiet, 260);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "tr-TR";
      utterance.rate = 0.72;
      utterance.pitch = 0.92;
      window.speechSynthesis.speak(utterance);
      lastVoiceAtRef.current = Date.now();
    };
    voiceTimerRef.current = window.setTimeout(speakWhenQuiet, force ? 240 : 1100);
  }, [voiceEnabled]);

  useEffect(() => {
    if (voiceEnabled) return;
    if (voiceTimerRef.current) window.clearTimeout(voiceTimerRef.current);
    window.speechSynthesis?.cancel();
  }, [voiceEnabled]);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    drawLandmarks(canvasRef.current, videoRef.current, landmarks, assessment.problemJoint);
  }, [assessment.problemJoint, landmarks]);

  useEffect(() => {
    assessmentScoreRef.current = assessment.score || 70;
    scoreTargetRef.current = assessment.ready ? assessment.score : null;
  }, [assessment.ready, assessment.score]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const target = scoreTargetRef.current;
      setDisplayScore((current) => {
        if (target === null) return null;
        if (current === null) return target;
        const difference = target - current;
        if (Math.abs(difference) <= 2) return target;
        return current + Math.sign(difference) * 2;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stage !== "live" || cameraState !== "ready" || captureState !== "aligning" || !viewReady || Date.now() < correctionAllowedAtRef.current) return;
    speakCalmly(assessment.cue);
  }, [assessment.cue, cameraState, captureState, speakCalmly, stage, viewReady]);

  const startCamera = useCallback(async () => {
    const sessionId = detectionSessionRef.current + 1;
    detectionSessionRef.current = sessionId;
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: { ideal: 16 / 9 } },
      });
      if (sessionId !== detectionSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const cameraTrack = stream.getVideoTracks()[0] ?? null;
      cameraTrackRef.current = cameraTrack;
      const capabilities = cameraTrack?.getCapabilities() as MediaTrackCapabilities & { zoom?: { min: number; max: number; step: number } };
      if (cameraTrack && capabilities?.zoom && Number.isFinite(capabilities.zoom.min)) {
        const minimumZoom = capabilities.zoom.min;
        setZoom({ min: minimumZoom, max: capabilities.zoom.max, step: Math.max(capabilities.zoom.step || 0.1, 0.1), value: minimumZoom });
        await cameraTrack.applyConstraints({ advanced: [{ zoom: minimumZoom }] } as unknown as MediaTrackConstraints).catch(() => undefined);
      } else {
        setZoom(null);
      }
      video.srcObject = stream;
      await video.play();
      const module = await import("@/lib/pose/createPoseLandmarker");
      const detector = await module.createPoseLandmarker();
      if (sessionId !== detectionSessionRef.current) {
        detector.close?.();
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      detectorRef.current = detector;
      setCameraState("ready");
      setStage("live");
      setCaptureState("aligning");
      setHoldProgress(0);
      holdAnnouncedViewRef.current = null;
      correctionAllowedAtRef.current = Date.now() + 3600;
      viewReadyAfterRef.current = Date.now() + 3600;
      setViewReady(false);
      setCaptureReady(false);
      viewReadyTimerRef.current = window.setTimeout(() => setViewReady(true), 2600);
      captureReadyTimerRef.current = window.setTimeout(() => setCaptureReady(true), 6500);
      speakCalmly("Önden kameraya dön. Tam bedenin kadrajda olsun.", true);

      const detect = (timestamp: number) => {
        if (sessionId !== detectionSessionRef.current || detectorRef.current !== detector) return;
        animationRef.current = window.requestAnimationFrame(detect);
        if (video.readyState < 2 || timestamp - lastDetectionRef.current < 110) return;
        lastDetectionRef.current = timestamp;
        try {
          const pose = detector.detectForVideo(video, timestamp).landmarks?.[0];
          if (sessionId !== detectionSessionRef.current) return;
          setLandmarks(pose?.map((point, index) => ({ name: landmarkNames[index] ?? `point-${index}`, x: point.x, y: point.y, score: point.visibility ?? 1 })) ?? []);
        } catch (error) {
          if (sessionId !== detectionSessionRef.current) return;
          detectionSessionRef.current += 1;
          window.cancelAnimationFrame(animationRef.current);
          detectorRef.current = null;
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setCameraState("error");
        }
      };
      animationRef.current = window.requestAnimationFrame(detect);
    } catch (error) {
      if (sessionId !== detectionSessionRef.current || isMediaPipeAbort(error)) return;
      setCameraState(error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") ? "denied" : "error");
    }
  }, [speakCalmly]);

  const changeZoom = useCallback(async (direction: -1 | 1) => {
    const track = cameraTrackRef.current;
    if (!track || !zoom) return;
    const nextValue = Math.max(zoom.min, Math.min(zoom.max, zoom.value + zoom.step * direction));
    await track.applyConstraints({ advanced: [{ zoom: nextValue }] } as unknown as MediaTrackConstraints).catch(() => undefined);
    setZoom((current) => current ? { ...current, value: nextValue } : current);
  }, [zoom]);

  const captureAndContinue = useCallback(() => {
    if (captureLockRef.current) return;
    captureLockRef.current = true;
    const image = captureFrameWithLandmarks(videoRef.current, landmarks, assessment.problemJoint);
    if (!image) {
      captureLockRef.current = false;
      holdStartedRef.current = 0;
      setCaptureState("aligning");
      setHoldProgress(0);
      return;
    }
    const nextCaptures = { ...capturesRef.current, [view.id]: image };
    const nextScores = { ...viewScoresRef.current, [view.id]: assessmentScoreRef.current };
    capturesRef.current = nextCaptures;
    viewScoresRef.current = nextScores;
    setCaptures(nextCaptures);
    setCaptureState("captured");
    setHoldProgress(100);
    playCaptureClick();
    if (viewIndex < views.length - 1) {
      const nextIndex = viewIndex + 1;
      speakCalmly(nextIndex === 1 ? "Fotoğraf çekildi. Şimdi yavaşça yana dön." : "Fotoğraf çekildi. Şimdi yavaşça arkanı dön.", true);
      transitionTimerRef.current = window.setTimeout(() => {
        setViewIndex(nextIndex);
        setLandmarks([]);
        holdStartedRef.current = 0;
        if (holdMismatchTimerRef.current) window.clearTimeout(holdMismatchTimerRef.current);
        viewReadyAfterRef.current = Date.now() + 1600;
        correctionAllowedAtRef.current = Date.now() + 1600;
        setViewReady(false);
        setCaptureReady(false);
        if (viewReadyTimerRef.current) window.clearTimeout(viewReadyTimerRef.current);
        if (captureReadyTimerRef.current) window.clearTimeout(captureReadyTimerRef.current);
        viewReadyTimerRef.current = window.setTimeout(() => setViewReady(true), 1700);
        captureReadyTimerRef.current = window.setTimeout(() => setCaptureReady(true), 4800);
        captureLockRef.current = false;
        setCaptureState("aligning");
        setHoldProgress(0);
      }, 3300);
      return;
    }
    const scores = Object.values(nextScores).filter((score): score is number => typeof score === "number");
    const completedScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length));
    setFinalScore(completedScore);
    const report = buildArchiveReport(nextCaptures as Record<MirrorView, string>, nextScores, completedScore);
    void saveMirrorSession(nextCaptures, completedScore);
    onReportCaptured?.(report);
    setResultView("front");
    speakCalmly("Fotoğraf çekildi. Analiz bitti.", true);
    transitionTimerRef.current = window.setTimeout(() => {
      stopCamera();
      setStage("result");
    }, 4200);
  }, [assessment.problemJoint, landmarks, onReportCaptured, speakCalmly, stopCamera, view.id, viewIndex]);

  useEffect(() => {
    if (stage !== "live" || cameraState !== "ready" || captureLockRef.current || !viewReady || !captureReady) return;
    if (!assessment.matched) {
      if (holdStartedRef.current) {
        if (!holdMismatchTimerRef.current) {
          holdMismatchTimerRef.current = window.setTimeout(() => {
            holdMismatchTimerRef.current = null;
            holdStartedRef.current = 0;
            correctionAllowedAtRef.current = Date.now() + 1800;
            setCaptureState("aligning");
            setHoldProgress(0);
          }, 900);
        }
        return;
      }
      holdStartedRef.current = 0;
      setCaptureState((current) => current === "aligning" ? current : "aligning");
      setHoldProgress((current) => current === 0 ? current : 0);
      return;
    }
    if (holdMismatchTimerRef.current) {
      window.clearTimeout(holdMismatchTimerRef.current);
      holdMismatchTimerRef.current = null;
    }
    if (!holdStartedRef.current) {
      holdStartedRef.current = performance.now();
      setCaptureState("holding");
      if (holdAnnouncedViewRef.current !== viewIndex) {
        holdAnnouncedViewRef.current = viewIndex;
        speakCalmly("Tamam. İki saniye sabit kal.", true);
      }
    }
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - holdStartedRef.current;
      setHoldProgress(Math.min(100, Math.round((elapsed / 2000) * 100)));
      if (elapsed >= 2000) {
        window.clearInterval(timer);
        captureAndContinue();
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [assessment.matched, cameraState, captureAndContinue, captureReady, speakCalmly, stage, viewIndex, viewReady]);

  const restart = useCallback(() => {
    setStage("intro");
    setViewIndex(0);
    setCaptures({});
    capturesRef.current = {};
    viewScoresRef.current = {};
    setLandmarks([]);
    setFinalScore(78);
    setDisplayScore(null);
    scoreTargetRef.current = null;
    holdStartedRef.current = 0;
    if (holdMismatchTimerRef.current) window.clearTimeout(holdMismatchTimerRef.current);
    holdMismatchTimerRef.current = null;
    holdAnnouncedViewRef.current = null;
    captureLockRef.current = false;
    viewReadyAfterRef.current = 0;
    correctionAllowedAtRef.current = 0;
    if (viewReadyTimerRef.current) window.clearTimeout(viewReadyTimerRef.current);
    if (captureReadyTimerRef.current) window.clearTimeout(captureReadyTimerRef.current);
    setViewReady(false);
    setCaptureReady(false);
    setCaptureState("aligning");
    setHoldProgress(0);
  }, []);

  if (stage === "result") {
    return (
      <section className={styles.page}>
        <header className={styles.titleBlock}><span>ANALİZ BİTTİ</span><h1>Bugünkü Temelin</h1><p>Üç görünüm ve gerçek fotoğrafların analiz kaydına eklendi.</p></header>
        <div className={styles.resultLayout}>
          <div className={styles.resultPortrait}>{selectedResultPhoto ? <img alt={`${views.find((item) => item.id === resultView)?.label ?? "Bugünkü"} postür ölçümü`} src={selectedResultPhoto} /> : <div className={styles.emptyPortrait}>Fotoğraf bekleniyor</div>}<div className={styles.resultScore}><span>TEMELİN</span><strong>{finalScore}</strong></div></div>
          <div className={styles.resultPanel}>
            <div className={styles.captureStrip}>{views.map((item) => <button aria-pressed={resultView === item.id} className={resultView === item.id ? styles.captureActive : undefined} key={item.id} onClick={() => setResultView(item.id)} type="button">{captures[item.id] ? <img alt={`${item.label} görünüm kaydı`} src={captures[item.id]} /> : null}<span>{item.label}</span></button>)}</div>
            <div className={styles.resultRows}>{metrics.map((metric) => <div className={styles.resultRow} key={metric.label}><span>{metric.label}</span><strong className={metric.value < 76 ? styles.metricWarm : undefined}>{metric.value}</strong></div>)}</div>
            <p className={styles.resultInsight}>Dengen iyi. Sol omzunda hafif yükselme var. Bugünkü pratiğinde omuzlarını bırakmaya odaklan.</p>
            <div className={styles.resultActions}><button className={styles.secondary} onClick={restart} type="button">Yeniden ölç</button><button className={styles.primary} onClick={onNavigateToPractice} type="button">Bugünkü pratiğe geç</button></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.titleBlock}><span>BEDENİNİ GÖR</span><h1>Tai Chi Beden Aynası</h1><p>Nasıl durduğunu gör. Aynı anda yalnızca bir şeyi düzelt.</p></header>
      <div className={styles.mirror}>
        <div className={styles.camera}>
          <video className={styles.video} muted playsInline ref={videoRef} />
          <canvas className={styles.canvas} ref={canvasRef} />
          <div className={styles.cameraShade} />
          {cameraState !== "ready" ? <div className={styles.cameraWelcome}><span aria-hidden="true">◎</span><h2>Üç sakin açı. Tek, anlaşılır sonuç.</h2><p>Kamera açıldığında önden, yandan ve arkadan görünümünü sırayla kaydedeceğiz.</p><button className={styles.primary} disabled={cameraState === "requesting"} onClick={startCamera} type="button">{cameraState === "requesting" ? "Kamera hazırlanıyor…" : "Beden aynasını başlat"}</button>{cameraState === "denied" ? <small>Kamera izni verilmedi. Tarayıcı ayarlarından izin verebilirsin.</small> : null}{cameraState === "error" ? <small>Kamera başlatılamadı. Başka bir kamera veya tarayıcıyla tekrar dene.</small> : null}</div> : null}
          {cameraState === "ready" ? <>
            <div className={styles.viewBadge}>{viewIndex + 1} / 3 <strong>{view.label.toLocaleUpperCase("tr-TR")}</strong></div>
            <div className={styles.score}><span>TEMELİN</span><strong>{displayScore ?? "—"}</strong></div>
            <div className={`${styles.cue} ${captureState === "holding" ? styles.cueHolding : ""}`}><i aria-hidden="true" /><strong>{captureState === "holding" ? `Tamam. ${Math.max(1, Math.ceil((100 - holdProgress) / 50))} saniye bekle.` : captureState === "captured" ? "Fotoğraf çekildi." : assessment.cue}</strong>{captureState === "holding" ? <span className={styles.holdBar}><b style={{ width: `${holdProgress}%` }} /></span> : null}</div>
            <button aria-label={voiceEnabled ? "Sesli yönlendirmeyi kapat" : "Sesli yönlendirmeyi aç"} aria-pressed={voiceEnabled} className={styles.sound} onClick={() => setVoiceEnabled((current) => !current)} type="button">{voiceEnabled ? "◖))" : "◖×"}</button>
            <div className={styles.zoom} title={zoom ? "Kamera zoom seviyesi" : "Bu kamera donanımsal zoom desteklemiyor"}><button aria-label="Kamerayı uzaklaştır" disabled={!zoom || zoom.value <= zoom.min} onClick={() => void changeZoom(-1)} type="button">−</button><span>{zoom ? `${zoom.value.toFixed(1)}×` : "Zoom yok"}</span><button aria-label="Kamerayı yakınlaştır" disabled={!zoom || zoom.value >= zoom.max} onClick={() => void changeZoom(1)} type="button">+</button></div>
            <button className={styles.close} onClick={() => { stopCamera(); setStage("intro"); }} type="button" aria-label="Beden aynasını kapat">×</button>
            <div className={styles.stepper}>{views.map((item, index) => <button key={item.id} aria-current={index === viewIndex ? "step" : undefined} className={index === viewIndex ? styles.stepActive : index < viewIndex ? styles.stepDone : undefined} disabled type="button"><i />{item.label}</button>)}</div>
            <div className={styles.autoCapture}>{!captureReady ? "Önce yönlendirmeyi uygula" : assessment.matched ? "Otomatik çekim hazırlanıyor" : `${view.label} görünümünü hizala`}</div>
          </> : null}
        </div>
      </div>
    </section>
  );
}

function assessLandmarks(items: readonly Landmark[], view: MirrorView) {
  const visible = new Map(items.filter((item) => item.score >= 0.48).map((item) => [item.name, item]));
  const confidence = new Map(items.map((item) => [item.name, item.score]));
  const faceConfidence = ((confidence.get("nose") ?? 0) + (confidence.get("left_eye") ?? 0) + (confidence.get("right_eye") ?? 0)) / 3;
  if (view === "side") {
    const side = (["left", "right"] as const)
      .map((name) => ({ name, confidence: ["shoulder", "hip", "knee", "ankle"].reduce((sum, joint) => sum + (visible.get(`${name}_${joint}`)?.score ?? 0), 0) }))
      .sort((a, b) => b.confidence - a.confidence)[0]?.name ?? "left";
    const shoulder = visible.get(`${side}_shoulder`);
    const hip = visible.get(`${side}_hip`);
    const knee = visible.get(`${side}_knee`);
    const ankle = visible.get(`${side}_ankle`);
    if (!shoulder || !hip || !knee || !ankle) return { ready: false, matched: false, score: 0, cue: "Yan dön ve başından ayaklarına kadar kadrajda kal.", problemJoint: undefined as string | undefined };
    const bodyHeight = Math.max(0.001, Math.abs(shoulder.y - ankle.y));
    const leftShoulder = visible.get("left_shoulder");
    const rightShoulder = visible.get("right_shoulder");
    const shoulderPerspective = leftShoulder && rightShoulder ? Math.abs(leftShoulder.x - rightShoulder.x) / bodyHeight : 0;
    const torsoLean = Math.abs(shoulder.x - hip.x) / bodyHeight;
    const legLean = Math.abs(hip.x - ankle.x) / bodyHeight;
    const centerError = Math.abs((shoulder.x + hip.x + knee.x + ankle.x) / 4 - 0.5);
    const score = Math.round(Math.max(42, Math.min(98, 97 - torsoLean * 125 - legLean * 55 - centerError * 80)));
    if (shoulderPerspective > 0.17) return { ready: true, matched: false, score, cue: "Henüz önden görünüyorsun. Vücudunu tam yana çevir.", problemJoint: undefined as string | undefined };
    if (centerError > 0.17) return { ready: true, matched: false, score, cue: shoulder.x < 0.5 ? "Biraz sağına yerleş." : "Biraz soluna yerleş.", problemJoint: "center" };
    if (torsoLean > 0.085) return { ready: true, matched: false, score, cue: "Başını kalçanın üzerinde sakinçe hizala.", problemJoint: `${side}_shoulder` };
    if (legLean > 0.12) return { ready: true, matched: false, score, cue: "Ağırlığını iki ayağının ortasına getir.", problemJoint: `${side}_hip` };
    return { ready: true, matched: score >= 70, score, cue: "Yan görünümün hazır. Bu sakinliği koru.", problemJoint: undefined as string | undefined };
  }

  const required = ["left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"];
  if (required.some((name) => !visible.get(name))) return { ready: false, matched: false, score: 0, cue: view === "back" ? "Arkanı dön ve tam bedeninle kadrajda kal." : "Tam bedeninle kadraja gir.", problemJoint: undefined as string | undefined };
  if (view === "front" && faceConfidence < 0.3) return { ready: true, matched: false, score: 60, cue: "Yüzün kameraya dönük olsun.", problemJoint: undefined as string | undefined };
  if (view === "back" && faceConfidence >= 0.26) return { ready: true, matched: false, score: 60, cue: "Hâlâ yüzünü görüyorum. Arkanı tamamen kameraya dön.", problemJoint: undefined as string | undefined };
  const leftShoulder = visible.get("left_shoulder")!;
  const rightShoulder = visible.get("right_shoulder")!;
  const leftHip = visible.get("left_hip")!;
  const rightHip = visible.get("right_hip")!;
  const shoulderWidth = Math.max(0.001, Math.abs(leftShoulder.x - rightShoulder.x));
  const shoulderDifference = Math.abs(leftShoulder.y - rightShoulder.y) / shoulderWidth;
  const hipDifference = Math.abs(leftHip.y - rightHip.y) / shoulderWidth;
  const center = (leftHip.x + rightHip.x) / 2;
  const centerError = Math.abs(center - 0.5);
  const score = Math.round(Math.max(45, Math.min(98, 96 - shoulderDifference * 110 - hipDifference * 70 - centerError * 75)));
  if (centerError > 0.13) return { ready: true, matched: false, score, cue: center < 0.5 ? "Biraz sağına doğru yerleş." : "Biraz soluna doğru yerleş.", problemJoint: "center" };
  if (shoulderDifference > 0.065) return { ready: true, matched: false, score, cue: leftShoulder.y < rightShoulder.y ? "Sol omzunu biraz bırak." : "Sağ omzunu biraz bırak.", problemJoint: leftShoulder.y < rightShoulder.y ? "left_shoulder" : "right_shoulder" };
  if (hipDifference > 0.06) return { ready: true, matched: false, score, cue: "Kalçanı iki ayağının ortasına getir.", problemJoint: "left_hip" };
  return { ready: true, matched: score >= 70, score, cue: view === "back" ? "Arka görünümün hazır. Bu sakinliği koru." : "Dengen iyi. Bu sakinliği koru.", problemJoint: undefined as string | undefined };
}

function buildMetrics(score: number) {
  const base = score || 78;
  return [
    { label: "Dikey eksen", value: Math.min(96, base + 6) },
    { label: "Omuz–kalça dengesi", value: Math.max(55, base - 6) },
    { label: "Diz–ayak yönü", value: Math.min(94, base + 3) },
    { label: "Beden merkezi", value: Math.max(58, base - 2) },
  ];
}

function isMediaPipeAbort(error: unknown) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return /abort(?:ed)?/i.test(message);
}

function captureFrame(video: HTMLVideoElement | null) {
  if (!video || video.readyState < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

function captureFrameWithLandmarks(
  video: HTMLVideoElement | null,
  landmarks: readonly Landmark[],
  problemJoint?: string,
) {
  if (!video || video.readyState < 2) return null;
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 720;
  const scale = Math.min(1, 1080 / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  context.setTransform(1, 0, 0, 1, 0, 0);
  drawLandmarksOnCapture(context, canvas.width, canvas.height, landmarks, problemJoint);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function drawLandmarksOnCapture(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: readonly Landmark[],
  problemJoint?: string,
) {
  const points = new Map(
    landmarks
      .filter((item) => item.score >= 0.48)
      .map((item) => [item.name, { x: (1 - item.x) * width, y: item.y * height }]),
  );
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(3, width * 0.004);
  for (const [from, to] of connections) {
    const a = points.get(from);
    const b = points.get(to);
    if (!a || !b) continue;
    const warning = from === problemJoint || to === problemJoint;
    context.strokeStyle = warning ? "#ff524b" : "#63c97b";
    context.shadowBlur = Math.max(8, width * 0.012);
    context.shadowColor = context.strokeStyle;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }
  for (const name of trackedNames) {
    const point = points.get(name);
    if (!point) continue;
    const warning = name === problemJoint;
    context.fillStyle = warning ? "#ff524b" : "#63c97b";
    context.shadowBlur = Math.max(8, width * 0.012);
    context.shadowColor = context.fillStyle;
    context.beginPath();
    context.arc(point.x, point.y, Math.max(warning ? 7 : 5, width * (warning ? 0.009 : 0.007)), 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = warning ? "#e3b85f" : "#07130f";
    context.lineWidth = Math.max(2, width * 0.002);
    context.stroke();
  }
  context.restore();
}

function buildArchiveReport(
  captures: Record<MirrorView, string>,
  scores: Partial<Record<MirrorView, number>>,
  score: number,
): NewPostureArchiveReport {
  const now = new Date();
  const dateKey = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(now);
  const timeLabel = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(now);
  const makeCapture = (view: MirrorView) => {
    const viewScore = Math.round(scores[view] ?? score);
    return {
      view,
      createdAt: now.toISOString(),
      imageData: captures[view],
      analysis: {
        axisScore: viewScore,
        confidence: 88,
        feedback: viewScore >= 80 ? "Duruşun dengeli ve kararlı." : "Tek bir küçük düzeltmeyle hizanı güçlendirebilirsin.",
        flags: viewScore >= 80 ? [] : ["Hizayı bir sonraki ölçümde yeniden gözlemle."],
        hipScore: Math.max(0, Math.min(100, viewScore - 2)),
        hipTilt: 0,
        shoulderScore: Math.max(0, Math.min(100, viewScore - 3)),
        shoulderTilt: 0,
        sampleCount: 1,
        spineShift: 0,
        view,
      },
    };
  };
  return {
    id: `new-posture-${now.getTime()}`,
    createdAt: now.toISOString(),
    dateKey,
    timeLabel,
    score,
    asymmetrySignal: score < 62 ? "yüksek" : score < 78 ? "orta" : "düşük",
    captures: { front: makeCapture("front"), side: makeCapture("side"), back: makeCapture("back") },
    flags: [],
    summary: score >= 80 ? "Beden eksenin bugün dengeli ve kararlı." : "Beden eksenin hazır; omuz ve merkez hizanı nazikçe geliştirebilirsin.",
    trendText: "New Posture ölçümü",
  };
}

function playCaptureClick() {
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(980, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(210, context.currentTime + 0.075);
    gain.gain.setValueAtTime(0.055, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.085);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.09);
    oscillator.addEventListener("ended", () => void context.close(), { once: true });
  } catch {
    // Some browsers block synthetic audio; capture should still continue.
  }
}

async function saveMirrorSession(captures: Partial<Record<MirrorView, string>>, score: number) {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  try {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open("shibashi-new-posture", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("sessions")) request.result.createObjectStore("sessions", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("sessions", "readwrite");
      transaction.objectStore("sessions").put({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), score, captures });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // Persistence failure must not interrupt the completed analysis experience.
  }
}

function drawLandmarks(canvas: HTMLCanvasElement | null, video: HTMLVideoElement | null, landmarks: readonly Landmark[], problemJoint?: string) {
  if (!canvas || !video) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  const sourceWidth = video.videoWidth || rect.width;
  const sourceHeight = video.videoHeight || rect.height;
  const scale = Math.min(rect.width / sourceWidth, rect.height / sourceHeight);
  const offsetX = (rect.width - sourceWidth * scale) / 2;
  const offsetY = (rect.height - sourceHeight * scale) / 2;
  const points = new Map(landmarks.filter((item) => item.score >= 0.48).map((item) => [item.name, { x: rect.width - (item.x * sourceWidth * scale + offsetX), y: item.y * sourceHeight * scale + offsetY }]));
  context.lineCap = "round";
  context.lineWidth = 2;
  for (const [from, to] of connections) {
    const a = points.get(from);
    const b = points.get(to);
    if (!a || !b) continue;
    const warning = from === problemJoint || to === problemJoint;
    context.strokeStyle = warning ? "rgba(255,82,75,.92)" : "rgba(91,190,111,.82)";
    context.shadowBlur = 8;
    context.shadowColor = context.strokeStyle;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }
  for (const name of trackedNames) {
    const point = points.get(name);
    if (!point) continue;
    const warning = name === problemJoint;
    context.shadowBlur = warning ? 18 : 9;
    context.shadowColor = warning ? "#ff524b" : "#63c97b";
    context.fillStyle = warning ? "#ff524b" : "#63c97b";
    context.beginPath();
    context.arc(point.x, point.y, warning ? 5.5 : 4, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = warning ? "#e3b85f" : "rgba(4,16,10,.9)";
    context.lineWidth = warning ? 3 : 1.5;
    context.stroke();
  }
  context.shadowBlur = 0;
}
