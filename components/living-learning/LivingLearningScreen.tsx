"use client";

import { useState } from "react";
import Link from "next/link";
import { MorningExperience } from "@/components/living-learning/MorningExperience";
import { StoryCard } from "@/components/living-learning/StoryCard";
import { livingStories } from "@/data/livingStories";
import styles from "@/app/yasayarak-ogren/page.module.css";

type LivingLearningScreenProps = {
  embedded?: boolean;
};

export function LivingLearningScreen({ embedded = false }: LivingLearningScreenProps) {
  const [morningStage, setMorningStage] = useState<"story" | "practice">("story");

  return (
    <section className={`${styles.page} ${embedded ? styles.embedded : ""}`}>
      {!embedded ? (
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            <span>SHIBASHI</span>
            <small>18 Hareket</small>
          </Link>
          <nav aria-label="Yaşayarak Öğren sayfa navigasyonu">
            <a href="#yeni-gun">Yeni Gün</a>
            <a href="#golde-yolculuk">Gölde Yolculuk</a>
            <Link href="/">Uygulamaya Dön</Link>
          </nav>
        </header>
      ) : null}

      <div className={styles.inner}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Living Shibashi · 01 / 18</p>
            <h1>Hareketi ezberleme.<br />Hikâyeyi yaşa.</h1>
            <p className={styles.intro}>
              Shibashi hareketlerini günlük yaşamın içinden gelen sinematik sahnelerle öğren.
              Önce karakteri izle, sonra aynı hareketi bedeninle tamamla.
            </p>
            <div className={styles.heroNotes}>
              <article>
                <span>Gündelik bağ</span>
                <strong>Her hareket gerçek bir yaşam anına bağlanır.</strong>
                <p>Uyanış, hazırlanış, yürüyüş ve gün içi geçişler üzerinden akılda kalır.</p>
              </article>
              <article>
                <span>Öğrenme biçimi</span>
                <strong>Önce sahne, sonra beden, sonra kamera.</strong>
                <p>Önce neden yaptığını anlarsın; sonra hareketi uygulamak doğal hale gelir.</p>
              </article>
            </div>
            <div className={styles.heroActions}>
              <a href="#yeni-gun">İlk hikâyeyi başlat</a>
              <span>2 sahne · yaklaşık 14 dakika</span>
            </div>
          </div>

          <aside className={styles.progressCard}>
            <span>Bugünkü yolculuk</span>
            <strong>2 / 18</strong>
            <div><i /></div>
            <p>Sabah uyanışından sakin göl yolculuğuna.</p>
            <ul className={styles.progressList}>
              <li>
                <b>01</b>
                <div>
                  <strong>Yeni Gün</strong>
                  <small>Yorganı kaldırma akışı</small>
                </div>
              </li>
              <li>
                <b>02</b>
                <div>
                  <strong>Gölde Yolculuk</strong>
                  <small>Kürek ve merkez ritmi</small>
                </div>
              </li>
            </ul>
          </aside>
        </section>

        <section className={styles.storyList} aria-label="Yaşayarak öğren hikâyeleri">
          <MorningExperience
            onBack={() => setMorningStage("story")}
            onStart={() => setMorningStage("practice")}
            stage={morningStage}
            story={livingStories[0]}
          />
          <StoryCard story={livingStories[1]} />
        </section>

        <section className={styles.closing}>
          <p>Bir sonraki sahne</p>
          <h2>Ormana doğru yürüyüş</h2>
          <span>Göğsü açma hareketiyle nefesi ve ufku genişleteceğiz.</span>
          <button disabled type="button">Yakında</button>
        </section>
      </div>
    </section>
  );
}
