import styles from "./living-learning.module.css";

export function LiveFeedbackCard({ feedback, score }: { feedback: string; score: number | null }) {
  return <div className={styles.liveFeedback}><span>{score === null ? "Tam beden bekleniyor" : `Uyum · ${score}`}</span><strong>{feedback}</strong></div>;
}
