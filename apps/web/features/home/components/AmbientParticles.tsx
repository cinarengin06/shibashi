"use client";

import { useEffect, useRef } from "react";

export function AmbientParticles({ selectedShenId, color }: { selectedShenId: "hun" | "shen" | "yi" | "po" | "zhi"; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const liveCanvas = canvas;
    const liveContext = context;

    let frame = 0;
    let width = 0;
    let height = 0;
    const particleCount = selectedShenId === "shen" ? 74 : selectedShenId === "po" ? 38 : 56;
    let particles: Array<{ alpha: number; phase: number; size: number; vx: number; vy: number; x: number; y: number }> = [];

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      liveCanvas.width = width * ratio;
      liveCanvas.height = height * ratio;
      liveContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: particleCount }, () => ({
        alpha: Math.random() * 0.48 + 0.12,
        phase: Math.random() * Math.PI * 2,
        size: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        x: Math.random() * width,
        y: Math.random() * height,
      }));
    }

    function draw() {
      liveContext.clearRect(0, 0, width, height);
      particles.forEach((particle, index) => {
        particle.phase += 0.012;

        if (selectedShenId === "shen") {
          particle.vy -= 0.002;
          particle.vx += Math.sin(particle.phase) * 0.004;
        } else if (selectedShenId === "hun") {
          particle.vy -= 0.012;
          particle.vx += Math.sin(particle.phase) * 0.011;
        } else if (selectedShenId === "yi") {
          particle.vx *= 0.96;
          particle.vy *= 0.96;
        } else if (selectedShenId === "po") {
          particle.vx = 0.2 + (index % 3) * 0.045;
          particle.vy = -0.035;
        } else {
          particle.vx += Math.sin(particle.phase) * 0.002;
          particle.vy += Math.cos(particle.phase) * 0.003;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < -24) particle.x = width + 24;
        if (particle.x > width + 24) particle.x = -24;
        if (particle.y < -24) particle.y = height + 24;
        if (particle.y > height + 24) particle.y = -24;

        liveContext.globalAlpha = particle.alpha;
        liveContext.fillStyle = color;
        liveContext.beginPath();
        if (selectedShenId === "yi") {
          liveContext.rect(particle.x, particle.y, particle.size * 2.2, particle.size * 2.2);
        } else if (selectedShenId === "po") {
          liveContext.rect(particle.x, particle.y, particle.size * 4.8, 0.8);
        } else {
          liveContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        }
        liveContext.fill();
      });
      liveContext.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [color, selectedShenId]);

  return <canvas className="ambient-canvas" ref={canvasRef} aria-hidden="true" />;
}
