import type { LivingScene, LivingSceneId } from "../../../packages/living-learning";
import { livingSceneImages } from "../data/assets";
import styles from "./living-learning.module.css";

export function SceneSelector({ scenes, selectedId, onSelect }: { scenes: readonly LivingScene[]; selectedId: LivingSceneId; onSelect: (id: LivingSceneId) => void }) {
  return (
    <section className={styles.scenes}>
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Altı hareket · altı yaşam anı</p><h2>Her hareketin tek bir dünyası var.</h2></div><span>6 sinematik ortam · 6 canlı pratik</span></div>
      <div className={styles.sceneGrid}>
        {scenes.map((scene) => (
          <button className={`${styles.sceneCard} ${selectedId === scene.id ? styles.sceneSelected : ""}`} key={scene.id} onClick={() => onSelect(scene.id)} type="button">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={livingSceneImages[scene.id]} />
            <span className={styles.sceneShade} />
            <span className={styles.sceneState}>Canlı pratik</span>
            <span className={styles.sceneCopy}><small>{scene.subtitle}</small><strong>{scene.name}</strong><em>{scene.metaphor}</em></span>
          </button>
        ))}
      </div>
    </section>
  );
}
