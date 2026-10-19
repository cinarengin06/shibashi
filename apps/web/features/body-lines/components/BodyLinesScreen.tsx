"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  deepMeridianVisuals,
  getMovementOrganVisuals,
  getPoint,
  meridianClinicalBoundary,
  meridianMovements,
  meridianTeachingMethod,
  movementPointMarkers,
  meridianLivingSteps,
  pointGuidance,
  type MeridianMovementKnowledge,
} from "@/packages/meridian-knowledge";
import { MovementCameraPractice } from "@/features/living-learning/components/MovementCameraPractice";
import styles from "./body-lines.module.css";

type BodyLayer = "body" | "lines" | "deep";

const layerCopy: Record<
  BodyLayer,
  { label: string; eyebrow: string; title?: string }
> = {
  body: {
    label: "Beden",
    eyebrow: "HAREKETİN İSKELETİ",
    title: "Önce bedendeki yönü hisset.",
  },
  lines: {
    label: "Beden Hatları",
    eyebrow: "Bedenindeki İzleri",
  },
  deep: {
    label: "Derin Bağlantı",
    eyebrow: "OLAĞANÜSTÜ MERİDYENLER",
    title: "Hareketin daha derin temasını aç.",
  },
};

function imageFor(order: number) {
  return `/images/body-lines/${String(order).padStart(2, "0")}.jpg`;
}

function motionImageFor(order: number) {
  return `/images/body-lines-motion/${String(order).padStart(2, "0")}.jpg`;
}

function MovementDetail({
  movement,
  layer,
}: {
  movement: MeridianMovementKnowledge;
  layer: BodyLayer;
}) {
  return (
    <section className={styles.detail} aria-live="polite">
      <div>
        <span className={styles.eyebrow}>{layerCopy[layer].eyebrow}</span>
        {layerCopy[layer].title ? <h2>{layerCopy[layer].title}</h2> : null}
      </div>
      <InnerWorld movement={movement} />
      {layer === "body" ? (
        <>
          <p className={styles.lead}>{movement.anatomy}</p>
          <div className={styles.cue}>
            <span>Şimdi bedeninde</span>
            <strong>{movement.bodyCue}</strong>
          </div>
          <InfoBlock
            title="Öğretim bağlantısı"
            items={[movement.teachingConnection]}
          />
        </>
      ) : null}
      {layer === "lines" ? (
        <>
          <InfoBlock
            title="Ana beden hatları"
            items={movement.primaryMeridians}
            tone="jade"
          />
          <InfoBlock
            title="Eşlik eden hatlar"
            items={movement.secondaryMeridians}
          />
        </>
      ) : null}
      {layer === "deep" ? (
        <>
          <InfoBlock
            title="Derin bağlantılar"
            items={movement.extraordinaryMeridians}
            tone="gold"
          />
          <p className={styles.lead}>{movement.teachingConnection}</p>
        </>
      ) : null}
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

const movementPointFallback =
  "Bu bölgeyi sıkmadan hareketin içinde yumuşak tut.";

function MovementPointOverlay({
  activeIndex,
  onSelect,
  order,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
  order: number;
}) {
  const markers = movementPointMarkers[order] ?? [];
  const activeMarker = markers[activeIndex] ?? markers[0];
  const guidance = activeMarker ? pointGuidance[activeMarker.code] : undefined;
  const point = activeMarker ? getPoint(activeMarker.code) : undefined;
  return (
    <div className={styles.pointOverlay}>
      {activeMarker ? (
        <div aria-live="polite" className={styles.pointCoach}>
          <span>
            ŞİMDİ HİSSET · {activeIndex + 1}/{markers.length}
          </span>
          <strong>{guidance?.instruction ?? movementPointFallback}</strong>
          <small>
            {activeMarker.code} ·{" "}
            {point?.pinyin ?? guidance?.title ?? "Beden noktası"}
          </small>
        </div>
      ) : null}
      {markers.map((marker, index) => (
        <button
          aria-label={`${marker.code}: ${pointGuidance[marker.code]?.instruction ?? movementPointFallback}`}
          aria-pressed={index === activeIndex}
          className={`${styles.pointMarker} ${index === activeIndex ? styles.pointMarkerActive : ""}`}
          key={marker.code}
          onClick={() => onSelect(index)}
          style={{ left: `${marker.left}%`, top: `${marker.top}%` }}
          type="button"
        >
          <i />
          {index === activeIndex ? (
            <b
              className={
                marker.side === "left"
                  ? styles.pointLabelLeft
                  : styles.pointLabelRight
              }
            >
              {marker.code}
            </b>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function DeepMeridianOverlay({ names }: { names: string[] }) {
  const visuals = names.flatMap((name) =>
    deepMeridianVisuals[name] ? [{ name, ...deepMeridianVisuals[name] }] : [],
  );
  return (
    <div
      aria-label={`${names.join(" ve ")} derin bağlantı hatları`}
      className={styles.deepOverlay}
      role="img"
    >
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
        {visuals.map((visual, index) => (
          <g key={visual.name}>
            <path
              className={styles.meridianGlow}
              d={visual.path}
              pathLength="1"
              style={{ stroke: visual.color }}
            />
            <path
              className={styles.meridianLine}
              d={visual.path}
              pathLength="1"
              style={{
                animationDelay: `${index * 0.45}s`,
                filter: `drop-shadow(0 0 4px ${visual.glow})`,
                stroke: visual.color,
              }}
            />
          </g>
        ))}
      </svg>
      {visuals.map((visual, index) => (
        <span
          className={styles.meridianLabel}
          key={visual.name}
          style={{
            animationDelay: `${index * 0.45}s`,
            color: visual.color,
            left: `${visual.labelLeft}%`,
            top: `${visual.labelTop}%`,
          }}
        >
          {visual.name.toLocaleUpperCase("tr-TR")}
        </span>
      ))}
    </div>
  );
}

export function BodyLinesScreen() {
  const [movementOrder, setMovementOrder] = useState(1);
  const [layer, setLayer] = useState<BodyLayer>("lines");
  const [remaining, setRemaining] = useState(60);
  const [ritualRunning, setRitualRunning] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [activePointIndex, setActivePointIndex] = useState(0);
  const [mode, setMode] = useState<"demo" | "camera">("demo");
  const [demoKey, setDemoKey] = useState(0);
  const movement =
    meridianMovements.find((item) => item.order === movementOrder) ??
    meridianMovements[0];
  const pointCount = movementPointMarkers[movement.order]?.length ?? 0;

  useEffect(() => {
    if (!ritualRunning) return;
    if (remaining <= 0) {
      setRitualRunning(false);
      setRemaining(60);
      return;
    }
    const timer = window.setTimeout(
      () => setRemaining((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [remaining, ritualRunning]);

  useEffect(() => {
    if (layer !== "lines" || !motionEnabled || pointCount < 2) return;
    const timer = window.setInterval(
      () => setActivePointIndex((index) => (index + 1) % pointCount),
      4200,
    );
    return () => window.clearInterval(timer);
  }, [layer, motionEnabled, movement.order, pointCount]);

  const chooseMovement = useCallback((order: number) => {
    setMovementOrder(order);
    setActivePointIndex(0);
    setRemaining(60);
    setRitualRunning(false);
    setMode("demo");
  }, []);
  const stepMovement = useCallback((step: number) => {
    chooseMovement(((movementOrder - 1 + step + 18) % 18) + 1);
  }, [chooseMovement, movementOrder]);
  const movementSteps = meridianLivingSteps[movementOrder - 1];

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <div>
          <span className={styles.eyebrow}>YAŞAYARAK ÖĞREN · BEDEN HATLARI</span>
        </div>
      </header>
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
            <button className={mode === "demo" ? styles.practiceActive : undefined} onClick={() => { setMode("demo"); setDemoKey((key) => key + 1); }} type="button">Hoca yapsın <span>↻</span></button>
            <button className={mode === "camera" ? styles.practiceActive : undefined} onClick={() => { setRitualRunning(false); setMode("camera"); }} type="button">Sen yap <span>→</span></button>
          </div>
          {mode === "camera" ? <small className={styles.cameraHint}>Kamera 15 saniye hareket uyumunu ölçer; %70’e ulaşınca sıradaki harekete geçer.</small> : null}
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
          ) : <div
            className={`${styles.visual} ${motionEnabled ? "" : styles.motionPaused}`}
          >
            <div className={styles.figureFrame} key={demoKey}>
              <Image
                alt=""
                aria-hidden="true"
                className={styles.motionStart}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 44vw"
                src={motionImageFor(movement.order)}
              />
              <Image
                alt={`${movement.appAliases[0]} hareketinin altın ve yeşim beden hatlarıyla öğretmen gösterimi`}
                className={styles.motionEnd}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 44vw"
                src={imageFor(movement.order)}
              />
              <div className={styles.energySweep} />
              <div className={styles.shade} />
              {layer === "lines" ? (
                <MovementPointOverlay
                  activeIndex={activePointIndex}
                  onSelect={setActivePointIndex}
                  order={movement.order}
                />
              ) : null}
              {layer === "deep" ? (
                <DeepMeridianOverlay names={movement.extraordinaryMeridians} />
              ) : null}
            </div>
            <button
              aria-label={motionEnabled ? "Hareketi durdur" : "Hareketi oynat"}
              aria-pressed={!motionEnabled}
              className={styles.motionToggle}
              onClick={() => setMotionEnabled((value) => !value)}
              type="button"
            >
              <i />
              {motionEnabled ? "CANLI" : "DURDU"}
            </button>
            <div className={styles.visualCaption}>
              <span>{movement.sourceTitle}</span>
              <strong>{layerCopy[layer].label}</strong>
            </div>
          </div>}
          <div
            className={styles.layers}
            role="tablist"
            aria-label="Beden okuma katmanı"
          >
            {(Object.keys(layerCopy) as BodyLayer[]).map((id) => (
              <button
                aria-selected={layer === id}
                className={layer === id ? styles.activeLayer : undefined}
                key={id}
                onClick={() => setLayer(id)}
                role="tab"
                type="button"
              >
                <i />
                {layerCopy[id].label}
              </button>
            ))}
          </div>
          {mode === "demo" ? <button
            className={`${styles.ritual} ${ritualRunning ? styles.ritualActive : ""}`}
            onClick={() => setRitualRunning((value) => !value)}
            type="button"
          >
            <span>{ritualRunning ? remaining : "60"}</span>
            <div>
              <b>
                {ritualRunning ? "Sessizce harekette kal" : "60 saniye hisset"}
              </b>
              <small>
                {ritualRunning
                  ? "Nefesi düzeltme; yalnızca izle."
                  : "Zamanlayıcıyı başlat ve bedendeki yolu takip et."}
              </small>
            </div>
            <i>{ritualRunning ? "DUR" : "BAŞLA"}</i>
          </button> : null}
        </section>
        <MovementDetail layer={layer} movement={movement} />
      </div>
      <section className={styles.movementSelector} aria-label="18 hareket">
        <div className={styles.selectorHeading}><span className={styles.eyebrow}>HAREKET ŞERİDİ</span><strong>Şu an 18 hareketin {movementOrder}. hareketindesin.</strong><button onClick={() => stepMovement(1)} type="button">Sonraki harekete geç →</button></div>
        <div className={styles.movementTiles}>
          {meridianMovements.map((item) => <button aria-current={item.order === movementOrder ? "step" : undefined} className={item.order === movementOrder ? styles.movementTileActive : undefined} key={item.movementId} onClick={() => chooseMovement(item.order)} type="button"><Image alt="" aria-hidden="true" fill sizes="180px" src={motionImageFor(item.order)} /><i>{String(item.order).padStart(2, "0")}</i><strong>{item.sourceTitle}</strong></button>)}
        </div>
      </section>
      <footer className={styles.note}>
        <p>{meridianTeachingMethod}</p>
        <small>{meridianClinicalBoundary}</small>
      </footer>
    </main>
  );
}
