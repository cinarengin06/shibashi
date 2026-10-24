import { useAudioPlayer } from 'expo-audio';
import type { VideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';
import { shibashiNarrations } from '../data/shibashiMedia';

export function useMovementNarration(order: number, video: VideoPlayer) {
  const narration = useAudioPlayer(shibashiNarrations[order], { downloadFirst: true });
  const previousOrder = useRef(order);

  useEffect(() => {
    if (previousOrder.current !== order) {
      narration.pause();
      narration.replace(shibashiNarrations[order]);
      previousOrder.current = order;
    }
    narration.loop = false;
    narration.volume = 1;
    video.muted = true;
    video.timeUpdateEventInterval = 0.25;

    let lastVideoTime = video.currentTime;
    const restart = () => {
      void narration.seekTo(0).catch(() => {}).then(() => {
        if (video.playing) narration.play();
      });
    };
    const resume = () => {
      const status = narration.currentStatus;
      if (video.currentTime < 0.3 && status.currentTime > 0.5) restart();
      else if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.15)) restart();
      else narration.play();
    };
    const playingSubscription = video.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying) resume();
      else narration.pause();
    });
    const timeSubscription = video.addListener('timeUpdate', ({ currentTime }) => {
      if (currentTime + 0.7 < lastVideoTime) {
        const endedNaturally = video.duration > 0 && lastVideoTime >= video.duration - 1;
        if (!endedNaturally || !narration.currentStatus.playing) restart();
      }
      lastVideoTime = currentTime;
    });
    if (video.playing) resume();
    return () => {
      playingSubscription.remove();
      timeSubscription.remove();
      narration.pause();
    };
  }, [narration, order, video]);
}
