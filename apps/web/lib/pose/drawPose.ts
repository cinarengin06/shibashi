import type { JointStatus, PoseLandmark } from "@/types/pose";

const CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
];

function statusColor(status?: JointStatus): string {
  if (status === "error") return "#ef4444";
  if (status === "warning") return "#f59e0b";
  return "#34d399";
}

export function drawPose(
  context: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number,
  jointStatus: Partial<Record<number, JointStatus>> = {},
): void {
  context.clearRect(0, 0, width, height);
  context.save();
  context.translate(width, 0);
  context.scale(-1, 1);
  context.lineCap = "round";

  for (const [startIndex, endIndex] of CONNECTIONS) {
    const start = landmarks[startIndex];
    const end = landmarks[endIndex];
    if (!start || !end || (start.visibility ?? 1) < 0.45 || (end.visibility ?? 1) < 0.45) continue;
    const status = jointStatus[startIndex] === "error" || jointStatus[endIndex] === "error"
      ? "error"
      : jointStatus[startIndex] === "warning" || jointStatus[endIndex] === "warning"
        ? "warning"
        : "good";
    context.strokeStyle = statusColor(status);
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(start.x * width, start.y * height);
    context.lineTo(end.x * width, end.y * height);
    context.stroke();
  }

  const joints = new Set(CONNECTIONS.flat());
  for (const index of joints) {
    const point = landmarks[index];
    if (!point || (point.visibility ?? 1) < 0.45) continue;
    context.fillStyle = statusColor(jointStatus[index]);
    context.beginPath();
    context.arc(point.x * width, point.y * height, 5.5, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}
