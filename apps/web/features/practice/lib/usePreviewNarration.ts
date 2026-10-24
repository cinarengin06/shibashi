"use client";

import { useCallback, useEffect, useRef } from "react";

export function usePreviewNarration() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastVideoTime = useRef(0);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    lastVideoTime.current = 0;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback((order: number) => {
    stop();
    const audio = new Audio(`/audio/shibashi-18/shibashi_${String(order).padStart(2, "0")}.mp3`);
    audio.preload = "auto";
    audioRef.current = audio;
    void audio.play().catch(() => {});
  }, [stop]);

  const onPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ended) audio.currentTime = 0;
    void audio.play().catch(() => {});
  }, []);

  const onPause = useCallback(() => audioRef.current?.pause(), []);

  const onTimeUpdate = useCallback((video: HTMLVideoElement) => {
    const audio = audioRef.current;
    if (audio && video.currentTime + 0.7 < lastVideoTime.current) {
      const naturalLoop = video.duration > 0 && lastVideoTime.current >= video.duration - 1;
      if (!naturalLoop || audio.ended) {
        audio.currentTime = 0;
        if (!video.paused) void audio.play().catch(() => {});
      }
    }
    lastVideoTime.current = video.currentTime;
  }, []);

  return { start, stop, onPlay, onPause, onTimeUpdate };
}
