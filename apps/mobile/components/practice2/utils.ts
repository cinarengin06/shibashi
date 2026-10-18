import type { Practice2PosePoint } from "../../../../packages/practice2";
import type { PoseLandmark } from "../../services/pose/MediaPipePoseBridge";

const names = [
  "nose", "left_eye_inner", "left_eye", "left_eye_outer",
  "right_eye_inner", "right_eye", "right_eye_outer", "left_ear",
  "right_ear", "mouth_left", "mouth_right", "left_shoulder",
  "right_shoulder", "left_elbow", "right_elbow", "left_wrist",
  "right_wrist", "left_pinky", "right_pinky", "left_index",
  "right_index", "left_thumb", "right_thumb", "left_hip",
  "right_hip", "left_knee", "right_knee", "left_ankle",
  "right_ankle", "left_heel", "right_heel", "left_foot_index",
  "right_foot_index",
];

export function toPose(landmarks: PoseLandmark[]): Practice2PosePoint[] {
  return landmarks.map((item, index) => ({
    name: names[index] ?? `point-${index}`,
    x: item.x,
    y: item.y,
    z: item.z,
    score: item.visibility,
  }));
}
export function formatElapsed(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
