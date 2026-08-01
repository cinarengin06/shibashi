import styles from "./living-learning.module.css";

export function LiveFeedbackCard({ feedback, score, samples }: { feedback: string; score: number | null; samples: number }) {
  return <div className={styles.liveFeedback}><span>{score === null ? "Tam beden bekleniyor" : `Canlı uyum · ${score}`}</span><strong>{feedback}</strong>{samples > 0 ? <small>{samples} gerçek poz karesi</small> : null}</div>;
}
