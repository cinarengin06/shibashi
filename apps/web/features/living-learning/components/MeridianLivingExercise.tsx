"use client";

import Image from "next/image";
import { useState } from "react";
import { meridianMovements } from "@/packages/meridian-knowledge";
import styles from "./living-learning.module.css";

const movementSteps: readonly (readonly [string, string, string])[] = [
  ["Ayaklarını rahatça yere bas; dizlerini yumuşak bırak.", "Nefes alırken iki kolunu öne ve yukarı kaldır.", "Kollarını indirirken omuzlarını gevşet, ağırlığını ayaklarına bırak."],
  ["Ayaklarını yere dengeli yerleştir; ellerini göğüs önünde buluştur.", "Kollarını iki yana açarken göğsünde rahatça alan oluştur.", "Kollarını öne getir; kürek kemiklerinin yumuşakça kaymasına izin ver."],
  ["Dizlerini yumuşat, ellerini gövdenin önünde hazırla.", "Ağırlığını bir yana aktarırken bir kolunu geniş bir yayla kaldır.", "Bakışını elinle izleyip diğer yana akıcı biçimde geç."],
  ["Ayaklarını sabitle, omuzlarını serbest bırak.", "Kollarınla rahat bir daire çizerken gövdenin de eşlik etsin.", "Daireyi tamamla ve yönü tersine çevir."],
  ["Ayaklarını dengeli aç, dizlerini kilitleme.", "Gövdeni bel çevresinden nazikçe bir yana döndür; kolların serbestçe sallansın.", "Merkeze dön ve hareketi diğer yana tekrarla."],
  ["Dizlerini yumuşat, kalçanı geriye alırken sırtını uzun tut.", "Kollarını kürek çeker gibi öne uzatıp kendine doğru al.", "Dizlerini rahatça açarak yüksel; hareketi akışla tekrarla."],
  ["Ellerini gövdenin önünde görünmez bir top tutar gibi yuvarla.", "Topu taşırken ağırlığını yavaşça bir ayağına aktar.", "Ellerin yön değiştirirken ağırlığını diğer ayağına taşı."],
  ["Bir elini bel hizasında tut, diğerini rahatça yukarı uzat.", "Yukarı uzarken boynunu ve belini sıkıştırma.", "Kollarının yerini değiştirip diğer yana uzan."],
  ["Ayaklarını dengeli bas, ellerini göğüs önünde hazırla.", "Belinden başlayan yumuşak dönüşle avuçlarını öne doğru it.", "Dirseklerini kilitlemeden merkeze dön ve yönü değiştir."],
  ["Dizlerini yumuşat, iki elini gövdenin önünde tut.", "Ellerini bulut taşır gibi bir yana doğru yuvarla.", "Belini ve bakışını ellerinle birlikte diğer yana çevir."],
  ["Kalçandan öne eğil; omurganı uzun ve rahat tut.", "Kollarınla yerden su toplar gibi aşağıdan yukarı bir yay çiz.", "Yumuşakça yükselirken ellerini başının üstüne doğru taşı."],
  ["Ayaklarını rahatça aç, dizlerini yumuşat.", "Ağırlığını öne ve arkaya küçük, kontrollü bir dalga gibi aktar.", "Dizlerin ayaklarınla aynı yönde kalsın; ritmi sürdür."],
  ["Ellerini göğüs önünde buluştur, omuzlarını gevşet.", "Kollarını iki yana açarken göğsünde rahatça alan bırak.", "Kollarını merkeze getir; kürek kemiklerini sıkıştırma."],
  ["Ayaklarını yere bas, ellerini bel hizasında hazırla.", "Ayak ve kalçandan başlayan yumuşak dönüşle yumruğunu öne uzat.", "Kolunu zorlamadan geri çek ve diğer yana dön."],
  ["Dizlerini yumuşak tut, kollarını yanlarında serbest bırak.", "Kollarını hafifçe kaldırırken başının tepesini yukarı uzat.", "Kollarını indir; ayak tabanlarının yerle temasını hisset."],
  ["Ayaklarını dengeli yerleştir, kollarını öne al.", "Gövden ve kürek kemiklerinle geniş, yumuşak bir daire çiz.", "Daireyi diğer yönde tamamla; belini zorlamadan dön."],
  ["Ağırlığını bir ayağına al, dizlerini kilitleme.", "Karşı elinle yumuşakça yaylanırken ritmi buluştur.", "Taraf değiştir; ayak bileklerinde hafif ve rahat kal."],
  ["Ayaklarını yere dengeli bas, avuçlarını göğüs önünde buluştur.", "Avuçlarını öne ve aşağı doğru yumuşakça bastır.", "Kollarını indirirken omuzlarını bırak, ağırlığını merkezde hisset."],
];

export function MeridianLivingExercise() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reflection, setReflection] = useState<string | null>(null);
  const movement = meridianMovements[activeIndex];
  const steps = movementSteps[activeIndex];
  const order = String(movement.order).padStart(2, "0");
  const next = () => {
    setActiveIndex((index) => (index + 1) % meridianMovements.length);
    setReflection(null);
  };

  return (
    <section aria-labelledby="meridian-exercise-title" className={styles.meridianExercise}>
      <div className={styles.exerciseHeading}>
        <div><p className={styles.eyebrow}>YAŞAYARAK ÖĞREN · SHIBASHI</p><span className={styles.exerciseKicker}>HAREKET {order} / 18</span></div>
        <div aria-label={"18 hareketten " + movement.order + ". hareket"} className={styles.exerciseProgress}>{meridianMovements.map((item, index) => <i aria-current={index === activeIndex ? "step" : undefined} key={item.movementId}/>)}</div>
      </div>
      <div className={styles.exerciseGrid}>
        <div className={styles.exerciseArt}>
          <Image alt={movement.sourceTitle + " hareketinin başlangıç pozu"} className={styles.exercisePhoto + " " + styles.poseStart} fill priority={activeIndex === 0} sizes="(max-width: 820px) 100vw, 42vw" src={"/images/body-lines-motion/" + order + ".jpg"} />
          <Image alt="" aria-hidden="true" className={styles.exercisePhoto + " " + styles.poseEnd} fill sizes="(max-width: 820px) 100vw, 42vw" src={"/images/body-lines/" + order + ".jpg"} />
          <span className={styles.photoShade}/>
          <span className={styles.photoLabel}>HAREKETLİ GÖSTERİM · {order}</span>
        </div>
        <div className={styles.exerciseContent}>
          <p className={styles.eyebrow}>BUGÜNÜN HAREKETİ</p>
          <h2 id="meridian-exercise-title">{movement.sourceTitle}</h2>
          <p className={styles.exerciseLead}>{movement.bodyCue}</p>
          <ol className={styles.exerciseSteps}>{steps.map((instruction, index) => <li key={instruction}><span>{index + 1}</span><p>{instruction}</p></li>)}</ol>
          <div className={styles.reflectionBox}>
            <span>ÜÇ TURDAN SONRA NE FARK ETTİN?</span>
            <div>{["Nefes", "Denge", "Omuzlar"].map((item) => <button aria-pressed={reflection === item} className={reflection === item ? styles.reflectionSelected : ""} key={item} onClick={() => setReflection(item)} type="button">{item}</button>)}</div>
          </div>
          <button className={styles.exerciseStart} onClick={next} type="button"><span>→</span>Sonraki adım<small>{movement.order === 18 ? "Başa dön" : String(movement.order + 1).padStart(2, "0") + " / 18"}</small></button>
        </div>
      </div>
    </section>
  );
}
