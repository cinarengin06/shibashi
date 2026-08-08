"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type {
  HomeEnergySummary,
  HomeFlowSummary,
  HomeLevelSummary,
  HomeShenId,
  HomeShenSummary,
  HomeStreakSummary,
  HomeWeekSummary,
} from "../types/home";
import styles from "./home-dashboard.module.css";

type HomeDashboardProps = {
  energy: HomeEnergySummary;
  flows: HomeFlowSummary[];
  level: HomeLevelSummary;
  onFlows: () => void;
  onHistory: () => void;
  onPractice: () => void;
  onPosture: () => void;
  onReset: () => void;
  onSelectShen: (shenId: HomeShenId) => void;
  onShen: () => void;
  postureCount: number;
  recommendedFlow: HomeFlowSummary;
  shen: HomeShenSummary;
  shenOptions: HomeShenSummary[];
  streak: HomeStreakSummary;
  userName: string;
  week: HomeWeekSummary;
};

const dayLabels = ["P", "S", "Ç", "P", "C", "C", "P"];

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
      <section className={styles.contentGrid} aria-label="Bugünün Shibashi özeti">
        <TodayPracticeCard flow={props.recommendedFlow} onPractice={props.onPractice} />
        <ShortFlowsRow flows={props.flows} onFlows={props.onFlows} onPractice={props.onPractice} />
        <PostureAnalysisCard count={props.postureCount} onPosture={props.onPosture} />
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

function HomeHero({ onHistory, onPractice, onShen, shen, userName }: HomeDashboardProps) {
  return (
    <article className={styles.hero}>
      <Image
        alt={`${shen.name} atmosferini taşıyan Shibashi manzarası`}
        className={styles.heroImage}
        fill
        priority
        sizes="100vw"
        src={shen.wallpaper}
      />
      <span aria-hidden="true" className={styles.heroShade} />
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span>Hoş geldin,</span> <strong>{userName || "Çınar"}</strong></p>
        <h1>{shen.heroTitle}</h1>
        <p className={styles.lead}>{shen.heroBody}</p>
        <blockquote>
          <span aria-hidden="true">“</span>
          <p>{shen.motto}</p>
          <cite>— {shen.name} rehberi</cite>
        </blockquote>
        <div className={styles.heroActions}>
          <button className={styles.primaryAction} onClick={onPractice} type="button"><span aria-hidden="true">▶</span> {shen.actionLabel}</button>
          <button className={styles.textAction} onClick={onHistory} type="button">Pratik geçmişimi gör <span aria-hidden="true">→</span></button>
        </div>
      </div>
      <DailyShenCard onShen={onShen} shen={shen} />
    </article>
  );
}

function ShenSelector({ activeShen, onSelect, options }: { activeShen: HomeShenSummary; onSelect: (shenId: HomeShenId) => void; options: HomeShenSummary[] }) {
  return (
    <section className={styles.shenSelector} aria-label="Beş Shen seçimi">
      <div className={styles.shenSelectorIntro}>
        <span>Bugünün iç alanı</span>
        <strong>{activeShen.name}</strong>
        <small>{activeShen.shortLabel}</small>
      </div>
      <div className={styles.shenChoices}>
        {options.map((option) => {
          const active = option.id === activeShen.id;
          return (
            <button
              aria-label={`${option.name}: ${option.shortLabel}`}
              aria-pressed={active}
              className={active ? styles.shenChoiceActive : styles.shenChoice}
              key={option.id}
              onClick={() => onSelect(option.id)}
              style={{ "--choice-color": option.color } as CSSProperties}
              type="button"
            >
              <i aria-hidden="true">{option.symbol}</i>
              <span><strong>{option.name}</strong><small>{option.shortLabel}</small></span>
            </button>
          );
        })}
      </div>
      <p><span aria-hidden="true">♫</span> Müzik açıksa seçtiğin Shen’in sesi de birlikte değişir.</p>
    </section>
  );
}

function DailyShenCard({ onShen, shen }: { onShen: () => void; shen: HomeShenSummary }) {
  return (
    <aside className={styles.shenCard} style={{ "--home-shen": shen.color } as CSSProperties}>
      <header><span className={styles.shenGlyph} aria-hidden="true">{shen.symbol}</span><small>Bugünkü Shen’in</small></header>
      <h2>{shen.name}</h2>
      <p className={styles.shenElement}>{shen.element} · {shen.organ}</p>
      <time>{shen.period}</time>
      <p>{shen.description}</p>
      <button onClick={onShen} type="button">Daha fazla bilgi <span aria-hidden="true">→</span></button>
    </aside>
  );
}

function HomeStatsRow({ energy, level, streak, week }: Pick<HomeDashboardProps, "energy" | "level" | "streak" | "week">) {
  return (
    <section className={styles.stats} aria-label="Kısa ilerleme özeti">
      <article className={styles.statCard}>
        <header><span>♨</span><h2>Seri</h2></header>
        <div className={styles.streakValue}><strong>{streak.current}</strong><span>gün</span></div>
        <div className={styles.dayDots}>{dayLabels.map((day, index) => <span className={streak.activeDays[index] ? styles.dayActive : ""} key={`${day}-${index}`}><i>{streak.activeDays[index] ? "✓" : ""}</i><small>{day}</small></span>)}</div>
        <p>En uzun seri: {streak.longest || "—"} gün</p>
      </article>

      <article className={styles.statCard}>
        <header><h2>Seviye</h2></header>
        <div className={styles.levelRow}><div><strong>{level.level}</strong><span>Yolcu</span></div><span className={styles.levelSeal} aria-hidden="true">⌁</span></div>
        <div className={styles.progress}><i style={{ width: `${level.progress}%` }} /></div>
        <p>{level.experience} / {level.nextLevelExperience} XP</p>
      </article>

      <article className={styles.statCard}>
        <header><h2>Bu Hafta</h2></header>
        <div className={styles.weekRow}><div><strong>{week.practiceCount}</strong><span>pratik</span></div><MiniBars values={week.dailyMinutes} /></div>
        <p>Toplam {week.minutes} dakika</p>
      </article>

      <article className={styles.statCard}>
        <header><h2>Enerjin (Shen)</h2></header>
        <div className={styles.energyRow}><div className={styles.energyScore}><strong>{energy.score ?? "—"}</strong><span>{energy.score === null ? "Ölçüm bekliyor" : energy.score >= 75 ? "İyi" : energy.score >= 50 ? "Dengeleniyor" : "İlgi istiyor"}</span></div><MiniTrend values={energy.trend} /></div>
        <p>Son 7 gün</p>
      </article>
    </section>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return <div className={styles.miniBars} aria-label="Son yedi günün pratik dakikaları">{values.map((value, index) => <span key={index}><i style={{ height: `${Math.max(value ? 20 : 6, (value / max) * 100)}%` }} /><small>{dayLabels[index]}</small></span>)}</div>;
}

function MiniTrend({ values }: { values: number[] }) {
  const safeValues = values.length ? values : Array(7).fill(0);
  return <div className={styles.miniTrend} aria-label="Son yedi günün enerji eğilimi">{safeValues.map((value, index) => <span key={index} style={{ height: `${Math.max(6, value)}%` }} />)}</div>;
}

function TodayPracticeCard({ flow, onPractice }: { flow: HomeFlowSummary; onPractice: () => void }) {
  return (
    <article className={styles.todayCard}>
      <h2>Bugünkü Pratik Önerisi</h2>
      <button onClick={onPractice} type="button">
        <Image alt={`${flow.title} pratiği`} fill sizes="(min-width: 1024px) 28vw, 100vw" src={flow.image} />
        <span className={styles.cardShade} />
        <div className={styles.todayCopy}><small>{flow.durationMinutes} dk · {flow.level}</small><h3>{flow.title}</h3><p>{flow.description}</p></div>
        <span className={styles.playButton} aria-hidden="true">▶</span>
      </button>
    </article>
  );
}

function ShortFlowsRow({ flows, onFlows, onPractice }: { flows: HomeFlowSummary[]; onFlows: () => void; onPractice: () => void }) {
  return (
    <section className={styles.flowsPanel}>
      <header><h2>Kısa Akışlar</h2><button onClick={onFlows} type="button">Tümünü gör <span aria-hidden="true">→</span></button></header>
      <div className={styles.flowCards}>{flows.slice(0, 5).map((flow) => <button key={flow.id} onClick={onPractice} type="button"><span className={styles.flowImage}><Image alt={flow.title} fill sizes="180px" src={flow.image} /></span><small>{flow.durationMinutes} dk</small><strong>{flow.title}</strong><em>{flow.level} · {flow.focus}</em></button>)}</div>
    </section>
  );
}

function PostureAnalysisCard({ count, onPosture }: { count: number; onPosture: () => void }) {
  return (
    <article className={styles.postureCard}>
      <div><h2>Postür Analizi</h2><p>Duruşunu analiz et, farkı gör,<br />gelişimini takip et.</p><button onClick={onPosture} type="button">Analize başla</button>{count > 0 ? <small>{count} kayıtlı analiz</small> : null}</div>
      <div className={styles.postureModels} aria-hidden="true"><Image alt="" fill sizes="280px" src="/images/posture/posture-back-translucent.png" /><Image alt="" fill sizes="280px" src="/images/posture/posture-back-translucent.png" /><Image alt="" fill sizes="280px" src="/images/posture/posture-back-translucent.png" /></div>
    </article>
  );
}
