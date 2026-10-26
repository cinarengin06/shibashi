"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { milestoneDefinitions, type EarnedMilestone } from "@/packages/gamification";
import { loadEarnedMilestones, milestonesChangedEvent } from "@/lib/milestones";
import { localDayKey, recordedPractices, recentDates } from "@/features/home/lib/practice-stats";
import type { PracticeSnapshot } from "@/features/practice/types";
import { isReliablePostureCapture } from "@/features/posture/lib/posture-session";
import type { PostureReport } from "@/features/posture/types";
import type { ShenActivity } from "@/packages/shen-domain";
import { useJourneyXp } from "@/lib/use-journey-xp";

type JournalPracticeSnapshot = PracticeSnapshot;
type JournalPostureReport = PostureReport;
type JournalShen = { dailyName: string };
type DailyReflection = { id: string; text: string; mood?: string; createdAt?: string };

function reflectionStorageKey(userId?: string) {
  return `shibashi-daily-reflections-v1:${userId ?? "guest"}`;
}

function isCapturedPracticePhoto(value: unknown): value is string {
  return typeof value === "string" && /^(?:data:image\/|blob:|https?:\/\/)/i.test(value.trim());
}
function formatSnapshotDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}
function groupSnapshotsByDate(gallery: JournalPracticeSnapshot[]): [string, JournalPracticeSnapshot[]][] {
  const groups = new Map<string, JournalPracticeSnapshot[]>();
  gallery.forEach((snapshot) => { const items = groups.get(snapshot.dateKey) ?? []; items.push(snapshot); groups.set(snapshot.dateKey, items); });
  return Array.from(groups.entries());
}

export function JournalScreen({
  activities,
  gallery,
  onDeleteSnapshots,
  onOpenPostureReport,
  onSetTrainerVisibility,
  postureReports,
  selectedShen,
  userId,
}: {
  activities: ShenActivity[];
  gallery: JournalPracticeSnapshot[];
  onDeleteSnapshots: (snapshotIds: string[]) => void;
  onOpenPostureReport: (reportId: string) => void;
  onSetTrainerVisibility: (snapshotId: string, trainerVisible: boolean) => void;
  postureReports: JournalPostureReport[];
  selectedShen: JournalShen;
  userId?: string;
}) {
  const todayKey = formatSnapshotDate(new Date());
  const totalXp = useJourneyXp(userId, gallery);
  const todaysPostureReports = postureReports.filter((item) => item.dateKey === todayKey);
  const practices = recordedPractices(gallery, activities);
  const todayPracticeCount = practices.filter((item) => localDayKey(item.createdAt) === localDayKey(new Date())).length;
  const groupedGallery = groupSnapshotsByDate(gallery);
  const [reflection, setReflection] = useState("");
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [showAllReflections, setShowAllReflections] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<JournalPracticeSnapshot | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState<string[]>([]);
  const deleteSelected = (ids: string[]) => {
    if (!ids.length || !window.confirm(`${ids.length} fotoğraf kaydı silinsin mi?`)) return;
    onDeleteSnapshots(ids);
    setSelectedSnapshot(null);
    setSelectedSnapshotIds([]);
    setSelectionMode(false);
  };
  const [earnedMilestones, setEarnedMilestones] = useState<EarnedMilestone[]>([]);
  useEffect(() => {
    const refresh = () => setEarnedMilestones(loadEarnedMilestones(userId));
    refresh();
    window.addEventListener(milestonesChangedEvent, refresh);
    return () => window.removeEventListener(milestonesChangedEvent, refresh);
  }, [userId]);
  const recentScores = [...gallery].slice(0, 7).map((item) => item.score);
  const averagePracticeScore = recentScores.length ? Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length) : 0;
  const reliablePostureReports = postureReports.filter((report) => report.observationVersion === 2 && (["front", "side", "back"] as const).every((view) => isReliablePostureCapture(report.captures[view], view)));
  const averagePostureScore = reliablePostureReports.length ? Math.round(reliablePostureReports.slice(0, 7).reduce((sum, item) => sum + item.score, 0) / Math.min(7, reliablePostureReports.length)) : 0;
  const lastSevenDays = recentDates().map((day) => ({ key: localDayKey(day), label: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day), date: new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(day) }));
  const dailyPracticeCounts = lastSevenDays.map((day) => practices.filter((item) => localDayKey(item.createdAt) === day.key).length);
  const weeklyPracticeCount = dailyPracticeCounts.reduce((total, count) => total + count, 0);
  const consistencyScore = Math.round((dailyPracticeCounts.filter((count) => count > 0).length / 7) * 100);
  const summaryStats = [
    { icon: "◉", value: todayPracticeCount, label: "bugünkü pratik" },
    { icon: "↕", value: todaysPostureReports.length, label: "bugünkü postür analizi" },
  ];
  const progressStats = [
    { label: "Hareket benzerliği", description: "Öğretmen referansına göre ölçülen hareket uyumu.", value: averagePracticeScore, hasData: recentScores.length > 0, icon: "◉" },
    { label: "Postür göstergesi", description: "Belirli görüntü ve ölçüm koşullarındaki hizalanma sonucu.", value: averagePostureScore, hasData: reliablePostureReports.length > 0, icon: "↕" },
    { label: "Süreklilik", description: "Son 7 günde pratik yapılan günlerin oranı.", value: consistencyScore, hasData: true, icon: "✦" },
  ];

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(reflectionStorageKey(userId)) ?? "[]") as unknown;
      const valid = Array.isArray(stored) ? stored.filter((item): item is DailyReflection => Boolean(item) && typeof item.id === "string" && typeof item.text === "string") : [];
      if (userId && !valid.length) {
        const guestNotes = JSON.parse(window.localStorage.getItem(reflectionStorageKey()) ?? "[]") as unknown;
        if (Array.isArray(guestNotes)) {
          valid.push(...guestNotes.filter((item): item is DailyReflection => Boolean(item) && typeof item.id === "string" && typeof item.text === "string"));
          if (valid.length) {
            window.localStorage.setItem(reflectionStorageKey(userId), JSON.stringify(valid));
            window.localStorage.removeItem(reflectionStorageKey());
          }
        }
      }
      const previous = window.localStorage.getItem("ritim-kapisi-daily-reflection")?.trim();
      if (previous && !valid.some((item) => item.text === previous)) {
        valid.push({ id: `previous-${Date.now()}`, text: previous });
        window.localStorage.setItem(reflectionStorageKey(userId), JSON.stringify(valid));
      }
      if (previous) window.localStorage.removeItem("ritim-kapisi-daily-reflection");
      setReflections(valid);
      setReflection("");
    } catch { setSaveError(true); }
  }, [userId]);

  useEffect(() => {
    if (!selectedSnapshot) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedSnapshot(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedSnapshot]);

  function saveReflection() {
    const text = reflection.trim();
    if (!text) return;
    const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, createdAt: new Date().toISOString() }, ...reflections];
    try {
      window.localStorage.setItem(reflectionStorageKey(userId), JSON.stringify(next));
      setReflections(next);
      setReflection("");
      setSaveError(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch { setSaveError(true); }
  }

  async function shareSnapshot(snapshot: JournalPracticeSnapshot) {
    if (!navigator.share || !isCapturedPracticePhoto(snapshot.imageData)) return;
    try {
      const response = await fetch(snapshot.imageData);
      const blob = await response.blob();
      const file = new File([blob], `shibashi-${snapshot.dateKey}.jpg`, { type: blob.type || "image/jpeg" });
      const data = { title: snapshot.movementName, text: `${snapshot.movementName} · %${snapshot.score} poz uyumu`, files: [file] };
      if (!navigator.canShare || navigator.canShare(data)) await navigator.share(data);
      else await navigator.share({ title: data.title, text: data.text });
    } catch {
      // Paylaşım kullanıcı tarafından kapatıldığında galeriyi etkileme.
    }
  }

  return (
    <section className="screen daily-journal-screen">
      <div className="daily-journal-hero">
        <div>
          <span className="eyebrow">İstatistiklerim</span>
          <h1>Bugünün beden kaydı.</h1>
          <p>Pratiklerin, postür analizlerin ve günün yansıması tek bir akışta.</p>
        </div>
        <div className="daily-journal-date">
          <strong>{new Intl.DateTimeFormat("tr-TR", { day: "2-digit" }).format(new Date())}</strong>
          <span>{new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(new Date())}</span>
        </div>
      </div>

      <section className="journal-statistics" aria-label="Kayıt istatistiklerin">
        <article className="journal-xp-total" aria-label={totalXp === null ? "Toplam yolculuk puanın yükleniyor" : `Toplam yolculuk puanın: ${totalXp} XP`}><span aria-hidden="true">✦</span><div><small>TOPLAM YOLCULUK PUANIN</small><strong>{totalXp ?? "—"} <em>XP</em></strong><p>Formların ve pratiklerinle biriken puan.</p></div></article>
        <div className="daily-summary-grid">
          {summaryStats.map((stat) => <article className="journal-stat-card journal-stat-simple" key={stat.label}>
            <span className="daily-summary-icon" aria-hidden="true">{stat.icon}</span>
            <strong>{stat.value}</strong>
            <small>{stat.label}</small>
          </article>)}
          <article className="journal-stat-card journal-week-card">
            <span className="daily-summary-icon" aria-hidden="true">✦</span>
            <strong>{weeklyPracticeCount}</strong>
            <small>son 7 gün pratik</small>
            <div className="journal-stat-chart journal-week-chart" aria-label={`Son 7 gün: ${lastSevenDays.map((day, index) => `${day.label} ${dailyPracticeCounts[index]} pratik`).join(", ")}`} role="img">
              {lastSevenDays.map((day, index) => <div className="journal-week-day" key={day.key} title={`${day.date}: ${dailyPracticeCounts[index]} pratik`}>
                <b>{dailyPracticeCounts[index]}</b>
                <i className={index === 6 ? "today" : ""} style={{ "--bar-height": `${dailyPracticeCounts[index] ? Math.max(14, dailyPracticeCounts[index] / Math.max(1, ...dailyPracticeCounts) * 100) : 7}%`, "--bar-delay": `${index * 70}ms` } as CSSProperties} />
                <span>{day.label}</span>
              </div>)}
            </div>
          </article>
        </div>
        <div className="journal-progress-strip">
          {progressStats.map((stat) => <article className="journal-progress-card" key={stat.label} aria-label={`${stat.label}: ${stat.hasData ? `%${stat.value}` : "henüz veri yok"}`}>
            <div className="journal-progress-ring" style={{ "--ring-end": 100 - Math.max(0, Math.min(100, stat.value)) } as CSSProperties}>
              <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="journal-ring-track" cx="50" cy="50" r="42" pathLength="100" /><circle className="journal-ring-value" cx="50" cy="50" r="42" pathLength="100" /></svg>
              <span aria-hidden="true">{stat.icon}</span>
            </div>
            <div className="journal-progress-copy"><div className="journal-progress-label"><span>{stat.label}</span><details className="journal-progress-help"><summary aria-label={`${stat.label} açıklaması`}>?</summary><p>{stat.description}</p></details></div><strong>{stat.hasData ? `%${stat.value}` : "—"}</strong></div>
          </article>)}
        </div>
      </section>

      <section className="glass-card journal-badges" aria-label="Kazandığın Shibashi rozetleri">
        <div className="section-heading"><div><span className="eyebrow">SHIBASHI YOLCULUĞUN</span><h2>Rozetlerim</h2></div><span>{earnedMilestones.length} / {milestoneDefinitions.length} rozet</span></div>
        {earnedMilestones.length ? <div className="journal-badge-list">{earnedMilestones.map((earned, index) => {
          const badge = milestoneDefinitions.find((item) => item.id === earned.id);
          return badge ? <article className="journal-badge-card" key={earned.id} style={{ "--badge-delay": `${index * 90}ms` } as CSSProperties}>
            <div className="journal-badge-topline"><span>KAZANILDI</span><span>{String(index + 1).padStart(2, "0")} / {String(milestoneDefinitions.length).padStart(2, "0")}</span></div>
            <div className="journal-badge-medal" aria-hidden="true"><span>{badge.icon}</span></div>
            <div className="journal-badge-copy"><strong>{badge.title}</strong><small>{badge.detail}</small></div>
            <time dateTime={earned.earnedAt}>{new Date(earned.earnedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</time>
          </article> : null;
        })}</div> : <div className="journal-badge-empty"><div className="journal-badge-medal" aria-hidden="true"><span>✦</span></div><div><strong>İlk rozetin seni bekliyor</strong><p>İlk formunu tamamladığında Qi Yolcusu rozetin burada parlayacak.</p></div></div>}
      </section>

      <div className="glass-card daily-journal-section">
          <div className="section-heading">
            <div><span className="eyebrow">Beden Hattı</span><h2>Postür analizlerin</h2></div>
            <span>{postureReports.length} kayıt</span>
          </div>
      {postureReports.length ? (
            <div className="daily-posture-list">
              {postureReports.map((report) => (
                <article key={report.id}>
                  <div className="daily-posture-score">{report.observationVersion === 2 ? report.score : "—"}</div>
                  <div><strong>{report.dateKey}</strong><small>{report.observationVersion === 2 ? report.summary : "Bu kaydın ölçüm güveni doğrulanamıyor. Yeniden ölçüm yapabilirsin."}</small></div>
                  <button className="journal-posture-open" onClick={() => onOpenPostureReport(report.id)} type="button">Raporu Postür’de aç →</button>
                </article>
              ))}
            </div>
          ) : <div className="empty-gallery">İlk postür analizin burada tarih ve skoruyla birikecek.</div>}
      </div>

      <div className="glass-card reflection-card">
        <div className="section-heading">
          <div><span className="eyebrow">Günün Yansıması</span><h2>Bugün bedeninde ne değişti?</h2></div>
          <span>{selectedShen.dailyName}</span>
        </div>
        {reflections.length ? <div className="reflection-saved-list" aria-label="Kaydedilen notların">{(showAllReflections ? reflections : reflections.slice(0, 2)).map((item) => <article key={item.id}><div><span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "Önceki kayıt"}</span></div><p>{item.text}</p></article>)}{reflections.length > 2 ? <button onClick={() => setShowAllReflections((show) => !show)} type="button">{showAllReflections ? "Daha az göster" : `Tüm notlar (${reflections.length})`}</button> : null}</div> : null}
        <textarea
          className="input-surface journal-entry"
          maxLength={1200}
          onChange={(event) => { setReflection(event.target.value); setSaved(false); }}
          placeholder="Nefesim, dengem, enerjim veya zihnim hakkında kısa bir not..."
          value={reflection}
          aria-label="Günlük yansıma"
        />
        <button className="primary-action" disabled={!reflection.trim()} onClick={saveReflection} type="button">
          {saved ? "Yansıma kaydedildi" : "Yansımayı Kaydet"}
        </button>
        {saveError ? <small className="reflection-save-error" role="alert">Not kaydedilemedi. Tarayıcı depolamasını kontrol et.</small> : null}
      </div>

      <div className="glass-card all-practices-card">
        <div className="section-heading">
          <div><span className="eyebrow">Senin Galerin</span><h2>Yaptığın pratikler</h2><p>Otomatik çekilen kendi pozların, tarih ve skorlarıyla burada.</p></div>
          <div className="gallery-management"><span>{gallery.length} kayıt</span>{gallery.length ? <><button onClick={() => { setSelectionMode((current) => !current); setSelectedSnapshotIds([]); }} type="button">{selectionMode ? "Seçimi kapat" : "Fotoğraf seç"}</button><button onClick={() => deleteSelected(gallery.map((item) => item.id))} type="button">Tümünü sil</button></> : null}</div>
        </div>
        {selectionMode ? <div className="gallery-selection-bar"><span>{selectedSnapshotIds.length} fotoğraf seçildi</span><button disabled={!selectedSnapshotIds.length} onClick={() => deleteSelected(selectedSnapshotIds)} type="button">Seçilenleri sil</button></div> : null}
        {groupedGallery.length ? groupedGallery.map(([dateKey, snapshots]) => (
          <div className="gallery-day" key={dateKey}>
            <div className="gallery-date">{dateKey}</div>
            <div className="practice-photo-grid">
              {snapshots.map((snapshot) => (
                <article className={isCapturedPracticePhoto(snapshot.imageData) ? "practice-photo-card" : "practice-photo-card practice-photo-card-missing"} key={snapshot.id}>
                  {selectionMode ? <label className="practice-photo-select"><input checked={selectedSnapshotIds.includes(snapshot.id)} onChange={(event) => setSelectedSnapshotIds((current) => event.target.checked ? [...current, snapshot.id] : current.filter((id) => id !== snapshot.id))} type="checkbox" /><span>Seç</span></label> : null}
                  {isCapturedPracticePhoto(snapshot.imageData) ? <button aria-label={`${snapshot.movementName} fotoğrafını aç`} onClick={() => selectionMode ? setSelectedSnapshotIds((current) => current.includes(snapshot.id) ? current.filter((id) => id !== snapshot.id) : [...current, snapshot.id]) : setSelectedSnapshot(snapshot)} type="button"><img src={snapshot.imageData} alt={`${snapshot.movementName} sırasında kaydedilen kendi pozun`} /><span className="practice-photo-score">%{snapshot.score}</span></button> : <div className="practice-photo-placeholder"><span>◎</span><strong>Fotoğraf bu cihazda yok</strong><small>Referans videosu yerine yalnızca kendi çekimin gösterilir.</small></div>}
                  <div className="practice-photo-copy"><strong>{snapshot.movementName}</strong><span>{snapshot.timeLabel}</span></div>
                </article>
              ))}
            </div>
          </div>
        )) : <div className="empty-gallery">Henüz arşivlenmiş pratik yok.</div>}
      </div>
      {selectedSnapshot ? (
        <div aria-label="Kaydedilen poz görüntüsü" aria-modal="true" className="snapshot-viewer" onClick={() => setSelectedSnapshot(null)} role="dialog">
          <div className="snapshot-viewer-card" onClick={(event) => event.stopPropagation()}>
            <button aria-label="Görüntüyü kapat" className="snapshot-viewer-close" onClick={() => setSelectedSnapshot(null)} type="button">×</button>
            <div className="snapshot-viewer-image"><img src={selectedSnapshot.imageData} alt={`${selectedSnapshot.movementName} tam ekran poz kaydı`} /></div>
            <div className="snapshot-viewer-copy"><span>KAYDEDİLEN POZUN</span><h2>{selectedSnapshot.movementName}</h2><p>{selectedSnapshot.dateKey} · {selectedSnapshot.timeLabel}</p><strong>%{selectedSnapshot.score} uyum</strong><div className="snapshot-viewer-actions"><label><input checked={selectedSnapshot.trainerVisible ?? false} onChange={(event) => { onSetTrainerVisibility(selectedSnapshot.id, event.target.checked); setSelectedSnapshot({ ...selectedSnapshot, trainerVisible: event.target.checked }); }} type="checkbox" />{selectedSnapshot.trainerVisible ? "Eğitmene açık" : "Yalnızca ben"}</label><button onClick={() => void shareSnapshot(selectedSnapshot)} type="button">Paylaş</button><button onClick={() => deleteSelected([selectedSnapshot.id])} type="button">Fotoğrafı sil</button></div></div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
