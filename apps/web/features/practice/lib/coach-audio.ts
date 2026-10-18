import type { AiCoach } from "@/features/practice/data/coaches";

export type CoachCueName = "align" | "calibration" | "ok" | "soft" | "start";

export function speakCoach(text: string, voiceProfile?: Pick<AiCoach, "pitch" | "rate">, retryIfVoicesLoad = true) {
  if (!("speechSynthesis" in window)) return;

  const currentVoices = window.speechSynthesis.getVoices();
  if (!currentVoices.length && retryIfVoicesLoad) {
    window.setTimeout(() => speakCoach(text, voiceProfile, false), 320);
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  const preferredVoice = getBestCoachVoice();

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.lang = preferredVoice?.lang ?? "tr-TR";
  utterance.pitch = voiceProfile?.pitch ?? 1.02;
  utterance.rate = voiceProfile?.rate ?? (preferredVoice?.lang.toLocaleLowerCase("tr-TR").startsWith("tr") ? 0.94 : 0.88);
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export function styleCoachCue(text: string, coach: AiCoach): string {
  const normalized = text.trim();
  const lead = coach.styleLead.trim();
  const close = coach.styleClose.trim();
  const withLead = normalized.startsWith(lead) ? normalized : `${lead} ${normalized}`;

  return withLead.endsWith(close) ? withLead : `${withLead} ${close}`;
}

export function getCoachSilenceMs(coach: AiCoach, name: CoachCueName): number {
  const cuePause = name === "ok" ? 2400 : name === "start" || name === "calibration" ? 1800 : 900;

  return Math.max(5600, Math.round(coach.cadenceMs * 0.45) + cuePause);
}

export function speakCoachCue(text: string, coach: AiCoach): Promise<void> {
  if (!("speechSynthesis" in window)) return Promise.resolve();

  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      window.setTimeout(() => {
        void speakCoachCue(text, coach).then(resolve);
      }, 320);
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    const preferredVoice = getBestCoachVoice();

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.lang = preferredVoice?.lang ?? "tr-TR";
    utterance.pitch = coach.pitch;
    utterance.rate = coach.rate;
    utterance.volume = 1;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    window.setTimeout(finish, Math.min(12000, Math.max(4200, text.length * 95)));
  });
}

function getBestCoachVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();

  return voices
    .map((voice) => ({ score: scoreCoachVoice(voice), voice }))
    .sort((first, second) => second.score - first.score)[0]?.voice;
}

function scoreCoachVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLocaleLowerCase("tr-TR");
  const lang = voice.lang.toLocaleLowerCase("tr-TR");
  let score = 0;

  if (lang.startsWith("tr")) score += 120;
  if (voice.localService) score += 18;
  if (/google|microsoft|apple|siri|enhanced|premium|natural|neural|online/.test(name)) score += 35;
  if (/yelda|eda|seda|zeynep|filiz|emel|ayşe|female|woman|samantha|victoria|zira|susan|aria|jenny/.test(name)) score += 28;
  if (/compact|low quality|robot|espeak|basic/.test(name)) score -= 45;
  if (!lang.startsWith("tr") && /en-us|en-gb/.test(lang)) score += 8;

  return score;
}
