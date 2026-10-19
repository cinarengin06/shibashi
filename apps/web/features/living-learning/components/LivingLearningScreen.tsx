"use client";

import { WebHeader } from "../../../components/web/WebHeader";
import { MeridianLivingExercise } from "./MeridianLivingExercise";
import styles from "./living-learning.module.css";

export function LivingLearningScreen({ embedded = false }: { embedded?: boolean }) {
  return (
    <main className={`${styles.page} ${embedded ? styles.embedded : ""}`}>
      {!embedded ? <WebHeader active="learning" /> : null}
      <div className={styles.shell}>
        <MeridianLivingExercise />
      </div>
    </main>
  );
}
