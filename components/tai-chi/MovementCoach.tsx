"use client";

import { useCallback, useRef, useState } from "react";
import { PoseCamera } from "@/components/tai-chi/PoseCamera";
import { createRaiseArmsEvaluator } from "@/lib/pose/raiseArmsEvaluator";
import type { PoseEvaluation, PoseLandmark, ScoreBreakdown } from "@/types/pose";

const WARNING_COOLDOWN_MS = 4000;

const STAGE_LABELS: Record<PoseEvaluation["stage"], string> = {
  CAMERA_OFF: "Kamera Kapalı",
  FIND_BODY: "Bedeni Bul",
  READY_POSITION: "Hazırlık",
  RAISING: "Kolları Yükselt",
  HOLDING: "Omuz Hizasını Koru",
  LOWERING: "Kolları İndir",
  COMPLETED: "Tamamlandı",
};

const SCORE_LABELS: Array<[keyof ScoreBreakdown, string, string]> = [
  ["symmetry", "Simetri", "◇"],
  ["armHeight", "Kol Yüksekliği", "↥"],
  ["softElbows", "Dirsek Yumuşaklığı", "⌁"],
  ["torsoStability", "Gövde Dengesi", "⌖"],
  ["tempo", "Tempo", "◴"],
];

const STAGE_FLOW: PoseEvaluation["stage"][] = [
  "FIND_BODY",
  "READY_POSITION",
  "RAISING",
  "HOLDING",
  "LOWERING",
  "COMPLETED",
];

const initialEvaluation: PoseEvaluation = {
  stage: "CAMERA_OFF",
  instruction: "Kamerayı açarak ilk harekete başla.",
  liveScore: null,
  finalScore: null,
  holdRemainingSeconds: null,
  scores: { symmetry: 0, armHeight: 0, softElbows: 0, torsoStability: 0, tempo: 0 },
  jointStatus: {},
  stateChanged: false,
  hasPose: false,
};

export function MovementCoach() {
  const evaluatorRef = useRef(createRaiseArmsEvaluator());
  const [evaluation, setEvaluation] = useState<PoseEvaluation>(initialEvaluation);
  const lastSpeechRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  const speak = useCallback((text: string, force = false) => {
    if (!("speechSynthesis" in window)) return;
    const now = Date.now();
    const isDuplicate = lastSpeechRef.current.text === text && now - lastSpeechRef.current.at < WARNING_COOLDOWN_MS;
    if (!force && isDuplicate) return;
    if (force) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    lastSpeechRef.current = { text, at: now };
  }, []);

  const onLandmarks = useCallback((landmarks: PoseLandmark[] | null, timestamp: number) => {
    const next = evaluatorRef.current.update(landmarks, timestamp);
    setEvaluation((current) => {
      const same = current.stage === next.stage &&
        current.instruction === next.instruction &&
        current.liveScore === next.liveScore &&
        current.finalScore === next.finalScore &&
        current.holdRemainingSeconds === next.holdRemainingSeconds &&
        JSON.stringify(current.scores) === JSON.stringify(next.scores) &&
        JSON.stringify(current.jointStatus) === JSON.stringify(next.jointStatus);
      return same ? current : next;
    });
    if (next.speech) speak(next.speech, next.stateChanged);
  }, [speak]);

  const onCameraClosed = useCallback(() => {
    window.speechSynthesis?.cancel();
    setEvaluation(evaluatorRef.current.cameraOff());
  }, []);

  const reset = useCallback(() => {
    window.speechSynthesis?.cancel();
    const next = evaluatorRef.current.reset();
    setEvaluation(next);
    speak("Tekrar deneyelim. Tüm bedenini kadraja al.", true);
  }, [speak]);

  const displayScore = evaluation.finalScore ?? evaluation.liveScore;
  const activeStageIndex = STAGE_FLOW.indexOf(evaluation.stage);

  return (
    <div className="tc-coach">
      <div className="tc-camera-wrap">
        <PoseCamera
          jointStatus={evaluation.jointStatus}
          onCameraClosed={onCameraClosed}
          onLandmarks={onLandmarks}
        />
        <div className="tc-command" aria-live="polite">{evaluation.instruction}</div>
        <div className="tc-stage-chip">{STAGE_LABELS[evaluation.stage]}</div>
        <div className="tc-live-score">
          <strong>{displayScore ?? "—"}</strong>
          <span>{evaluation.finalScore !== null ? "/100 sonuç" : "/100 uyum"}</span>
        </div>
        {evaluation.holdRemainingSeconds !== null ? (
          <div className="tc-hold-countdown">{evaluation.holdRemainingSeconds}</div>
        ) : null}
      </div>

      <div className="tc-stage-flow" aria-label="Hareket aşamaları">
        {STAGE_FLOW.map((stage, index) => {
          const isDone = activeStageIndex > index || evaluation.stage === "COMPLETED";
          const isActive = activeStageIndex === index;
          return (
            <div className={`tc-stage-step ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`} key={stage}>
              <i>{isDone ? "✓" : index + 1}</i>
              <span>{STAGE_LABELS[stage]}</span>
            </div>
          );
        })}
      </div>

      <div className="tc-score-grid">
        {SCORE_LABELS.map(([key, label, icon]) => (
          <div className={evaluation.stage === "COMPLETED" ? "tc-score-card tc-score-card-complete" : "tc-score-card"} key={key}>
            <div className="tc-score-head"><i>{icon}</i><span>{label}</span></div>
            <strong>{evaluation.scores[key] ? `${evaluation.scores[key]}%` : "—"}</strong>
            <div className="tc-score-track"><i style={{ width: `${evaluation.scores[key]}%` }} /></div>
          </div>
        ))}
      </div>

      {evaluation.stage === "COMPLETED" ? (
        <div className="tc-complete-card">
          <span>Hareket tamamlandı</span>
          <strong>{evaluation.finalScore}/100</strong>
          <button className="tc-primary-button" onClick={reset} type="button">Tekrar Dene</button>
        </div>
      ) : null}

      <p className="tc-privacy-note">Görüntü kaydedilmez veya sunucuya gönderilmez. Analiz tamamen bu tarayıcıda yapılır.</p>
    </div>
  );
}
