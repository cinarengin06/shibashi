import { livingReferencePoses } from "./data";
import type { LivingComparisonResult, LivingComparisonSample, LivingPosePoint } from "./types";

const REQUIRED = ["left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"];

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const scoreFromError = (error: number, tolerance: number) => Math.round(clamp(100 * (1 - error / tolerance)));
const point = (pose: readonly LivingPosePoint[], name: string) => pose.find((item) => item.name === name && (item.score ?? 1) >= .38);
const distance = (a: LivingPosePoint, b: LivingPosePoint) => Math.hypot(a.x - b.x, a.y - b.y);

function angle(a: LivingPosePoint, b: LivingPosePoint, c: LivingPosePoint) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const denominator = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (!denominator) return 0;
  return Math.acos(clamp((ab.x * cb.x + ab.y * cb.y) / denominator, -1, 1)) * 180 / Math.PI;
}

function normalizedPose(source: readonly LivingPosePoint[]): LivingPosePoint[] | null {
  const leftShoulder = point(source, "left_shoulder"), rightShoulder = point(source, "right_shoulder");
  const leftHip = point(source, "left_hip"), rightHip = point(source, "right_hip");
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;
  const centerX = (leftHip.x + rightHip.x) / 2;
  const centerY = (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4;
  const scale = Math.max(.001, distance(leftShoulder, rightShoulder));
  return source.map((item) => ({ ...item, x: (item.x - centerX) / scale, y: (item.y - centerY) / scale }));
}

export function compareLivingMovement(sample: LivingComparisonSample): LivingComparisonResult | null {
  const visible = REQUIRED.filter((name) => point(sample.landmarks, name));
  if (visible.length < 10) return null;
  const reference = livingReferencePoses[`push-${sample.stepId === "push" ? "forward" : sample.stepId}`] ?? livingReferencePoses["push-prepare"];
  const user = normalizedPose(sample.landmarks), target = normalizedPose(reference);
  if (!user || !target) return null;

  const u = (name: string) => point(user, name)!;
  const t = (name: string) => point(target, name)!;
  const shoulderError = Math.abs((u("left_shoulder").y - u("right_shoulder").y) - (t("left_shoulder").y - t("right_shoulder").y));
  const shoulderLevel = scoreFromError(shoulderError, .22);
  const handError = (distance(u("left_wrist"), t("left_wrist")) + distance(u("right_wrist"), t("right_wrist"))) / 2;
  const handPath = scoreFromError(handError, 1.25);
  const userLeftElbow = angle(u("left_shoulder"), u("left_elbow"), u("left_wrist"));
  const userRightElbow = angle(u("right_shoulder"), u("right_elbow"), u("right_wrist"));
  const targetLeftElbow = angle(t("left_shoulder"), t("left_elbow"), t("left_wrist"));
  const targetRightElbow = angle(t("right_shoulder"), t("right_elbow"), t("right_wrist"));
  const elbowSymmetry = scoreFromError((Math.abs(userLeftElbow - targetLeftElbow) + Math.abs(userRightElbow - targetRightElbow)) / 2, 65);
  const userShoulderMidX = (u("left_shoulder").x + u("right_shoulder").x) / 2;
  const userHipMidX = (u("left_hip").x + u("right_hip").x) / 2;
  const torsoDirection = scoreFromError(Math.abs(userShoulderMidX - userHipMidX), .32);
  const ankleMidX = (u("left_ankle").x + u("right_ankle").x) / 2;
  const weightTransfer = scoreFromError(Math.abs(userHipMidX - ankleMidX), .52);
  const movementScore = Math.round(shoulderLevel * .2 + handPath * .3 + elbowSymmetry * .2 + torsoDirection * .15 + weightTransfer * .15);
  const rhythmScore = Math.round(clamp(82 + Math.min(12, sample.elapsedMs / 2500) - Math.abs(88 - movementScore) * .18));
  const metrics = { shoulderLevel, handPath, elbowSymmetry, torsoDirection, weightTransfer };
  const ranked = Object.entries(metrics).sort((a, b) => b[1] - a[1]);
  const weakest = [...ranked].sort((a, b) => a[1] - b[1])[0];
  const feedback = weakest[1] >= 78 ? "Güzel, akışı koru." : weakest[0] === "shoulderLevel" ? "Omuzlarını biraz bırak." : weakest[0] === "handPath" ? "İki elini aynı yumuşak çizgide taşı." : weakest[0] === "elbowSymmetry" ? "Dirseklerini kilitlemeden eşleştir." : weakest[0] === "weightTransfer" ? "Ağırlığını daha yavaş aktar." : "Göğsünü merkezin üzerinde sakin tut.";
  const metricLabels: Record<string, string> = { shoulderLevel: "omuz hizası", handPath: "el yolu", elbowSymmetry: "dirsek yumuşaklığı", torsoDirection: "gövde yönü", weightTransfer: "ağırlık aktarımı" };
  return { confidence: visible.length / REQUIRED.length, movementScore, rhythmScore, metrics, feedback, bestMetric: metricLabels[ranked[0][0]] };
}
