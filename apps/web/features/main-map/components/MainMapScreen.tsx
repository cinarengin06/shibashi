"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { gateProgress, gates, uniqueMovementOrders, type GateId } from "@/packages/eight-gates";
import { meridianMovements } from "@/packages/meridian-knowledge";
import { loadCompletedMovements, movementCompletionEvent } from "@/lib/movement-completion";
import { useShibashiAuth } from "@/lib/supabase-auth";
import styles from "./main-map.module.css";

const arrangement: GateId[] = ["peng", "lu", "kao", "ji", "zhou", "an", "lie", "cai"];

function BodySilhouette() {
  return <svg aria-hidden="true" className={styles.body} viewBox="0 0 130 260" fill="none">
    <circle cx="65" cy="28" r="16" fill="currentColor" />
    <path d="M48 50c-8 4-16 11-19 23L17 131c-2 8 8 11 12 5l19-47-2 46 6 43-12 63c-2 9 10 11 13 3l14-57 14 57c3 8 15 6 13-3l-12-63 6-43-2-46 19 47c4 6 14 3 12-5L101 73c-3-12-11-19-19-23-11 7-23 7-34 0Z" fill="currentColor" />
  </svg>;
}

export function MainMapScreen() {
  const { user, ready } = useShibashiAuth();
  const [completed, setCompleted] = useState<number[]>([]);
  const [selectedGate, setSelectedGate] = useState<GateId>("peng");
  const [name, setName] = useState("Gezgin");

  useEffect(() => {
    if (!ready) return;
    const refresh = () => {
      setCompleted(loadCompletedMovements(user?.id));
      setName(user?.user_metadata?.full_name || window.localStorage.getItem("ritim-kapisi-user-name") || "Gezgin");
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(movementCompletionEvent, refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); window.removeEventListener(movementCompletionEvent, refresh); };
  }, [ready, user?.id, user?.user_metadata?.full_name]);

  const completedOrders = useMemo(() => uniqueMovementOrders(completed), [completed]);
  const progress = useMemo(() => gateProgress(completedOrders), [completedOrders]);
  const selected = progress.find((gate) => gate.id === selectedGate) ?? progress[0];
  const completedCards = meridianMovements.filter((movement) => completedOrders.includes(movement.order)).slice(-3).reverse();
  const remaining = 18 - completedOrders.length;

  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.greeting}><span className={styles.leaf}>✦</span><div><strong>Merhaba {name}</strong><p>Bugün de dengeye bir adım daha.</p></div><div className={styles.topProgress}><span>18 Hareketlik Seri</span><div><i style={{ width: `${(completedOrders.length / 18) * 100}%` }} /></div><b>{completedOrders.length} / 18</b></div></header>

      <div className={styles.columns}>
        <section className={styles.mainColumn}>
          <div className={styles.hero}><div><span className={styles.kicker}>ANA HARİTAM</span><h1>Shibashi Pratiğin</h1><p>Bedeni sakinleştir, nefesi dengele, kendi ritminde ilerle.</p><Link className={styles.heroLink} href="/beden-hatlari">18 harekete git <span aria-hidden="true">→</span></Link></div><div aria-label={`${completedOrders.length} hareket tamamlandı, ${remaining} hareket kaldı`} className={styles.heroRing} style={{ "--progress": `${(completedOrders.length / 18) * 100}%` } as CSSProperties}><strong>{completedOrders.length}<small> / 18</small></strong><span>Hareket tamamlandı</span><p>{remaining ? `${remaining} hareket kaldı` : "Seri tamamlandı"}</p></div></div>

          <section className={styles.progressCard}><div><h2>18 Hareketlik İlerleme</h2><span>{completedOrders.length} / 18 tamamlandı</span></div><div className={styles.dots} aria-label="Tamamlanan hareketler">{meridianMovements.map((movement) => <span className={completedOrders.includes(movement.order) ? styles.dotDone : ""} key={movement.order} title={`${movement.order}. ${movement.sourceTitle}: ${completedOrders.includes(movement.order) ? "tamamlandı" : "bekliyor"}`} />)}</div></section>

          <section className={styles.completedSection}><div className={styles.sectionHeader}><h2>Tamamlanan Hareketler</h2><Link href="/beden-hatlari">Tümünü gör →</Link></div>{completedCards.length ? <div className={styles.movementCards}>{completedCards.map((movement) => <Link className={styles.movementCard} href={`/beden-hatlari?movementOrder=${movement.order}`} key={movement.order}><div className={styles.poster}><Image alt={`${movement.sourceTitle} hoca videosundan kare`} fill sizes="(max-width: 680px) 42vw, 260px" src={`/images/shibashi-new/${movement.order}.jpg`} /><span>{String(movement.order).padStart(2, "0")}</span></div><strong>{movement.sourceTitle}</strong><small>✓ Hareket tamamlandı</small></Link>)}</div> : <div className={styles.empty}><span>◌</span><p>İlk hareketi tamamladığında ilerlemen burada görünecek.</p><Link href="/beden-hatlari">İlk harekete başla →</Link></div>}</section>
        </section>

        <aside className={styles.gatePanel}><div className={styles.gateHeader}><h2>8 Kapı Beden Haritan</h2><p>Kapılar, tamamladığın hareketlerin sembolik katkısını gösterir.</p></div><div className={styles.gateMap}><div className={styles.halo} /><BodySilhouette />{arrangement.map((id, index) => { const gate = progress.find((item) => item.id === id)!; return <button aria-label={`${gate.name} Kapısı, yüzde ${gate.percent}`} aria-pressed={selectedGate === id} className={`${styles.gate} ${styles[`gate${index}`]} ${selectedGate === id ? styles.gateSelected : ""}`} key={id} onClick={() => setSelectedGate(id)} type="button" style={{ "--gate-progress": `${gate.percent}%` } as CSSProperties}><span className={styles.gateCircle}>{gates[id].symbol}</span><strong>{gate.name}</strong><small>%{gate.percent}</small></button>; })}</div><div className={styles.gateDetail}><span>SEÇİLİ KAPI</span><strong>{selected.name} · %{selected.percent}</strong><p>{selected.cue}</p><div className={styles.detailTrack}><i style={{ width: `${selected.percent}%` }} /></div><small>{selected.mappedCount ? `${selected.completedCount} / ${selected.mappedCount} ilişkili hareket tamamlandı` : "Henüz hareket eşleştirilmedi"}</small></div><p className={styles.boundary}>Bu yüzdeler yalnızca Shibashi hareket tamamlama katkısını gösterir. Bedensel durum veya Taijiquan ustalığı ölçümü değildir.</p><Link className={styles.more} href="/?tab=journey">Mevcut beden haritasını aç →</Link></aside>
      </div>
      <div className={styles.note}><span>✦</span><div><strong>Bu bir ölçüm değil, bir rehber.</strong><p>Her hareketi kendi hızında tamamla. İlerleme, kaydedilmiş benzersiz hareketlerden hesaplanır.</p></div></div>
    </div>
  </main>;
}
