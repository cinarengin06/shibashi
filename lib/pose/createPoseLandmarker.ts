import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_PATH = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let instance: PoseLandmarker | null = null;
let loadingPromise: Promise<PoseLandmarker> | null = null;

async function buildPoseLandmarker(delegate: "GPU" | "CPU"): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
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
  if (instance) return instance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      instance = await buildPoseLandmarker("GPU");
    } catch {
      instance = await buildPoseLandmarker("CPU");
    }
    return instance;
  })();

  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}
