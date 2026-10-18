import type { PoseKeypoint, PostureAnalysisSnapshot, PostureView } from "@/packages/posture-analysis";

export type PostureRenderMode = "3d" | "2d";
export type PostureAssessmentStep = "intro" | "history" | "captured" | "processing" | PostureView | "result";
export type PostureScanGuidance = "model-loading" | "find-body" | "wrong-angle" | "reposition" | "hold" | "capturing";

export type PostureAssessmentCapture = {
  analysis: PostureAnalysisSnapshot;
  createdAt: string;
  imageData: string;
  view: PostureView;
};

export type PostureReport = {
  asymmetrySignal: "düşük" | "orta" | "yüksek";
  captures: Record<PostureView, PostureAssessmentCapture>;
  createdAt: string;
  dateKey: string;
  flags: string[];
  id: string;
  score: number;
  summary: string;
  timeLabel: string;
  trainerVisible?: boolean;
  trendText: string;
};

export type Pose = {
  keypoints?: PoseKeypoint[];
};

export type PoseDetector = {
  dispose?: () => void;
  estimatePoses: (input: HTMLVideoElement, config?: { flipHorizontal?: boolean }) => Promise<Pose[]>;
};
