export type MovementAnalysisWindowState = "idle" | "recording" | "complete";

export type MovementAnalysisWindowResult = {
  total: number;
  form: number;
  rhythm: number;
  balance: number;
  samples: number;
};

export type PracticeSnapshot = {
  id: string;
  dateKey: string;
  timeLabel: string;
  createdAt: string;
  movementId: number;
  movementName: string;
  score: number;
  shenName: string;
  imageData: string;
  trainerVisible?: boolean;
};
