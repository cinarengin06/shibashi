"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BODY_GATE_ORDER, gateProgress, gates, movementGateWeights, uniqueMovementOrders, type GateId } from "@/packages/eight-gates";
import { meridianMovements } from "@/packages/meridian-knowledge";
import { loadCompletedMovements, movementCompletionEvent } from "@/lib/movement-completion";
import { unlockMilestones } from "@/lib/milestones";
import { useShibashiAuth } from "@/lib/supabase-auth";
import { usePreviewNarration } from "@/features/practice/lib/usePreviewNarration";
import styles from "./main-map.module.css";

const arrangement = BODY_GATE_ORDER;
const gateOrganCues: Record<GateId, string> = {
  peng: "İlgili hareketlerde akciğer ve böbrek hatları öne çıkar.",
  lu: "İlgili hareketlerde böbrek ve mide hatları öne çıkar.",
  ji: "İlgili hareketlerde akciğer ve kalın bağırsak öne çıkar.",
  an: "İlgili hareketlerde akciğer ve böbrek hatları öne çıkar.",
  cai: "İlgili hareketlerde böbrek ve mesane hatları öne çıkar.",
  lie: "İlgili hareketlerde akciğer ve göğüs çevresi öne çıkar.",
  zhou: "İlgili hareketlerde safra kesesi hattı öne çıkar.",
  kao: "İlgili hareketlerde akciğer ve karaciğer hattı öne çıkar.",
};

const gateOrganPositions: Record<GateId, { organ: string; x: number; y: number }> = {
  peng: { organ: "Akciğerler", x: 43, y: 31 },
  lu: { organ: "Mide", x: 59, y: 46 },
  kao: { organ: "Karaciğer", x: 37, y: 44 },
  ji: { organ: "Kalın bağırsak", x: 60, y: 55 },
  zhou: { organ: "Safra kesesi", x: 37, y: 52 },
  an: { organ: "Böbrekler", x: 42, y: 59 },
  lie: { organ: "Kalp çevresi", x: 57, y: 34 },
  cai: { organ: "Mesane", x: 53, y: 66 },
};

type GateArrow = { x1: number; y1: number; x2: number; y2: number; width: number; height: number };

function GateBodyMap({ progress, selectedGate, onSelect }: {
  progress: ReturnType<typeof gateProgress>;
  selectedGate: GateId;
  onSelect: (gate: GateId) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [arrow, setArrow] = useState<GateArrow | null>(null);

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateArrow = () => {
      const origin = map.querySelector<HTMLElement>(`[data-organ-gate="${selectedGate}"]`);
      const destination = map.querySelector<HTMLElement>(`[data-ring-gate="${selectedGate}"] .${styles.gateCircle}`);
      if (!origin || !destination) return;
      const bounds = map.getBoundingClientRect();
      const from = origin.getBoundingClientRect();
      const to = destination.getBoundingClientRect();
      const startX = from.left + from.width / 2 - bounds.left;
      const startY = from.top + from.height / 2 - bounds.top;
      const targetX = to.left + to.width / 2 - bounds.left;
      const targetY = to.top + to.height / 2 - bounds.top;
      const distance = Math.hypot(targetX - startX, targetY - startY) || 1;
      const dx = (targetX - startX) / distance;
      const dy = (targetY - startY) / distance;
      setArrow({
        x1: startX + dx * 13,
        y1: startY + dy * 13,
        x2: targetX - dx * (to.width / 2 + 3),
        y2: targetY - dy * (to.height / 2 + 3),
        width: bounds.width,
        height: bounds.height,
      });
    };
    updateArrow();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateArrow) : null;
    observer?.observe(map);
    window.addEventListener("resize", updateArrow);
    return () => { observer?.disconnect(); window.removeEventListener("resize", updateArrow); };
  }, [selectedGate]);

  return <div className={styles.gateMap} ref={mapRef}>
    <div className={styles.halo} />
    <Image alt="8 Kapı beden haritası referans görseli" className={styles.bodyImage} height={320} priority src="/images/body-map-eight-gates-3d-v2.jpg" width={180} />
    {arrow ? <svg aria-hidden="true" className={styles.gateArrow} preserveAspectRatio="none" viewBox={`0 0 ${arrow.width} ${arrow.height}`}>
      <defs><marker id="selected-gate-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4"><path d="M0 0 8 4 0 8" /></marker></defs>
      <path d={`M ${arrow.x1} ${arrow.y1} L ${arrow.x2} ${arrow.y2}`} markerEnd="url(#selected-gate-arrow)" />
    </svg> : null}
    <div className={styles.bodyMarkers}>
      {arrangement.map((id, index) => <button
        aria-label={`${index + 1}. ${gateOrganPositions[id].organ}: ${gates[id].name} kapısını seç`}
        aria-pressed={selectedGate === id}
        className={`${styles.organMarker} ${selectedGate === id ? styles.organMarkerSelected : ""}`}
        data-organ-gate={id}
        key={id}
        onClick={() => onSelect(id)}
        style={{ left: `${gateOrganPositions[id].x}%`, top: `${gateOrganPositions[id].y}%` }}
        title={`${index + 1} · ${gateOrganPositions[id].organ} / ${gates[id].name}`}
        type="button"
      >{index + 1}</button>)}
    </div>
    {arrangement.map((id, index) => {
      const gate = progress.find((item) => item.id === id)!;
      return <button
        aria-label={`${index + 1}. ${gate.name}, ${gateOrganPositions[id].organ}, yüzde ${gate.percent}`}
        aria-pressed={selectedGate === id}
        className={`${styles.gate} ${styles[`gate${index}`]} ${selectedGate === id ? styles.gateSelected : ""}`}
        data-ring-gate={id}
        key={id}
        onClick={() => onSelect(id)}
        style={{ "--gate-progress": `${gate.percent}%` } as CSSProperties}
        type="button"
      ><span className={styles.gateCircle}>{gates[id].symbol}</span><span className={styles.gateNumber}>{index + 1}</span><strong>{gate.name}</strong><small>%{gate.percent}</small></button>;
    })}
  </div>;
}

export function MainMapScreen() {
  const { user, ready } = useShibashiAuth();
  const [completed, setCompleted] = useState<number[]>([]);
  const [selectedGate, setSelectedGate] = useState<GateId>("peng");
  const [playingOrder, setPlayingOrder] = useState<number | null>(null);
  const narration = usePreviewNarration();

  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      setCompleted(loadCompletedMovements(user?.id));
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(movementCompletionEvent, refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); window.removeEventListener(movementCompletionEvent, refresh); };
  }, [ready, user?.id]);

  const completedOrders = useMemo(() => uniqueMovementOrders(completed), [completed]);
  const progress = useMemo(() => gateProgress(completedOrders), [completedOrders]);
  const selected = progress.find((gate) => gate.id === selectedGate) ?? progress[0];
  const gateMovements = meridianMovements.filter((movement) => (movementGateWeights[movement.order]?.[selectedGate] ?? 0) > 0);
  const completedCards = meridianMovements.filter((movement) => completedOrders.includes(movement.order)).slice(-3).reverse();
  const remaining = 18 - completedOrders.length;

  return <main className={styles.page}>
    <div className={styles.shell}>
      <div className={styles.columns}>
        <section className={styles.mainColumn}>
          <div className={styles.hero}><div><span className={styles.kicker}>GELİŞİM HARİTAM</span><h1>Shibashi Pratiğin</h1><p>Bedeni sakinleştir, nefesi dengele, kendi ritminde ilerle.</p><Link className={styles.heroLink} href="/beden-hatlari">18 Form'a git <span aria-hidden="true">→</span></Link></div><div aria-label={`${completedOrders.length} hareket tamamlandı, ${remaining} hareket kaldı`} className={styles.heroRing} style={{ "--progress": `${(completedOrders.length / 18) * 100}%` } as CSSProperties}><strong>{completedOrders.length}<small> / 18</small></strong><span>Hareket tamamlandı</span><p>{remaining ? `${remaining} hareket kaldı` : "Seri tamamlandı"}</p></div></div>

          <section className={styles.progressCard}><div><h2>18 Form İlerlemesi</h2><span>{completedOrders.length} / 18 tamamlandı</span></div><div className={styles.dots} aria-label="Tamamlanan hareketler">{meridianMovements.map((movement) => <span className={completedOrders.includes(movement.order) ? styles.dotDone : ""} key={movement.order} title={`${movement.order}. ${movement.sourceTitle}: ${completedOrders.includes(movement.order) ? "tamamlandı" : "bekliyor"}`} />)}</div></section>

          <section className={styles.completedSection}><div className={styles.sectionHeader}><h2>Tamamlanan Hareketler</h2><Link href="/beden-hatlari">Tümünü gör →</Link></div>{completedCards.length ? <div className={styles.movementCards}>{completedCards.map((movement) => <Link className={styles.movementCard} href={`/beden-hatlari?movementOrder=${movement.order}`} key={movement.order}><div className={styles.poster}><Image alt={`${movement.sourceTitle} hoca videosundan kare`} fill sizes="(max-width: 680px) 42vw, 260px" src={`/images/shibashi-new/${movement.order}.jpg`} /><span>{String(movement.order).padStart(2, "0")}</span></div><strong>{movement.sourceTitle}</strong><small>✓ Hareket tamamlandı</small></Link>)}</div> : <div className={styles.empty}><span>◌</span><p>İlk hareketi tamamladığında ilerlemen burada görünecek.</p><Link href="/beden-hatlari">İlk harekete başla →</Link></div>}</section>
        </section>

        <aside className={styles.gatePanel}><div className={styles.gateHeader}><h2>8 Kapı Beden Haritan</h2><p>Kapılar, tamamladığın hareketlerin sembolik katkısını gösterir.</p></div><GateBodyMap progress={progress} selectedGate={selectedGate} onSelect={(id) => { narration.stop(); setSelectedGate(id); setPlayingOrder(null); unlockMilestones(["gate-explorer"],user?.id); }} /><div className={styles.gateDetail}><span>SEÇİLİ KAPI</span><strong>{selected.name} · %{selected.percent}</strong><p>{arrangement.indexOf(selectedGate) + 1} · {gateOrganPositions[selectedGate].organ} odağı</p><p>{selected.cue}</p><p className={styles.organCue}>{gateOrganCues[selectedGate]}</p><div className={styles.detailTrack}><i style={{ width: `${selected.percent}%` }} /></div><small>{selected.mappedCount ? `${selected.completedCount} / ${selected.mappedCount} ilişkili hareket tamamlandı` : "Henüz hareket eşleştirilmedi"}</small></div><section className={styles.relatedSection} aria-label={`${selected.name} ile ilişkili hareket videoları`}><div className={styles.relatedHeader}><h3>{selected.name} · İlgili Hareketler</h3><span>{gateMovements.length} video</span></div><div className={styles.relatedGrid}>{gateMovements.map((movement) => { const done = completedOrders.includes(movement.order); return <article className={styles.relatedCard} key={movement.order}><div className={styles.relatedMedia}>{playingOrder === movement.order ? <video autoPlay controls onError={narration.stop} onPause={narration.onPause} onPlay={narration.onPlay} onTimeUpdate={(event) => narration.onTimeUpdate(event.currentTarget)} playsInline poster={`/images/shibashi-new/${movement.order}.jpg`} src={`/videos/shibashi/${movement.order}.mp4`} /> : <button aria-label={`${movement.sourceTitle} videosunu oynat`} onClick={() => { narration.start(movement.order); setPlayingOrder(movement.order); }} type="button"><Image alt="" fill sizes="(max-width: 650px) 45vw, 180px" src={`/images/shibashi-new/${movement.order}.jpg`} /><span aria-hidden="true">▶</span></button>}{done ? <span className={styles.relatedDone}>✓ Tamamlandı</span> : null}</div><strong>{String(movement.order).padStart(2,"0")} · {movement.sourceTitle}</strong><Link href={`/beden-hatlari?movementOrder=${movement.order}`}>Hareketi aç →</Link></article>; })}</div></section><p className={styles.boundary}>Bu yüzdeler yalnızca Shibashi hareket tamamlama katkısını gösterir. Bedensel durum veya Taijiquan ustalığı ölçümü değildir.</p><Link className={styles.more} href="/?tab=journey">Mevcut beden haritasını aç →</Link></aside>
      </div>
      <div className={styles.note}><span>✦</span><div><strong>Bu bir ölçüm değil, bir rehber.</strong><p>Her hareketi kendi hızında tamamla. İlerleme, kaydedilmiş benzersiz hareketlerden hesaplanır.</p></div></div>
    </div>
  </main>;
}
