"use client";

import { useState, type CSSProperties } from "react";
import { visualThemes, type VisualThemeId } from "@/packages/design-tokens";

type ProfileShen = {
  id: "hun" | "shen" | "yi" | "po" | "zhi";
  name: string;
  dailyName: string;
  color: string;
  symbol: string;
};
export function ProfileScreen({
  authEmail,
  musicState,
  onRestartOnboarding,
  onSelectVisualTheme,
  onSignOut,
  onToggleMusic,
  selectedShen,
  visualThemeId,
  userName,
  googleAuthEnabled,
}: {
  authEmail?: string;
  musicState: "açık" | "kapalı";
  onRestartOnboarding: () => void;
  onSelectVisualTheme: (theme: VisualThemeId) => void;
  onSignOut?: () => void;
  onToggleMusic: () => void;
  selectedShen: ProfileShen;
  visualThemeId: VisualThemeId;
  userName: string;
  googleAuthEnabled: boolean;
}) {
  const [cameraStatus, setCameraStatus] = useState("İzin durumu kontrol edilmedi");
  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus("Kamera izni verildi");
    } catch {
      setCameraStatus("Kamera izni verilmedi. Tarayıcı ayarlarından açabilirsin.");
    }
  };
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
              <strong>Başlangıç Rehberini yeniden başlatmak istiyorum</strong>
              <small>Tanıtım ve ilk kurulum ekranlarını yeniden aç.</small>
            </div>
            <b>Aç</b>
          </button>
        </div>
      </div>
      <div className="glass-card profile-theme-settings">
        <div className="section-heading" style={{ margin: 0 }}>
          <div>
            <span className="eyebrow">Görünüm</span>
            <h2>Temanı seç</h2>
          </div>
          <span>{visualThemes[visualThemeId].name}</span>
        </div>
        <p>Renkler ve yazı karakteri seçtiğin temaya göre değişir.</p>
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
      <div className="glass-card profile-quick-settings">
        <div className="section-heading"><div><span className="eyebrow">İzinler</span><h2>Kameraya izin ver</h2></div></div>
        <p>Postür ve Form uyum pratikleri sırasında kameraya erişim iznini onaylıyorum.</p>
        <button className="secondary-action" onClick={() => void requestCamera()} type="button">Kamera iznini kontrol et</button>
        <p role="status">{cameraStatus}</p>
      </div>
    </section>
  );
}
