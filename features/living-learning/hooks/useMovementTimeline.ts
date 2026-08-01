"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { livingStepAt, type LivingPractice } from "../../../packages/living-learning";

export function useMovementTimeline(practice: LivingPractice) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const startedAtRef = useRef(0);
  const carriedMsRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    startedAtRef.current = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(practice.durationMs, carriedMsRef.current + now - startedAtRef.current);
      setElapsedMs(next);
      if (next >= practice.durationMs) {
        carriedMsRef.current = practice.durationMs;
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, practice.durationMs]);

  const toggle = useCallback(() => {
    setPlaying((current) => {
      if (current) carriedMsRef.current = elapsedMs;
      else {
        if (elapsedMs >= practice.durationMs) {
          carriedMsRef.current = 0;
          setElapsedMs(0);
        }
      }
      return !current;
    });
  }, [elapsedMs, practice.durationMs]);

  const restart = useCallback(() => {
    carriedMsRef.current = 0;
    setElapsedMs(0);
    setPlaying(true);
  }, []);

  const reset = useCallback(() => {
    carriedMsRef.current = 0;
    setElapsedMs(0);
    setPlaying(false);
  }, []);

  return {
    elapsedMs,
    playing,
    progress: elapsedMs / practice.durationMs,
    activeStep: useMemo(() => livingStepAt(elapsedMs, practice), [elapsedMs, practice]),
    setPlaying,
    toggle,
    restart,
    reset,
  };
}
