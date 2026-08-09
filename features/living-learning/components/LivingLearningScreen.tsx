"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLivingPractice, livingScenes, type LivingPracticeResult, type LivingSceneId } from "../../../packages/living-learning";
import { useMovementTimeline } from "../hooks/useMovementTimeline";
import { CinematicPracticeStage } from "./CinematicPracticeStage";
import { LivingCameraPractice } from "./LivingCameraPractice";
import { PracticeCompletion } from "./PracticeCompletion";
import { SceneSelector } from "./SceneSelector";
import styles from "./living-learning.module.css";

export function LivingLearningScreen({ embedded = false }: { embedded?: boolean }) {
  const [selectedSceneId, setSelectedSceneId] = useState<LivingSceneId>("bedroom"), [mode, setMode] = useState<"watch" | "camera" | "complete">("watch"), [muted, setMuted] = useState(true), [result, setResult] = useState<LivingPracticeResult | null>(null), [saved, setSaved] = useState(false);
  const selectedScene = useMemo(() => livingScenes.find((scene) => scene.id === selectedSceneId) ?? livingScenes[0], [selectedSceneId]);
  const selectedPractice = useMemo(() => getLivingPractice(selectedScene.id), [selectedScene.id]);
  const timeline = useMovementTimeline(selectedPractice);

  useEffect(() => { timeline.reset(); setMode("watch"); setResult(null); setSaved(false); }, [selectedSceneId]); // eslint-disable-line react-hooks/exhaustive-deps

  const complete = useCallback((next: LivingPracticeResult) => { setResult(next); setMode("complete"); }, []);
  const save = () => {
    if (!result) return;
    try {
      const key = "shibashi-living-practices";
      const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as LivingPracticeResult[];
      window.localStorage.setItem(key, JSON.stringify([result, ...current.filter((item) => item.id !== result.id)].slice(0, 40)));
      window.dispatchEvent(new CustomEvent("shibashi:living-practice-saved", { detail: result }));
      setSaved(true);
    } catch { setSaved(false); }
  };
  const retry = () => { setResult(null); setSaved(false); setMode("camera"); timeline.restart(); };
  const home = () => { if (embedded) { setMode("watch"); timeline.reset(); window.scrollTo({ top: 0, behavior: "smooth" }); } else window.location.href = "/"; };

  return <main className={`${styles.page} ${embedded ? styles.embedded : ""}`}>
    {!embedded ? <header className={styles.topbar}><Link href="/" className={styles.topBrand}>SHIBASHI EFE</Link><span>Bir hareketi değil, yaşamdaki karşılığını öğren.</span><Link href="/">Uygulamaya dön</Link></header> : null}
    <div className={`${styles.shell} ${mode === "camera" ? styles.cameraShell : ""}`}>
        {mode === "complete" && result ? <PracticeCompletion result={result} onSave={save} onRetry={retry} onHome={home} saved={saved} /> : <>
        {mode === "watch" ? <header className={styles.memoryHero}><div><p className={styles.eyebrow}>Hareket hafızası</p><h1>Formu ezberleme.<br/>Sahneyi hatırla.</h1></div><p>Her Shibashi hareketi gündelik bir ana bağlanır. Ambiyansı hisset, öğretmenin tam bedenini izle, sonra aynı anıyı kendi bedeninde canlandır.</p></header> : null}
        <section className={styles.practiceColumn}>
          {mode === "camera" ? <LivingCameraPractice activeStep={timeline.activeStep} elapsedMs={timeline.elapsedMs} onClose={() => { timeline.reset(); setMode("watch"); }} onComplete={complete} onRestart={timeline.restart} onToggle={timeline.toggle} playing={timeline.playing} practice={selectedPractice} /> : <CinematicPracticeStage activeStep={timeline.activeStep} elapsedMs={timeline.elapsedMs} muted={muted} onCamera={() => { setMode("camera"); timeline.reset(); }} onMute={() => setMuted((value) => !value)} onRestart={timeline.restart} onToggle={timeline.toggle} playing={timeline.playing} practice={selectedPractice} scene={selectedScene} />}
          {mode === "watch" ? <div className={styles.memoryPath}><article className={styles.memoryPathActive}><span>01</span><div><strong>Sahneyi hisset</strong><small>{selectedScene.name} · {selectedScene.light}</small></div></article><i/><article><span>02</span><div><strong>Öğretmeni izle</strong><small>Beş okunur hareket karesi</small></div></article><i/><article><span>03</span><div><strong>Sen yap</strong><small>Kamerada aynı hikâyeyi canlandır</small></div></article></div> : null}
        </section>

        {mode === "watch" ? <div className={styles.scenesWrap}><SceneSelector onSelect={setSelectedSceneId} scenes={livingScenes} selectedId={selectedSceneId} />
          <section className={styles.memoryPromise}><p className={styles.eyebrow}>Hafıza çapası</p><blockquote>“{selectedScene.metaphor}.”</blockquote><span>Yarın benzer bir yaşam anı geldiğinde bedenin bu hareketi kendiliğinden hatırlasın.</span></section>
        </div> : null}
      </>}
    </div>
  </main>;
}
