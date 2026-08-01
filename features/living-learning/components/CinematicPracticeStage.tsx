"use client";

import { useEffect, useRef } from "react";
import type { LivingMovementStep, LivingPractice, LivingScene } from "../../../packages/living-learning";
import { livingSceneAudio, livingSceneImages } from "../data/assets";
import { GhostTeacherOverlay } from "./GhostTeacherOverlay";
import styles from "./living-learning.module.css";

export function CinematicPracticeStage({ scene, practice, activeStep, elapsedMs, playing, muted, onToggle, onRestart, onMute, onCamera }: { scene: LivingScene; practice: LivingPractice; activeStep: LivingMovementStep; elapsedMs: number; playing: boolean; muted: boolean; onToggle: () => void; onRestart: () => void; onMute: () => void; onCamera: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = .26;
    if (muted) audio.pause();
    else void audio.play().catch(() => undefined);
  }, [muted, scene.id]);
  const fullscreen = () => document.getElementById("living-cinematic-stage")?.requestFullscreen?.();
  return <section className={styles.cinematicStage} id="living-cinematic-stage">
    <audio loop ref={audioRef} src={livingSceneAudio[scene.id]} />
    {/* eslint-disable-next-line @next/next/no-img-element */}<img alt={`${scene.name} sinematik sahnesi`} className={styles.stageImage} src={livingSceneImages[scene.id]} />
    <div className={styles.stageShade} />
    <div className={`${styles.teacherDemo} ${styles[`teacher_${activeStep.id}`]}`}><GhostTeacherOverlay step={activeStep} /></div>
    <div className={styles.stageTop}><span>HAREKET {String(practice.movementNumber).padStart(2, "0")}</span><div><button aria-label="Ambiyans müziğini aç veya kapat" onClick={onMute} type="button">{muted ? "♫ Ambiyansı aç" : "♫ Ambiyans açık"}</button><button aria-label="Tam ekran" onClick={fullscreen} type="button">Tam ekran</button></div></div>
    <div className={styles.stageCopy}><p>{scene.subtitle} · {scene.light}</p><h2>{practice.title}</h2><span>{scene.metaphor}</span></div>
    <div className={styles.breathCue}><i /><div><small>{activeStep.title}</small><strong>{activeStep.breathingCue}</strong></div></div>
    <div className={styles.stageControls}><button className={styles.playButton} onClick={onToggle} type="button">{playing ? "Ⅱ" : "▶"}</button><div className={styles.timeline}><span style={{ width: `${Math.min(100, elapsedMs / practice.durationMs * 100)}%` }} /></div><time>{Math.floor(elapsedMs / 60000)}:{String(Math.floor(elapsedMs / 1000) % 60).padStart(2, "0")} / 0:{String(Math.round(practice.durationMs / 1000)).padStart(2, "0")}</time><button onClick={onRestart} type="button">Yeniden</button><button className={styles.cameraCta} onClick={onCamera} type="button">Kamerayla dene</button></div>
  </section>;
}
