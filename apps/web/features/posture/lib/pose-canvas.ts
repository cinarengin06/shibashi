import { getMidpoint, isVisiblePosePoint, type PoseKeypoint, type PostureAnalysisSnapshot } from "@/packages/posture-analysis";

export const poseConnections: ReadonlyArray<readonly [string, string]> = [
  ["left_ear", "left_eye"],
  ["left_eye", "nose"],
  ["nose", "right_eye"],
  ["right_eye", "right_ear"],
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
  ["left_wrist", "left_pinky"],
  ["left_wrist", "left_index"],
  ["left_wrist", "left_thumb"],
  ["right_wrist", "right_pinky"],
  ["right_wrist", "right_index"],
  ["right_wrist", "right_thumb"],
  ["left_ankle", "left_heel"],
  ["left_heel", "left_foot_index"],
  ["left_ankle", "left_foot_index"],
  ["right_ankle", "right_heel"],
  ["right_heel", "right_foot_index"],
  ["right_ankle", "right_foot_index"],
];

export const postureDisplayPoints = new Set([
  "nose", "left_ear", "right_ear",
  "left_shoulder", "right_shoulder",
  "left_elbow", "right_elbow",
  "left_wrist", "right_wrist",
  "left_hip", "right_hip",
  "left_knee", "right_knee",
  "left_ankle", "right_ankle",
  "left_heel", "right_heel",
  "left_foot_index", "right_foot_index",
]);

export function drawPoseCanvas(canvas: HTMLCanvasElement | null, pose: { keypoints?: PoseKeypoint[] } | undefined, accent: string, analysis?: PostureAnalysisSnapshot) {
  const context = canvas?.getContext("2d");
  if (!canvas || !context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!pose?.keypoints?.length) return;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowBlur = 0;
  if (analysis) {
    drawPostureReferenceGuides(context, pose.keypoints, analysis);
    drawPostureQualityConnections(context, pose.keypoints, analysis);
  } else {
    drawPoseConnections(context, pose.keypoints, "#7FB46B");
  }
  if (analysis) drawPostureQualityKeypoints(context, pose.keypoints, analysis);
  else drawPoseKeypoints(context, pose.keypoints, "#A9D977");
  context.restore();
}

export function drawPoseConnections(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], accent: string, visibleNames?:Set<string>) {
  context.strokeStyle = colorWithAlpha(accent, 0.82);
  context.lineWidth = 3;

  for (const [startName, endName] of poseConnections) {
    if(visibleNames&&(!visibleNames.has(startName)||!visibleNames.has(endName)))continue;
    const start = findVisiblePosePoint(keypoints, startName);
    const end = findVisiblePosePoint(keypoints, endName);

    if (!start || !end) continue;

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
}

export function drawPoseKeypoints(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], accent: string, visibleNames?:Set<string>) {
  for (const keypoint of keypoints) {
    if(visibleNames&&(!keypoint.name||!visibleNames.has(keypoint.name)))continue;
    if (!isVisiblePosePoint(keypoint)) continue;

    context.fillStyle = "rgba(242, 238, 231, 0.88)";
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 7, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = accent;
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 4.4, 0, Math.PI * 2);
    context.fill();
  }
}

export function drawPostureQualityKeypoints(
  context: CanvasRenderingContext2D,
  keypoints: PoseKeypoint[],
  analysis: PostureAnalysisSnapshot,
) {
  for (const keypoint of keypoints) {
    if (!keypoint.name || !postureDisplayPoints.has(keypoint.name) || !isVisiblePosePoint(keypoint)) continue;

    const color = getPostureQualityColor(getPosturePointScore(keypoint.name, analysis));

    context.strokeStyle = color;
    context.fillStyle = colorWithAlpha(color, 0.26);
    context.lineWidth = 3;
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 12, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 9, 0, Math.PI * 2);
    context.stroke();
  }
}

function getPosturePointScore(name: string, analysis: PostureAnalysisSnapshot) {
  if (["nose", "left_ear", "right_ear", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist"].includes(name)) return analysis.shoulderScore;
  if (name === "left_hip" || name === "right_hip") return analysis.hipScore;
  return analysis.axisScore;
}

function getPostureQualityColor(score: number) {
  return score >= 70 ? "#72E08C" : "#FF5B57";
}

export function drawPostureQualityConnections(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], analysis: PostureAnalysisSnapshot) {
  for (const [startName, endName] of poseConnections) {
    if (!postureDisplayPoints.has(startName) || !postureDisplayPoints.has(endName)) continue;
    const start = findVisiblePosePoint(keypoints, startName);
    const end = findVisiblePosePoint(keypoints, endName);
    if (!start || !end) continue;
    const score = Math.min(getPosturePointScore(startName, analysis), getPosturePointScore(endName, analysis));
    const color = getPostureQualityColor(score);
    context.strokeStyle = colorWithAlpha(color, 0.9);
    context.shadowColor = colorWithAlpha(color, score < 62 ? 0.55 : 0.28);
    context.shadowBlur = score < 62 ? 12 : 6;
    context.lineWidth = score < 62 ? 5 : 4;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
  context.shadowBlur = 0;
}

export function drawPostureReferenceGuides(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], analysis: PostureAnalysisSnapshot) {
  const leftAnkle = findVisiblePosePoint(keypoints, "left_ankle");
  const rightAnkle = findVisiblePosePoint(keypoints, "right_ankle");
  const shoulderCenter = getMidpoint(findVisiblePosePoint(keypoints, "left_shoulder"), findVisiblePosePoint(keypoints, "right_shoulder"));
  const hipCenter = getMidpoint(findVisiblePosePoint(keypoints, "left_hip"), findVisiblePosePoint(keypoints, "right_hip"));
  const ankleCenter = getMidpoint(leftAnkle, rightAnkle);
  const sideAnkle = [leftAnkle, rightAnkle].filter((point): point is PoseKeypoint => Boolean(point)).sort((first, second) => (second.score ?? 0) - (first.score ?? 0))[0];
  const plumbX = analysis.view === "side" ? sideAnkle?.x : ankleCenter?.x;
  context.save();
  context.setLineDash([10, 9]);
  context.lineWidth = 1.5;
  context.strokeStyle = "rgba(126, 200, 212, 0.62)";
  context.beginPath();
  context.moveTo(plumbX ?? context.canvas.width / 2, context.canvas.height * 0.06);
  context.lineTo(plumbX ?? context.canvas.width / 2, context.canvas.height * 0.95);
  context.stroke();
  if (analysis.view !== "side") {
    context.strokeStyle = "rgba(242, 238, 231, 0.28)";
    for (const point of [shoulderCenter, hipCenter]) {
      if (!point) continue;
      context.beginPath();
      context.moveTo(context.canvas.width * 0.12, point.y);
      context.lineTo(context.canvas.width * 0.88, point.y);
      context.stroke();
    }
  }
  context.restore();
}

export function findVisiblePosePoint(keypoints: PoseKeypoint[], name: string): PoseKeypoint | undefined {
  const keypoint = keypoints.find((point) => point.name === name);
  return isVisiblePosePoint(keypoint) ? keypoint : undefined;
}


export function colorWithAlpha(color: string, alpha: number) {
  if (!color.startsWith("#") || color.length !== 7) return `rgba(140, 207, 178, ${alpha})`;

  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}


