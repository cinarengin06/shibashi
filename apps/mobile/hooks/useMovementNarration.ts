import { useAudioPlayer } from 'expo-audio';
import type { VideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';
import { shibashiNarrations } from '../data/shibashiMedia';
import { safeMediaAction } from '../services/safeMediaAction';

export function useMovementNarration(order: number, video: VideoPlayer, enabled = true) {
  const narration = useAudioPlayer(shibashiNarrations[order], { downloadFirst: true });
  const playbackCount = useRef(1);

  useEffect(() => {
    let disposed = false;
    let lastVideoTime = 0;
    const pause = () => safeMediaAction(() => narration.pause());
    const restart = () => {
      try {
        void narration.seekTo(0).then(() => {
          if (!disposed && enabled && video.playing && playbackCount.current % 2 === 1) {
            safeMediaAction(() => narration.play());
          }
        }).catch(() => {});
      } catch {}
    };
    const resume = () => {
      if (disposed || !enabled || playbackCount.current % 2 === 0) return;
      try {
        const status = narration.currentStatus;
        if (!status) return;
        if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.15)) return;
        safeMediaAction(() => narration.play());
      } catch {}
    };
    try {
      narration.loop = false;
      narration.volume = 1;
      video.muted = true;
      video.timeUpdateEventInterval = 0.25;
    } catch {}
    const playingSubscription = video.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying && enabled) resume(); else pause();
    });
    const timeSubscription = video.addListener('timeUpdate', ({ currentTime }) => {
      if (disposed || !enabled) return;
      if (currentTime + 0.7 < lastVideoTime) {
        try {
          const endedNaturally = video.duration > 0 && lastVideoTime >= video.duration - 1;
          if (endedNaturally) {
            playbackCount.current += 1;
            // Keep longer narration playing through the silent second video loop.
            if (playbackCount.current % 2 === 1) { pause(); restart(); }
          } else pause();
        } catch {}
      }
      lastVideoTime = currentTime;
    });
    if (video.playing && enabled) resume(); else pause();
    return () => {
      disposed = true;
      pause();
      playingSubscription.remove();
      timeSubscription.remove();
    };
  }, [narration, video, enabled]);
}
