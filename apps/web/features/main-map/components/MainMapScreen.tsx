"use client";

import Image from "next/image";
import Link from "next/link";
import { FormMetaTags } from "@/components/web/FormMetaTags";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BODY_GATE_ORDER, gateProgress, gates, movementGateWeights, uniqueMovementOrders, type GateId } from "@/packages/eight-gates";
import { meridianMovements } from "@/packages/meridian-knowledge";
import { loadCompletedMovements, movementCompletionEvent } from "@/lib/movement-completion";
import { unlockMilestones } from "@/lib/milestones";
import { useShibashiAuth } from "@/lib/supabase-auth";
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
  peng: { organ: "Akciğerler", x: 52, y: 82 },
  lu: { organ: "Mide", x: 76, y: 79 },
  kao: { organ: "Karaciğer", x: 54, y: 65 },
  ji: { organ: "Kalın bağırsak", x: 68, y: 49 },
  zhou: { organ: "Safra kesesi", x: 33, y: 46 },
  an: { organ: "Böbrekler", x: 55, y: 31 },
  lie: { organ: "Kalp çevresi", x: 54, y: 10 },
  cai: { organ: "Mesane", x: 29, y: 69 },
};

type GateArrow = { x1: number; y1: number; x2: number; y2: number; c1x: number; c1y: number; c2x: number; c2y: number; width: number; height: number };

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
      const x1 = startX + dx * 13;
      const y1 = startY + dy * 13;
      const x2 = targetX - dx * (to.width / 2 + 3);
      const y2 = targetY - dy * (to.height / 2 + 3);
      const side = targetX < startX ? -1 : 1;
      setArrow({
        x1, y1, x2, y2,
        c1x: x1 + side * Math.min(68, Math.abs(x2 - x1) * .65),
        c1y: y1,
        c2x: x2 - side * 24,
        c2y: y2 + Math.sign(y1 - y2) * Math.min(35, Math.abs(y1 - y2) * .3),
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
    <Image alt="Sekiz kapılı iç dünya beden haritası" className={styles.bodyImage} height={832} priority src="/images/neijing-map.jpg" width={464} />
    {arrow ? <svg aria-hidden="true" className={styles.gateArrow} preserveAspectRatio="none" viewBox={`0 0 ${arrow.width} ${arrow.height}`}>
      <defs><marker id="selected-gate-arrow" markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5"><path d="M0 0 7 3.5 0 7" /></marker></defs>
      <path className={styles.gateArrowUnderlay} d={`M ${arrow.x1} ${arrow.y1} C ${arrow.c1x} ${arrow.c1y} ${arrow.c2x} ${arrow.c2y} ${arrow.x2} ${arrow.y2}`} />
      <path className={styles.gateArrowLine} d={`M ${arrow.x1} ${arrow.y1} C ${arrow.c1x} ${arrow.c1y} ${arrow.c2x} ${arrow.c2y} ${arrow.x2} ${arrow.y2}`} markerEnd="url(#selected-gate-arrow)" />
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
  const [selectedGate, setSelectedGate] = useState<GateId | null>(null);

  useEffect(() => {
    if (window.location.hash !== "#sekiz-kapi") return;
    const frame = window.requestAnimationFrame(() => document.getElementById("sekiz-kapi")?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
  const defaultGate = progress.reduce((best, gate) => gate.percent > best.percent || (gate.percent === best.percent && gate.completedCount > best.completedCount) ? gate : best, progress[0]);
  const activeGate = selectedGate ?? defaultGate.id;
  const selected = progress.find((gate) => gate.id === activeGate) ?? progress[0];
  const gateMovements = meridianMovements.filter((movement) => (movementGateWeights[movement.order]?.[activeGate] ?? 0) > 0);
  const currentGateNumber = arrangement.indexOf(defaultGate.id) + 1;

  return <main className={styles.page}>
    <div className={styles.shell}>
      <section className={styles.gatePanel} id="sekiz-kapi"><div className={styles.gateHeader}><h1>8 Kapı Beden Haritan</h1><p>Kapılar, tamamladığın hareketlerin sembolik katkısını gösterir.</p></div><div className={styles.activeGateBanner} aria-live="polite"><span>ŞU ANKİ KAPIN</span><strong>{currentGateNumber}. kapıdasın · {defaultGate.name}</strong><small>{activeGate === defaultGate.id ? "Haritadaki kapılara dokunarak diğerlerini inceleyebilirsin." : `${arrangement.indexOf(activeGate) + 1}. kapıyı inceliyorsun; geri geldiğinde kendi kapın açılır.`}</small></div><GateBodyMap progress={progress} selectedGate={activeGate} onSelect={(id) => { setSelectedGate(id); unlockMilestones(["gate-explorer"],user?.id); }} /><div className={styles.gateDetail}><span>{activeGate === defaultGate.id ? "ŞU ANKİ KAPI" : "İNCELEDİĞİN KAPI"}</span><strong>{selected.name} · %{selected.percent}</strong><p>{arrangement.indexOf(activeGate) + 1} · {gateOrganPositions[activeGate].organ} odağı</p><p>{selected.cue}</p><p className={styles.organCue}>{gateOrganCues[activeGate]}</p><div className={styles.detailTrack}><i style={{ width: `${selected.percent}%` }} /></div><small>{selected.mappedCount ? `${selected.completedCount} / ${selected.mappedCount} ilişkili hareket tamamlandı` : "Henüz hareket eşleştirilmedi"}</small></div><section className={styles.relatedSection} aria-label={`${selected.name} ile ilişkili hareket videoları`}><div className={styles.relatedHeader}><h3>{selected.name} · İlgili Hareketler</h3><span>{gateMovements.length} video</span></div><div className={styles.relatedGrid}>{gateMovements.map((movement) => { const done = completedOrders.includes(movement.order); return <article className={styles.relatedCard} key={movement.order}><div className={styles.relatedMedia}><Link aria-label={`${movement.sourceTitle} formunu aç`} href={`/beden-hatlari?movementOrder=${movement.order}`}><Image alt="" fill sizes="(max-width: 650px) 45vw, 180px" src={`/images/form-scenes/${movement.order}.jpg`} /><span aria-hidden="true">▶</span></Link>{done ? <span className={styles.relatedDone}>✓ Tamamlandı</span> : null}</div><strong>{String(movement.order).padStart(2,"0")} · {movement.sourceTitle}</strong><div className={styles.cardMeta}><FormMetaTags order={movement.order} compact/></div><Link href={`/beden-hatlari?movementOrder=${movement.order}`}>Hareketi aç →</Link></article>; })}</div></section><p className={styles.boundary}>Bu yüzdeler yalnızca Shibashi hareket tamamlama katkısını gösterir. Bedensel durum veya Taijiquan ustalığı ölçümü değildir.</p></section>
    </div>
  </main>;
}
