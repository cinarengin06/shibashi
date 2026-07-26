import Image from "next/image";
import Link from "next/link";
import type { LivingStory } from "@/data/livingStories";
import styles from "./StoryCard.module.css";

type StoryCardProps = {
  story: LivingStory;
};

export function StoryCard({ story }: StoryCardProps) {
  return (
    <article className={styles.card} id={story.id}>
      <div className={styles.visual}>
        <Image
          alt={`${story.title} hikâye sahnesi`}
          className={styles.image}
          fill
          priority={story.order === 1}
          sizes="(max-width: 900px) 100vw, 58vw"
          src={story.image}
        />
        <div className={styles.imageShade} />
        <div className={styles.badges}>
          <span>Bölüm {String(story.order).padStart(2, "0")}</span>
          <span>{story.duration}</span>
        </div>
        <div className={styles.visualCopy}>
          <p>{story.subtitle}</p>
          <h2>{story.title}</h2>
          <strong>{story.movementLabel}</strong>
        </div>
      </div>

      <div className={styles.content}>
        <div>
          <p className={styles.eyebrow}>Hikâyenin hareketi</p>
          <blockquote>“{story.quote}”</blockquote>
          <p className={styles.description}>{story.description}</p>
        </div>

        <ol className={styles.steps}>
          {story.steps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>

        <div className={styles.ambience}>
          <span>Ambiyans</span>
          <div>
            {story.ambience.map((item) => (
              <small key={item}>{item}</small>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button aria-label={`${story.title} hikâyesini oynat`} type="button">
            <span>▶</span> Hikâyeyi İzle
          </button>
          <Link href={story.practiceHref}>Kendim Dene →</Link>
        </div>
      </div>
    </article>
  );
}
