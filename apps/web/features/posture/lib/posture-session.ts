import { analyzePosture, type PoseKeypoint, type PostureAnalysisSnapshot, type PostureView } from "@/packages/posture-analysis";
import { evaluateWebPostureFrame } from "../components/PostureScreens";
import type { PostureAssessmentCapture, PostureReport } from "../types";
import { formatSnapshotDate, formatSnapshotTime } from "@/lib/local-history-storage";
import { colorWithAlpha, drawPoseKeypoints, drawPostureQualityConnections, drawPostureQualityKeypoints, drawPostureReferenceGuides, postureDisplayPoints } from "./pose-canvas";

export function toPostureAnalysisSnapshot(analysis: ReturnType<typeof analyzePosture>): PostureAnalysisSnapshot {
  return {
    axisScore: analysis.axisScore,
    confidence: analysis.confidence,
    feedback: analysis.feedback,
    flags: analysis.flags,
    hipScore: analysis.hipScore,
    hipTilt: analysis.hipTilt,
    shoulderScore: analysis.shoulderScore,
    shoulderTilt: analysis.shoulderTilt,
    spineShift: analysis.spineShift,
    view: analysis.view,
  };
}

export function aggregatePostureAnalysisSnapshots(samples: PostureAnalysisSnapshot[]): PostureAnalysisSnapshot {
  const median = (values: number[]) => {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  };
  const latest = samples[samples.length - 1];
  return {
    ...latest,
    axisScore: Math.round(median(samples.map((sample) => sample.axisScore))),
    confidence: Math.round(median(samples.map((sample) => sample.confidence))),
    hipScore: Math.round(median(samples.map((sample) => sample.hipScore))),
    hipTilt: median(samples.map((sample) => sample.hipTilt)),
    sampleCount: samples.length,
    shoulderScore: Math.round(median(samples.map((sample) => sample.shoulderScore))),
    shoulderTilt: median(samples.map((sample) => sample.shoulderTilt)),
    spineShift: median(samples.map((sample) => sample.spineShift)),
  };
}

export function createPostureCapture(
  video: HTMLVideoElement | null,
  keypoints: PoseKeypoint[],
  view: PostureView,
  analysis: PostureAnalysisSnapshot,
  accent: string,
): PostureAssessmentCapture | null {
  if (!video || video.readyState < 2) return null;

  const width = video.videoWidth || 720;
  const height = video.videoHeight || 1280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, width, height);
  context.restore();

  const mirroredKeypoints = keypoints.map((keypoint) => ({
    ...keypoint,
    x: width - keypoint.x,
  }));

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = colorWithAlpha(accent, 0.38);
  context.shadowBlur = 14;
  drawPostureReferenceGuides(context, mirroredKeypoints, analysis);
  drawPostureQualityConnections(context, mirroredKeypoints, analysis);
  drawPoseKeypoints(context, mirroredKeypoints, accent, postureDisplayPoints);
  drawPostureQualityKeypoints(context, mirroredKeypoints, analysis);
  context.restore();

  return {
    analysis,
    createdAt: new Date().toISOString(),
    imageData: canvas.toDataURL("image/jpeg", 0.84),
    view,
  };
}

export function smoothPoseKeypoints(previous: PoseKeypoint[], current: PoseKeypoint[], alpha = 0.24): PoseKeypoint[] {
  if (!previous.length) return current;
  const previousByName = new Map(previous.map((point) => [point.name, point]));
  return current.map((point) => {
    const before = previousByName.get(point.name);
    if (!before || (point.score ?? 0) < 0.2 || (before.score ?? 0) < 0.2) return point;
    return {
      ...point,
      x: before.x + (point.x - before.x) * alpha,
      y: before.y + (point.y - before.y) * alpha,
      score: (before.score ?? 0) * (1 - alpha) + (point.score ?? 0) * alpha,
    };
  });
}

export function getPostureOrientationCue(view: PostureView) {
  if (view === "front") return "Ön görünüm. Kameraya dön. Ayaklarını kalça genişliğinde aç ve kollarını rahat bırak.";
  if (view === "side") return "Şimdi sağ yanını kameraya dön. Başını doğal konumda tut ve kollarını rahat bırak.";
  return "Şimdi arkanı kameraya dön. Ağırlığını iki ayağına eşit dağıt ve doğal dur.";
}

export function isPostureDetectorAbort(error: unknown) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return /abort(?:ed)?|deleted object|not found/i.test(message);
}

export function getPostureLiveCoachCue(
  view: PostureView,
  readiness: ReturnType<typeof evaluateWebPostureFrame>,
  analysis: PostureAnalysisSnapshot,
  keypoints: PoseKeypoint[],
) {
  if (!readiness.bodyReady) return "Laptop ekranını sabitle. Başınla ayakların aynı karede görünene kadar biraz geri çekil.";
  if (!readiness.angleReady) return getPostureOrientationCue(view);
  if (!readiness.positionReady) return readiness.positionCue;

  if (view === "side") {
    if (analysis.shoulderScore < 70) return "Çeneni hafifçe geriye al. Başını omuzunun üzerinde tut.";
    if (analysis.axisScore < 70) return "Göğsünü kaldırmadan gövdeni dikey hatta getir.";
    if (analysis.hipScore < 70) return "Kalçanı ayak bileğinin üzerinde hizala.";
  } else {
    if (analysis.shoulderScore < 70) {
      const left = keypoints.find((point) => point.name === "left_shoulder");
      const right = keypoints.find((point) => point.name === "right_shoulder");
      if (left && right) return left.y < right.y ? "Sol omzunu biraz indir." : "Sağ omzunu biraz indir.";
      return "Omuzlarını aynı yüksekliğe getir.";
    }
    if (analysis.hipScore < 70) return "Ağırlığını iki ayağına eşit dağıt.";
    if (analysis.axisScore < 70) return analysis.spineShift > 0 ? "Gövdeni hafifçe sola taşı." : "Gövdeni hafifçe sağa taşı.";
  }
  return "Duruşun dengeli. Nefesini değiştirmeden sabit kal.";
}

export function getPoseStabilityDistance(previous: PoseKeypoint[], current: PoseKeypoint[]): number {
  const trackedNames = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_hip",
    "right_hip",
    "left_knee",
    "right_knee",
    "left_ankle",
    "right_ankle",
  ];
  const previousByName = new Map(previous.map((point) => [point.name, point]));
  const distances = current.flatMap((point) => {
    if (!point.name || !trackedNames.includes(point.name) || (point.score ?? 0) < 0.35) return [];
    const before = previousByName.get(point.name);
    if (!before || (before.score ?? 0) < 0.35) return [];
    return [Math.hypot(point.x - before.x, point.y - before.y)];
  });
  if (distances.length < 6) return Number.POSITIVE_INFINITY;
  return distances.reduce((sum, distance) => sum + distance, 0) / distances.length;
}

export function buildPostureReport(captures: Record<PostureView, PostureAssessmentCapture>, previous?: PostureReport): PostureReport {
  const analyses = [captures.front.analysis, captures.side.analysis, captures.back.analysis];
  const score = Math.round(
    analyses.reduce((sum, analysis) => sum + analysis.axisScore + analysis.shoulderScore + analysis.hipScore, 0) / (analyses.length * 3),
  );
  const strongestSignal = Math.max(
    ...analyses.flatMap((analysis) => [Math.abs(analysis.shoulderTilt), Math.abs(analysis.hipTilt), Math.abs(analysis.spineShift)]),
  );
  const asymmetrySignal: PostureReport["asymmetrySignal"] =
    strongestSignal > 15 || score < 62 ? "yüksek" : strongestSignal > 8 || score < 78 ? "orta" : "düşük";
  const flags = Array.from(new Set(analyses.flatMap((analysis) => analysis.flags))).slice(0, 6);
  const now = new Date();
  const trendDelta = previous ? score - previous.score : 0;
  const trendText = previous
    ? trendDelta > 2
      ? `${trendDelta} puan iyileşme`
      : trendDelta < -2
        ? `${Math.abs(trendDelta)} puan gerileme sinyali`
        : "önceki rapora yakın"
    : "baz çizgi oluşturuldu";
  const summary =
    asymmetrySignal === "yüksek"
      ? "Omuz, kalça veya merkez hattında belirgin asimetri sinyali var. Ağrı ya da şüphe varsa profesyonel değerlendirme önerilir."
      : asymmetrySignal === "orta"
        ? "Bazı açılarda takip edilmesi gereken postür asimetrisi görünüyor. Düzenli tekrar ile trendi izle."
        : "Postür hattı sakin görünüyor. Bu rapor ilerideki iyileşme kıyası için baz olarak saklanabilir.";

  return {
    asymmetrySignal,
    captures,
    createdAt: now.toISOString(),
    dateKey: formatSnapshotDate(now),
    flags,
    id: `posture-${now.getTime()}`,
    score,
    summary,
    timeLabel: formatSnapshotTime(now),
    trendText,
  };
}
