"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  acupoints,
  buildPracticeMeridianSummary,
  extraordinaryMeridians,
  getLeastExploredMeridian,
  getMeridianForCoach,
  getMovementKnowledge,
  getPointsForMovement,
  getSuggestedMovementForMeridian,
  meridianClinicalBoundary,
  meridianMovements,
  meridianTeachingMethod,
} from "@/packages/meridian-knowledge";
import styles from "./meridian-knowledge.module.css";

export function MovementMeridianCard({ movementId, accent = "#c9a45f" }: { movementId: number | string; accent?: string }) {
  const [expanded, setExpanded] = useState(false);
  const knowledge = getMovementKnowledge(movementId);
  const points = getPointsForMovement(movementId);
  if (!knowledge) return null;
  const glossaryGaps = knowledge.pointCodes.filter((code) => !points.some((point) => point.code === code));
  return (
    <section className={styles.movementCard} style={{ "--meridian-accent": accent } as CSSProperties}>
      <header>
        <div><span>BEDENİNDE NE OLUYOR?</span><h3>{knowledge.sourceTitle}</h3></div>
        <b>{knowledge.evidenceLevel}</b>
      </header>
      <p className={styles.cue}>{knowledge.bodyCue}</p>
      <div className={styles.anatomy}><small>ANATOMİK ODAK</small><p>{knowledge.anatomy}</p></div>
      <div className={styles.lines}>
        <div><small>ANA BEDEN HATLARI</small><strong>{knowledge.primaryMeridians.join(" · ")}</strong></div>
        <div><small>SIRA DIŞI HATLAR</small><strong>{knowledge.extraordinaryMeridians.join(" · ")}</strong></div>
      </div>
      <button className={styles.disclosure} onClick={() => setExpanded((value) => !value)} type="button">
        {expanded ? "Geleneksel öğretimi kapat" : "Geleneksel karşılığını öğren"}<span>{expanded ? "−" : "+"}</span>
      </button>
      {expanded ? <div className={styles.expanded}>
        <p>{knowledge.teachingConnection}</p>
        <div className={styles.pointGrid}>{points.map((point) => <article key={point.code}><b>{point.code}</b><strong>{point.pinyin}</strong><p>{point.anatomicalLocation}</p><small>{point.classicalSummary}</small></article>)}</div>
        {glossaryGaps.length ? <p className={styles.sourceGap}>{glossaryGaps.join(" · ")} hareket haritasında anılıyor; ustanın 27 noktalı sözlüğünde ayrıca açıklanmıyor.</p> : null}
        <p className={styles.boundary}>{meridianClinicalBoundary}</p>
      </div> : null}
    </section>
  );
}

export function MeridianExplorer({ accent = "#c9a45f" }: { accent?: string }) {
  const [activeId, setActiveId] = useState(extraordinaryMeridians[0].id);
  const [pointCode, setPointCode] = useState(extraordinaryMeridians[0].openingPoint.split(" ")[0]);
  const active = extraordinaryMeridians.find((item) => item.id === activeId) ?? extraordinaryMeridians[0];
  const point = acupoints.find((item) => item.code === pointCode);
  const matchingMovements = meridianMovements.filter((item) => item.extraordinaryMeridians.includes(active.name));
  return <section className={styles.explorer} style={{ "--meridian-accent": accent } as CSSProperties}>
    <header><div><span>BEDEN HATLARI</span><h2>8 sıra dışı meridyen</h2><p>{meridianTeachingMethod}</p></div><strong>8 HAT · 27 NOKTA</strong></header>
    <div className={styles.meridianRail}>{extraordinaryMeridians.map((item) => <button className={item.id === active.id ? styles.active : ""} key={item.id} onClick={() => { setActiveId(item.id); setPointCode(item.openingPoint.split(" ")[0]); }} type="button"><small>{item.immortalName}</small><b>{item.name}</b></button>)}</div>
    <div className={styles.explorerBody}>
      <article className={styles.meridianDetail}><span>SEÇİLİ BEDEN HATTI</span><h3>{active.name}</h3><p>{active.teachingSummary}</p><strong>{active.dominantTheme}</strong><div className={styles.pointPair}><button onClick={() => setPointCode(active.openingPoint.split(" ")[0])} type="button"><small>AÇILMA NOKTASI</small>{active.openingPoint}</button><button onClick={() => setPointCode(active.pairedPoint.split(" ")[0])} type="button"><small>EŞLEŞEN NOKTA</small>{active.pairedPoint}</button></div></article>
      <article className={styles.pointDetail}><span>NOKTA SÖZLÜĞÜ</span><h3>{point ? `${point.code} · ${point.pinyin}` : "Bir noktaya dokun"}</h3>{point ? <><p>{point.anatomicalLocation}</p><small>{point.classicalSummary}</small></> : null}</article>
    </div>
    <div className={styles.pointDirectory}><span>27 NOKTA · SÖZLÜĞÜ AÇ</span><div>{acupoints.map((item) => <button className={item.code === pointCode ? styles.pointActive : ""} key={item.code} onClick={() => setPointCode(item.code)} type="button">{item.code}</button>)}</div></div>
    <div className={styles.movementLinks}><span>BU HATTI GÖRÜNÜR KILAN HAREKETLER</span>{matchingMovements.map((item) => <b key={item.movementId}>{String(item.order).padStart(2, "0")} · {item.appAliases[0]}</b>)}</div>
    <p className={styles.boundary}>{meridianClinicalBoundary}</p>
  </section>;
}

export function CoachMeridianCard({ coachId, accent = "#c9a45f" }: { coachId: Parameters<typeof getMeridianForCoach>[0]; accent?: string }) {
  const meridian = getMeridianForCoach(coachId);
  if (!meridian) return null;
  return <aside className={styles.coachConnection} style={{ "--meridian-accent": accent } as CSSProperties}><span>SHIBASHI EFE ÖĞRETİM EŞLEŞTİRMESİ</span><h3>{meridian.name}</h3><p>{meridian.dominantTheme}</p><div><b>{meridian.openingPoint}</b><i>↔</i><b>{meridian.pairedPoint}</b></div><small>Bu, geleneksel anlatıyı öğretimde hatırlanabilir kılan pedagojik bir eşleştirmedir.</small></aside>;
}

export function PersonalMeridianSuggestion({ completedMovementIds, accent = "#c9a45f", onSelectMovement }: { completedMovementIds: Array<number | string>; accent?: string; onSelectMovement?: (movementId: number) => void }) {
  const insight = useMemo(() => {
    const meridian = getLeastExploredMeridian(completedMovementIds);
    const movement = meridian ? getSuggestedMovementForMeridian(meridian.name, completedMovementIds) : undefined;
    return { meridian, movement };
  }, [completedMovementIds]);
  if (!insight.meridian || !insight.movement) return null;
  return <aside className={styles.suggestion} style={{ "--meridian-accent": accent } as CSSProperties}><div><span>BUGÜN KEŞFEDEBİLECEĞİN HAT</span><h3>{insight.meridian.name}</h3><p>{insight.meridian.dominantTheme}</p></div><button onClick={() => onSelectMovement?.(insight.movement!.order)} type="button">{insight.movement.appAliases[0]} ile keşfet →</button></aside>;
}

export function PracticeMeridianSummaryCard({ movementIds, accent = "#c9a45f" }: { movementIds: Array<number | string>; accent?: string }) {
  const summary = buildPracticeMeridianSummary(movementIds);
  if (!summary.movementCount) return null;
  return <aside className={styles.practiceSummary} style={{ "--meridian-accent": accent } as CSSProperties}><span>PRATİK SONRASI · BEDEN HATLARI</span><h3>{summary.extraordinaryMeridians.join(" · ")}</h3><p>{summary.anatomyCues.join(" ")}</p><div>{summary.primaryMeridians.map((item) => <b key={item}>{item}</b>)}</div><small>Bu özet kamera puanı değildir; tamamladığın hareketin geleneksel öğretim haritasıdır.</small></aside>;
}
