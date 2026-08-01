export type LivingShenId = "hun" | "po" | "yi" | "zhi" | "shen";

export type LivingSceneId = "bedroom" | "lake" | "curtains" | "garden" | "pottery" | "gate";

export type LivingStepId = "prepare" | "lift" | "push" | "extend" | "release";

export type LivingPosePoint = {
  name: string;
  x: number;
  y: number;
  score?: number;
};

export type LivingScene = {
  id: LivingSceneId;
  name: string;
  subtitle: string;
  description: string;
  previewAssetKey: string;
  movementId: string;
  metaphor: string;
  shenId: LivingShenId;
  soundAtmosphereId: string;
  light: string;
  tempo: string;
  teacherTone: string;
  movementQuality: string;
  available: boolean;
};

export type LivingMovementStep = {
  id: LivingStepId;
  title: string;
  instruction: string;
  breathingCue: string;
  startMs: number;
  endMs: number;
  referencePoseId: string;
};

export type LivingPractice = {
  id: string;
  title: string;
  movementId: string;
  movementNumber: number;
  sceneId: LivingSceneId;
  durationMs: number;
  steps: readonly LivingMovementStep[];
  difficulty: "easy" | "medium" | "advanced";
  supportedViews: readonly ("front" | "side" | "back")[];
};

export type LivingComparisonSample = {
  landmarks: readonly LivingPosePoint[];
  stepId: LivingStepId;
  elapsedMs: number;
};

export type LivingComparisonResult = {
  confidence: number;
  movementScore: number;
  rhythmScore: number;
  metrics: {
    shoulderLevel: number;
    handPath: number;
    elbowSymmetry: number;
    torsoDirection: number;
    weightTransfer: number;
  };
  feedback: string;
  bestMetric: string;
};

export type LivingPracticeResult = {
  id: string;
  practiceId: string;
  sceneId: LivingSceneId;
  completedAt: string;
  durationSeconds: number;
  sampleCount: number;
  movementScore: number;
  breathRhythmScore: number;
  bestSection: string;
  improvement: string;
  masterSentence: string;
  analysisSource: "mediapipe-33";
};
