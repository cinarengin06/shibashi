import type { PoseLandmark } from "@/types/pose";

export const POSE_THRESHOLDS = {
  visibility: 0.55,
  minimumBodyVisibleMs: 1500,
  readyHoldMs: 2000,
  transitionHoldMs: 400,
  holdingMs: 3000,
  wristShoulderTolerance: 0.11,
  wristStartBelowShoulder: 0.23,
  shoulderLevelTolerance: 0.09,
  torsoLeanToleranceDegrees: 13,
  elbowTargetMin: 145,
  elbowTargetMax: 175,
  elbowHardLock: 177,
  armHeightAcceptableError: 0.07,
  armHeightMaximumError: 0.28,
  symmetryAcceptableError: 0.06,
  symmetryMaximumError: 0.28,
  raisingTargetMinMs: 3000,
  raisingTargetMaxMs: 6000,
  loweringTargetMinMs: 3000,
  loweringTargetMaxMs: 6000,
  tooFastMs: 2200,
} as const;

export function distance(a: PoseLandmark, b: PoseLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: PoseLandmark, b: PoseLandmark): PoseLandmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

export function angle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const denominator = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (denominator === 0) return 0;
  const cosine = clamp((abx * cbx + aby * cby) / denominator, -1, 1);
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeScore(error: number, acceptableError: number, maximumError: number): number {
  if (error <= acceptableError) return 100;
  if (error >= maximumError) return 0;
  return Math.round(100 * (1 - (error - acceptableError) / (maximumError - acceptableError)));
}

export function average(numbers: number[]): number {
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : 0;
}

export function landmarkVisible(landmark: PoseLandmark | undefined, threshold = POSE_THRESHOLDS.visibility): boolean {
  return Boolean(landmark && (landmark.visibility ?? landmark.presence ?? 1) >= threshold);
}

export function getShoulderWidth(landmarks: PoseLandmark[]): number {
  return distance(landmarks[11], landmarks[12]);
}

export function getHipWidth(landmarks: PoseLandmark[]): number {
  return distance(landmarks[23], landmarks[24]);
}

export function getTorsoLength(landmarks: PoseLandmark[]): number {
  return distance(midpoint(landmarks[11], landmarks[12]), midpoint(landmarks[23], landmarks[24]));
}

export function normalizedDistance(a: PoseLandmark, b: PoseLandmark, torsoLength: number): number {
  return torsoLength > 0 ? distance(a, b) / torsoLength : 0;
}
