"use client";

import { useEffect, useState } from "react";

type JournalPracticeSnapshot = {
  id: string; dateKey: string; timeLabel: string; movementName: string; score: number; imageData: string; trainerVisible?: boolean;
};
type JournalPostureReport = {
  id: string; dateKey: string; score: number; summary: string; asymmetrySignal: string;
};
type JournalShen = { dailyName: string };

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
  gallery,
  onSetTrainerVisibility,
  postureReports,
  selectedShen,
}: {
  gallery: JournalPracticeSnapshot[];
  onSetTrainerVisibility: (snapshotId: string, trainerVisible: boolean) => void;
  postureReports: JournalPostureReport[];
  selectedShen: JournalShen;
}) {
  const todayKey = formatSnapshotDate(new Date());
  const todaysPractices = gallery.filter((item) => item.dateKey === todayKey);
  const todaysPostureReports = postureReports.filter((item) => item.dateKey === todayKey);
  const groupedGallery = groupSnapshotsByDate(gallery);
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [mood, setMood] = useState("Sakin");
  const [selectedSnapshot, setSelectedSnapshot] = useState<JournalPracticeSnapshot | null>(null);
  const recentScores = [...gallery].slice(0, 7).map((item) => item.score);
  const averagePracticeScore = recentScores.length ? Math.round(recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length) : 0;
  const averagePostureScore = postureReports.length ? Math.round(postureReports.slice(0, 7).reduce((sum, item) => sum + item.score, 0) / Math.min(7, postureReports.length)) : 0;
  const consistencyScore = Math.min(100, gallery.length * 8 + postureReports.length * 5);

  useEffect(() => {
    setReflection(window.localStorage.getItem("ritim-kapisi-daily-reflection") ?? "");
    setMood(window.localStorage.getItem("ritim-kapisi-daily-mood") ?? "Sakin");
  }, []);

  useEffect(() => {
    if (!selectedSnapshot) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedSnapshot(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedSnapshot]);

  function saveReflection() {
    window.localStorage.setItem("ritim-kapisi-daily-reflection", reflection.trim());
    window.localStorage.setItem("ritim-kapisi-daily-mood", mood);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
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
          <span className="eyebrow">Günlük</span>
          <h1>Bugünün beden kaydı.</h1>
          <p>Pratiklerin, postür analizlerin ve günün yansıması tek bir akışta.</p>
        </div>
        <div className="daily-journal-date">
          <strong>{new Intl.DateTimeFormat("tr-TR", { day: "2-digit" }).format(new Date())}</strong>
          <span>{new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(new Date())}</span>
        </div>
      </div>

      <div className="daily-summary-grid">
        <article>
          <span className="daily-summary-icon">◉</span>
          <strong>{todaysPractices.length}</strong>
          <small>bugünkü pratik</small>
        </article>
        <article>
          <span className="daily-summary-icon">↕</span>
          <strong>{todaysPostureReports.length}</strong>
          <small>postür analizi</small>
        </article>
        <article>
          <span className="daily-summary-icon">✦</span>
          <strong>{gallery.length}</strong>
          <small>tüm pratikler</small>
        </article>
      </div>

      <div className="journal-insight-grid">
        <article className="glass-card journal-wellbeing-card">
          <span className="eyebrow">Bugün nasıl hissediyorsun?</span>
          <div className="journal-mood-row">
            {["Sakin", "Enerjik", "Huzurlu", "Yorgun", "Stresli"].map((item) => (
              <button className={mood === item ? "active" : ""} key={item} onClick={() => setMood(item)} type="button">{item}</button>
            ))}
          </div>
          <small>Seçimin yansımayla birlikte kaydedilir.</small>
        </article>
        <article className="glass-card journal-ai-insight">
          <span className="eyebrow">AI Günlük Yorumu</span>
          <h2>{gallery.length || postureReports.length ? "Bugün ritmin daha görünür." : "İlk kaydınla kişisel desenin başlayacak."}</h2>
          <p>{averagePostureScore >= 75 ? "Postür hattın dengeli görünüyor. Nefesi yavaş tutup bu dengeyi koru." : "Omuz ve merkez hattına nazikçe dön. Kısa ama düzenli pratik bugün daha değerli."}</p>
        </article>
      </div>

      <div className="journal-progress-strip">
        <article><span>Pratik Uyumu</span><strong>{averagePracticeScore || "—"}{averagePracticeScore ? "%" : ""}</strong></article>
        <article><span>Postür</span><strong>{averagePostureScore || "—"}{averagePostureScore ? "%" : ""}</strong></article>
        <article><span>Süreklilik</span><strong>{consistencyScore}%</strong></article>
        <article><span>Bugünkü Mod</span><strong>{mood}</strong></article>
      </div>

      <div className="daily-journal-grid">
        <div className="glass-card daily-journal-section">
          <div className="section-heading">
            <div><span className="eyebrow">Bugün</span><h2>Yaptığın pratikler</h2></div>
            <span>{todaysPractices.length} kayıt</span>
          </div>
          {todaysPractices.length ? (
            <div className="daily-practice-list">
              {todaysPractices.map((snapshot) => (
                <article key={snapshot.id}>
                  {isCapturedPracticePhoto(snapshot.imageData) ? <button aria-label={`${snapshot.movementName} fotoğrafını aç`} className="snapshot-thumb-button" onClick={() => setSelectedSnapshot(snapshot)} type="button"><img src={snapshot.imageData} alt={`${snapshot.movementName} sırasında kaydedilen pozun`} /></button> : <div className="snapshot-photo-missing" aria-label="Bu pratiğin kullanıcı fotoğrafı bu cihazda bulunmuyor"><span>◎</span></div>}
                  <div><strong>{snapshot.movementName}</strong><small>{snapshot.timeLabel} · %{snapshot.score} uyum</small></div>
                  <span>{snapshot.score}</span>
                </article>
              ))}
            </div>
          ) : <div className="empty-gallery">Bugünkü ilk pratiğini tamamladığında burada görünecek.</div>}
        </div>

        <div className="glass-card daily-journal-section">
          <div className="section-heading">
            <div><span className="eyebrow">Beden Hattı</span><h2>Postür analizlerin</h2></div>
            <span>{postureReports.length} kayıt</span>
          </div>
          {postureReports.length ? (
            <div className="daily-posture-list">
              {postureReports.slice(0, 4).map((report) => (
                <article key={report.id}>
                  <div className="daily-posture-score">{report.score}</div>
                  <div><strong>{report.dateKey}</strong><small>{report.summary}</small></div>
                  <span>{report.asymmetrySignal}</span>
                </article>
              ))}
            </div>
          ) : <div className="empty-gallery">İlk postür analizin burada tarih ve skoruyla birikecek.</div>}
        </div>
      </div>

      <div className="glass-card reflection-card">
        <div className="section-heading">
          <div><span className="eyebrow">Günün Yansıması</span><h2>Bugün bedeninde ne değişti?</h2></div>
          <span>{selectedShen.dailyName}</span>
        </div>
        <textarea
          className="input-surface journal-entry"
          onChange={(event) => setReflection(event.target.value)}
          placeholder="Nefesim, dengem, enerjim veya zihnim hakkında kısa bir not..."
          value={reflection}
          aria-label="Günlük yansıma"
        />
        <button className="primary-action" onClick={saveReflection} type="button">
          {saved ? "Yansıma kaydedildi" : "Yansımayı Kaydet"}
        </button>
      </div>

      <div className="glass-card all-practices-card">
        <div className="section-heading">
          <div><span className="eyebrow">Senin Galerin</span><h2>Yaptığın pratikler</h2><p>Otomatik çekilen kendi pozların, tarih ve skorlarıyla burada.</p></div>
          <span>{gallery.length} kayıt</span>
        </div>
        {groupedGallery.length ? groupedGallery.map(([dateKey, snapshots]) => (
          <div className="gallery-day" key={dateKey}>
            <div className="gallery-date">{dateKey}</div>
            <div className="practice-photo-grid">
              {snapshots.map((snapshot) => (
                <article className={isCapturedPracticePhoto(snapshot.imageData) ? "practice-photo-card" : "practice-photo-card practice-photo-card-missing"} key={snapshot.id}>
                  {isCapturedPracticePhoto(snapshot.imageData) ? <button aria-label={`${snapshot.movementName} fotoğrafını aç`} onClick={() => setSelectedSnapshot(snapshot)} type="button"><img src={snapshot.imageData} alt={`${snapshot.movementName} sırasında kaydedilen kendi pozun`} /><span className="practice-photo-score">%{snapshot.score}</span></button> : <div className="practice-photo-placeholder"><span>◎</span><strong>Fotoğraf bu cihazda yok</strong><small>Referans videosu yerine yalnızca kendi çekimin gösterilir.</small></div>}
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
            <div className="snapshot-viewer-copy"><span>KAYDEDİLEN POZUN</span><h2>{selectedSnapshot.movementName}</h2><p>{selectedSnapshot.dateKey} · {selectedSnapshot.timeLabel}</p><strong>%{selectedSnapshot.score} uyum</strong><div className="snapshot-viewer-actions"><label><input checked={selectedSnapshot.trainerVisible ?? false} onChange={(event) => { onSetTrainerVisibility(selectedSnapshot.id, event.target.checked); setSelectedSnapshot({ ...selectedSnapshot, trainerVisible: event.target.checked }); }} type="checkbox" />{selectedSnapshot.trainerVisible ? "Eğitmene açık" : "Yalnızca ben"}</label><button onClick={() => void shareSnapshot(selectedSnapshot)} type="button">Paylaş</button></div></div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
