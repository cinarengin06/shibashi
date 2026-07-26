export type PoseLandmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
};

export type CoachStage =
  | "CAMERA_OFF"
  | "FIND_BODY"
  | "READY_POSITION"
  | "RAISING"
  | "HOLDING"
  | "LOWERING"
  | "COMPLETED";

export type ScoreBreakdown = {
  symmetry: number;
  armHeight: number;
  softElbows: number;
  torsoStability: number;
  tempo: number;
};

export type JointStatus = "good" | "warning" | "error";

export type PoseEvaluation = {
  stage: CoachStage;
  instruction: string;
  liveScore: number | null;
  finalScore: number | null;
  holdRemainingSeconds: number | null;
  scores: ScoreBreakdown;
  jointStatus: Partial<Record<number, JointStatus>>;
  stateChanged: boolean;
  speech?: string;
  hasPose: boolean;
};
