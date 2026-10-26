"use client";

import NextImage from "next/image";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  breathingPatterns,
  calculateShenProgress,
  getMasterSentence,
  getPracticeForShen,
  getProgressLabel,
  getQuestionForShen,
  getShenProfile,
  getShenRecommendation,
  masterSentences,
  progressGoals,
  reflectionQuestions,
  shenProfiles,
  soundAtmospheres,
  type ReflectionEntry as DomainReflectionEntry,
  type SavedMasterSentence,
  type ShenActivity,
} from "@/packages/shen-domain";
import { fiveShen, type ShenId } from "@/features/home/data/shen";
import { neijingStages } from "@/features/journey/data/scenes";
import { aiCoaches, coachDialogues, inferCoachIntent, type AiCoach, type CoachIntent } from "@/features/practice/data/coaches";
import { CoachMeridianCard } from "@/components/meridian/MeridianKnowledge";
import type { TabId } from "@/types/navigation";
import { speakCoach } from "@/features/practice/lib/coach-audio";
import { usePreviewNarration } from "@/features/practice/lib/usePreviewNarration";
import { meridianMovements } from "@/packages/meridian-knowledge";
import { loadCompletedMovements, movementCompletionEvent } from "@/lib/movement-completion";
import { BODY_GATE_ORDER, gateGuidance, gateProgress, gates, movementGateWeights } from "@/packages/eight-gates";
import { unlockMilestones } from "@/lib/milestones";

type DomainShenId = (typeof shenProfiles)[number]["id"];
function mostCompletedGate(progress: ReturnType<typeof gateProgress>) {
  return BODY_GATE_ORDER.reduce((best, id, index) => {
    const candidate = progress.find((gate) => gate.id === id)!;
    const current = progress.find((gate) => gate.id === BODY_GATE_ORDER[best])!;
    return candidate.percent > current.percent || (candidate.percent === current.percent && candidate.completedCount > current.completedCount) ? index : best;
  }, 0);
}

function HumanMap({
  userId,
}: {
  userId?: string;
}) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [gateInfoOpen, setGateInfoOpen] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<number[]>([]);
  const [playingOrder, setPlayingOrder] = useState<number | null>(null);
  const narration = usePreviewNarration();
  const selectedManually = useRef(false);
  const completed = useMemo(() => new Set(completedOrders), [completedOrders]);
  const progress = useMemo(() => gateProgress(completedOrders), [completedOrders]);
  const activeGateId = BODY_GATE_ORDER[activeStageIndex];
  const activeGate = progress.find((gate) => gate.id === activeGateId)!;
  const activeGuidance = gateGuidance[activeGateId];
  const selectedMovements = meridianMovements.filter((movement) => (movementGateWeights[movement.order]?.[activeGateId] ?? 0) > 0);
  const currentGateIndex = mostCompletedGate(progress);
  const currentGate = progress.find((gate) => gate.id === BODY_GATE_ORDER[currentGateIndex])!;
  const mapProgress = currentGate.percent;

  useEffect(() => {
    const refresh = () => {
      const orders = loadCompletedMovements(userId);
      setCompletedOrders(orders);
      if (!selectedManually.current) setActiveStageIndex(mostCompletedGate(gateProgress(orders)));
    };
    refresh();
    window.addEventListener(movementCompletionEvent, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(movementCompletionEvent, refresh); window.removeEventListener("storage", refresh); };
  }, [userId]);

  function selectStage(index: number) {
    unlockMilestones(["gate-explorer"],userId);
    selectedManually.current = true;
    narration.stop();
    setActiveStageIndex(index);
    setPlayingOrder(null);
    setGateInfoOpen(true);
  }

  function moveGate(direction: 1 | -1) {
    selectStage((activeStageIndex + direction + BODY_GATE_ORDER.length) % BODY_GATE_ORDER.length);
  }

  return (
    <>
    <div className="glass-card human-map-card neijing-card cut-safe-card">
      <div className="section-heading cut-safe-heading" style={{ margin: "0 0 12px" }}>
        <h2>8 Kapılı Beden Haritan</h2>
        <span>Seçili kapı · {activeGate.name}</span>
      </div>
      <div className="neijing-map-shell neijing-map-shell-with-panel">
        <div
          className="neijing-map"
          aria-label={`Sekiz kapılı beden haritası. ${completedOrders.length ? "En çok ilerlediğin" : "Başlangıç"} kapısı ${currentGate.name}`}
          style={
            {
              "--journey-progress": `${mapProgress}%`,
            } as CSSProperties
          }
        >
          <NextImage
            alt="Bedenin iç dünyasını ve sekiz kapıyı gösteren özgün insan haritası"
            className="neijing-map-image"
            fill
            priority
            sizes="(min-width: 1024px) 460px, (min-width: 700px) 55vw, 340px"
            src="/images/neijing-map.jpg"
          />
          <div className="neijing-current-gate-badge" aria-live="polite">
            <span>{completedOrders.length ? "EN ÇOK İLERLEDİĞİN KAPI" : "BAŞLANGIÇ KAPISI"}</span>
            <strong>{currentGate.name}</strong>
            <small>{currentGate.cue}</small>
          </div>
          {BODY_GATE_ORDER.map((id, index) => (
            <div key={id}>
              <button
                aria-label={`${index + 1}. ${gates[id].name} kapısını seç`}
                aria-current={currentGateIndex === index ? "step" : undefined}
                aria-pressed={activeStageIndex === index}
                className={`neijing-hotspot ${activeStageIndex === index ? "neijing-hotspot-active" : ""} ${currentGateIndex === index ? "neijing-hotspot-current" : ""}`}
                onClick={() => selectStage(index)}
                style={{ left: `${neijingStages[index].x}%`, top: `${neijingStages[index].y}%` }}
                type="button"
              >
                {index + 1}
                <span className="neijing-hotspot-name">{neijingStages[index].title}</span>
              </button>
            </div>
          ))}
          <div className="neijing-map-hint">Bir kapıya dokun · bilgi ve videoları gör</div>
          {gateInfoOpen ? (
            <div className="gate-info-card" role="dialog" aria-label={`${activeGate.name} kapısı bilgileri`}>
              <div className="gate-info-topline">
                <span className="eyebrow">Kapı {activeStageIndex + 1}</span>
                <button className="gate-info-close" onClick={() => setGateInfoOpen(false)} type="button" aria-label="Kapı bilgisini kapat">×</button>
              </div>
              <div className="gate-info-title-row">
                <div><h3>{activeGate.name}</h3></div>
                <strong>{activeGuidance.focus} odağı</strong>
              </div>
              <div className="gate-benefit-grid">{activeGuidance.benefits.map((benefit) => <span key={benefit}>{benefit}</span>)}</div>
              <div className="gate-life-note"><span>Günlük hayatta</span><p>{activeGuidance.dailyUse}</p></div>
              <div className="gate-life-note gate-practice-note"><span>Mini pratik</span><p>{activeGuidance.microPractice}</p></div>
              <div className="gate-info-actions">
                <button className="secondary-action compact-action" onClick={() => moveGate(-1)} type="button">Önceki</button>
                <button className="primary-action compact-action" onClick={() => moveGate(1)} type="button">Sonraki Kapı</button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="journey-gate-panel">
          <div className="journey-gate-panel-heading">
            <span className="eyebrow">KAPI {activeStageIndex + 1} · {activeGate.name}</span>
            <h3 aria-live="polite" className="journey-gate-completion-line">%{activeGate.percent} <small>({activeGate.completedCount}/{activeGate.mappedCount} hareket)</small></h3>
            <div className="journey-gate-progress" role="progressbar" aria-label={`${activeGate.name} hareket tamamlama oranı`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={activeGate.percent}><span style={{ width: `${activeGate.percent}%` }} /></div>
            <div className="journey-gate-outcome"><span>BEDENİNDE NEYE BAKMALI?</span><p>{activeGuidance.outcome}</p></div>
          </div>
          <div className="journey-gate-panel-title"><div><span className="eyebrow">BU KAPIYLA İLGİLİ</span><h4>Hareket videoları</h4></div><span>{selectedMovements.length} video</span></div>
          <div className="journey-gate-video-grid">{selectedMovements.map((movement) => <article className="journey-gate-video-card" key={movement.order}>
            <div className="journey-gate-video-media">
              {playingOrder === movement.order ? <video autoPlay controls onError={narration.stop} onPause={narration.onPause} onPlay={narration.onPlay} onTimeUpdate={(event) => narration.onTimeUpdate(event.currentTarget)} playsInline poster={`/images/shibashi-new/${movement.order}.jpg`} src={`/videos/shibashi/${movement.order}.mp4`} /> : <button aria-label={`${movement.sourceTitle} videosunu oynat`} onClick={() => { narration.start(movement.order); setPlayingOrder(movement.order); }} type="button"><NextImage alt="" fill sizes="(max-width: 700px) 100vw, 30vw" src={`/images/shibashi-new/${movement.order}.jpg`} /><span aria-hidden="true">▶</span></button>}
              {completed.has(movement.order) ? <span className="journey-gate-completed" aria-label="Tamamlandı">✓ Tamamlandı</span> : null}
            </div>
            <div className="journey-gate-video-copy"><small>HAREKET {String(movement.order).padStart(2, "0")}</small><strong>{movement.sourceTitle}</strong></div>
          </article>)}</div>
        </div>
      </div>
    </div>
    </>
  );
}


export function FiveShenJourneyWeb({
  activities,
  onNavigate,
  onSelectCoach,
  onSelectShen,
  reflections,
  savedSentences,
  selectedShenId,
  selectedCoachId,
  setActivities,
  setReflections,
  setSavedSentences,
  userName,
  userId,
}: {
  activities: ShenActivity[];
  onNavigate: (tab: TabId) => void;
  onSelectCoach: (coachId: AiCoach["id"]) => void;
  onSelectShen: (id: DomainShenId) => void;
  reflections: DomainReflectionEntry[];
  savedSentences: SavedMasterSentence[];
  selectedShenId: DomainShenId;
  selectedCoachId: AiCoach["id"];
  setActivities: Dispatch<SetStateAction<ShenActivity[]>>;
  setReflections: Dispatch<SetStateAction<DomainReflectionEntry[]>>;
  setSavedSentences: Dispatch<SetStateAction<SavedMasterSentence[]>>;
  userName: string;
  userId?: string;
}) {
  const [selected, setSelected] = useState<DomainShenId>(selectedShenId);
  const [view, setView] = useState<"map" | "journey" | "detail" | "notebook">("map");
  const [directionIndex, setDirectionIndex] = useState(0);
  const [reflectionText, setReflectionText] = useState("");
  const [feeling, setFeeling] = useState("");
  const [sentenceFilter, setSentenceFilter] = useState<"all" | DomainShenId>("all");
  const progresses = useMemo(() => shenProfiles.map((profile) => calculateShenProgress(activities, profile.id)), [activities]);
  const profile = getShenProfile(selected);
  const progress = progresses.find((item) => item.shenId === selected) ?? progresses[0];
  const practices = getPracticeForShen(selected);
  const practice = practices[0];
  const question = getQuestionForShen(selected, reflections.length);
  const sentence = getMasterSentence(selected, progress.completedPractices);
  const breathing = breathingPatterns.find((item) => item.id === practice.breathingPatternId);
  const atmosphere = soundAtmospheres.find((item) => item.id === profile.soundAtmosphereId);
  const activeDirection = baguaDirections[directionIndex] ?? baguaDirections[0];
  const recommendedDirectionIndex = Math.max(0, shenProfiles.findIndex((item) => item.id === selected)) % baguaDirections.length;
  const journeyCoach = aiCoaches.find((item) => item.id === selectedCoachId) ?? aiCoaches[0];
  const goals = progressGoals.filter((item) => item.shenId === selected);
  const savedSentenceItems = savedSentences
    .map((record) => ({ record, sentence: masterSentences.find((item) => item.id === record.masterSentenceId) }))
    .filter((item) => item.sentence && (sentenceFilter === "all" || item.sentence.shenId === sentenceFilter));
  const select = (id: DomainShenId) => {
    setSelected(id);
    onSelectShen(id);
  };
  const saveSentence = () => {
    if (savedSentences.some((item) => item.masterSentenceId === sentence.id)) return;
    setSavedSentences((current) => {
      const next = [{ id: `saved-${Date.now()}`, masterSentenceId: sentence.id, savedAt: new Date().toISOString(), practiceId: practice.id }, ...current];
      window.localStorage.setItem("shibashi-master-sentences", JSON.stringify(next));
      return next;
    });
  };
  const saveReflection = () => {
    if (!reflectionText.trim() && !feeling) return;
    const createdAt = new Date().toISOString();
    setActivities((current) => {
      const next = [{ id: `activity-reflection-${Date.now()}`, shenId: selected, type: "reflection" as const, createdAt, practiceId: practice.id }, ...current];
      window.localStorage.setItem("shibashi-shen-activities", JSON.stringify(next));
      return next;
    });
    setReflections((current) => {
      const next = [{
        id: `reflection-${Date.now()}`,
        userId: "local-web-user",
        shenId: selected,
        practiceId: practice.id,
        questionId: question.id,
        responseText: reflectionText.trim() || undefined,
        selectedFeeling: feeling || undefined,
        masterSentenceId: sentence.id,
        createdAt,
      }, ...current];
      window.localStorage.setItem("shibashi-shen-reflections", JSON.stringify(next));
      return next;
    });
    setReflectionText("");
    setFeeling("");
  };

  if (view === "map") {
    return (
      <section className="screen shen-journey-screen journey-framework-screen">
        <header className="shen-journey-header">
          <div><span className="eyebrow">Haritan · Sekiz beden kapısı</span><h1>Bedenindeki kapıları gör.</h1><p>Kapılara dokun; kapı bilgisini, ilgili videoları ve tamamlanma oranını gör. Altın halka en çok ilerlediğin kapıyı gösterir.</p></div>
        </header>
        <HumanMap userId={userId} />
      </section>
    );
  }

  if (view === "notebook") {
    return (
      <section className="screen shen-journey-screen">
        <header className="shen-journey-header">
          <div><span className="eyebrow">Ustanın Defteri</span><h1>Yanında taşımak istediğin cümleler.</h1></div>
          <button className="secondary-action" onClick={() => setView("journey")} type="button">Yolculuğa dön</button>
        </header>
        <div className="master-filter-row">
          <button className={sentenceFilter === "all" ? "active" : ""} onClick={() => setSentenceFilter("all")} type="button">Tümü</button>
          {shenProfiles.map((item) => <button className={sentenceFilter === item.id ? "active" : ""} key={item.id} onClick={() => setSentenceFilter(item.id)} type="button">{item.name}</button>)}
        </div>
        <div className="master-notebook-grid">
          {savedSentenceItems.length ? savedSentenceItems.map(({ record, sentence: saved }) => (
            <article className="master-notebook-card" key={record.id}>
              <small>{new Date(record.savedAt).toLocaleDateString("tr-TR")} · {saved?.shenId === "xin" ? "Shen" : saved?.shenId}</small>
              <blockquote>“{saved?.text}”</blockquote>
              <button onClick={() => setSavedSentences((current) => {
                const next = current.filter((item) => item.id !== record.id);
                window.localStorage.setItem("shibashi-master-sentences", JSON.stringify(next));
                return next;
              })} type="button">Defterden çıkar</button>
            </article>
          )) : <div className="empty-state-card">Defterin henüz sessiz. Pratik sonunda bir cümleyi buraya ekleyebilirsin.</div>}
        </div>
      </section>
    );
  }

  if (view === "detail") {
    return (
      <section className="screen shen-journey-screen">
        <header className="shen-journey-header">
          <div><span className="eyebrow">Beş Shen detayı</span><h1>{profile.name} · {profile.shortMeaning}</h1><p>{profile.description}</p></div>
          <button className="secondary-action" onClick={() => setView("journey")} type="button">Beş alana dön</button>
        </header>
        <div className="shen-detail-layout">
          <article className="shen-detail-primary" style={{ "--shen-detail-accent": profile.primaryColor } as CSSProperties}>
            <span className="eyebrow">Bugünkü pratik</span><h2>{practice.title}</h2><p>{practice.description}</p>
            <div className="shen-detail-tags">{practice.movementQualityIds.map((item) => <span key={item}>{item}</span>)}</div>
            <button className="primary-action" onClick={() => onNavigate("lessons")} type="button">Pratiği başlat →</button>
          </article>
          <div className="shen-detail-grid">
            <Info title="Nefes ritmi" body={breathing?.instruction ?? ""} />
            <Info title="Hareket kalitesi" body={profile.movementQualities.join(" · ")} />
            <Info title="Günlük sorusu" body={question.text} />
            <Info title="Ses atmosferi" body={`${atmosphere?.name ?? ""} · Katman kaynakları placeholder`} />
            <Info title="30 günlük gelişim" body={`${getProgressLabel(progress)} · ${progress.completedPractices} pratik · ${progress.practiceMinutes} dakika`} />
            <Info title="Tamamlanan pratikler" body={progress.completedPractices ? `${progress.completedPractices} kayıt` : "İlk kayıt için bugünkü pratiği başlat."} />
          </div>
          <div className="shen-goals-panel"><span className="eyebrow">İlerleme hedefleri</span>{goals.map((goal) => <div key={goal.id}><strong>{goal.title}</strong><small>{goal.description}</small></div>)}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="screen shen-journey-screen">
      <header className="shen-journey-header">
        <div><span className="eyebrow">01 · İç dünya</span><h1>{userName || "Sen"}, şu an içinde ne oluyor?</h1><p>5 Shen, zihinsel ve duygusal işleyişini beş ayrı pencereden fark etmene yardım eder. {getShenRecommendation([...progresses])}</p></div>
        <div className="journey-header-actions"><button className="secondary-action" onClick={() => setView("map")} type="button">8 Kapı'ya dön</button><button className="secondary-action" onClick={() => setView("notebook")} type="button">Ustanın Defteri</button></div>
      </header>
      <div className="shen-journey-rail">
        {shenProfiles.map((item) => {
          const itemProgress = progresses.find((value) => value.shenId === item.id)!;
          return <button className={item.id === selected ? "active" : ""} key={item.id} onClick={() => select(item.id)} style={{ "--shen-card-accent": item.primaryColor } as CSSProperties} type="button"><strong>{item.name}</strong><span>{item.shortMeaning}</span><small>{getProgressLabel(itemProgress)}</small></button>;
        })}
      </div>
      <div className="shen-journey-main">
        <article className="shen-journey-focus" style={{ "--shen-card-accent": profile.primaryColor } as CSSProperties}>
          <span className="eyebrow">Bugünün alanı</span><h2>{profile.name} · {profile.shortMeaning}</h2><p>{profile.description}</p>
          <div className="shen-progress-line"><span>{getProgressLabel(progress)}</span><b style={{ width: `${Object.values(progress.dimensions).reduce((a, b) => a + b, 0) / 6}%` }} /></div>
          <div className="shen-progress-mini"><div><strong>{progress.completedPractices}</strong><span>pratik</span></div><div><strong>{progress.practiceMinutes}</strong><span>dakika</span></div><div><strong>{progress.reflectionCount}</strong><span>yansıma</span></div></div>
          <button className="secondary-action" onClick={() => setView("detail")} type="button">Alanı ayrıntılı aç</button>
        </article>
        <div className="shen-journey-stack">
          <article className="shen-practice-card"><span className="eyebrow">Önerilen pratik</span><h3>{practice.title}</h3><p>{practice.durationMinutes} dk · {practice.movementQualityIds.join(" · ")}</p><button onClick={() => onNavigate("lessons")} type="button">Bugünkü pratiği başlat →</button></article>
          <article className="master-sentence-card"><span className="eyebrow">Ustadan bir cümle</span><blockquote>“{sentence.text}”</blockquote><button onClick={saveSentence} type="button">{savedSentences.some((item) => item.masterSentenceId === sentence.id) ? "Defterinde ✓" : "Defterime ekle"}</button></article>
        </div>
      </div>
      <div className="shen-reflection-card">
        <div><span className="eyebrow">Bugünün sorusu</span><h3>{question.text}</h3><div className="feeling-row">{["Daha açık", "Daha sakin", "Daha merkezde", "Daha hafif", "Hâlâ gergin", "Enerjik", "Sessiz"].map((item) => <button className={feeling === item ? "active" : ""} key={item} onClick={() => setFeeling(item)} type="button">{item}</button>)}</div></div>
        <div><textarea onChange={(event) => setReflectionText(event.target.value)} placeholder="Tek cümle yeterli…" value={reflectionText} /><button className="primary-action" onClick={saveReflection} type="button">Yansımayı kaydet</button></div>
      </div>
    </section>
  );
}

function Info({ body, title }: { body: string; title: string }) {
  return <article className="shen-info-card"><span>{title}</span><p>{body}</p></article>;
}

const baguaDirections = [
  { id: "qian", trigram: "☰", name: "Qian", title: "Gök", module: "AI Koç", tab: "lessons" as TabId, cue: "Vizyonunu netleştir; rehberinle bugünün pratiğini seç.", accent: "#f3cf8b", image: "/images/shen-universe.jpg" },
  { id: "dui", trigram: "☱", name: "Dui", title: "Göl", module: "Paylaşım", tab: "journal" as TabId, cue: "Deneyimini adlandır; bugünün yansımasını kaydet.", accent: "#d9bd80", image: "/images/shen-river-yi.jpg" },
  { id: "li", trigram: "☲", name: "Li", title: "Ateş", module: "Pratik", tab: "lessons" as TabId, cue: "Canlılığı harekete geçir; kısa bir Shibashi akışı başlat.", accent: "#ff7a18", image: "/images/shen-mode-hun.jpg" },
  { id: "zhen", trigram: "☳", name: "Zhen", title: "Gök Gürültüsü", module: "Postür", tab: "posture" as TabId, cue: "Uyan ve hizalan; beden eksenini yeniden kontrol et.", accent: "#f4a340", image: "/images/shen-river-hun.jpg" },
  { id: "xun", trigram: "☴", name: "Xun", title: "Rüzgâr", module: "İstatistiklerim", tab: "journal" as TabId, cue: "İçgörünün sessizce yayılmasına izin ver; bir reflection yaz.", accent: "#79d6ad", image: "/images/shen-mode-yi.jpg" },
  { id: "kan", trigram: "☵", name: "Kan", title: "Su", module: "Nefes", tab: "lessons" as TabId, cue: "Akışı zorlamadan sürdür; nefes ritmine dön.", accent: "#5eb7d8", image: "/images/shen-river-zhi.jpg" },
  { id: "gen", trigram: "☶", name: "Gen", title: "Dağ", module: "Denge", tab: "posture" as TabId, cue: "Dur, köklen ve merkezini dinle; postür taraması yap.", accent: "#b6a982", image: "/images/shen-mode-po.jpg" },
  { id: "kun", trigram: "☷", name: "Kun", title: "Toprak", module: "Toparlanma", tab: "home" as TabId, cue: "Temele dön; bugünkü enerjini ve ritmini gözden geçir.", accent: "#c89962", image: "/images/inner-gate-path.png" },
] as const;

function BaguaWheel({
  activeDirection,
  activeIndex,
  onSelect,
  recommendedIndex,
}: {
  activeDirection: (typeof baguaDirections)[number];
  activeIndex: number;
  onSelect: (index: number) => void;
  recommendedIndex: number;
}) {
  return (
    <div className="bagua-v2-wheel-shell" style={{ "--bagua-v2-accent": activeDirection.accent } as CSSProperties}>
      <div className="bagua-v2-orbit bagua-v2-orbit-outer" aria-hidden="true" />
      <div className="bagua-v2-orbit bagua-v2-orbit-inner" aria-hidden="true" />
      <div className="bagua-v2-rotor" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="bagua-v2-disc" role="img" aria-label="Sekiz yönlü hareketli Bagua çarkı">
        <div className="bagua-v2-sector-glow" aria-hidden="true" />
        {baguaDirections.map((direction, index) => {
          const angle = index * 45 - 90;
          const radians = (angle * Math.PI) / 180;
          const orbitRadius = 39;
          return (
            <button
              aria-label={`${direction.name} ${direction.title}: ${direction.module}`}
              className={`bagua-v2-node ${index === activeIndex ? "is-active" : ""} ${index === recommendedIndex ? "is-recommended" : ""}`}
              key={direction.id}
              onClick={() => onSelect(index)}
              style={{
                left: `${50 + Math.cos(radians) * orbitRadius}%`,
                top: `${50 + Math.sin(radians) * orbitRadius}%`,
                "--node-accent": direction.accent,
              } as CSSProperties}
              type="button"
            >
              <span className="bagua-v2-node-inner">
                <strong>{direction.trigram}</strong>
                <small>{direction.name}</small>
                <em>{direction.title}</em>
              </span>
            </button>
          );
        })}
        <div className="bagua-v2-center">
          <span>☯</span>
          <small>{activeDirection.name} · {activeDirection.title}</small>
          <strong>{activeDirection.module}</strong>
          <em>Seçili yön</em>
        </div>
      </div>
      <div className="bagua-v2-pointer" aria-hidden="true" />
    </div>
  );
}

function JourneyGuideSelector({
  onSelectCoach,
  selectedCoach,
  selectedCoachId,
}: {
  onSelectCoach: (coachId: AiCoach["id"]) => void;
  selectedCoach: AiCoach;
  selectedCoachId: AiCoach["id"];
}) {
  type GuideMessage = { id: string; from: "coach" | "user"; text: string };
  const dialogue=coachDialogues[selectedCoach.id];
  const [input,setInput]=useState("");
  const [messages,setMessages]=useState<GuideMessage[]>([{id:"intro",from:"coach",text:dialogue.intro}]);
  useEffect(()=>setMessages([{id:`intro-${selectedCoach.id}`,from:"coach",text:dialogue.intro}]),[dialogue.intro,selectedCoach.id]);
  const send=(text:string,intent?:CoachIntent)=>{
    const clean=text.trim();if(!clean)return;
    const reply=dialogue.lines[intent??inferCoachIntent(clean)];
    const stamp = Date.now();
    const additions: GuideMessage[] = [
      { id: `u-${stamp}`, from: "user", text: clean },
      { id: `c-${stamp}`, from: "coach", text: reply },
    ];
    setMessages(current=>[...current,...additions].slice(-8));
    setInput("");
  };
  const lastCoachMessage=[...messages].reverse().find(item=>item.from==="coach")?.text??dialogue.intro;
  return (
    <div className="glass-card journey-guide-card">
      <div className="journey-guide-hero">
        <span className={`coach-portrait coach-portrait-${selectedCoach.imageIndex}`} />
        <div>
          <span className="eyebrow">Yolculuk Rehberini Seç</span>
          <h2>{selectedCoach.name}</h2>
          <p>{selectedCoach.role}. Seçimin kaydedilir; canlı komutların tonu ve ritmi bundan sonra bu rehberden gelir.</p>
        </div>
      </div>
      <div className="journey-guide-grid" aria-label="Sekiz Ölümsüz yolculuk rehberi seçimi">
        {aiCoaches.map((coach) => {
          const coachShen = getShenById(coach.shenId);
          return (
            <button
              className={`journey-guide-option ${coach.id === selectedCoachId ? "journey-guide-option-active" : ""}`}
              key={coach.id}
              onClick={() => onSelectCoach(coach.id)}
              style={{ "--shen-card-accent": coachShen.color } as CSSProperties}
              type="button"
            >
              <span className={`coach-portrait coach-portrait-${coach.imageIndex}`} />
              <strong>{coach.name}</strong>
              <small>{coach.role}</small>
            </button>
          );
        })}
      </div>
      <CoachMeridianCard coachId={selectedCoach.id} accent={getShenById(selectedCoach.shenId).color} />
      <div className="journey-guide-chat">
        <div className="journey-guide-chat-head"><span className="eyebrow">REHBERLE KONUŞ</span><button onClick={()=>speakCoach(lastCoachMessage,selectedCoach)} type="button">Sesi dinle ♪</button></div>
        <div className="journey-guide-chat-log">{messages.map(message=><p className={`journey-guide-message journey-guide-message-${message.from}`} key={message.id}>{message.text}</p>)}</div>
        <div className="journey-guide-intents">
          {([["scatter","Bugün dağınığım"],["courage","Cesaret lazım"],["slow","Yavaşlamak istiyorum"],["start","Pratiğe başla"]] as const).map(([id,label])=><button key={id} onClick={()=>send(label,id)} type="button">{label}</button>)}
        </div>
        <form className="journey-guide-input" onSubmit={event=>{event.preventDefault();send(input)}}>
          <input value={input} onChange={event=>setInput(event.target.value)} placeholder="Bugün nasıl hissettiğini yaz…" maxLength={180}/>
          <button type="submit" aria-label="Mesajı gönder">→</button>
        </form>
      </div>
    </div>
  );
}


const energyMetricLearning: Record<string, { summary: string; detail: string }> = {
  Jing: {
    summary: "Bedeninin temel kaynağı ve dayanıklılık rezervi.",
    detail: "Tai Chi dilinde Jing, aceleyle tüketilmeyen öz kaynak gibi düşünülür; dinlenme, köklenme ve düzenli pratikle korunur.",
  },
  Qi: {
    summary: "Nefesinle ve hareketinle dolaşan yaşam enerjisi.",
    detail: "Qi, Tai Chi’de beden, nefes ve niyetin birlikte akmasıdır; yumuşak ve kesintisiz hareket bu akışı destekler.",
  },
  Shen: {
    summary: "Farkındalığın, canlılığın ve iç açıklığın.",
    detail: "Shen, kalbin ve zihnin uyanık tarafıdır; sakin bakış, nefes ve çevrenle kurduğun temasla beslenir.",
  },
};

type EnergyMetricLabel = "Jing" | "Qi" | "Shen";

function getShenById(id: ShenId): (typeof fiveShen)[number] {
  return fiveShen.find((shen) => shen.id === id) ?? fiveShen[1];
}


