"use client";

import { livingReferencePoses, type LivingMovementStep } from "../../../packages/living-learning";

const connections: ReadonlyArray<readonly [string, string]> = [
  ["left_shoulder", "right_shoulder"], ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"], ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"], ["left_hip", "right_hip"], ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"], ["right_hip", "right_knee"], ["right_knee", "right_ankle"],
];

export function GhostTeacherOverlay({ step, compact = false }: { step: LivingMovementStep; compact?: boolean }) {
  const pose = livingReferencePoses[step.referencePoseId] ?? [];
  const find = (name: string) => pose.find((item) => item.name === name);
  return (
    <svg aria-label="Ghost Teacher referans pozu" className={compact ? "ll-ghost ll-ghost--compact" : "ll-ghost"} viewBox="5 2 90 96">
      <defs><filter id="living-soft"><feGaussianBlur stdDeviation=".22" /></filter></defs>
      <ellipse cx="50" cy="96" rx="18" ry="2" fill="rgba(198,165,106,.12)" />
      <circle cx="50" cy="18" r="5.4" fill="rgba(255,240,189,.18)" stroke="#fff0bd" strokeWidth="1.1" />
      {connections.map(([startName, endName]) => {
        const start = find(startName), end = find(endName);
        return start && end ? <line key={`${startName}-${endName}`} x1={start.x * 100} y1={start.y * 100} x2={end.x * 100} y2={end.y * 100} stroke="#fff0bd" strokeWidth="1.7" strokeLinecap="round" filter="url(#living-soft)" /> : null;
      })}
      {pose.map((item) => <circle key={item.name} cx={item.x * 100} cy={item.y * 100} r="1.75" fill="#f3cf8b" stroke="#fff0bd" strokeWidth=".28" />)}
    </svg>
  );
}
