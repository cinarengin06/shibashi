"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  createFirstJourneyPlan,
  emptyOnboardingProfile,
  onboardingShenResults,
  onboardingStages,
  profileQuestions,
  type BodyFocus,
  type ExperienceLevel,
  type OnboardingProfile,
  type OnboardingProgress,
  type PracticeIntention,
} from "@/packages/onboarding";
import styles from "./premium-onboarding.module.css";

const STORAGE_KEY = "shibashi-onboarding-v6";
const RESULT_KEY = "shibashi-onboarding-result-v6";
type ShenId = ReturnType<typeof createFirstJourneyPlan>["recommendedShen"];

const shenVisuals: Record<ShenId, { accent: string; image: string }> = {
  hun: { accent: "#91A867", image: "/images/shen-river-hun.jpg" },
  shen: { accent: "#D1AE68", image: "/images/shen-river-shen.jpg" },
  yi: { accent: "#C7BFAE", image: "/images/shen-river-po.jpg" },
  po: { accent: "#B69268", image: "/images/shen-river-yi.jpg" },
  zhi: { accent: "#688AA1", image: "/images/shen-river-zhi.jpg" },
};

type Props = {
  embedded?: boolean;
  musicState?: "kapalı" | "açık";
  onComplete?: (profile: OnboardingProfile) => void;
  onShenRevealed?: (shenId: ShenId) => void;
  onToggleMusic?: () => void;
};

export function PremiumOnboarding({ embedded = false, musicState = "kapalı", onComplete, onShenRevealed, onToggleMusic }: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(emptyOnboardingProfile);
  const [hydrated, setHydrated] = useState(false);
  const stage = onboardingStages[step];
  const plan = useMemo(() => createFirstJourneyPlan(profile), [profile]);
  const result = onboardingShenResults[plan.recommendedShen];
  const visual = shenVisuals[plan.recommendedShen];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as OnboardingProgress;
        if (saved.version === 6 && saved.stage !== "completed") {
          const index = onboardingStages.findIndex((item) => item.id === saved.stage);
          if (index >= 0) setStep(index);
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
    const progress: OnboardingProgress = { version: 6, stage: onboardingStages[step]?.id ?? "completed", profile, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, profile, step]);

  const patch = <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => setProfile((current) => ({ ...current, [key]: value }));
  const canContinue = step !== 0 || profile.name.trim().length >= 2;
  const next = () => {
    if (step === 3) {
      onShenRevealed?.(plan.recommendedShen);
      setStep(4);
      return;
    }
    if (step === 4) {
      const completeProfile = { ...profile, name: profile.name.trim(), firstJourneyPlan: plan };
      const completed: OnboardingProgress = { version: 6, stage: "completed", profile: completeProfile, updatedAt: new Date().toISOString() };
      localStorage.setItem(RESULT_KEY, JSON.stringify(completeProfile));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
      localStorage.setItem("ritim-kapisi-onboarding-profile", JSON.stringify(completeProfile));
      onComplete?.(completeProfile);
      return;
    }
    setStep((value) => Math.min(4, value + 1));
  };

  if (!hydrated) return null;
  return (
    <main className={`${styles.root} ${embedded ? styles.embedded : ""}`} style={{ "--onboarding-accent": step === 4 ? visual.accent : "#C6A56A" } as CSSProperties}>
      <div className={styles.ambient} />
      <header className={styles.header}>
        <button aria-label="Önceki soru" className={styles.back} disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} type="button">←</button>
        <div className={styles.brand}><span>SHIBASHI EFE</span><small>{step < 4 ? `${step + 1} / 4` : "SENİN RİTMİN"}</small></div>
        <div className={styles.progress} aria-label={`${Math.min(step + 1, 4)} / 4 tamamlandı`}>{onboardingStages.slice(0, 4).map((item, index) => <i className={index <= step ? styles.progressActive : ""} key={item.id} />)}</div>
      </header>

      <section className={styles.shell} key={stage.id}>
        <div className={styles.copy}>
          <span className={styles.kicker}>{step < 4 ? `SORU ${step + 1}` : "KISA TESTİN TAMAMLANDI"}</span>
          <h1>{stage.title}</h1>
          <p>{step === 0 ? "Burada doğru cevap yok. Seni zorlamayan, sana ait bir başlangıç hazırlamak için dört kısa sorumuz var." : step === 1 ? "Daha önce hiç yapmamış olman sorun değil. Başlangıcın hızını ve anlatım dilini buna göre ayarlayacağız." : step === 2 ? "İnsanlar harekete farklı nedenlerle başlar. Sana gerçekten anlamlı gelen nedeni seç." : step === 3 ? "Bir rahatsızlık teşhisi koymuyoruz; yalnızca ilk pratikte hangi bölgeye daha nazik yaklaşacağımızı seçiyoruz." : `${profile.name || "Sen"}, cevapların bize bugün nasıl bir ritme ihtiyaç duyduğunu gösterdi.`}</p>
        </div>

        <div className={styles.stage}>
          {step === 0 ? <NameStep name={profile.name} onChange={(value) => patch("name", value)} /> : null}
          {step === 1 ? <ExperienceStep value={profile.experienceLevel} onChange={(value) => patch("experienceLevel", value)} /> : null}
          {step === 2 ? <IntentionStep value={profile.practiceIntention} onChange={(value) => patch("practiceIntention", value)} /> : null}
          {step === 3 ? <BodyFocusStep value={profile.bodyFocus} onChange={(value) => patch("bodyFocus", value)} /> : null}
          {step === 4 ? <ResultStep musicState={musicState} onToggleMusic={onToggleMusic} plan={plan} result={result} visual={visual} /> : null}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>{step === 4 ? "Bu bir etiket değil; bugün sana iyi gelebilecek başlangıç noktası." : "Yanıtlarını daha sonra profilinden değiştirebilirsin."}</span>
        <button className={styles.primary} disabled={!canContinue} onClick={next} type="button">{step === 4 ? "Ana sayfama geç" : step === 3 ? "Ritmimi bul" : "Devam"}<b aria-hidden="true">→</b></button>
      </footer>
    </main>
  );
}

function NameStep({ name, onChange }: { name: string; onChange: (value: string) => void }) {
  return <div className={styles.nameStage}><div className={styles.welcomeImage}><Image alt="Sakin bir doğa ortamında Tai Chi pratiği" fill priority sizes="(min-width: 900px) 52vw, 100vw" src="/images/living-learning/curtains-opening.png" /><span>İlk adımın kusursuz olmak değil, kendine yer açmak.</span></div><label><span>Adın</span><input autoComplete="given-name" autoFocus maxLength={40} onChange={(event) => onChange(event.target.value)} placeholder="Sana nasıl seslenelim?" value={name} /></label></div>;
}

function ExperienceStep({ value, onChange }: { value: ExperienceLevel; onChange: (value: ExperienceLevel) => void }) {
  const options = [{ value: "none", label: "Yeni başlıyorum", note: "Daha önce denemedim veya çok az denedim" }, { value: "some", label: "Biraz deneyimim var", note: "Birkaç ders ya da benzer hareket çalışmaları yaptım" }, { value: "regular", label: "Düzenli çalıştım", note: "Temel akışlara ve beden farkındalığına aşinayım" }] as const;
  return <OptionList options={options} selected={value} onSelect={onChange} />;
}

function IntentionStep({ value, onChange }: { value: PracticeIntention; onChange: (value: PracticeIntention) => void }) {
  return <OptionList options={profileQuestions.intention} selected={value} onSelect={onChange} />;
}

function BodyFocusStep({ value, onChange }: { value: BodyFocus; onChange: (value: BodyFocus) => void }) {
  return <OptionList options={profileQuestions.bodyFocus} selected={value} onSelect={onChange} />;
}

function OptionList<T extends string>({ onSelect, options, selected }: { onSelect: (value: T) => void; options: ReadonlyArray<{ value: T; label: string; note: string }>; selected: T }) {
  return <div className={styles.options} role="radiogroup">{options.map((option, index) => <button aria-checked={selected === option.value} className={selected === option.value ? styles.optionActive : styles.option} key={option.value} onClick={() => onSelect(option.value)} role="radio" type="button"><i>{String(index + 1).padStart(2, "0")}</i><span><strong>{option.label}</strong><small>{option.note}</small></span><b aria-hidden="true">{selected === option.value ? "✓" : ""}</b></button>)}</div>;
}

function ResultStep({ musicState, onToggleMusic, plan, result, visual }: { musicState: "kapalı" | "açık"; onToggleMusic?: () => void; plan: ReturnType<typeof createFirstJourneyPlan>; result: (typeof onboardingShenResults)[ShenId]; visual: { accent: string; image: string } }) {
  return <article className={styles.result}><Image alt={`${result.mode} atmosferi`} fill priority sizes="(min-width: 900px) 52vw, 100vw" src={visual.image} /><span className={styles.resultShade} /><div className={styles.resultContent}><div className={styles.resultSymbol}>{result.symbol}</div><small>{result.mode}</small><h2>{result.title}</h2><p>{result.description}</p><div className={styles.resultPlan}><span><b>{plan.dailyMinutes} dk</b> başlangıç pratiği</span><span><b>{plan.movementIds.length}</b> temel hareket</span></div><button aria-label={`Müziği ${musicState === "açık" ? "kapat" : "aç"}`} aria-pressed={musicState === "açık"} className={styles.music} onClick={onToggleMusic} type="button"><i aria-hidden="true">{musicState === "açık" ? "♪" : "♪̸"}</i><span><b>{musicState === "açık" ? "Ritmin çalıyor" : "Ritmini dinle"}</b><small>Ana sayfada kesintisiz devam eder</small></span></button></div></article>;
}
