import { useAudioPlayer } from 'expo-audio';
import type { VideoPlayer } from 'expo-video';
import { useEffect } from 'react';
import { shibashiNarrations } from '../data/shibashiMedia';
import { safeMediaAction } from '../services/safeMediaAction';

export function useMovementNarration(order: number, video: VideoPlayer, enabled = true) {
  const narration = useAudioPlayer(shibashiNarrations[order], { downloadFirst: true });

  useEffect(() => {
    let disposed = false;
    let lastVideoTime = 0;
    const pause = () => safeMediaAction(() => narration.pause());
    const restart = () => {
      try {
        void narration.seekTo(0).then(() => {
          if (!disposed && enabled && video.playing) {
            safeMediaAction(() => narration.play());
          }
        }).catch(() => {});
      } catch {}
    };
    const resume = () => {
      if (disposed || !enabled) return;
      try {
        const status = narration.currentStatus;
        if (!status) return;
        if (video.currentTime < 0.3 && status.currentTime > 0.5) restart();
        else if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.15)) restart();
        else safeMediaAction(() => narration.play());
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
          if (!endedNaturally || !narration.currentStatus?.playing) restart();
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
