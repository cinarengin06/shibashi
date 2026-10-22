"use client";

import { useState } from "react";
import { warmupLessons } from "@/features/practice/data/movements";
import styles from "./lesson-videos.module.css";

export function LessonVideosScreen() {
  const [selectedId, setSelectedId] = useState(warmupLessons[0].id);
  const selected = warmupLessons.find((lesson) => lesson.id === selectedId) ?? warmupLessons[0];

  return <section className={`screen ${styles.page}`} aria-labelledby="lesson-videos-title">
    <header className={styles.header}>
      <span className={styles.eyebrow}>SHIBASHI ÖNCESİ</span>
      <h1 id="lesson-videos-title">Ders Videoları</h1>
      <p>Üç temel dersi sırayla izle. Hazır hissettiğinde 18 harekete geç.</p>
    </header>

    <div className={styles.layout}>
      <div className={styles.playerPanel}>
        <div className={styles.player}>
          <iframe
            key={selected.videoId}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?rel=0&modestbranding=1`}
            title={`${selected.title} - Qigong İzmir`}
          />
        </div>
        <div className={styles.description}>
          <span>DERS {selected.order} / {warmupLessons.length} · {selected.focus.toLocaleUpperCase("tr-TR")}</span>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
        </div>
      </div>

      <aside className={styles.playlist} aria-label="Ders seçimi">
        <h2>Oynatma listesi</h2>
        {warmupLessons.map((lesson) => <button
          aria-current={lesson.id === selected.id ? "true" : undefined}
          className={`${styles.lesson} ${lesson.id === selected.id ? styles.active : ""}`}
          key={lesson.id}
          onClick={() => setSelectedId(lesson.id)}
          type="button"
        >
          <span className={styles.number}>{String(lesson.order).padStart(2, "0")}</span>
          <span className={styles.lessonText}><strong>{lesson.title}</strong><small>{lesson.focus}</small></span>
          <span aria-hidden="true">▶</span>
        </button>)}
        <a className={styles.next} href="/beden-hatlari">18 Harekete Git <span aria-hidden="true">→</span></a>
      </aside>
    </div>
  </section>;
}
