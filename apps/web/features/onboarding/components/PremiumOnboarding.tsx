"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createFirstJourneyPlan,
  emptyOnboardingProfile,
  onboardingShenResults,
  onboardingStages,
  profileQuestions,
  type BodyFocus,
  type ExperienceLevel,
  type MovementSupport,
  type OnboardingProfile,
  type OnboardingProgress,
  type PracticeIntention,
  type StandingCapacity,
} from "@/packages/onboarding";
import styles from "./premium-onboarding.module.css";

const STORAGE_KEY = "shibashi-onboarding-v9";
const RESULT_KEY = "shibashi-onboarding-result-v9";
type ShenId = ReturnType<typeof createFirstJourneyPlan>["recommendedShen"];

const shenVisuals: Record<ShenId, { accent: string; image: string }> = {
  hun: { accent: "#91A867", image: "/images/shen-home/hun-web.webp" },
  shen: { accent: "#D1AE68", image: "/images/shen-home/shen-fire-web.webp" },
  yi: { accent: "#C7BFAE", image: "/images/shen-home/yi-web.webp" },
  po: { accent: "#B69268", image: "/images/shen-home/po-web.webp" },
  zhi: { accent: "#688AA1", image: "/images/shen-home/zhi-web.webp" },
};

const shenMusic: Record<ShenId, string> = {
  hun: "/videos/shen-music-hun.mp4",
  shen: "/videos/shen-music-shen.mp4",
  yi: "/videos/shen-music-yi.mp4",
  po: "/videos/shen-music-po.mp4",
  zhi: "/videos/shen-music-zhi.mp4",
};

const bodyFocusMarkers: Record<BodyFocus, Array<{ height?: number; width?: number; x: number; y: number }>> = {
  "breath-shoulders": [{ x: 35, y: 20 }, { x: 65, y: 20 }, { height: 14, width: 42, x: 50, y: 27 }],
  "hips-sides": [{ x: 38, y: 48 }, { x: 62, y: 48 }],
  "center-balance": [{ height: 26, width: 22, x: 50, y: 42 }, { height: 8, width: 44, x: 50, y: 88 }],
  "back-knees-feet": [{ height: 22, width: 30, x: 50, y: 42 }, { x: 39, y: 69 }, { x: 61, y: 69 }, { x: 39, y: 90 }, { x: 61, y: 90 }],
  "whole-body": [{ height: 88, width: 54, x: 50, y: 49 }],
};

type Props = {
  embedded?: boolean;
  musicState?: "kapalı" | "açık";
  onComplete?: (profile: OnboardingProfile) => void;
  onShenRevealed?: (shenId: ShenId) => void;
  onToggleMusic?: () => void;
};

export function PremiumOnboarding({
  embedded = false,
  musicState = "kapalı",
  onComplete,
  onShenRevealed,
  onToggleMusic,
}: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(
    emptyOnboardingProfile,
  );
  const [hydrated, setHydrated] = useState(false);
  const [localMusicState, setLocalMusicState] = useState<"kapalı" | "açık">("kapalı");
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const stage = onboardingStages[step];
  const plan = useMemo(() => createFirstJourneyPlan(profile), [profile]);
  const result = onboardingShenResults[plan.recommendedShen];
  const visual = shenVisuals[plan.recommendedShen];
  const effectiveMusicState = onToggleMusic ? musicState : localMusicState;

  const startLocalMusic = (shenId: ShenId) => {
    const audio = localAudioRef.current ?? new Audio();
    localAudioRef.current = audio;
    if (!audio.src.endsWith(shenMusic[shenId])) audio.src = shenMusic[shenId];
    audio.loop = true;
    audio.volume = 0.3;
    void audio.play().then(() => setLocalMusicState("açık")).catch(() => setLocalMusicState("kapalı"));
  };

  const toggleMusic = () => {
    if (onToggleMusic) {
      onToggleMusic();
      return;
    }
    if (localMusicState === "açık") {
      localAudioRef.current?.pause();
      setLocalMusicState("kapalı");
    } else startLocalMusic(plan.recommendedShen);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as OnboardingProgress;
        if (saved.version === 9 && saved.stage !== "completed") {
          setProfile({ ...emptyOnboardingProfile, ...saved.profile });
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const progress: OnboardingProgress = {
      version: 9,
      stage: onboardingStages[step]?.id ?? "completed",
      profile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, profile, step]);

  useEffect(() => () => {
    localAudioRef.current?.pause();
    localAudioRef.current = null;
  }, []);

  const patch = <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
  ) => setProfile((current) => ({ ...current, [key]: value }));
  const canContinue = step !== 1 || profile.name.trim().length >= 2;
  const next = () => {
    if (step === 6) {
      if (onShenRevealed) onShenRevealed(plan.recommendedShen);
      else startLocalMusic(plan.recommendedShen);
    }
    setStep((value) => Math.min(7, value + 1));
  };
  const finish = () => {
    const completeProfile = {
      ...profile,
      name: profile.name.trim(),
      firstJourneyPlan: plan,
    };
    const completed: OnboardingProgress = {
      version: 9,
      stage: "completed",
      profile: completeProfile,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(RESULT_KEY, JSON.stringify(completeProfile));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    localStorage.setItem(
      "ritim-kapisi-onboarding-profile",
      JSON.stringify(completeProfile),
    );
    if (onComplete) onComplete(completeProfile);
    else window.location.assign("/");
  };

  if (!hydrated) return null;
  const questionNumber = Math.min(6, step);
  return (
    <main
      className={`${styles.root} ${embedded ? styles.embedded : ""}`}
      style={
        {
          "--onboarding-accent": step === 7 ? visual.accent : "#C99543",
        } as CSSProperties
      }
    >
      <div className={styles.ambient} />
      {step > 0 ? (
        <header className={styles.header}>
          <button
            aria-label="Önceki ekran"
            className={styles.back}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
            type="button"
          >
            ←
          </button>
          <div className={styles.brand}>
            <span>SHIBASHI EFE</span>
            <small>{step < 7 ? `${questionNumber} / 6` : "SENİN RİTMİN"}</small>
          </div>
          <div
            className={styles.progress}
            aria-label={`${questionNumber} / 6 tamamlandı`}
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <i
                className={item <= questionNumber ? styles.progressActive : ""}
                key={item}
              />
            ))}
          </div>
        </header>
      ) : null}

      {step === 0 ? <Welcome onStart={next} /> : null}
      {step > 0 ? (
        <section
          className={`${styles.shell} ${step === 7 ? styles.resultShell : ""}`}
          key={stage.id}
        >
          <div className={styles.copy}>
            <span className={styles.kicker}>
              {step < 7 ? `${questionNumber} / 6` : "BAŞLANGICIN HAZIR"}
            </span>
            <h1>
              {step === 7
                ? `Bugün sana ${result.name} eşlik edecek.`
                : stage.title}
            </h1>
            <p>
              {step === 1
                ? "Adını yalnızca deneyimini kişiselleştirmek için kullanacağız."
                : step === 2
                  ? "Üç çizgiyi sana en yakın noktaya getir; burada doğru ya da yanlış yok."
                  : step === 3
                    ? "Şu anda sana en yakın gelen seçeneği işaretle."
                    : step === 4
                      ? "Bu bir teşhis değil; ilk pratiğin odağını nazikçe belirler."
                      : step === 5
                        ? "Deneyimine ve ayırabileceğin zamana uygun bir plan hazırlayacağız."
                        : step === 6
                          ? "Kamera ilk gününde zorunlu değil. Önce rahat ve güvenli bir başlangıç yapacağız."
                        : `${profile.name || "Sen"}, cevapların bugün sana iyi gelebilecek başlangıç ritmini gösterdi.`}
            </p>
          </div>

          <div className={styles.stage}>
            {step === 1 ? (
              <NameStep
                name={profile.name}
                onChange={(value) => patch("name", value)}
              />
            ) : null}
            {step === 2 ? (
              <CheckinStep profile={profile} patch={patch} />
            ) : null}
            {step === 3 ? (
              <IntentionStep
                value={profile.practiceIntention}
                onChange={(value) => patch("practiceIntention", value)}
              />
            ) : null}
            {step === 4 ? (
              <BodyFocusStep
                value={profile.bodyFocus}
                onChange={(value) => patch("bodyFocus", value)}
              />
            ) : null}
            {step === 5 ? (
              <PreferencesStep profile={profile} patch={patch} />
            ) : null}
            {step === 6 ? (
              <PracticeSetupStep profile={profile} patch={patch} />
            ) : null}
            {step === 7 ? (
              <ResultStep
                musicState={effectiveMusicState}
                onToggleMusic={toggleMusic}
                plan={plan}
                result={result}
                visual={visual}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {step > 0 && step < 7 ? (
        <footer className={styles.footer}>
          <span>Yanıtlarını daha sonra profilinden değiştirebilirsin.</span>
          <button
            className={styles.primary}
            disabled={!canContinue}
            onClick={next}
            type="button"
          >
            {step === 6 ? "RİTMİMİ GÖSTER" : "DEVAM ET"}
            <b aria-hidden="true">→</b>
          </button>
        </footer>
      ) : null}
      {step === 7 ? (
        <footer className={`${styles.footer} ${styles.resultFooter}`}>
          <button
            className={styles.primary}
            onClick={finish}
            type="button"
          >
            Hadi Başlayalım <b aria-hidden="true">→</b>
          </button>
        </footer>
      ) : null}
    </main>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <section className={styles.welcome}>
      <Image
        alt="Dağların arasında Tai Chi pratiği"
        fill
        priority
        sizes="100vw"
        src="/images/living-learning/curtains-opening.png"
      />
      <span className={styles.welcomeShade} />
      <div className={styles.welcomeBrand}>
        <i />
        <span>
          SHIBASHI<small>EFE</small>
        </span>
      </div>
      <div className={styles.welcomeCopy}>
        <small>YOLCULUĞUN BURADA BAŞLIYOR</small>
        <h1>Sana iyi gelecek yolu birlikte bulalım.</h1>
        <p>Deneyim ve ekipman gerektirmez. Altı kısa adımda ilk 5 dakikalık pratiğini hazırlayacağız.</p>
        <button className={styles.primary} onClick={onStart} type="button">
          BAŞLAYALIM <b>→</b>
        </button>
        <span>◷ Yaklaşık 2 dakika · Kamera isteğe bağlı</span>
      </div>
    </section>
  );
}

function NameStep({
  name,
  onChange,
}: {
  name: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.nameStage}>
      <div className={styles.welcomeImage}>
        <Image
          alt="Sakin bir doğa ortamında Tai Chi pratiği"
          fill
          priority
          sizes="(min-width: 900px) 52vw, 100vw"
          src="/images/living-learning/curtains-opening.png"
        />
        <span>İlk adımın kusursuz olmak değil, kendine yer açmak.</span>
      </div>
      <label>
        <span>Adın</span>
        <input
          autoComplete="given-name"
          autoFocus
          maxLength={40}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Adın"
          value={name}
        />
      </label>
    </div>
  );
}

function CheckinStep({
  profile,
  patch,
}: {
  profile: OnboardingProfile;
  patch: <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
  ) => void;
}) {
  return (
    <div className={styles.checkinCard}>
      <CheckinSlider
        color="#C9A96A"
        label="Beden"
        left="Gergin"
        onChange={(value) => patch("bodyState", value)}
        right="Rahat"
        value={profile.bodyState}
      />
      <CheckinSlider
        color="#8EB6AE"
        label="Nefes"
        left="Sıkışık"
        onChange={(value) => patch("breathState", value)}
        right="Açık"
        value={profile.breathState}
      />
      <CheckinSlider
        color="#D48B55"
        label="Enerji"
        left="Düşük"
        onChange={(value) => patch("energyState", value)}
        right="Canlı"
        value={profile.energyState}
      />
    </div>
  );
}

function CheckinSlider({
  color,
  label,
  left,
  onChange,
  right,
  value,
}: {
  color: string;
  label: string;
  left: string;
  onChange: (value: number) => void;
  right: string;
  value: number;
}) {
  return (
    <label
      className={styles.checkinRow}
      style={{ "--slider-color": color } as CSSProperties}
    >
      <span>
        <b>{label}</b>
        <strong>{value}</strong>
      </span>
      <input
        aria-label={`${label}: ${value}`}
        max="100"
        min="0"
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
      <small>
        <i>{left}</i>
        <i>{right}</i>
      </small>
    </label>
  );
}

function IntentionStep({
  value,
  onChange,
}: {
  value: PracticeIntention;
  onChange: (value: PracticeIntention) => void;
}) {
  const labels: Record<PracticeIntention, string> = {
    calm: "Sakinleşmek",
    energy: "Enerji kazanmak",
    focus: "Odaklanmak",
    resilience: "Daha sağlam hissetmek",
    connection: "Kendimle bağ kurmak",
  };
  return (
    <OptionList
      options={profileQuestions.intention.map((item) => ({
        ...item,
        label: labels[item.value],
      }))}
      selected={value}
      onSelect={onChange}
    />
  );
}

function BodyFocusStep({
  value,
  onChange,
}: {
  value: BodyFocus;
  onChange: (value: BodyFocus) => void;
}) {
  const options = [
    { value: "breath-shoulders", label: "Boyun ve omuz" },
    { value: "back-knees-feet", label: "Bel ve sırt" },
    { value: "center-balance", label: "Denge" },
    { value: "whole-body", label: "Tüm beden" },
  ] as const;
  return (
    <div className={styles.bodyStage}>
      <div className={styles.bodyFigure}>
        <Image
          alt="Beden bölgeleri haritası"
          fill
          sizes="300px"
          src="/images/posture/posture-back-translucent.png"
        />
        {bodyFocusMarkers[value].map((marker, index) => (
          <i
            className={styles.bodyFocusMarker}
            key={`${value}-${index}`}
            style={{
              "--marker-height": `${marker.height ?? 9}%`,
              "--marker-left": `${marker.x}%`,
              "--marker-top": `${marker.y}%`,
              "--marker-width": `${marker.width ?? 9}%`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className={styles.bodyOptions} role="radiogroup">
        {options.map((option) => (
          <button
            aria-checked={value === option.value}
            className={
              value === option.value
                ? styles.bodyOptionActive
                : styles.bodyOption
            }
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            <span>{option.label}</span>
            <b>{value === option.value ? "✓" : ""}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

function PreferencesStep({
  profile,
  patch,
}: {
  profile: OnboardingProfile;
  patch: <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
  ) => void;
}) {
  const experience = [
    { value: "none", label: "İlk kez" },
    { value: "some", label: "Biraz deneyimim var" },
    { value: "regular", label: "Düzenli çalışıyorum" },
  ] as const;
  const time = [
    { value: "1-5", label: "5 dk" },
    { value: "5-15", label: "10 dk" },
    { value: "15-plus", label: "15 dk" },
  ] as const;
  return (
    <div className={styles.preferences}>
      <span>Deneyimin</span>
      <div className={styles.segments}>
        {experience.map((item) => (
          <button
            aria-pressed={profile.experienceLevel === item.value}
            className={
              profile.experienceLevel === item.value
                ? styles.segmentActive
                : styles.segment
            }
            key={item.value}
            onClick={() =>
              patch("experienceLevel", item.value as ExperienceLevel)
            }
            type="button"
          >
            {item.label}
            {profile.experienceLevel === item.value ? <b>✓</b> : null}
          </button>
        ))}
      </div>
      <span>Günlük ayırabileceğin süre</span>
      <div className={styles.segments}>
        {time.map((item) => (
          <button
            aria-pressed={profile.standingCapacity === item.value}
            className={
              profile.standingCapacity === item.value
                ? styles.segmentActive
                : styles.segment
            }
            key={item.value}
            onClick={() =>
              patch("standingCapacity", item.value as StandingCapacity)
            }
            type="button"
          >
            {item.label}
            {profile.standingCapacity === item.value ? <b>✓</b> : null}
          </button>
        ))}
      </div>
      <span>Hareket ederken sana ne iyi gelir?</span>
      <div className={styles.segments}>
        {([
          { value: "free-standing", label: "Rahatça ayakta" },
          { value: "gentle-range", label: "Küçük hareketlerle" },
          { value: "supported", label: "Destek yakınımda" },
        ] as const).map((item) => (
          <button
            aria-pressed={profile.movementSupport === item.value}
            className={profile.movementSupport === item.value ? styles.segmentActive : styles.segment}
            key={item.value}
            onClick={() => patch("movementSupport", item.value as MovementSupport)}
            type="button"
          >
            {item.label}
            {profile.movementSupport === item.value ? <b>✓</b> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function PracticeSetupStep({
  profile,
  patch,
}: {
  profile: OnboardingProfile;
  patch: <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => void;
}) {
  return (
    <div className={styles.setupStage}>
      <div className={styles.setupPreview}>
        <Image
          alt="Tai Chi başlangıç duruşu"
          fill
          sizes="(min-width: 900px) 34vw, 100vw"
          src="/images/posture/posture-neutral-front-v2.jpg"
        />
        <span><b>İlk küçük başarı</b>Ayaklarını rahatça yerleştir, dizlerini kilitleme ve üç doğal nefes al.</span>
      </div>
      <div className={styles.setupList}>
        <span><b>01</b><i>İki adımlık boş alan</i><small>Özel ekipman gerekmiyor.</small></span>
        <span><b>02</b><i>Rahat kıyafet</i><small>Ayakkabı zorunlu değil.</small></span>
        <span><b>03</b><i>Kamera isteğe bağlı</i><small>İlk pratiğe kamerayı açmadan da başlayabilirsin.</small></span>
        <button
          className={styles.supportToggle}
          onClick={() => patch("movementSupport", profile.movementSupport === "supported" ? "gentle-range" : "supported")}
          type="button"
        >
          <span>Yakınımda sandalye veya duvar olsun</span>
          <b>{profile.movementSupport === "supported" ? "Açık" : "Kapalı"}</b>
        </button>
        <p>Ağrı veya baş dönmesi hissedersen dur. Bu deneyim tıbbi değerlendirme yerine geçmez.</p>
      </div>
    </div>
  );
}

function OptionList<T extends string>({
  onSelect,
  options,
  selected,
}: {
  onSelect: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string; note: string }>;
  selected: T;
}) {
  return (
    <div className={styles.options} role="radiogroup">
      {options.map((option, index) => (
        <button
          aria-checked={selected === option.value}
          className={
            selected === option.value ? styles.optionActive : styles.option
          }
          key={option.value}
          onClick={() => onSelect(option.value)}
          role="radio"
          type="button"
        >
          <i>{String(index + 1).padStart(2, "0")}</i>
          <span>
            <strong>{option.label}</strong>
            <small>{option.note}</small>
          </span>
          <b aria-hidden="true">{selected === option.value ? "✓" : ""}</b>
        </button>
      ))}
    </div>
  );
}

function ResultStep({
  musicState,
  onToggleMusic,
  plan,
  result,
  visual,
}: {
  musicState: "kapalı" | "açık";
  onToggleMusic: () => void;
  plan: ReturnType<typeof createFirstJourneyPlan>;
  result: (typeof onboardingShenResults)[ShenId];
  visual: { accent: string; image: string };
}) {
  return (
    <article className={styles.result}>
      <Image
        alt={`${result.mode} atmosferi`}
        fill
        priority
        sizes="(min-width: 900px) 58vw, 100vw"
        src={visual.image}
      />
      <span className={styles.resultShade} />
      <div className={styles.resultContent}>
        <small>
          {result.mode} · {plan.focuses[0]}
        </small>
        <h2>Bugün sana {result.name} eşlik edecek.</h2>
        <p>
          {plan.reasonSummary}
        </p>
        <div className={styles.firstWeek} aria-label="İlk 7 gün planı">
          <strong>İlk 7 günün</strong>
          <span><b>Bugün</b><i>Temel duruş + 3 doğal nefes</i><small>5 dk</small></span>
          <span><b>3. gün</b><i>İki hareketi birbirine bağla</i><small>{Math.min(plan.dailyMinutes, 10)} dk</small></span>
          <span><b>7. gün</b><i>Kısa akış + beden kontrolü</i><small>{plan.dailyMinutes} dk</small></span>
        </div>
        <button
          aria-label={`Müziği ${musicState === "açık" ? "kapat" : "aç"}`}
          aria-pressed={musicState === "açık"}
          className={styles.music}
          onClick={onToggleMusic}
          type="button"
        >
          <i aria-hidden="true">♪</i>
          <span>
            <b>
              {result.name} müziği {musicState === "açık" ? "çalıyor" : "duraklatıldı"}
            </b>
            <small>Ana sayfada kesintisiz devam eder</small>
          </span>
          <strong>{musicState === "açık" ? "Ⅱ" : "▶"}</strong>
        </button>
      </div>
    </article>
  );
}
