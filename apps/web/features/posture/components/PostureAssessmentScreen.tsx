import type { CSSProperties, RefObject } from "react";
import { analyzePosture, getPostureOverallScore, getPostureQualityCounts, type PoseKeypoint, type PostureView } from "@/packages/posture-analysis";
import { fiveShen } from "@/features/home/data/shen";
import {
  PostureAssessmentLanding,
  PostureAutoCaptureScreen,
  PostureCaptureFlash,
  PostureCaptureReadyScreen,
  PostureFeedbackPanel,
  PostureHistoryScreen,
  PostureInsightStrip,
  PostureProcessingScreen,
  PostureResultDashboard,
  PostureScorePanel,
  PostureSkeleton2D,
  evaluateWebPostureFrame,
} from "./PostureScreens";
import type { PostureAssessmentCapture, PostureAssessmentStep, PostureRenderMode, PostureReport, PostureScanGuidance } from "../types";
import { getCameraStatus, getPoseStatusText } from "../lib/status-labels";

export function PostureAssessmentScreen({
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
