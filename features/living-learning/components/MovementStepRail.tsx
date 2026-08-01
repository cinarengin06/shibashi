import type { LivingMovementStep } from "../../../packages/living-learning";
import styles from "./living-learning.module.css";

export function MovementStepRail({ steps, activeStepId }: { steps: readonly LivingMovementStep[]; activeStepId: string }) {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStepId));
  return (
    <aside className={styles.stepRail} aria-label="Hareket akışı">
      <p className={styles.eyebrow}>Hareket akışı</p>
      <h2>Beş sakin geçiş</h2>
      <ol>
        {steps.map((step, index) => (
          <li className={index === activeIndex ? styles.stepActive : index < activeIndex ? styles.stepDone : ""} key={step.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{step.title}</strong><small>{step.instruction}</small></div>
          </li>
        ))}
      </ol>
      <div className={styles.railBreath}>
        <i /><div><small>Şimdi</small><strong>{steps[activeIndex]?.breathingCue}</strong></div>
      </div>
    </aside>
  );
}
