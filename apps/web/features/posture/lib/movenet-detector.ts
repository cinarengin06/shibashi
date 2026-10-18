import type { PoseDetector } from "../types";
import { mediaPipePoseNames } from "./pose-names";

export async function createMoveNetDetector(): Promise<PoseDetector> {
  const { createPoseLandmarker } = await import("@/lib/pose/createPoseLandmarker");
  const landmarker = await createPoseLandmarker();
  let lastTimestamp = 0;

  return {
    dispose: () => landmarker.close(),
    estimatePoses: async (input) => {
      const timestamp = Math.max(performance.now(), lastTimestamp + 0.01);
      lastTimestamp = timestamp;
      const result = landmarker.detectForVideo(input, timestamp);
      const landmarks = result.landmarks[0];
      if (!landmarks?.length) return [];

      return [{
        keypoints: landmarks.map((landmark, index) => ({
          name: mediaPipePoseNames[index],
          score: landmark.visibility ?? 1,
          x: landmark.x * input.videoWidth,
          y: landmark.y * input.videoHeight,
        })),
      }];
    },
  };
}
