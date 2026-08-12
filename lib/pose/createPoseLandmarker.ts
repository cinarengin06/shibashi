import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_PATH = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let visionFilesetPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;

function getVisionFileset() {
  visionFilesetPromise ??= FilesetResolver.forVisionTasks(WASM_PATH);
  return visionFilesetPromise;
}

async function buildPoseLandmarker(delegate: "GPU" | "CPU"): Promise<PoseLandmarker> {
  const vision = await getVisionFileset();
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.6,
    minPosePresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
    outputSegmentationMasks: false,
  });
}

export async function createPoseLandmarker(): Promise<PoseLandmarker> {
  try {
    return await buildPoseLandmarker("GPU");
  } catch {
    return buildPoseLandmarker("CPU");
  }
}
