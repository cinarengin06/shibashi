"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import {
  getMovementOrganVisuals,
  meridianClinicalBoundary,
  meridianMovements,
  meridianTeachingMethod,
  meridianLivingSteps,
  type MeridianMovementKnowledge,
} from "@/packages/meridian-knowledge";
import { MovementCameraPractice } from "@/features/living-learning/components/MovementCameraPractice";
import styles from "./body-lines.module.css";

function MovementDetail({ movement }: { movement: MeridianMovementKnowledge }) {
  return (
    <section className={styles.detail}>
      <div>
        <span className={styles.eyebrow}>Bedenindeki İzleri</span>
      </div>
      <InnerWorld movement={movement} />
      <InfoBlock title="Ana beden hatları" items={movement.primaryMeridians} tone="jade" />
      <InfoBlock title="Eşlik eden hatlar" items={movement.secondaryMeridians} />
    </section>
  );
}

function InnerWorld({ movement }: { movement: MeridianMovementKnowledge }) {
  const organs = getMovementOrganVisuals(
    movement.primaryMeridians,
    movement.secondaryMeridians,
  );
  return (
    <section className={styles.innerWorld}>
      <div
        aria-label={`${organs.map((organ) => organ.label).join(", ")} bu harekette öne çıkan iç beden bölgeleri`}
        className={styles.organMap}
        role="img"
      >
        <Image
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 760px) 88vw, 290px"
          src="/images/body-lines/inner-world-organs-v1.jpg"
        />
        <div className={styles.organShade} />
        {organs.map((organ) => (
          <span
            className={`${styles.organMarker} ${organ.role === "primary" ? styles.organPrimary : styles.organSecondary}`}
            key={organ.id}
            style={{ left: `${organ.left}%`, top: `${organ.top}%` }}
          >
            <i />
            <b>{organ.label}</b>
          </span>
        ))}
        <span className={styles.innerWorldLabel}>İÇ DÜNYA</span>
      </div>
      <div className={styles.organLegend}>
        {organs.map((organ) => (
          <span key={organ.id}>
            <i data-role={organ.role} />
            <b>{organ.label}</b>
            <small>{organ.cue}</small>
          </span>
        ))}
      </div>
    </section>
  );
}

function InfoBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "jade" | "gold";
}) {
  return (
    <div className={styles.infoBlock}>
      <span>{title}</span>
      <div>
        {items.map((item) => (
          <b className={tone ? styles[tone] : undefined} key={item}>
            {item}
          </b>
        ))}
      </div>
    </div>
  );
}

export function BodyLinesScreen() {
  const [movementOrder, setMovementOrder] = useState(1);
  const [videoUnavailable, setVideoUnavailable] = useState(false);
  const [mode, setMode] = useState<"demo" | "camera">("demo");
  const [demoKey, setDemoKey] = useState(0);
  const movement =
    meridianMovements.find((item) => item.order === movementOrder) ??
    meridianMovements[0];
  const chooseMovement = useCallback((order: number) => {
    setMovementOrder(order);
    setVideoUnavailable(false);
    setMode("demo");
  }, []);
  const stepMovement = useCallback((step: number) => {
    chooseMovement(((movementOrder - 1 + step + 18) % 18) + 1);
  }, [chooseMovement, movementOrder]);
  const movementSteps = meridianLivingSteps[movementOrder - 1];

  return (
    <main className={styles.page}>
      <div className={styles.workspace}>
        <aside className={styles.rail} aria-label="Hareket adımları">
          <div className={styles.railHead}>
            <span>HAREKET {String(movementOrder).padStart(2, "0")}</span>
            <b>3 ADIM</b>
          </div>
          <ol className={styles.quickSteps}>
            {movementSteps.map((step, index) => <li key={step}><i>{index + 1}</i><span>{step}</span></li>)}
          </ol>
          <div className={styles.practiceActions}>
            <button className={mode === "demo" ? styles.practiceActive : undefined} onClick={() => { setMode("demo"); setVideoUnavailable(false); setDemoKey((key) => key + 1); }} type="button">Hoca yapsın <span>↻</span></button>
            <button className={`${styles.practiceStart} ${mode === "camera" ? styles.practiceActive : ""}`} onClick={() => setMode("camera")} type="button">Pratik yaparak öğren <span>→</span></button>
          </div>
          {mode === "camera" ? <small className={styles.cameraHint}>Canlı uyumunu izle, hedef yüzdesini ayarla. Tam bedenin görünerek hedefe ulaştığında sıradaki harekete geçersin.</small> : null}
        </aside>
        <section className={styles.stage}>
          <div className={styles.stageTop}>
            <button
              aria-label="Önceki hareket"
              onClick={() => stepMovement(-1)}
              type="button"
            >
              ←
            </button>
            <div>
              <span>HAREKET {String(movement.order).padStart(2, "0")}</span>
              <strong>{movement.sourceTitle}</strong>
            </div>
            <button
              aria-label="Sonraki hareket"
              onClick={() => stepMovement(1)}
              type="button"
            >
              →
            </button>
          </div>
          {mode === "camera" ? (
            <div className={styles.cameraStage}><MovementCameraPractice active movementOrder={String(movement.order).padStart(2, "0")} movementName={movement.sourceTitle} retryKey={0} onComplete={() => stepMovement(1)} /></div>
          ) : <div className={styles.visual}>
              <div className={`${styles.figureFrame} ${styles.videoFrame}`}>
                {videoUnavailable ? (
                  <Image alt={`${movement.sourceTitle} hoca videosunun kapak görseli`} fill sizes="(max-width: 900px) 100vw, 44vw" src={`/images/shibashi-new/${movement.order}.jpg`} />
                ) : (
                <video
                  aria-label={`${movement.sourceTitle} hoca videosu`}
                  autoPlay
                  controls
                  key={`${movement.order}-${demoKey}`}
                  loop
                  muted
                  onError={() => setVideoUnavailable(true)}
                  playsInline
                  poster={`/images/shibashi-new/${movement.order}.jpg`}
                  preload="metadata"
                  src={`/videos/shibashi/${movement.order}.mp4`}
                />
                )}
              </div>
            {videoUnavailable ? <span className={styles.videoUnavailable}>Video şu anda açılamıyor. Hareketi yeniden seçerek tekrar deneyebilirsin.</span> : null}
          </div>}
        </section>
        <MovementDetail movement={movement} />
      </div>
      <section className={styles.movementSelector} aria-label="18 hareket">
        <div className={styles.selectorHeading}><span className={styles.eyebrow}>HAREKET ŞERİDİ</span><strong>Şu an 18 hareketin {movementOrder}. hareketindesin.</strong><button onClick={() => stepMovement(1)} type="button">Sonraki harekete geç →</button></div>
        <div className={styles.movementTiles}>
          {meridianMovements.map((item) => <button aria-current={item.order === movementOrder ? "step" : undefined} className={item.order === movementOrder ? styles.movementTileActive : undefined} key={item.movementId} onClick={() => chooseMovement(item.order)} type="button"><Image alt="" aria-hidden="true" fill sizes="180px" src={`/images/shibashi-new/${item.order}.jpg`} /><i>{String(item.order).padStart(2, "0")}</i><strong>{item.sourceTitle}</strong></button>)}
        </div>
      </section>
      <footer className={styles.note}>
        <p>{meridianTeachingMethod}</p>
        <small>{meridianClinicalBoundary}</small>
      </footer>
    </main>
  );
}
