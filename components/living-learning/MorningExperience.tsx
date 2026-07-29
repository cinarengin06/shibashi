"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LivingStory } from "@/data/livingStories";
import { GuidedMovementModel3D } from "./GuidedMovementModel3D";
import styles from "./MorningExperience.module.css";

type MorningExperienceProps = {
  onBack: () => void;
  onStart: () => void;
  stage: "story" | "practice";
  story: LivingStory;
};

export function MorningExperience({ onBack, onStart, stage, story }: MorningExperienceProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setIsFollowing(false);
    setIsComplete(false);
  }, [stage]);

  useEffect(() => {
    if (!isFollowing) return;
    const timer = window.setTimeout(() => setIsComplete(true), 4200);
    return () => window.clearTimeout(timer);
  }, [isFollowing]);

  return (
    <article className={`${styles.card} ${stage === "practice" ? styles.practiceCard : ""}`} id={story.id}>
      {stage === "story" ? (
        <>
          <div className={styles.storyVisual}>
            <Image
              alt="Sabah uyanışında yataktan kalkma sahnesi"
              className={styles.sceneImage}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
              src={story.image}
            />
            <div className={styles.imageShade} />
          </div>

          <div className={styles.content}>
            <div>
              <p className={styles.sceneContext}>Sahne 01 · Sabah · Yatak odası</p>
              <p className={styles.eyebrow}>Bugün bunu neden yapıyoruz?</p>
              <blockquote>“Yorganı üzerinden kaldırırken, güne de yer aç.”</blockquote>
              <p className={styles.description}>
                Sabah yataktan kalktığında ellerini nasıl kaldırıyorsan, bu hareket de aynı doğal akışı
                büyütür. Omuzları sıkmadan nefesi içeri alır, kolları yükseltir ve günün ilk geçişini
                daha dengeli yaparsın.
              </p>
            </div>

            <div className={styles.lifeConnection}>
              <span>Gündelik karşılığı</span>
              <strong>Yataktan kalkışını daha az zorlayarak başlat.</strong>
              <p>Hareketi ezberlemek yerine ne zaman kullanacağını hatırla: uyanırken, gerinirken, güne hazırlanırken.</p>
            </div>

            <div className={styles.metaRow}>
              <span>01 / 18 hareket</span>
              <span>Sabah ritüeli</span>
            </div>

            <div className={styles.actions}>
              <button onClick={onStart} type="button">Hareketi bedeninde dene <span>→</span></button>
              <Link href={story.practiceHref}>Kamerayla dene</Link>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.practiceStage}>
          <Image
            alt="Sabah odasında yorganı kaldırma ambiyansı"
            className={styles.practiceBackdrop}
            fill
            sizes="(max-width: 980px) 100vw, 70vw"
            src={story.image}
          />
          <div className={styles.practiceBackdropShade} />
          <div className={styles.practiceHeader}>
            <div>
              <p className={styles.eyebrow}>Ekranı izle, sonra bedeninle eşleştir</p>
              <h2>Yorganı kaldırır gibi</h2>
              <p>Ayakların yere bassın. Nefes alırken ellerini yumuşakça yukarı taşı.</p>
            </div>
            <button className={styles.backButton} onClick={onBack} type="button">← Sahneye dön</button>
          </div>

          <div className={styles.practiceGrid}>
            <div className={styles.modelPanel}>
              <div className={styles.modelLabel}>
                <span>{isComplete ? "Hareket yerini buldu" : isFollowing ? "Şimdi senin sıran" : "Önce modeli izle"}</span>
                <small>{isComplete ? "İlk gündelik temas tamamlandı" : "Yavaş ve nefesle"}</small>
              </div>
              <div className={`${styles.modelScene} ${isFollowing ? styles.modelFollowing : ""}`}>
                <div className={styles.sunHalo} />
                <div className={styles.floorGlow} />
                <div className={styles.modelSceneCaption}>Hareket modeli · yorganı kaldırma akışı</div>
                <GuidedMovementModel3D active={isFollowing} className={styles.model3d} />
                <div className={styles.breathLine} />
              </div>
            </div>

            <div className={styles.instructionPanel}>
              <div className={styles.stepMarker}>
                <span>1</span><i /><span>2</span><i /><span>3</span>
              </div>
              <div className={styles.instructionBlock}>
                <span className={styles.instructionNumber}>01</span>
                <div><strong>Ayaklarını yere bırak</strong><p>Yataktan kalktığın ilk anda olduğu gibi, dizlerini kilitleme.</p></div>
              </div>
              <div className={styles.instructionBlock}>
                <span className={styles.instructionNumber}>02</span>
                <div><strong>Nefes al ve ellerini kaldır</strong><p>Yorganı üzerinden kaldırıyormuş gibi omuzlarını yumuşak tut.</p></div>
              </div>
              <div className={styles.instructionBlock}>
                <span className={styles.instructionNumber}>03</span>
                <div><strong>Nefes ver, alan aç</strong><p>Kollar yükselirken göğsünde ve gününde biraz daha yer aç.</p></div>
              </div>

              <div className={styles.practicePrompt}>
                <span>{isComplete ? "İlk hareketin tamam" : isFollowing ? "Model seninle birlikte akıyor" : "Hazır olduğunda başla"}</span>
                <strong>{isComplete ? "Bunu yarın yataktan kalkarken hatırla." : "Ben de yapıyorum"}</strong>
                <button
                  disabled={isFollowing && !isComplete}
                  onClick={() => {
                    if (isComplete) {
                      setIsFollowing(false);
                      setIsComplete(false);
                      return;
                    }
                    setIsFollowing(true);
                  }}
                  type="button"
                >
                  {isComplete ? "Tekrar et" : isFollowing ? "Akış sürüyor..." : "Hareketi başlat"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
