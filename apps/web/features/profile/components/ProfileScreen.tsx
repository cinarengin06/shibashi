"use client";

import type { CSSProperties } from "react";
import { visualThemes, type VisualThemeId } from "@/packages/design-tokens";

type ProfileShen = {
  id: "hun" | "shen" | "yi" | "po" | "zhi";
  name: string;
  dailyName: string;
  color: string;
  symbol: string;
};
type ProfilePostureReport = {
  id: string; score: number; dateKey: string; summary: string; asymmetrySignal: string; trendText: string;
};

export function ProfileScreen({
  authEmail,
  musicState,
  onRestartOnboarding,
  onSelectShen,
  onSelectVisualTheme,
  onSignOut,
  onToggleMusic,
  postureReports,
  selectedShen,
  selectedShenId,
  visualThemeId,
  userName,
  shens,
  googleAuthEnabled,
}: {
  authEmail?: string;
  musicState: "açık" | "kapalı";
  onRestartOnboarding: () => void;
  onSelectShen: (shen: ProfileShen["id"]) => void;
  onSelectVisualTheme: (theme: VisualThemeId) => void;
  onSignOut?: () => void;
  onToggleMusic: () => void;
  postureReports: ProfilePostureReport[];
  selectedShen: ProfileShen;
  selectedShenId: ProfileShen["id"];
  visualThemeId: VisualThemeId;
  userName: string;
  shens: readonly ProfileShen[];
  googleAuthEnabled: boolean;
}) {
  return (
    <section className="screen profile-screen-simple">
      <div className="profile-intro">
        <div className="profile-avatar">{(userName.trim()[0] ?? "R").toLocaleUpperCase("tr-TR")}</div>
        <div>
          <span className="eyebrow">Uygulayıcı</span>
          <h1>{userName || "Uygulayıcı"}</h1>
          <p>Bugünkü modun {selectedShen.dailyName}. Gelişim kayıtların ve izinlerin burada.</p>
        </div>
      </div>
      {googleAuthEnabled ? <div className="glass-card profile-auth-card">
        <div>
          <span className="eyebrow">Google Hesabı</span>
          <h2>{authEmail ? "Hesabın bağlı" : "Hesapsız kullanıyorsun"}</h2>
          <p>
            {authEmail ??
              "Google ile giriş yaptığında kayıtların cihazların arasında daha güvenli taşınır."}
          </p>
        </div>
        {onSignOut ? (
          <button className="secondary-action" onClick={onSignOut} type="button">
            Çıkış yap
          </button>
        ) : null}
      </div> : null}
      <div className="glass-card profile-quick-settings">
        <div className="section-heading" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow">Uygulama</span>
            <h2>Ses ve başlangıç rehberi</h2>
          </div>
        </div>
        <div className="profile-quick-actions">
          <button className={musicState === "açık" ? "profile-quick-action-active" : ""} onClick={onToggleMusic} type="button">
            <span aria-hidden="true">♪</span>
            <div>
              <strong>Müzik</strong>
              <small>{musicState === "açık" ? "Açık · kapatmak için dokun" : "Kapalı · açmak için dokun"}</small>
            </div>
            <b>{musicState === "açık" ? "Açık" : "Kapalı"}</b>
          </button>
          <button onClick={onRestartOnboarding} type="button">
            <span aria-hidden="true">?</span>
            <div>
              <strong>Başlangıç rehberi</strong>
              <small>Tanıtım ve ilk kurulum ekranlarını yeniden aç.</small>
            </div>
            <b>Aç</b>
          </button>
        </div>
      </div>
      <div className="glass-card profile-shen-settings">
        <div className="section-heading" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow">5 Shen Profili</span>
            <h2>Günlük modunu seç</h2>
          </div>
          <span>{selectedShen.name}</span>
        </div>
        <p>Bu seçim uygulamanın atmosferini, önerilerini ve müzik dünyasını değiştirir.</p>
        <div className="profile-shen-grid">
          {shens.map((shen) => (
            <button
              className={selectedShenId === shen.id ? "profile-shen-active" : ""}
              key={shen.id}
              onClick={() => onSelectShen(shen.id)}
              style={{ "--shen-card-accent": shen.color } as CSSProperties}
              type="button"
            >
              <span>{shen.symbol}</span>
              <strong>{shen.dailyName.replace(" Modu", "")}</strong>
              <small>{shen.name}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="glass-card profile-theme-settings">
        <div className="section-heading" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow">Görünüm</span>
            <h2>Uygulama temanı seç</h2>
          </div>
          <span>{visualThemes[visualThemeId].name}</span>
        </div>
        <p>Tema bütün sayfaların zeminini, kartlarını, navigasyonunu ve ışık karakterini değiştirir. Günlük Shen rengin ayrı olarak yaşamaya devam eder.</p>
        <div className="profile-theme-grid" role="radiogroup" aria-label="Uygulama teması">
          {Object.values(visualThemes).map((theme) => (
            <button
              aria-checked={visualThemeId === theme.id}
              className={visualThemeId === theme.id ? "profile-theme-active" : ""}
              key={theme.id}
              onClick={() => onSelectVisualTheme(theme.id)}
              role="radio"
              style={{"--theme-preview-bg":theme.background,"--theme-preview-surface":theme.surfaceRaised,"--theme-preview-glow":theme.glow} as CSSProperties}
              type="button"
            >
              <i aria-hidden="true"><b/><b/><b/></i>
              <span><strong>{theme.name}</strong><small>{theme.description}</small></span>
              <em aria-hidden="true">{visualThemeId === theme.id ? "✓" : ""}</em>
            </button>
          ))}
        </div>
      </div>
      <PostureHistoryCard reports={postureReports} />
      <div className="profile-settings-list">
        <div className="list-item teacher-badge">
          <div className="list-icon">T</div>
          <div>
            <div className="item-title">Öğretmen Modu</div>
            <div className="item-subtitle">Videoları, ödevleri ve AI özetlerini paylaş.</div>
          </div>
        </div>
        <div className="list-item">
          <div className="list-icon">⌁</div>
          <div>
            <div className="item-title">Sağlık izinleri</div>
            <div className="item-subtitle">HRV, uyku ve toparlanma henüz bağlı değil.</div>
          </div>
        </div>
        <div className="list-item">
          <div className="list-icon">✦</div>
          <div>
            <div className="item-title">Premium yol</div>
            <div className="item-subtitle">Gelişmiş AI analizi ve hikaye bölümleri.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PostureHistoryCard({ reports }: { reports: ProfilePostureReport[] }) {
  const latestReport = reports[0];
  const previousReport = reports[1];

  return (
    <div className="glass-card profile-posture-card">
      <div className="section-heading" style={{ margin: "0 0 12px" }}>
        <div>
          <span className="eyebrow">Postür Geçmişi</span>
          <h2>{latestReport ? "Beden hattı takipte" : "İlk postür raporu bekleniyor"}</h2>
        </div>
        <span>{reports.length ? `${reports.length} kayıt` : "0 kayıt"}</span>
      </div>
      {latestReport ? (
        <>
          <div className="posture-history-hero">
            <div>
              <strong>{latestReport.score}</strong>
              <span>genel hizalanma</span>
            </div>
            <div>
              <span className="eyebrow">Son Sinyal</span>
              <p>{latestReport.asymmetrySignal} asimetri · {latestReport.trendText}</p>
              {previousReport ? <small>Önceki rapor: {previousReport.score}</small> : <small>İlk baz çizgin kaydedildi.</small>}
            </div>
          </div>
          <div className="posture-history-list">
            {reports.slice(0, 4).map((report) => (
              <article key={report.id}>
                <span>{report.dateKey}</span>
                <strong>{report.score}</strong>
                <small>{report.summary}</small>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-gallery">
          Pratik ekranından Postür Analizi başlatınca ön, yan ve arka kayıtlar burada tarihsel gelişim olarak saklanacak.
        </div>
      )}
    </div>
  );
}
