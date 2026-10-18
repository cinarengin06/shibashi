"use client";

import { useState } from "react";

export function ShibashiAuthGate({
  configured,
  loading,
  onContinueWithoutAccount,
  onGoogle,
}: {
  configured: boolean;
  loading: boolean;
  onContinueWithoutAccount: () => void;
  onGoogle: () => Promise<{ error: Error | null } | { error: Error }>;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const continueWithGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const result = await onGoogle();
    if (result.error) {
      setError(result.error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div
      aria-label="Shibashi hesap girişi"
      aria-modal="true"
      className="shibashi-auth-gate"
      role="dialog"
    >
      <div className="shibashi-auth-landscape" aria-hidden="true" />
      <section className="shibashi-auth-card">
        <div className="shibashi-auth-mark" aria-hidden="true">
          ☯
        </div>
        <span className="eyebrow">SHIBASHI EFE</span>
        <h1>
          {mode === "login"
            ? "Yolculuğuna kaldığın yerden devam et."
            : "İlerlemeni yanında taşı."}
        </h1>
        <p>
          {mode === "login"
            ? "Pratiklerini, postür ölçümlerini ve günlük notlarını güvenle eşitle."
            : "Tek bir Google hesabıyla web ve mobile kayıtlarını aynı yerde tut."}
        </p>

        <div className="shibashi-auth-mode" aria-label="Hesap işlemi">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
            type="button"
          >
            Giriş yap
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
            type="button"
          >
            Hesap oluştur
          </button>
        </div>

        <button
          className="shibashi-google-button"
          disabled={loading || googleLoading || !configured}
          onClick={() => void continueWithGoogle()}
          type="button"
        >
          <GoogleMark />
          <span>
            {googleLoading
              ? "Google açılıyor…"
              : mode === "login"
                ? "Google ile giriş yap"
                : "Google ile kayıt ol"}
          </span>
        </button>

        {error ? <div className="shibashi-auth-error">{error}</div> : null}
        {!configured ? (
          <div className="shibashi-auth-error">
            Supabase bağlantısı yapılandırılmadı.
          </div>
        ) : null}

        <button
          className="shibashi-auth-skip"
          onClick={onContinueWithoutAccount}
          type="button"
        >
          Şimdilik hesapsız devam et
        </button>
        <small>
          Devam ederek Google hesap bilgilerinle güvenli oturum açmayı kabul
          edersin. Şifren Shibashi ile paylaşılmaz.
        </small>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M21.35 12.25c0-.72-.06-1.24-.2-1.79H12v3.43h5.37a4.6 4.6 0 0 1-2 2.94l-.02.11 2.9 2.25.2.02c1.84-1.7 2.9-4.2 2.9-6.96Z"
        fill="#4285F4"
      />
      <path
        d="M12 21.75c2.62 0 4.82-.86 6.43-2.54l-3.07-2.38c-.82.55-1.92.94-3.36.94a5.84 5.84 0 0 1-5.52-4.04l-.1.01-3.02 2.34-.04.1A9.72 9.72 0 0 0 12 21.75Z"
        fill="#34A853"
      />
      <path
        d="M6.48 13.73A5.98 5.98 0 0 1 6.16 12c0-.6.11-1.19.31-1.73v-.12L3.4 7.77l-.1.05A9.72 9.72 0 0 0 2.25 12c0 1.5.37 2.92 1.07 4.18l3.16-2.45Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.23c1.82 0 3.05.79 3.75 1.44l2.75-2.68A9.34 9.34 0 0 0 12 2.25a9.72 9.72 0 0 0-8.68 5.57l3.15 2.45A5.86 5.86 0 0 1 12 6.23Z"
        fill="#EB4335"
      />
    </svg>
  );
}
