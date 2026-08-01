import { getLivingPractice, type LivingPracticeResult } from "../../../packages/living-learning";
import styles from "./living-learning.module.css";

export function PracticeCompletion({ result, onSave, onRetry, onHome, saved }: { result: LivingPracticeResult; onSave: () => void; onRetry: () => void; onHome: () => void; saved: boolean }) {
  const practice = getLivingPractice(result.sceneId);
  return <section className={styles.completion}>
    <div className={styles.completionRing}><span>{result.movementScore}</span><small>/100</small></div>
    <p className={styles.eyebrow}>Akış tamamlandı</p><h2>{practice.title}</h2>
    <p className={styles.completionLead}>Hareketin ritmi ölçüldü. Bir sonraki çalışmada tek öneriyi yanında taşı.</p>
    <div className={styles.resultGrid}><article><small>Süre</small><strong>{result.durationSeconds} sn</strong></article><article><small>Hareket uyumu</small><strong>%{result.movementScore}</strong></article><article><small>Yönlendirilmiş nefes ritmi</small><strong>%{result.breathRhythmScore}</strong></article><article><small>En iyi bölüm</small><strong>{result.bestSection}</strong></article></div>
    <div className={styles.masterSentence}><small>Ustadan bir cümle</small><strong>“{result.masterSentence}”</strong><p>{result.improvement}</p></div>
    <div className={styles.completionActions}><button onClick={onSave} type="button">{saved ? "Pratik kaydedildi" : "Pratiği kaydet"}</button><button onClick={onRetry} type="button">Tekrar dene</button><button onClick={onHome} type="button">Ana sayfaya dön</button></div>
  </section>;
}
