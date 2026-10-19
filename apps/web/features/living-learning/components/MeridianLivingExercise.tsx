"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { meridianMovements } from "@/packages/meridian-knowledge";
import { MovementCameraPractice } from "./MovementCameraPractice";
import styles from "./living-learning.module.css";

const movementSteps: readonly (readonly [string, string, string])[] = [
  ["Ayaklarını rahatça yere bas; dizlerini yumuşak bırak.", "Nefes alırken iki kolunu öne ve yukarı kaldır.", "Kollarını indir; omuzlarını gevşet ve ağırlığını ayaklarına bırak."],
  ["Ayaklarını yere dengeli yerleştir.", "Nefes alırken kollarını iki yana aç.", "Kollarını yumuşakça öne getir."],
  ["Dizlerini yumuşat; ellerini gövdenin önünde hazırla.", "Ağırlığını bir yana taşırken kolunu geniş bir yayla kaldır.", "Bakışını elinle izle ve diğer yana ak."],
  ["Ayaklarını sabitle, omuzlarını serbest bırak.", "Kollarınla rahat bir daire çiz.", "Daireyi ters yönde tamamla."],
  ["Ayaklarını dengeli aç.", "Gövdeni nazikçe bir yana döndür; kolların serbestçe sallansın.", "Merkeze dön ve diğer yana tekrarla."],
  ["Dizlerini yumuşat, sırtını uzun tut.", "Kollarını kürek çeker gibi öne uzatıp kendine al.", "Yumuşakça yüksel ve akışla tekrarla."],
  ["Ellerini görünmez bir top tutar gibi yuvarla.", "Ağırlığını bir ayağına aktar.", "Ellerinle birlikte diğer yana geç."],
  ["Bir elini bel hizasında tut, diğerini yukarı uzat.", "Yukarı uzarken boynunu sıkıştırma.", "Kollarının yerini değiştir."],
  ["Ellerini göğüs önünde hazırla.", "Yumuşakça dönüp avuçlarını öne it.", "Merkeze gel ve yön değiştir."],
  ["Ellerini gövdenin önünde tut.", "Ellerini bulut taşır gibi bir yana yuvarla.", "Bakışınla birlikte diğer yana dön."],
  ["Kalçandan öne eğil, sırtını uzun tut.", "Kollarınla aşağıdan yukarı bir yay çiz.", "Yumuşakça yüksel."],
  ["Ayaklarını rahatça aç.", "Ağırlığını öne ve arkaya küçükçe aktar.", "Rahat ritmini sürdür."],
  ["Ellerini göğüs önünde buluştur.", "Kollarını iki yana aç.", "Kollarını yeniden merkeze getir."],
  ["Ellerini bel hizasında hazırla.", "Yumuşakça dönüp yumruğunu öne uzat.", "Kolunu zorlamadan geri çek ve yön değiştir."],
  ["Dizlerini yumuşak tut.", "Kollarını hafifçe kaldırıp başının tepesini uzat.", "Kollarını indir ve ayak tabanlarını hisset."],
  ["Ayaklarını dengeli yerleştir, kollarını öne al.", "Gövdenle geniş ve yumuşak bir daire çiz.", "Daireyi diğer yönde tamamla."],
  ["Ağırlığını bir ayağına al.", "Karşı elinle yumuşakça yaylan.", "Taraf değiştir ve rahat kal."],
  ["Avuçlarını göğüs önünde buluştur.", "Avuçlarını öne ve aşağı yumuşakça bastır.", "Kollarını indir, merkezini hisset."],
];

export function MeridianLivingExercise() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<"demo" | "camera">("demo");
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [demoKey, setDemoKey] = useState(0);
  const experienceRef = useRef<HTMLElement>(null);
  const movementRailRef = useRef<HTMLDivElement>(null);
  const movement = meridianMovements[activeIndex];
  const order = String(movement.order).padStart(2, "0");
  const otherMovements = meridianMovements.filter((_, index) => index !== activeIndex);

  const selectMovement = useCallback((index: number) => {
    setActiveIndex((index + meridianMovements.length) % meridianMovements.length);
    setMode("demo");
    setDemoKey((key) => key + 1);
    window.requestAnimationFrame(() => experienceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  const startDemo = () => {
    setMode("demo");
    setDemoKey((key) => key + 1);
  };

  return (
    <div className={styles.movementLearningStack}>
    <section aria-labelledby="meridian-exercise-title" className={styles.movementExperience} ref={experienceRef}>
      <div className={styles.movementExperienceTop}>
        <div>
          <p className={styles.eyebrow}>YAŞAYARAK ÖĞREN · SHIBASHI</p>
          <p className={styles.movementNow}>ŞİMDİ YAPACAĞIN HAREKET <span>{order} / 18</span></p>
        </div>
        <div aria-label={`${movement.order}. hareket / 18`} className={styles.movementProgress}>
          {meridianMovements.map((item, index) => <i aria-current={index === activeIndex ? "step" : undefined} key={item.movementId} />)}
        </div>
      </div>

      <div className={styles.movementExperienceGrid}>
        <div className={styles.movementCopy}>
          <h1 id="meridian-exercise-title">{movement.sourceTitle}</h1>
          <p className={styles.movementCue}>{movement.bodyCue}</p>
          <ol className={styles.movementQuickSteps}>
            {movementSteps[activeIndex].map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}
          </ol>
          <div className={styles.movementActions}>
            <button className={styles.teacherButton} onClick={startDemo} type="button">Hoca yapsın <span aria-hidden="true">↻</span></button>
            {mode === "camera" ? (
              <button className={styles.userButton} onClick={() => setCameraAttempt((attempt) => attempt + 1)} type="button">Kamerayı yenile <span aria-hidden="true">↻</span></button>
            ) : (
              <button className={styles.userButton} onClick={() => setMode("camera")} type="button">Sen yap <span aria-hidden="true">→</span></button>
            )}
          </div>
          <p className={styles.movementFootnote}>Kamerada 15 saniye hareket et; %70 uyuma ulaşınca tamamlanıp sıradaki harekete geç.</p>
        </div>

        <div aria-label={mode === "demo" ? `${movement.sourceTitle} hareketini gösteren hoca` : undefined} className={styles.movementVisual} data-mode={mode}>
          {mode === "demo" ? (
            <div key={demoKey} className={styles.movementDemoStage}>
              <Image alt={`${movement.sourceTitle} hareketinin ilk gösterim karesi`} className={`${styles.movementDemoPose} ${styles.movementDemoPoseStart}`} fill priority={activeIndex === 0} sizes="(max-width: 820px) 100vw, 48vw" src={`/images/body-lines-motion/${order}.jpg`} />
              <Image alt="" aria-hidden="true" className={`${styles.movementDemoPose} ${styles.movementDemoPoseEnd}`} fill priority={activeIndex === 0} sizes="(max-width: 820px) 100vw, 48vw" src={`/images/body-lines/${order}.jpg`} />
              <div className={styles.movementVisualShade} />
              <span className={styles.visualBadge}>HOCA GÖSTERİYOR · HAREKET {order}</span>
              <p className={styles.teacherCaption}><i /> Harekete nefesinle eşlik et</p>
            </div>
          ) : null}
          <MovementCameraPractice active={mode === "camera"} movementOrder={order} movementName={movement.sourceTitle} onComplete={() => selectMovement(activeIndex + 1)} retryKey={cameraAttempt} />
        </div>
      </div>
    </section>
    <section aria-labelledby="movement-selector-title" className={styles.movementSelector}>
      <div className={styles.movementSelectorHeader}>
        <div>
          <p className={styles.eyebrow}>HAREKET ŞERİDİ</p>
          <h2 id="movement-selector-title">Diğer hareketler</h2>
          <p className={styles.movementSelectorStatus} aria-live="polite">Şu an 18 hareketin <strong>{movement.order}. hareketindesin.</strong> İstersen aşağıdan başka bir hareket seç.</p>
        </div>
        <div className={styles.movementSelectorActions}>
          <button className={styles.nextMovementButton} onClick={() => selectMovement(activeIndex + 1)} type="button">
            Sonraki harekete geç <span aria-hidden="true">→</span>
          </button>
          <div className={styles.movementRailControls}>
            <button aria-label="Önceki hareket kartları" onClick={() => movementRailRef.current?.scrollBy({ left: -420, behavior: "smooth" })} type="button">←</button>
            <button aria-label="Sonraki hareket kartları" onClick={() => movementRailRef.current?.scrollBy({ left: 420, behavior: "smooth" })} type="button">→</button>
          </div>
        </div>
      </div>
      <div aria-label="Seçilebilen diğer Shibashi hareketleri" className={styles.movementRail} ref={movementRailRef}>
        {otherMovements.map((item) => {
          const itemIndex = item.order - 1;
          const itemOrder = String(item.order).padStart(2, "0");
          return (
            <button aria-label={`${item.order}. hareket: ${item.sourceTitle}`} className={styles.movementTile} key={item.movementId} onClick={() => selectMovement(itemIndex)} type="button">
              <span className={styles.movementTileImage}>
                <Image alt="" aria-hidden="true" fill sizes="170px" src={`/images/body-lines-motion/${itemOrder}.jpg`} />
                <i>{itemOrder}</i>
              </span>
              <span className={styles.movementTileTitle}>{item.sourceTitle}</span>
              <span className={styles.movementTileAction}>Bu hareketi aç <b aria-hidden="true">↗</b></span>
            </button>
          );
        })}
      </div>
    </section>
    </div>
  );
}
