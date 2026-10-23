"use client";

import NextImage from "next/image";
import type { CSSProperties, RefObject } from "react";
import { useState } from "react";
import { analyzePosture, getPostureCorrections, getPostureMetricList, getPostureQualityCounts, getPostureRecommendations, getPostureReportCompositeAnalysis, type PoseKeypoint, type PostureAnalysisSnapshot, type PostureView } from "@/packages/posture-analysis";

type PostureScanGuidance = "model-loading" | "find-body" | "wrong-angle" | "reposition" | "hold" | "capturing";
type PostureShen = { color: string; dailyName: string };
type PostureAssessmentCapture = { analysis: PostureAnalysisSnapshot; createdAt: string; imageData: string; view: PostureView };
type PostureReport = { asymmetrySignal: "düşük" | "orta" | "yüksek"; captures: Record<PostureView, PostureAssessmentCapture>; createdAt: string; dateKey: string; flags: string[]; id: string; score: number; summary: string; timeLabel: string; trainerVisible?: boolean; trendText: string };



export function PostureAssessmentLanding({
  hasReports,
  onClose,
  onShowHistory,
  onStart,
}: {
  hasReports: boolean;
  onClose: () => void;
  onShowHistory?: () => void;
  onStart: () => void;
}) {
  return (
    <section className="screen posture-flow-screen posture-landing-screen">
      <div className="posture-flow-shell posture-landing-shell">
        <button className="posture-back-button" onClick={onClose} type="button" aria-label="Postür ekranından çık">‹</button>
        <div className="posture-landing-content">
          <span className="eyebrow">Beden Hattın</span>
          <h1>Postürünün bugünkü izini çıkar.</h1>
          <p>Ön, yan ve arka görünümünü üç saniyelik sakin duruşlarla ölçelim; zaman içindeki değişimi birlikte görelim.</p>
          <div className="posture-landing-actions">
            <button className="posture-landing-primary" onClick={onStart} type="button">
              <span>Postürü Başlat</span>
              <i aria-hidden="true">→</i>
            </button>
            {onShowHistory ? (
              <button className="posture-landing-secondary" onClick={onShowHistory} type="button">
                <span>Geçmiş Postür Kayıtlarım</span>
                <small>{hasReports ? "Kayıtlarını karşılaştır" : "Henüz kayıt yok"}</small>
              </button>
            ) : null}
          </div>
        </div>
        <div className="posture-landing-figure" aria-hidden="true">
          <PremiumPosturePreview />
          <span className="posture-landing-figure-label">Nötr duruş · üç açıdan izlenecek</span>
        </div>
      </div>
    </section>
  );
}



export function PremiumPosturePreview() {
  const joints = [
    [110,40,"good"],[82,88,"warn"],[138,88,"warn"],[91,158,"good"],[129,158,"good"],
    [94,218,"good"],[126,218,"good"],[94,272,"good"],[126,272,"good"],
  ] as const;
  return (
    <div className="posture-premium-preview" role="img" aria-label="Arkadan görünen yarı saydam postür modeli">
      <img src="/images/posture/posture-back-translucent.png" alt="" />
      <svg viewBox="0 0 220 300" aria-hidden="true">
        <line className="posture-preview-axis" x1="110" x2="110" y1="30" y2="280" />
        <line className="posture-preview-measure posture-preview-shoulders" x1="72" x2="148" y1="88" y2="88" />
        <line className="posture-preview-measure posture-preview-hips" x1="78" x2="142" y1="158" y2="158" />
        {joints.map(([cx, cy, tone], index) => <circle className={`posture-preview-joint posture-preview-${tone}`} cx={cx} cy={cy} key={index} r={tone === "warn" ? 5 : 4.2} />)}
      </svg>
    </div>
  );
}



export function PostureAutoCaptureScreen({
  activeView,
  analysis,
  autoCaptureProgress,
  cameraStatus,
  canvasRef,
  captureCount,
  captureFlash,
  capturedView,
  coachCue,
  frameReadiness,
  onCapture,
  onClose,
  onRestart,
  onVoiceToggle,
  poseStatus,
  scanGuidance,
  score,
  selectedShen,
  videoRef,
  voiceEnabled,
}: {
  activeView: PostureView;
  analysis: ReturnType<typeof analyzePosture>;
  autoCaptureProgress: number;
  cameraStatus: "idle" | "requesting" | "ready" | "denied" | "unsupported";
  canvasRef: RefObject<HTMLCanvasElement | null>;
  captureCount: number;
  captureFlash: boolean;
  capturedView: PostureView | null;
  coachCue: string;
  frameReadiness: ReturnType<typeof evaluateWebPostureFrame>;
  onCapture: () => void;
  onClose: () => void;
  onRestart: () => void;
  onVoiceToggle: () => void;
  poseStatus: "bekliyor" | "yükleniyor" | "aktif" | "beden-yok" | "hata";
  scanGuidance: PostureScanGuidance;
  score: number;
  selectedShen: PostureShen;
  videoRef: RefObject<HTMLVideoElement | null>;
  voiceEnabled: boolean;
}) {
  const viewLabel = activeView === "front" ? "Ön" : activeView === "side" ? "Yan" : "Arka";
  const expectedInstruction =
    activeView === "front" ? "Kameraya dönün" : activeView === "side" ? "Şimdi yana dönün" : "Şimdi arkanızı dönün";
  const instruction =
    cameraStatus === "requesting"
      ? "Kamera izni bekleniyor"
      : scanGuidance === "model-loading"
        ? "Gerçek poz modeli hazırlanıyor"
        : scanGuidance === "find-body"
          ? "Tam bedeninizi kadraja alın"
          : scanGuidance === "wrong-angle"
            ? expectedInstruction
            : scanGuidance === "reposition"
              ? frameReadiness.positionCue
            : scanGuidance === "capturing"
              ? "Görünüm kaydedildi"
              : coachCue;
  const secondsLeft = Math.max(1, Math.ceil(((100 - autoCaptureProgress) / 100) * 2));
  const angleSteps = [
    ["front", "Ön"],
    ["side", "Yan"],
    ["back", "Arka"],
  ] as const;
  const regionScores = [analysis.shoulderScore, analysis.axisScore, analysis.hipScore];
  const alignedCount = regionScores.filter((value) => value >= 70).length;
  const correctionCount = regionScores.length - alignedCount;
  const scoreLabel = score >= 82 ? "Dengeli" : score >= 70 ? "Yaklaşıyor" : "Düzeltme gerekli";
  const live = cameraStatus === "ready" && poseStatus === "aktif";

  return (
    <section className="screen posture-capture-screen posture-live-screen">
      <div className="posture-capture-shell posture-live-shell">
        <div className="posture-live-camera">
          <div className="posture-live-floating-actions">
            <button className="posture-live-icon-button" onClick={onClose} type="button" aria-label="Postür çekiminden çık">×</button>
            <button className="posture-live-icon-button posture-live-voice" onClick={onVoiceToggle} type="button" aria-label={voiceEnabled ? "Sesli yönlendirmeyi kapat" : "Sesli yönlendirmeyi aç"}>
              {voiceEnabled ? "◖))" : "◖×"}
            </button>
          </div>
          <video
            className={`camera-preview ${cameraStatus === "ready" ? "camera-preview-active" : ""}`}
            muted
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              const cameraStage = video.closest<HTMLElement>(".posture-live-camera");
              if (!cameraStage || !video.videoWidth || !video.videoHeight) return;
              cameraStage.style.setProperty("--posture-camera-aspect", `${video.videoWidth} / ${video.videoHeight}`);
            }}
            playsInline
            ref={videoRef}
          />
          <canvas className="camera-pose-canvas" ref={canvasRef} />
          <div className={`posture-live-score-overlay ${live && score >= 70 ? "is-aligned" : ""}`} aria-live="polite">
            <span>Dik duruş skoru</span>
            <strong>{live ? score : "—"}<small>{live ? "/100" : ""}</small></strong>
          </div>
          <PostureCaptureFlash visible={captureFlash} capturedView={capturedView} />
          {cameraStatus !== "ready" ? <div className="posture-live-camera-wait">Kamera hazırlanıyor...</div> : null}

          <div className="posture-live-guide" aria-live="polite">
            <strong className="posture-live-countdown">{scanGuidance === "hold" ? secondsLeft : scanGuidance === "capturing" ? "✓" : "•"}</strong>
            <div>
              <strong>{instruction}</strong>
              <span>
                {scanGuidance === "hold"
                  ? "Gerçek ölçüm sürüyor; iki saniye aynı duruşu koruyun"
                  : scanGuidance === "reposition"
                    ? "Kılavuz yeşile döndüğünde ölçüm başlayacak"
                  : scanGuidance === "wrong-angle"
                    ? `${viewLabel} görünüm doğrulanınca sayaç başlayacak`
                    : "Tam beden ve doğru yön algılandığında sayaç başlayacak"}
              </span>
            </div>
          </div>
        </div>
        <aside className="posture-live-side-panel">
          <span className="eyebrow">Doğal dik duruş · {viewLabel}</span>
          <div className="posture-live-score-card">
            <span>Dik duruş uyumu</span>
            <strong>{live ? score : "—"}<small>{live ? "%" : ""}</small></strong>
            <b>{scoreLabel}</b>
            <div><i style={{ width: `${live ? score : 0}%` }} /></div>
          </div>
          <div className="posture-live-region-summary">
            <span><i className="good" /> {alignedCount} bölge uyumlu</span>
            <span><i className="fix" /> {correctionCount} bölgeyi düzelt</span>
          </div>
          <div className="posture-live-reference" data-view={activeView}>
            <PostureNeutralReference view={activeView} />
            <span>{viewLabel} görünüm</span>
          </div>
          <div className="posture-live-coach-card" aria-live="polite">
            <i aria-hidden="true">♫</i>
            <div><span>Sesli yönlendirme</span><strong>{coachCue}</strong></div>
          </div>
          <div className="posture-live-side-steps">
            {angleSteps.map(([item, label], index) => (
              <div className={activeView === item ? "active" : capturesStepClass(item, activeView)} key={item}>
                <i>{index + 1}</i>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <small>{captureCount + 1} / 3 · Görüntü yalnızca canlı ölçüm için işlenir.</small>
        </aside>
      </div>
    </section>
  );
}



const postureNeutralReferencePhotos = {
  front: {
    alt: "Önden doğal dik duruş gösteren eğitmen",
    src: "/images/posture/posture-neutral-front-v2.jpg",
  },
  side: {
    alt: "Yandan doğal dik duruş gösteren eğitmen",
    src: "/images/posture/posture-neutral-side-v2.jpg",
  },
  back: {
    alt: "Arkadan doğal dik duruş gösteren eğitmen",
    src: "/images/posture/posture-neutral-back-v2.jpg",
  },
} satisfies Record<PostureView, { alt: string; src: string }>;



export function PostureNeutralReference({ view }: { view: PostureView }) {
  const reference = postureNeutralReferencePhotos[view];

  return (
    <NextImage
      alt={reference.alt}
      className="posture-neutral-reference"
      height={796}
      sizes="96px"
      src={reference.src}
      width={480}
    />
  );
}



function capturesStepClass(item: PostureView, activeView: PostureView) {
  const order: PostureView[] = ["front", "side", "back"];
  return order.indexOf(item) < order.indexOf(activeView) ? "posture-capture-step-done" : "";
}



export function PostureCaptureFlash({ visible, capturedView }: { visible: boolean; capturedView: PostureView | null }) {
  if (!visible) return null;
  const label = capturedView === "front" ? "Ön" : capturedView === "side" ? "Yan" : "Arka";

  return (
    <>
      <div className="posture-capture-flash" aria-hidden="true" />
      <div className="posture-capture-shutter-frame" aria-hidden="true" />
      <div className="posture-capture-toast" role="status">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>{label} görünüm kaydedildi</strong>
          <small>Postür görüntüsü alındı</small>
        </div>
      </div>
    </>
  );
}



export function PostureCaptureReadyScreen({
  onClose,
  onComplete,
  onRetake,
  report,
}: {
  onClose: () => void;
  onComplete: () => void;
  onRetake: () => void;
  report: PostureReport;
}) {
  return (
    <section className="screen posture-capture-screen">
      <div className="posture-capture-shell posture-capture-ready-shell">
        <header className="posture-capture-topbar">
          <button className="posture-back-button" onClick={onClose} type="button" aria-label="Postür analizinden çık">‹</button>
          <div>
            <span className="eyebrow">Üç Görünüm Hazır</span>
            <strong>Çekim tamamlandı</strong>
          </div>
          <div className="posture-capture-score posture-capture-score-live">
            <strong>{report.score}</strong><span>/100</span>
          </div>
        </header>
        <div className="posture-capture-ready-images">
          {(["front", "side", "back"] as const).map((view) => (
            <figure key={view}>
              {report.captures[view].imageData ? <img src={report.captures[view].imageData} alt={`${view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka"} postür kaydı`} /> : <span className="posture-result-capture-empty">Görüntü yok</span>}
              <figcaption>{view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka"}</figcaption>
            </figure>
          ))}
        </div>
        <div className="posture-capture-ready-actions">
          <div>
            <span className="eyebrow">Hazırsan devam et</span>
            <p>Ayrıntılı skorların ve kişisel önerilerin bir sonraki ekranda hazırlanacak.</p>
          </div>
          <button className="posture-capture-retake" onClick={onRetake} type="button">Yeniden Çek</button>
          <button className="posture-capture-complete" onClick={onComplete} type="button">Analizi Tamamla <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </section>
  );
}



export function PostureHistoryScreen({
  onBack,
  onDeleteReport,
  onOpenReport,
  onSetTrainerVisibility,
  onStart,
  reports,
}: {
  onBack: () => void;
  onDeleteReport?: (reportId: string) => void;
  onOpenReport?: (report: PostureReport) => void;
  onSetTrainerVisibility?: (reportId: string, trainerVisible: boolean) => void;
  onStart: () => void;
  reports: PostureReport[];
}) {
  return (
    <section className="screen posture-flow-screen posture-history-screen">
      <div className="posture-flow-shell">
        <header className="posture-flow-topbar">
          <button className="posture-back-button" onClick={onBack} type="button" aria-label="Postür girişine dön">‹</button>
          <div>
            <span className="eyebrow">Zaman Çizgin</span>
            <h1>Geçmiş Postür Kayıtlarım</h1>
          </div>
          <button className="posture-result-retake-button" onClick={onStart} type="button">Yeni Analiz</button>
        </header>
        <PostureSavedReportsGallery
          onDeleteReport={onDeleteReport}
          onOpenReport={onOpenReport ?? (() => undefined)}
          onSetTrainerVisibility={onSetTrainerVisibility}
          reports={reports}
        />
      </div>
    </section>
  );
}



export function PostureProcessingScreen({ report }: { report: PostureReport }) {
  return (
    <section className="screen posture-flow-screen posture-processing-screen">
      <div className="posture-flow-shell posture-processing-shell">
        <div className="posture-processing-visual" aria-hidden="true">
          {(["front", "side", "back"] as const).map((view, index) => (
            <div key={view} style={{ "--processing-index": index } as CSSProperties}>
              {report.captures[view].imageData ? <img src={report.captures[view].imageData} alt="" /> : <span className="posture-result-capture-empty">Görüntü yok</span>}
              <span>{view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka"}</span>
            </div>
          ))}
          <i className="posture-processing-scan" />
        </div>
        <div className="posture-processing-copy">
          <span className="eyebrow">Üç gerçek ölçüm tamamlandı</span>
          <h1>BİTTİ</h1>
          <p>Omuz, omurga, kalça ve denge hattın karşılaştırılıyor. Lütfen bekleyin.</p>
          <div className="posture-processing-progress"><i /></div>
          <small>MediaPipe beden referansları eşleştiriliyor</small>
        </div>
      </div>
    </section>
  );
}



export function PostureResultDashboard({
  onClose,
  onRetake,
  onSave,
  report,
  reportIsSaved,
  selectedShen,
}: {
  onClose: () => void;
  onRetake: () => void;
  onSave: () => void;
  report: PostureReport;
  reportIsSaved: boolean;
  selectedShen: PostureShen;
}) {
  const [activeView, setActiveView] = useState<PostureView>("front");
  const compositeAnalysis = getPostureReportCompositeAnalysis(report);
  const capture = report.captures[activeView];
  const viewAnalysis = {
    ...compositeAnalysis,
    ...capture.analysis,
    breathScore: 0,
    feedback: report.summary,
    flags: report.flags,
    lean: Math.max(-10, Math.min(10, capture.analysis.spineShift / 3.4 + capture.analysis.shoulderTilt / 4.2)),
  };
  const quality = getPostureQualityCounts(viewAnalysis);
  const activeLabel = activeView === "front" ? "Ön" : activeView === "side" ? "Yan" : "Arka";
  const confidence = Math.round(Object.values(report.captures).reduce((total, item) => total + item.analysis.confidence, 0) / 3);

  return (
    <section className="screen posture-assessment-screen posture-analysis-screen posture-result-dashboard">
      <div className="posture-analysis-shell">
        <header className="posture-analysis-topbar">
          <button className="posture-back-button" onClick={onClose} type="button" aria-label="Postür raporundan çık">
            ‹
          </button>
          <div>
            <h1>Postür</h1>
            <p>Gerçek postür ölçüm kaydı • {report.dateKey} {report.timeLabel}</p>
          </div>
          <div className="posture-result-top-actions">
            <button className="posture-result-retake-button" onClick={onRetake} type="button">
              Yeniden Al
            </button>
            <button className="posture-save-button" disabled={reportIsSaved} onClick={onSave} type="button">
              {reportIsSaved ? "Kayıtlı" : "Analizi Kaydet"}
              <span aria-hidden="true">{reportIsSaved ? "✓" : "↓"}</span>
            </button>
          </div>
        </header>

        <div className="posture-analysis-grid posture-result-grid">
          <PostureScorePanel analysis={compositeAnalysis} compact confidence={confidence} ready score={report.score} selectedShen={selectedShen} />

          <main className="posture-analysis-stage-card posture-result-stage-card">
            <div className="posture-stage-tabs" aria-label="Kayıt görünümü seçimi">
              {([
                ["front", "Ön Görünüm"],
                ["side", "Yan Görünüm"],
                ["back", "Arka Görünüm"],
              ] as const).map(([item, label]) => (
                <button className={activeView === item ? "posture-tab-active" : ""} key={item} onClick={() => setActiveView(item)} type="button">
                  {label}
                </button>
              ))}
            </div>

            <div className="posture-result-capture-stage">
              {capture.imageData ? <img src={capture.imageData} alt={`${activeLabel} postür analizi`} /> : <div className="posture-result-capture-empty">Bu kayda ait kamera görüntüsü bu cihazda saklanmamış.</div>}
              <div className="posture-quality-legend posture-result-quality-legend">
                <span><i className="legend-good" /> İyi {quality.good}</span>
                <span><i className="legend-mid" /> Orta {quality.mid}</span>
                <span><i className="legend-fix" /> Düzelt {quality.fix}</span>
              </div>
              <div className="posture-result-confidence-badge">
                <strong>Gerçek veri</strong>
                <span>Genel güven %{confidence}</span>
              </div>
            </div>

            <div className="posture-result-capture-strip" aria-label="Üç açıdan postür kayıtları">
              {(["front", "side", "back"] as const).map((item) => (
                <button className={activeView === item ? "posture-result-capture-active" : ""} key={item} onClick={() => setActiveView(item)} type="button">
                  {report.captures[item].imageData ? <img src={report.captures[item].imageData} alt="" /> : <span className="posture-result-capture-empty posture-result-capture-empty-thumb">Görüntü yok</span>}
                  <span>{item === "front" ? "Ön" : item === "side" ? "Yan" : "Arka"}</span>
                </button>
              ))}
            </div>
          </main>

          <div className="posture-result-feedback-stack">
            <PostureFeedbackPanel
              analysis={viewAnalysis}
              captureImage={capture.imageData}
              guidanceText={report.summary}
              ready
              resultMode
              selectedShen={selectedShen}
              view={activeView}
            />
            <article className="posture-feedback-card posture-feedback-good">
              <span className="posture-feedback-title">Önceki ölçümle karşılaştırma</span>
              <p>{report.trendText}</p>
            </article>
            <div className="posture-result-medical-note">
              Bu bir medikal teşhis değildir. Belirgin ağrı, uyuşma veya skolyoz şüphesi varsa fizyoterapist ya da hekim değerlendirmesi gerekir.
            </div>
          </div>
        </div>

        <PostureInsightStrip analysis={compositeAnalysis} ready selectedShen={selectedShen} />
      </div>
    </section>
  );
}



export function PostureSavedReportsGallery({
  onDeleteReport,
  onOpenReport,
  onSetTrainerVisibility,
  reports,
}: {
  onDeleteReport?: (reportId: string) => void;
  onOpenReport: (report: PostureReport) => void;
  onSetTrainerVisibility?: (reportId: string, trainerVisible: boolean) => void;
  reports: PostureReport[];
}) {
  const [actionMessage, setActionMessage] = useState<{ id: string; text: string } | null>(null);

  async function handleShare(report: PostureReport) {
    const result = await sharePostureReport(report);
    if (!result) return;
    setActionMessage({ id: report.id, text: result });
    window.setTimeout(() => setActionMessage((current) => current?.id === report.id ? null : current), 3200);
  }

  function handleDelete(report: PostureReport) {
    if (!onDeleteReport) return;
    const confirmed = window.confirm(`${report.dateKey} tarihli postür analizini silmek istediğine emin misin?`);
    if (confirmed) onDeleteReport(report.id);
  }

  return (
    <section className="posture-saved-gallery" aria-label="Kayıtlı postür analizleri">
      <div className="posture-saved-gallery-heading">
        <div>
          <span className="eyebrow">Postür Arşivi</span>
          <h2>Kayıtlı analizlerin</h2>
        </div>
        <span>{reports.length} kayıt</span>
      </div>

      {reports.length ? (
        <div className="posture-saved-gallery-grid">
          {reports.map((report) => (
            <article key={report.id}>
              <button className="posture-saved-report-open" onClick={() => onOpenReport(report)} type="button">
                <div className="posture-saved-gallery-images">
                  {(["front", "side", "back"] as const).map((view) => (
                    report.captures[view].imageData ? <img
                      alt={`${report.dateKey} ${view === "front" ? "ön" : view === "side" ? "yan" : "arka"} postür kaydı`}
                      key={view}
                      src={report.captures[view].imageData}
                    /> : <span className="posture-result-capture-empty" key={view}>Görüntü yok</span>
                  ))}
                </div>
                <div className="posture-saved-gallery-meta">
                  <span>
                    <strong>{report.dateKey}</strong>
                    <small>{report.timeLabel} • {report.trendText}</small>
                  </span>
                  <b>{report.score}</b>
                </div>
                <span className="posture-saved-gallery-open">Analizi aç <i aria-hidden="true">›</i></span>
              </button>
              <div className="posture-saved-report-actions">
                <label>
                  <input
                    checked={report.trainerVisible ?? false}
                    disabled={!onSetTrainerVisibility}
                    onChange={(event) => onSetTrainerVisibility?.(report.id, event.target.checked)}
                    type="checkbox"
                  />
                  <span>Eğitmene açık</span>
                </label>
                <button onClick={() => void handleShare(report)} type="button">Paylaş</button>
                <button className="posture-report-delete" disabled={!onDeleteReport} onClick={() => handleDelete(report)} type="button">Sil</button>
              </div>
              {actionMessage?.id === report.id ? <div className="posture-report-action-message">{actionMessage.text}</div> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="posture-saved-gallery-empty">
          İlk ön, yan ve arka kaydını tamamladığında fotoğrafların burada tarihleriyle görünecek.
        </div>
      )}
    </section>
  );
}



export function PostureScorePanel({
  analysis,
  compact = false,
  confidence,
  ready,
  score,
  selectedShen,
}: {
  analysis: ReturnType<typeof analyzePosture>;
  compact?: boolean;
  confidence?: number;
  ready: boolean;
  score: number;
  selectedShen: PostureShen;
}) {
  const metrics = getPostureMetricList(analysis);
  const scoreLabel = !ready ? "Kurulum" : score >= 82 ? "İyi" : score >= 68 ? "Orta" : "Düzelt";

  return (
    <aside className="posture-score-column">
      <div className="posture-score-ring-card">
        <div
          className="posture-score-ring"
          style={{ "--score-value": `${ready ? score : 12}`, "--shen-accent": selectedShen.color } as CSSProperties}
        >
          <strong>{ready ? score : "--"}</strong>
          <span>/100</span>
        </div>
        <p>Genel Skor</p>
        <b>{scoreLabel}</b>
        {compact && typeof confidence === "number" ? <span className="posture-score-confidence">Genel güven %{confidence}</span> : null}
      </div>

      {!compact ? <div className="posture-score-list">
        {metrics.map((metric) => (
          <article className={`posture-score-item posture-score-${metric.value >= 80 ? "good" : metric.value >= 62 ? "mid" : "fix"}`} key={metric.label}>
            <span className="posture-score-icon">{metric.icon}</span>
            <div>
              <strong>{metric.label}</strong>
              <i>
                <b style={{ width: `${ready ? metric.value : 0}%` }} />
              </i>
            </div>
            <em>{ready ? `${metric.value}/100` : "--"}</em>
          </article>
        ))}
      </div> : null}
    </aside>
  );
}



export function PostureFeedbackPanel({
  analysis,
  captureImage,
  guidanceText,
  ready,
  resultMode = false,
  selectedShen,
  view,
}: {
  analysis: ReturnType<typeof analyzePosture>;
  captureImage?: string;
  guidanceText: string;
  ready: boolean;
  resultMode?: boolean;
  selectedShen: PostureShen;
  view: PostureView;
}) {
  const corrections = getPostureCorrections(analysis, ready);
  const recommendations = getPostureRecommendations(analysis, view);

  return (
    <aside className="posture-feedback-column">
      <article className="posture-feedback-card posture-feedback-good">
        <span className="posture-feedback-title">{resultMode ? "Kişiselleştirilmiş Öneriler ve Notlar" : "Genel Geri Bildirim"}</span>
        <p>{ready ? analysis.feedback : guidanceText}</p>
      </article>

      <article className="posture-feedback-card posture-feedback-warning">
        <span className="posture-feedback-title">{resultMode ? "Öncelikli Nokta" : "Düzeltilecek Noktalar"}</span>
        <div className="posture-correction-row">
          {resultMode && captureImage ? (
            <img className="posture-feedback-user-photo" src={captureImage} alt={`${view === "front" ? "Ön" : view === "side" ? "Yan" : "Arka"} postür kaydın`} />
          ) : (
            <div className="posture-mini-body" aria-hidden="true">
              <PostureSkeleton2D analysis={analysis} selectedShen={selectedShen} view={view} />
            </div>
          )}
          <p>{corrections[0]}</p>
        </div>
      </article>

      <article className="posture-feedback-card posture-feedback-improve">
        <span className="posture-feedback-title">{resultMode ? "Sana Özel Çalışma" : "Önerilen İyileştirmeler"}</span>
        <div className="posture-recommendation-list">
          {recommendations.map((item) => (
            <div className="posture-recommendation" key={item.title}>
              <span>{item.initial}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        {!resultMode ? <button className="posture-see-all" type="button">
          Tüm Önerileri Gör
          <span aria-hidden="true">›</span>
        </button> : null}
      </article>
    </aside>
  );
}



export function PostureInsightStrip({
  analysis,
  ready,
  selectedShen,
}: {
  analysis: ReturnType<typeof analyzePosture>;
  ready: boolean;
  selectedShen: PostureShen;
}) {
  const insights = [
    {
      label: "Ölçüm Güveni",
      title: ready ? `Görünür eklem güveni %${analysis.confidence}.` : "Tam beden görünürlüğü bekleniyor.",
      tone: "green",
    },
    {
      label: "Yin & Yang Dengesi",
      title: ready && analysis.hipScore > 76 ? "Ağırlık dağılımı sakin." : "Sağ-sol ağırlığını eşitle.",
      tone: "blue",
    },
    {
      label: "Enerji Akışı",
      title: ready && analysis.axisScore > 76 ? "Eksen akıyor, devam et." : `${selectedShen.dailyName} için merkezi toparla.`,
      tone: "gold",
    },
  ];

  return (
    <div className="posture-insight-strip">
      {insights.map((item) => (
        <article className={`posture-insight posture-insight-${item.tone}`} key={item.label}>
          <span>{item.label.slice(0, 1)}</span>
          <div>
            <strong>{item.label}</strong>
            <p>{item.title}</p>
          </div>
        </article>
      ))}
    </div>
  );
}



export function PostureSkeleton2D({
  analysis,
  selectedShen,
  view,
}: {
  analysis: ReturnType<typeof analyzePosture>;
  selectedShen: PostureShen;
  view: PostureView;
}) {
  const compressed = view === "side";
  const shoulderLeftX = compressed ? 102 : view === "back" ? 150 : 70;
  const shoulderRightX = compressed ? 118 : view === "back" ? 70 : 150;
  const hipLeftX = compressed ? 104 : view === "back" ? 140 : 82;
  const hipRightX = compressed ? 116 : view === "back" ? 80 : 138;
  const shoulderLeftY = 90 + analysis.shoulderTilt * 0.22;
  const shoulderRightY = 90 - analysis.shoulderTilt * 0.22;
  const hipLeftY = 168 + analysis.hipTilt * 0.18;
  const hipRightY = 168 - analysis.hipTilt * 0.18;
  const spineX = 110 + analysis.spineShift;
  const headX = 110 + analysis.spineShift * 0.45;

  return (
    <svg className="posture-skeleton-2d" viewBox="0 0 220 300" role="img" aria-label="2D postür çizgisi">
      <defs>
        <linearGradient id="posture2dLine" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={selectedShen.color} />
          <stop offset="100%" stopColor="#fff4c8" />
        </linearGradient>
      </defs>
      <line className="posture-center-line" x1="110" x2="110" y1="24" y2="266" />
      <path className="posture-curve-band" d={`M${headX} 58 C${108 + analysis.spineShift * 0.6} 98 ${spineX} 132 ${spineX} 170 C${spineX - analysis.spineShift * 0.4} 206 108 230 108 254`} />
      <circle className="posture-head" cx={headX} cy="45" r="16" />
      <line className="posture-bone" x1={shoulderLeftX} x2={shoulderRightX} y1={shoulderLeftY} y2={shoulderRightY} />
      <line className="posture-bone posture-hip-line" x1={hipLeftX} x2={hipRightX} y1={hipLeftY} y2={hipRightY} />
      <path className="posture-bone" d={`M${shoulderLeftX} ${shoulderLeftY} C${compressed ? 84 : 48} 118 ${compressed ? 84 : 44} 154 ${compressed ? 98 : 68} 184`} />
      <path className="posture-bone" d={`M${shoulderRightX} ${shoulderRightY} C${compressed ? 136 : 172} 118 ${compressed ? 136 : 176} 154 ${compressed ? 122 : 152} 184`} />
      <path className="posture-bone" d={`M${hipLeftX} ${hipLeftY} C${compressed ? 96 : 72} 204 ${compressed ? 96 : 62} 232 ${compressed ? 104 : 72} 264`} />
      <path className="posture-bone" d={`M${hipRightX} ${hipRightY} C${compressed ? 124 : 148} 204 ${compressed ? 124 : 158} 232 ${compressed ? 116 : 148} 264`} />
      {[
        [headX, 45],
        [shoulderLeftX, shoulderLeftY],
        [shoulderRightX, shoulderRightY],
        [hipLeftX, hipLeftY],
        [hipRightX, hipRightY],
        [compressed ? 98 : 68, 184],
        [compressed ? 122 : 152, 184],
        [compressed ? 104 : 72, 264],
        [compressed ? 116 : 148, 264],
      ].map(([x, y]) => (
        <circle className="posture-node" cx={x} cy={y} key={`${x}-${y}`} r="5" />
      ))}
      <text className="posture-view-label" x="110" y="288">
        {view === "front" ? "Ön hat" : view === "side" ? "Yan eksen" : "Arka hat"}
      </text>
    </svg>
  );
}



export function evaluateWebPostureFrame(
  keypoints: PoseKeypoint[],
  view: PostureView,
  frameWidth = 0,
  frameHeight = 0,
) {
  const byName = new Map(keypoints.map((point) => [point.name, point]));
  const visible = (name: string, threshold = 0.5) => {
    const point = byName.get(name);
    return Boolean(point && (point.score ?? 0) >= threshold);
  };
  const headThreshold = view === "back" ? 0.12 : view === "side" ? 0.2 : 0.28;
  // Back-facing pose models often hide every facial landmark even when the
  // whole body is perfectly framed. Requiring a nose/ear here made the final
  // step impossible on those cameras; shoulders and ankles already provide
  // the framing evidence needed for the back view.
  const headReady = view === "back" || ["nose", "left_ear", "right_ear"].some((name) => visible(name, headThreshold));
  const pairReady = (left: string, right: string, threshold: number) =>
    view === "side"
      ? visible(left, threshold) || visible(right, threshold)
      : visible(left, threshold) && visible(right, threshold);
  const bodyReady =
    headReady &&
    pairReady("left_shoulder", "right_shoulder", 0.42) &&
    pairReady("left_hip", "right_hip", 0.42) &&
    pairReady("left_knee", "right_knee", 0.36) &&
    pairReady("left_ankle", "right_ankle", 0.3);
  if (!bodyReady) return { bodyReady: false, angleReady: false, positionReady: false, positionCue: "Tam bedenini kadraja al." };

  const leftShoulder = visible("left_shoulder", 0.28) ? byName.get("left_shoulder") : undefined;
  const rightShoulder = visible("right_shoulder", 0.28) ? byName.get("right_shoulder") : undefined;
  const leftAnkle = visible("left_ankle", 0.22) ? byName.get("left_ankle") : undefined;
  const rightAnkle = visible("right_ankle", 0.22) ? byName.get("right_ankle") : undefined;
  const shoulderPoints = [leftShoulder, rightShoulder].filter((point): point is PoseKeypoint => Boolean(point));
  const anklePoints = [leftAnkle, rightAnkle].filter((point): point is PoseKeypoint => Boolean(point));
  const shoulderCenterY = shoulderPoints.reduce((sum, point) => sum + point.y, 0) / shoulderPoints.length;
  const ankleCenterY = anklePoints.reduce((sum, point) => sum + point.y, 0) / anklePoints.length;
  const bodyHeight = Math.max(1, Math.abs(ankleCenterY - shoulderCenterY));
  const shoulderWidthRatio = leftShoulder && rightShoulder ? Math.abs(leftShoulder.x - rightShoulder.x) / bodyHeight : 0;
  const shoulderFacingRatio = leftShoulder && rightShoulder ? (leftShoulder.x - rightShoulder.x) / bodyHeight : 0;
  const faceNames = ["nose", "left_eye", "right_eye", "left_ear", "right_ear"];
  const faceConfidence = faceNames.reduce((sum, name) => sum + (byName.get(name)?.score ?? 0), 0) / faceNames.length;
  const angleReady =
    view === "side"
      ? shoulderWidthRatio < 0.19
      : view === "front"
        ? shoulderFacingRatio >= 0.12 && faceConfidence >= 0.3
        : true;

  const measurablePoints = keypoints.filter((point) => (point.score ?? 0) >= 0.35);
  const width = frameWidth || Math.max(1, ...measurablePoints.map((point) => point.x));
  const height = frameHeight || Math.max(1, ...measurablePoints.map((point) => point.y));
  const minX = Math.min(...measurablePoints.map((point) => point.x));
  const maxX = Math.max(...measurablePoints.map((point) => point.x));
  const minY = Math.min(...measurablePoints.map((point) => point.y));
  const maxY = Math.max(...measurablePoints.map((point) => point.y));
  const displayCenterX = width - (minX + maxX) / 2;
  const bodyRatio = (maxY - minY) / height;
  const horizontalOffset = displayCenterX / width - 0.5;
  let positionCue = "Kadrajdaki beden kılavuzunun ortasında kal.";
  let positionReady = true;
  if (bodyRatio > 0.88) {
    positionReady = false;
    positionCue = "Bir adım geri git.";
  } else if (bodyRatio < 0.5) {
    positionReady = false;
    positionCue = "Kameraya yarım adım yaklaş.";
  } else if (horizontalOffset < -0.1) {
    positionReady = false;
    positionCue = "Biraz sağa geç.";
  } else if (horizontalOffset > 0.1) {
    positionReady = false;
    positionCue = "Biraz sola geç.";
  }

  return { bodyReady, angleReady, positionReady, positionCue };
}



async function sharePostureReport(report: PostureReport): Promise<string | null> {
  try {
    const file = await createPostureShareFile(report);
    const shareData = {
      files: [file],
      text: `${report.dateKey} postür analizi • Genel skor ${report.score}/100`,
      title: "Ritim Kapısı Postür Analizi",
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      return "Paylaşım menüsü açıldı.";
    }

    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `postur-analizi-${report.createdAt.slice(0, 10)}.jpg`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    return "Sosyal paylaşım görseli indirildi.";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null;
    return "Paylaşım hazırlanamadı. Tekrar deneyebilirsin.";
  }
}



async function createPostureShareFile(report: PostureReport): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Paylaşım görseli oluşturulamadı");

  const gradient = context.createLinearGradient(0, 0, 1200, 1200);
  gradient.addColorStop(0, "#07130f");
  gradient.addColorStop(1, "#17221c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 1200);

  const views = await Promise.all(
    (["front", "side", "back"] as const).map((view) => loadPostureShareImage(report.captures[view].imageData)),
  );
  views.forEach((image, index) => {
    const x = 48 + index * 368;
    drawPostureShareCover(context, image, x, 54, 352, 720);
    context.fillStyle = "rgba(5, 12, 10, 0.76)";
    context.fillRect(x, 714, 352, 60);
    context.fillStyle = "#f7f0e4";
    context.font = "800 26px system-ui, sans-serif";
    context.fillText(index === 0 ? "Ön" : index === 1 ? "Yan" : "Arka", x + 20, 753);
  });

  context.fillStyle = "#d9b866";
  context.font = "800 24px system-ui, sans-serif";
  context.fillText("RİTİM KAPISI • POSTÜR ANALİZİ", 52, 840);
  context.fillStyle = "#f7f0e4";
  context.font = "900 84px system-ui, sans-serif";
  context.fillText(`${report.score}`, 50, 946);
  context.font = "750 30px system-ui, sans-serif";
  context.fillText("/100 GENEL SKOR", 190, 944);
  context.fillStyle = "rgba(247, 240, 228, 0.72)";
  context.font = "700 25px system-ui, sans-serif";
  context.fillText(`${report.dateKey} • ${report.timeLabel}`, 52, 1004);
  drawPostureShareText(context, report.summary, 52, 1060, 1088, 32);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Görsel hazırlanamadı")), "image/jpeg", 0.9);
  });
  return new File([blob], `postur-analizi-${report.createdAt.slice(0, 10)}.jpg`, { type: "image/jpeg" });
}



function loadPostureShareImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Kayıt görseli açılamadı"));
    image.src = src;
  });
}



function drawPostureShareCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}



function drawPostureShareText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let lineIndex = 0;
  for (const word of words) {
    const candidate = `${line}${word} `;
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line.trim(), x, y + lineIndex * lineHeight);
      line = `${word} `;
      lineIndex += 1;
      if (lineIndex >= 2) break;
    } else {
      line = candidate;
    }
  }
  if (lineIndex < 2 && line) context.fillText(line.trim(), x, y + lineIndex * lineHeight);
}
