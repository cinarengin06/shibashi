import type { CoachStage, PoseEvaluation, PoseLandmark, ScoreBreakdown } from "@/types/pose";
import {
  POSE_THRESHOLDS,
  angle,
  average,
  clamp,
  landmarkVisible,
  midpoint,
  normalizeScore,
} from "@/lib/pose/poseMath";

const REQUIRED = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28] as const;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;

type Metrics = {
  leftElbow: number;
  rightElbow: number;
  wristHeightDifference: number;
  meanWristToShoulder: number;
  shoulderSlope: number;
  torsoLean: number;
  meanWristY: number;
};

function emptyScores(): ScoreBreakdown {
  return { symmetry: 0, armHeight: 0, softElbows: 0, torsoStability: 0, tempo: 0 };
}

function calculateMetrics(landmarks: PoseLandmark[]): Metrics {
  const shoulderMid = midpoint(landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER]);
  const hipMid = midpoint(landmarks[LEFT_HIP], landmarks[RIGHT_HIP]);
  const torsoVectorX = shoulderMid.x - hipMid.x;
  const torsoVectorY = hipMid.y - shoulderMid.y;
  return {
    leftElbow: angle(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST]),
    rightElbow: angle(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST]),
    wristHeightDifference: Math.abs(landmarks[LEFT_WRIST].y - landmarks[RIGHT_WRIST].y),
    meanWristToShoulder: average([
      Math.abs(landmarks[LEFT_WRIST].y - landmarks[LEFT_SHOULDER].y),
      Math.abs(landmarks[RIGHT_WRIST].y - landmarks[RIGHT_SHOULDER].y),
    ]),
    shoulderSlope: Math.abs(landmarks[LEFT_SHOULDER].y - landmarks[RIGHT_SHOULDER].y),
    torsoLean: Math.abs((Math.atan2(torsoVectorX, torsoVectorY) * 180) / Math.PI),
    meanWristY: average([landmarks[LEFT_WRIST].y, landmarks[RIGHT_WRIST].y]),
  };
}

function tempoScore(duration: number): number {
  if (duration >= POSE_THRESHOLDS.raisingTargetMinMs && duration <= POSE_THRESHOLDS.raisingTargetMaxMs) return 100;
  if (duration < POSE_THRESHOLDS.raisingTargetMinMs) {
    return clamp(Math.round((duration / POSE_THRESHOLDS.raisingTargetMinMs) * 100), 0, 100);
  }
  return clamp(Math.round(100 - ((duration - POSE_THRESHOLDS.raisingTargetMaxMs) / 4000) * 100), 0, 100);
}

export function createRaiseArmsEvaluator() {
  let stage: CoachStage = "CAMERA_OFF";
  let stageStartedAt = 0;
  let conditionStartedAt: number | null = null;
  let previousMetrics: Metrics | null = null;
  let previousAt = 0;
  let baselineTorsoLean = 0;
  let raisingStartedAt = 0;
  let loweringStartedAt = 0;
  let raisingDuration = 0;
  let loweringDuration = 0;
  let accumulatedSymmetry: number[] = [];
  let accumulatedArmHeight: number[] = [];
  let accumulatedSoftElbows: number[] = [];
  let accumulatedTorso: number[] = [];
  let lastWarning = "";

  function transition(next: CoachStage, now: number): boolean {
    if (stage === next) return false;
    stage = next;
    stageStartedAt = now;
    conditionStartedAt = null;
    if (next === "RAISING") raisingStartedAt = now;
    if (next === "LOWERING") loweringStartedAt = now;
    return true;
  }

  function held(condition: boolean, now: number, duration: number): boolean {
    if (!condition) {
      conditionStartedAt = null;
      return false;
    }
    conditionStartedAt ??= now;
    return now - conditionStartedAt >= duration;
  }

  function getScores(metrics: Metrics): ScoreBreakdown {
    const symmetry = Math.round(average(accumulatedSymmetry.length ? accumulatedSymmetry : [
      normalizeScore(metrics.wristHeightDifference, POSE_THRESHOLDS.symmetryAcceptableError, POSE_THRESHOLDS.symmetryMaximumError),
      normalizeScore(Math.abs(metrics.leftElbow - metrics.rightElbow), 6, 35),
    ]));
    const armHeight = Math.round(average(accumulatedArmHeight.length ? accumulatedArmHeight : [
      normalizeScore(metrics.meanWristToShoulder, POSE_THRESHOLDS.armHeightAcceptableError, POSE_THRESHOLDS.armHeightMaximumError),
    ]));
    const softElbows = Math.round(average(accumulatedSoftElbows.length ? accumulatedSoftElbows : [
      normalizeScore(Math.max(0, POSE_THRESHOLDS.elbowTargetMin - metrics.leftElbow), 0, 35),
      normalizeScore(Math.max(0, metrics.leftElbow - POSE_THRESHOLDS.elbowTargetMax), 0, 20),
      normalizeScore(Math.max(0, POSE_THRESHOLDS.elbowTargetMin - metrics.rightElbow), 0, 35),
      normalizeScore(Math.max(0, metrics.rightElbow - POSE_THRESHOLDS.elbowTargetMax), 0, 20),
    ]));
    const torsoStability = Math.round(average(accumulatedTorso.length ? accumulatedTorso : [
      normalizeScore(Math.abs(metrics.torsoLean - baselineTorsoLean), 3, 16),
    ]));
    const tempo = raisingDuration && loweringDuration
      ? Math.round(average([tempoScore(raisingDuration), tempoScore(loweringDuration)]))
      : raisingDuration
        ? tempoScore(raisingDuration)
        : 0;
    return { symmetry, armHeight, softElbows, torsoStability, tempo };
  }

  function finalFrom(scores: ScoreBreakdown): number {
    return Math.round(
      scores.symmetry * 0.25 +
      scores.armHeight * 0.25 +
      scores.softElbows * 0.2 +
      scores.torsoStability * 0.15 +
      scores.tempo * 0.15,
    );
  }

  function update(landmarks: PoseLandmark[] | null, now: number): PoseEvaluation {
    if (!landmarks) {
      if (stage !== "CAMERA_OFF") transition("FIND_BODY", now);
      return {
        stage,
        instruction: "Kameradan biraz uzaklaş, tüm bedenin görünsün.",
        liveScore: null,
        finalScore: null,
        holdRemainingSeconds: null,
        scores: emptyScores(),
        jointStatus: {},
        stateChanged: false,
        hasPose: false,
      };
    }

    if (stage === "CAMERA_OFF") transition("FIND_BODY", now);
    const visible = REQUIRED.every((index) => landmarkVisible(landmarks[index]));
    if (!visible) {
      transition("FIND_BODY", now);
      return {
        stage,
        instruction: "Kameradan biraz uzaklaş, tüm bedenin görünsün.",
        liveScore: null,
        finalScore: null,
        holdRemainingSeconds: null,
        scores: emptyScores(),
        jointStatus: {},
        stateChanged: false,
        hasPose: false,
      };
    }

    const metrics = calculateMetrics(landmarks);
    let instruction = "Tüm bedenin görünüyor.";
    let speech: string | undefined;
    let stateChanged = false;
    const jointStatus: PoseEvaluation["jointStatus"] = {};

    if (stage === "FIND_BODY") {
      instruction = "Harika. Başlangıç duruşuna yerleş.";
      if (held(true, now, POSE_THRESHOLDS.minimumBodyVisibleMs)) {
        stateChanged = transition("READY_POSITION", now);
      }
    }

    if (stage === "READY_POSITION") {
      const wristsBelow = landmarks[LEFT_WRIST].y - landmarks[LEFT_SHOULDER].y > POSE_THRESHOLDS.wristStartBelowShoulder &&
        landmarks[RIGHT_WRIST].y - landmarks[RIGHT_SHOULDER].y > POSE_THRESHOLDS.wristStartBelowShoulder;
      const stableTorso = metrics.torsoLean <= POSE_THRESHOLDS.torsoLeanToleranceDegrees;
      const levelShoulders = metrics.shoulderSlope <= POSE_THRESHOLDS.shoulderLevelTolerance;
      instruction = !wristsBelow
        ? "Kollarını yanlarında rahatça bırak."
        : !stableTorso
          ? "Gövdeni merkeze getir."
          : !levelShoulders
            ? "Omuzlarını aynı seviyede tut."
            : "Başlangıç duruşunu koru.";
      if (held(wristsBelow && stableTorso && levelShoulders, now, POSE_THRESHOLDS.readyHoldMs)) {
        baselineTorsoLean = metrics.torsoLean;
        stateChanged = transition("RAISING", now);
        speech = "Hazırsın. Nefes alırken kollarını yavaşça kaldır.";
        instruction = speech;
      }
    }

    if (stage === "RAISING") {
      const dt = previousAt ? Math.max(1, now - previousAt) : 1;
      const upwardSpeed = previousMetrics ? (previousMetrics.meanWristY - metrics.meanWristY) / dt : 0;
      const nearShoulders = metrics.meanWristToShoulder <= POSE_THRESHOLDS.wristShoulderTolerance;
      instruction = "Nefes alırken kollarını yavaşça omuz hizasına kaldır.";

      if (metrics.wristHeightDifference > 0.1) {
        instruction = "Kollarını aynı seviyede tut.";
        jointStatus[LEFT_WRIST] = "warning";
        jointStatus[RIGHT_WRIST] = "warning";
      } else if (metrics.leftElbow > POSE_THRESHOLDS.elbowHardLock || metrics.rightElbow > POSE_THRESHOLDS.elbowHardLock) {
        instruction = "Dirseklerini hafif yumuşat.";
        if (metrics.leftElbow > POSE_THRESHOLDS.elbowHardLock) jointStatus[LEFT_ELBOW] = "warning";
        if (metrics.rightElbow > POSE_THRESHOLDS.elbowHardLock) jointStatus[RIGHT_ELBOW] = "warning";
      } else if (nearShoulders && now - raisingStartedAt < POSE_THRESHOLDS.tooFastMs) {
        instruction = "Biraz daha yavaş hareket et.";
      } else if (previousMetrics && upwardSpeed <= 0.00001 && !nearShoulders) {
        instruction = "Kollarını yumuşakça yukarı taşımaya devam et.";
      }

      const symmetryNow = average([
        normalizeScore(metrics.wristHeightDifference, POSE_THRESHOLDS.symmetryAcceptableError, POSE_THRESHOLDS.symmetryMaximumError),
        normalizeScore(Math.abs(metrics.leftElbow - metrics.rightElbow), 6, 35),
      ]);
      accumulatedSymmetry.push(symmetryNow);
      accumulatedSoftElbows.push(average([
        normalizeScore(Math.abs(clamp(metrics.leftElbow, POSE_THRESHOLDS.elbowTargetMin, POSE_THRESHOLDS.elbowTargetMax) - metrics.leftElbow), 0, 25),
        normalizeScore(Math.abs(clamp(metrics.rightElbow, POSE_THRESHOLDS.elbowTargetMin, POSE_THRESHOLDS.elbowTargetMax) - metrics.rightElbow), 0, 25),
      ]));
      accumulatedTorso.push(normalizeScore(Math.abs(metrics.torsoLean - baselineTorsoLean), 3, 16));

      if (held(nearShoulders, now, POSE_THRESHOLDS.transitionHoldMs)) {
        raisingDuration = now - raisingStartedAt;
        stateChanged = transition("HOLDING", now);
        speech = "Güzel. Burada üç saniye kal.";
        instruction = speech;
      }
    }

    if (stage === "HOLDING") {
      const withinHeight = metrics.meanWristToShoulder <= POSE_THRESHOLDS.wristShoulderTolerance;
      if (!withinHeight) {
        conditionStartedAt = null;
        instruction = "Ellerini yeniden omuz hizasına getir; sayaç burada bekliyor.";
      } else {
        conditionStartedAt ??= now;
        const heldMs = now - conditionStartedAt;
        instruction = "Güzel. Burada üç saniye kal.";
        accumulatedArmHeight.push(normalizeScore(metrics.meanWristToShoulder, POSE_THRESHOLDS.armHeightAcceptableError, POSE_THRESHOLDS.armHeightMaximumError));
        if (heldMs >= POSE_THRESHOLDS.holdingMs) {
          stateChanged = transition("LOWERING", now);
          speech = "Şimdi nefes vererek kollarını yavaşça indir.";
          instruction = speech;
        }
      }
    }

    if (stage === "LOWERING") {
      const wristsDown = landmarks[LEFT_WRIST].y - landmarks[LEFT_SHOULDER].y > POSE_THRESHOLDS.wristStartBelowShoulder &&
        landmarks[RIGHT_WRIST].y - landmarks[RIGHT_SHOULDER].y > POSE_THRESHOLDS.wristStartBelowShoulder;
      instruction = "Nefes vererek kollarını kontrollü şekilde indir.";
      if (metrics.wristHeightDifference > 0.1) instruction = "Kollarını aynı seviyede indir.";
      if (held(wristsDown, now, POSE_THRESHOLDS.transitionHoldMs)) {
        loweringDuration = now - loweringStartedAt;
        stateChanged = transition("COMPLETED", now);
        speech = "Hareket tamamlandı.";
        instruction = speech;
      }
    }

    const scores = getScores(metrics);
    const finalScore = stage === "COMPLETED" ? finalFrom(scores) : null;
    const liveScore = stage === "FIND_BODY" || stage === "READY_POSITION"
      ? null
      : Math.round(average(Object.values(scores).filter((value) => value > 0)) || 0);
    const holdRemainingSeconds = stage === "HOLDING"
      ? Math.max(0, Math.ceil((POSE_THRESHOLDS.holdingMs - (conditionStartedAt ? now - conditionStartedAt : 0)) / 1000))
      : null;

    if (instruction !== lastWarning && !speech && ["RAISING", "LOWERING"].includes(stage)) {
      speech = instruction;
      lastWarning = instruction;
    }

    previousMetrics = metrics;
    previousAt = now;

    return { stage, instruction, speech, liveScore, finalScore, holdRemainingSeconds, scores, jointStatus, stateChanged, hasPose: true };
  }

  function cameraOff(): PoseEvaluation {
    stage = "CAMERA_OFF";
    return {
      stage,
      instruction: "Kamerayı açarak ilk harekete başla.",
      liveScore: null,
      finalScore: null,
      holdRemainingSeconds: null,
      scores: emptyScores(),
      jointStatus: {},
      stateChanged: true,
      hasPose: false,
    };
  }

  function reset(): PoseEvaluation {
    stage = "FIND_BODY";
    stageStartedAt = performance.now();
    conditionStartedAt = null;
    previousMetrics = null;
    previousAt = 0;
    baselineTorsoLean = 0;
    raisingStartedAt = 0;
    loweringStartedAt = 0;
    raisingDuration = 0;
    loweringDuration = 0;
    accumulatedSymmetry = [];
    accumulatedArmHeight = [];
    accumulatedSoftElbows = [];
    accumulatedTorso = [];
    lastWarning = "";
    return {
      stage,
      instruction: "Kameradan biraz uzaklaş, tüm bedenin görünsün.",
      liveScore: null,
      finalScore: null,
      holdRemainingSeconds: null,
      scores: emptyScores(),
      jointStatus: {},
      stateChanged: true,
      hasPose: false,
    };
  }

  return { update, reset, cameraOff };
}
