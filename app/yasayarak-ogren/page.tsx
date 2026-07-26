import Link from "next/link";
import { StoryCard } from "@/components/living-learning/StoryCard";
import { livingStories } from "@/data/livingStories";
import styles from "./page.module.css";

export default function LivingLearningPage() {
  return (
    <main className={styles.page}>
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

      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Living Shibashi · 01 / 18</p>
          <h1>Hareketi ezberleme.<br />Hikâyeyi yaşa.</h1>
          <p className={styles.intro}>
            Shibashi hareketlerini günlük yaşamın içinden gelen sinematik sahnelerle öğren.
            Önce karakteri izle, sonra aynı hareketi bedeninle tamamla.
          </p>
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
        </aside>
      </section>

      <section className={styles.storyList} aria-label="Yaşayarak öğren hikâyeleri">
        {livingStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </section>

      <section className={styles.closing}>
        <p>Bir sonraki sahne</p>
        <h2>Ormana doğru yürüyüş</h2>
        <span>Göğsü açma hareketiyle nefesi ve ufku genişleteceğiz.</span>
        <button disabled type="button">Yakında</button>
      </section>
    </main>
  );
}
