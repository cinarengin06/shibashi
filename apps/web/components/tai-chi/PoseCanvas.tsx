"use client";

import { useEffect, useRef } from "react";
import { drawPose } from "@/lib/pose/drawPose";
import type { JointStatus, PoseLandmark } from "@/types/pose";

export function PoseCanvas({
  landmarks,
  jointStatus,
  width,
  height,
}: {
  landmarks: PoseLandmark[];
  jointStatus: Partial<Record<number, JointStatus>>;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (landmarks.length) drawPose(context, landmarks, width, height, jointStatus);
  }, [height, jointStatus, landmarks, width]);

  return <canvas aria-hidden="true" className="tc-pose-canvas" ref={canvasRef} />;
}
