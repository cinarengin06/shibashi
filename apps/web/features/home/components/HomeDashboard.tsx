"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type {
  HomeEnergySummary,
  HomeLevelSummary,
  HomePracticePhoto,
  HomePostureSummary,
  HomeShenId,
  HomeShenSummary,
  HomeStreakSummary,
  HomeWeekSummary,
} from "../types/home";
import styles from "./home-dashboard.module.css";

type HomeDashboardProps = {
  gamification: { dailyCue: string; dailyDone: boolean; completedForms: number };
  energy: HomeEnergySummary;
  level: HomeLevelSummary;
  onHistory: () => void;
  onPosture: (reportId?: string) => void;
  onReset: () => void;
  onSelectShen: (shenId: HomeShenId) => void;
  postureCount: number;
  postureReports: HomePostureSummary[];
  practicePhotos: HomePracticePhoto[];
  shen: HomeShenSummary;
  shenOptions: HomeShenSummary[];
  streak: HomeStreakSummary;
  userName: string;
  week: HomeWeekSummary;
};

export function HomeDashboard(props: HomeDashboardProps) {
  return (
    <section
      className={styles.dashboard}
      data-shen={props.shen.id}
      style={{ "--home-accent": props.shen.color, "--home-wallpaper": `url(${props.shen.wallpaper})` } as CSSProperties}
    >
      <HomeHero {...props} />
      <ShenSelector activeShen={props.shen} onSelect={props.onSelectShen} options={props.shenOptions} />
      <HomeStatsRow energy={props.energy} level={props.level} streak={props.streak} week={props.week} />
      <section className={styles.gameGrid} aria-label="Shibashi yolculuğun">
        <article className={styles.gameCard}><span className={styles.gameEyebrow}>BUGÜNÜN SHEN GÖREVİ</span><h2>{props.gamification.dailyDone ? "Bugünkü adımın tamamlandı ✨" : "Bir formu bedeninde dene"}</h2><p>{props.gamification.dailyCue}</p><span className={styles.gameStatus}>{props.gamification.dailyDone ? "✓ Bugün form kaydın var" : "Fotoğrafın kaydedilince tamamlanır"}</span><Link href="/beden-hatlari">18 Form'a git →</Link></article>
        <article className={styles.gameCard}><span className={styles.gameEyebrow}>18 FORM YOLU</span><h2>{props.gamification.completedForms} / 18 form</h2><div className={styles.formProgress} aria-label={`${props.gamification.completedForms} form tamamlandı`}>{Array.from({ length:18 }, (_,index) => <i className={index < props.gamification.completedForms ? styles.formDone : undefined} key={index} />)}</div><p>Her formda hocayı izle, kamerayla dene, kaydını oluştur.</p><Link href="/beden-hatlari">Yolculuğa devam et →</Link></article>
      </section>
      <section className={styles.contentGrid} aria-label="Bugünün Shibashi özeti">
        <RecentPracticePhotos onHistory={props.onHistory} photos={props.practicePhotos} />
        <PostureAnalysisCard onPosture={props.onPosture} reports={props.postureReports} />
      </section>
      <footer className={styles.footer}>
        <span>© 2026 Shibashi EFE</span>
        <p>Yaşayarak öğren, deneyimleyerek dönüş.</p>
        <nav aria-label="Yasal bağlantılar"><button className={styles.resetButton} onClick={props.onReset} type="button">↺ Reset</button><a href="#privacy">Gizlilik Politikası</a><a href="#terms">Kullanım Şartları</a><a href="mailto:info@shibashi.com">İletişim</a></nav>
      </footer>
      <button className={styles.mobileReset} onClick={props.onReset} type="button">↺ Reset</button>
    </section>
  );
}

function HomeHero({ shen, shenOptions, userName }: HomeDashboardProps) {
  return (
    <article className={styles.hero}>
      <div aria-hidden="true" className={styles.heroWallpapers}>
        {shenOptions.map((option) => (
          <Image
            alt=""
            className={`${styles.heroImage} ${option.id === shen.id ? styles.heroImageActive : ""}`}
            fill
            key={option.id}
            priority
            sizes="100vw"
            src={option.wallpaper}
          />
        ))}
      </div>
      <span aria-hidden="true" className={styles.heroShade} />
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span>Hoş geldin,</span> <strong>{userName || "Çınar"}</strong></p>
        <h1>{shen.heroTitle}</h1>
        <p className={styles.lead}>{shen.heroBody}</p>
      </div>
    </article>
  );
}

function ShenSelector({ activeShen, onSelect, options }: { activeShen: HomeShenSummary; onSelect: (shenId: HomeShenId) => void; options: HomeShenSummary[] }) {
  return (
    <section className={styles.shenSelector} aria-label="Beş Shen seçimi">
      <div className={styles.shenSelectorIntro}>
        <span>Beş Shen · İç yaşamın beş yönü</span>
        <strong>{activeShen.shortLabel}</strong>
        <small>{activeShen.name}</small>
      </div>
      <div className={styles.shenChoices}>
        {options.map((option) => {
          const active = option.id === activeShen.id;
          return (
            <button
              aria-label={`${option.shortLabel}: ${option.name}`}
              aria-pressed={active}
              className={active ? styles.shenChoiceActive : styles.shenChoice}
              key={option.id}
              onClick={() => onSelect(option.id)}
              style={{ "--choice-color": option.color } as CSSProperties}
              type="button"
            >
              <i aria-hidden="true"><Image alt="" height={34} src={option.icon} width={34} /></i>
              <span><strong>{option.shortLabel}</strong><small>{option.name} · {option.organ}</small></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function HomeStatsRow({ energy, level, streak, week }: Pick<HomeDashboardProps, "energy" | "level" | "streak" | "week">) {
  const calendarDayLabels = ["P", "S", "Ç", "P", "C", "C", "P"];
  const calendarDayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  return (
    <section className={styles.stats} aria-label="Kısa ilerleme özeti">
      <article className={styles.statCard}>
        <header><span>♨</span><h2>Seri</h2><StatInfo id="streak-help" label="Seri nasıl artar?">Bir günde en az bir pratik tamamlandığında o gün işaretlenir. Ardışık tamamlanan günler serini oluşturur. Günler her zaman Pazartesi’den Pazar’a aynı sırada gösterilir.</StatInfo></header>
        <div className={styles.streakValue}><strong>{streak.current}</strong><span>gün</span></div>
        <div className={styles.dayDots}>{calendarDayLabels.map((day, index) => {
          const isToday = index === streak.todayIndex;
          const state = streak.activeDays[index] ? "pratik tamamlandı" : "pratik yok";
          return <span aria-current={isToday ? "date" : undefined} aria-label={`${calendarDayNames[index]}${isToday ? ", bugün" : ""}: ${state}`} className={`${streak.activeDays[index] ? styles.dayActive : ""} ${isToday ? styles.dayToday : ""}`} key={calendarDayNames[index]} title={`${calendarDayNames[index]}${isToday ? " · Bugün" : ""}`}><i>{streak.activeDays[index] ? "✓" : ""}</i><small>{day}</small></span>;
        })}</div>
        <p>En uzun seri: {streak.longest || "—"} gün</p>
      </article>

      <article className={styles.statCard}>
        <header><h2>Seviye</h2><StatInfo id="level-help" label="Seviye nasıl artar?">Kaydedilen her pratik oturumu 35 XP, her yansıma 15 XP kazandırır. Aynı oturumdaki üç fotoğraf bir kez sayılır. Her 240 XP yeni seviyedir.</StatInfo></header>
        <div className={styles.levelRow}><div><strong>{level.level}</strong><span>Yolcu</span></div><span className={styles.levelSeal} aria-hidden="true">⌁</span></div>
        <div className={styles.progress}><i style={{ width: `${level.progress}%` }} /></div>
        <p>{level.experience} / {level.nextLevelExperience} XP</p>
      </article>

      <article className={styles.statCard}>
        <header><h2>Son 7 Gün</h2><StatInfo id="week-help" label="Son yedi gün neyi gösterir?">Son yedi günde kaydedilen pratik oturumlarını gösterir. Aynı oturumdaki fotoğraflar bir kez sayılır; çubuklar günlük oturum sayısıdır.</StatInfo></header>
        <div className={styles.weekRow}><div><strong>{week.practiceCount}</strong><span>pratik</span></div><MiniBars labels={week.dayLabels} values={week.dailyPractices} /></div>
        <p>{week.activeDays} aktif gün</p>
      </article>

      <article className={styles.statCard}>
        <header><h2>Enerjin (Shen)</h2><StatInfo id="energy-help" label="Shen puanı nasıl hesaplanır?">Son yedi günde pratik veya postür kaydı bulunan günlerin oranıdır. Daha düzenli kayıt, daha yüksek devamlılık puanı oluşturur.</StatInfo></header>
        <div className={styles.energyRow}><div className={styles.energyScore}><strong>{energy.score ?? "—"}</strong>{energy.score !== null ? <span>{energy.score >= 75 ? "İyi" : energy.score >= 50 ? "Dengeleniyor" : "İlgi istiyor"}</span> : null}</div><MiniTrend values={energy.trend} /></div>
        <p>Son 7 gün</p>
      </article>
    </section>
  );
}

function StatInfo({ children, id, label }: { children: string; id: string; label: string }) {
  return <span className={styles.statInfo}><button aria-describedby={id} aria-label={label} type="button">?</button><span id={id} role="tooltip">{children}</span></span>;
}

function MiniBars({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(1, ...values);
  return <div className={styles.miniBars} aria-label="Son yedi günün pratik sayıları">{values.map((value, index) => <span key={index}><i style={{ height: `${Math.max(value ? 20 : 6, (value / max) * 100)}%` }} /><small>{labels[index]}</small></span>)}</div>;
}

function MiniTrend({ values }: { values: number[] }) {
  const safeValues = values.length ? values : Array(7).fill(0);
  return <div className={styles.miniTrend} aria-label="Son yedi günün enerji eğilimi">{safeValues.map((value, index) => <span key={index} style={{ height: `${Math.max(6, value)}%` }} />)}</div>;
}

function RecentPracticePhotos({ onHistory, photos }: { onHistory: () => void; photos: HomePracticePhoto[] }) {
  return (
    <section className={styles.flowsPanel}>
      <header><h2>Son Hareketlerin</h2><button onClick={onHistory} type="button">Galeriyi aç <span aria-hidden="true">→</span></button></header>
      {photos.length ? <div className={styles.flowCards}>{photos.slice(0, 5).map((photo) => <button aria-label={`${photo.movementName} hareket fotoğrafını aç`} key={photo.id} onClick={onHistory} type="button"><span className={styles.flowImage}><Image alt={`${photo.movementName} sırasında çekilen fotoğrafın`} fill sizes="180px" src={photo.image} unoptimized /></span><small>%{photo.score}</small><strong>{photo.movementName}</strong><em>{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(photo.date))}</em></button>)}</div> : <div className={styles.practicePhotoEmpty}><span aria-hidden="true">◎</span><strong>Henüz hareket fotoğrafın yok</strong><p>Kamerayla tamamladığın hareketler burada birikir.</p></div>}
    </section>
  );
}

function PostureAnalysisCard({ onPosture, reports }: { onPosture: (reportId?: string) => void; reports: HomePostureSummary[] }) {
  const recentReports = reports.slice(0, 3);
  return (
    <article className={styles.postureCard}>
      <div className={styles.postureContent}>
        <h2>Postür</h2>
        {recentReports.length ? <div className={styles.postureHistory}>
          {recentReports.map((report) => <button aria-label={`${report.score} puanlı postür analizini aç`} key={report.id} onClick={() => onPosture(report.id)} type="button">
            <strong>{report.score}</strong>
            <span><b>{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(report.date))}</b><small>{report.summary}</small></span>
            <em>İlgili analize git <i aria-hidden="true">→</i></em>
          </button>)}
        </div> : <p>Duruşunu analiz et, farkı gör,<br />gelişimini takip et.</p>}
        <button className={styles.postureAnalysisButton} onClick={() => onPosture()} type="button">Yeni analiz</button>
      </div>
      <div className={styles.postureModels} aria-hidden="true"><Image alt="" fill sizes="280px" src="/images/posture/posture-back-translucent.png" /><Image alt="" fill sizes="280px" src="/images/posture/posture-back-translucent.png" /><Image alt="" fill sizes="280px" src="/images/posture/posture-back-translucent.png" /></div>
    </article>
  );
}
