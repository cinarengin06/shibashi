"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { journeyRewards, yinYangSummary } from "@/packages/gamification";
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
  gamification: { dailyCue: string; completedForms: number; nextFormOrder: number; balance: ReturnType<typeof yinYangSummary>; rewards: ReturnType<typeof journeyRewards> };
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
  const balance = props.gamification.balance;
  const yinPercent = balance.total ? Math.round(balance.yin / balance.total * 100) : 0;
  const yangPercent = balance.total ? 100 - yinPercent : 0;
  return (
    <section
      className={styles.dashboard}
      data-shen={props.shen.id}
      style={{ "--home-accent": props.shen.color, "--home-wallpaper": `url(${props.shen.wallpaper})` } as CSSProperties}
    >
      <HomeHero {...props} />
      <ShenSelector activeShen={props.shen} onSelect={props.onSelectShen} options={props.shenOptions} />
      <section className={styles.gameGrid} aria-label="Shibashi yolculuğun">
        <article className={`${styles.gameCard} ${styles.featuredForm}`}><Link aria-label={`${props.gamification.nextFormOrder}. formu aç`} className={styles.featuredFormImage} href={`/beden-hatlari?movementOrder=${props.gamification.nextFormOrder}`}><Image alt={`${props.gamification.nextFormOrder}. form görseli`} fill sizes="(max-width: 899px) 100vw, 30vw" src={`/images/form-scenes/${props.gamification.nextFormOrder}.jpg`} /><span aria-hidden="true" className={styles.featuredPlay}>▶</span></Link><div className={styles.featuredFormCopy}><span className={styles.gameEyebrow}>BUGÜNÜN SHEN GÖREVİ · FORM {props.gamification.nextFormOrder}</span><h2>Sıradaki Adım</h2><p>{props.gamification.dailyCue}</p><Link className={styles.featuredFormAction} href={`/beden-hatlari?movementOrder=${props.gamification.nextFormOrder}`}>Pratik Yap →</Link></div></article>
        <article className={styles.gameCard}><span className={styles.gameEyebrow}>18 FORM YOLU</span><h2>{props.gamification.completedForms} / 18 form</h2><div className={styles.formProgress} aria-label={`${props.gamification.completedForms} form tamamlandı`}>{Array.from({ length:18 }, (_,index) => <i className={index < props.gamification.completedForms ? styles.formDone : undefined} key={index} />)}</div><p>Her formda hocayı izle, kamerayla dene, kaydını oluştur.</p><Link href="/beden-hatlari">Yolculuğa devam et →</Link></article>
      </section>
      <section className={styles.journeyGrid} aria-label="Yin Yang ve bahçe ilerlemen">
        <article className={`${styles.gameCard} ${styles.balanceCard}`}><span className={styles.gameEyebrow}>YİN · YANG DENGESİ</span><div className={styles.balanceContent}><div className={styles.balanceCounts}><div><i className={styles.yinDot}/><strong>{balance.yin}</strong><span>Yin</span></div><div><i className={styles.yangDot}/><strong>{balance.yang}</strong><span>Yang</span></div>{balance.todayTotal > 0 ? <small className={styles.todayBalance}>Bugün: {balance.todayYin} Yin · {balance.todayYang} Yang</small> : null}</div><div className={styles.balanceDonut} role="img" aria-label={`${balance.yin} Yin, yüzde ${yinPercent}; ${balance.yang} Yang, yüzde ${yangPercent}`}><svg aria-hidden="true" viewBox="0 0 140 140"><circle className={styles.donutTrack} cx="70" cy="70" r="54"/><circle className={styles.donutYin} cx="70" cy="70" r="54" pathLength="100" strokeDasharray={`${yinPercent} ${100-yinPercent}`} transform="rotate(-90 70 70)"/><circle className={styles.donutYang} cx="70" cy="70" r="54" pathLength="100" strokeDasharray={`${yangPercent} ${100-yangPercent}`} strokeDashoffset={-yinPercent} transform="rotate(-90 70 70)"/></svg><div className={styles.donutCenter}>{balance.total ? <><span>Yin %{yinPercent}</span><span>Yang %{yangPercent}</span></> : <span>0 form</span>}</div></div></div><div className={styles.balanceLinks}><Link href="/beden-hatlari?status=completed&energy=Yin">Yin formlarım →</Link><Link href="/beden-hatlari?status=completed&energy=Yang">Yang formlarım →</Link></div></article>
        <article className={styles.gameCard}><span className={styles.gameEyebrow}>KENDİ BAHÇEN</span><h2>Bahçen büyüyor</h2><p>Pratik yaptıkça yeni ayrıntılar belirir.</p><div className={styles.gardenScene}>{props.gamification.rewards.garden.filter(item=>item.unlocked).length ? props.gamification.rewards.garden.filter(item=>item.unlocked).map(item=><span key={item.id}><b aria-hidden="true">{item.icon}</b><small>{item.title}</small></span>) : <small>İlk formunu tamamlayınca ilk filiz belirecek.</small>}</div></article>
      </section>
      <HomeStatsRow energy={props.energy} streak={props.streak} week={props.week} />
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

function HomeStatsRow({ energy, streak, week }: Pick<HomeDashboardProps, "energy" | "streak" | "week">) {
  const calendarDayLabels = ["P", "S", "Ç", "P", "C", "C", "P"];
  const calendarDayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  return (
    <section className={styles.stats} aria-label="Kısa ilerleme özeti">
      <article className={styles.statCard}>
        <header><h2>Enerjin (Shen)</h2><StatInfo id="energy-help" label="Shen puanı nasıl hesaplanır?">Bu puan son yedi günde pratik veya postür kaydı bulunan günlerin oranıdır. Grafikte kayıt olan gün 100, kayıt olmayan gün 0 görünür.</StatInfo></header>
        <div className={styles.energyRow}>
          <div className={styles.energyOverview}><div className={styles.energyScore}><strong>{energy.score ?? "—"}</strong>{energy.score !== null ? <span>{energy.score >= 75 ? "İyi" : energy.score >= 50 ? "Dengeleniyor" : "İlgi istiyor"}</span> : null}</div></div>
          <div className={styles.energyChart}><small>Son 7 gün</small><MiniTrend descriptions={energy.dayDescriptions} hasData={energy.score !== null} labels={energy.dayLabels} values={energy.trend} /></div>
        </div>
      </article>
      <article className={styles.statCard}>
        <header><h2>Son 7 Gün</h2><StatInfo id="week-help" label="Son yedi gün neyi gösterir?">Son yedi günde kaydedilen pratik oturumlarını gösterir. Aynı oturumdaki fotoğraflar bir kez sayılır; çubuklar günlük oturum sayısıdır.</StatInfo></header>
        <div className={styles.weekRow}><div><strong>{week.practiceCount}</strong><span>pratik</span></div><MiniBars labels={week.dayLabels} values={week.dailyPractices} /></div>
        <p>{week.activeDays} aktif gün</p>
      </article>

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

function MiniTrend({ descriptions, hasData, labels, values }: { descriptions: string[]; hasData: boolean; labels: string[]; values: number[] }) {
  const safeValues = values.length ? values : Array(7).fill(0);
  return <div className={styles.miniTrend} aria-label={`Son yedi günün kayıt ritmi: ${safeValues.map((value, index) => `${descriptions[index] ?? labels[index] ?? index + 1}: ${hasData ? value : "kayıt yok"}`).join(", ")}`} role="img">{safeValues.map((value, index) => <div className={styles.trendDay} key={index} title={`${descriptions[index] ?? ""} · ${hasData ? `${value} puan` : "Kayıt yok"}`}><strong>{hasData ? value : "—"}</strong><span className={styles.trendTrack}><i style={{ height: `${Math.max(7, value)}%` }} /></span><small>{labels[index]}</small></div>)}</div>;
}

function RecentPracticePhotos({ onHistory, photos }: { onHistory: () => void; photos: HomePracticePhoto[] }) {
  return (
    <section className={styles.flowsPanel}>
      <header><h2>Beden Görüntülerin</h2><button onClick={onHistory} type="button">Galeriyi aç <span aria-hidden="true">→</span></button></header>
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
      <div className={styles.postureModels} aria-hidden="true"><Image alt="" fill sizes="280px" src="/images/posture/posture-back-translucent.png" /></div>
    </article>
  );
}
