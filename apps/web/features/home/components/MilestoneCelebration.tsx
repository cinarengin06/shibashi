"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { milestoneDefinitions, personalMilestones, type FormRecord } from "@/packages/gamification";
import { unlockMilestones } from "@/lib/milestones";
import styles from "./milestone-celebration.module.css";

export function MilestoneCelebration({ records, postureCount, userId }: { records: FormRecord[]; postureCount: number; userId?: string }) {
  const [pending, setPending] = useState<string[]>([]);
  const earnedIds = personalMilestones(records, postureCount).filter((item) => item.earned).map((item) => item.id).join(",");
  useEffect(() => {
    const unlocked = unlockMilestones(earnedIds ? earnedIds.split(",") : [], userId);
    if (unlocked.length) setPending((current) => [...current, ...unlocked.map((item) => item.id)]);
  }, [earnedIds, userId]);
  const current = milestoneDefinitions.find((item) => item.id === pending[0]);
  if (!current) return null;
  return <div className={styles.backdrop} role="presentation"><section aria-label="Yeni Shibashi rozeti" aria-modal="true" className={styles.dialog} role="dialog"><div aria-hidden="true" className={styles.glow}>✧</div><span className={styles.eyebrow}>YENİ ROZET KAZANDIN</span><div aria-hidden="true" className={styles.icon}>{current.icon}</div><h2>{current.title}</h2><p>{current.message}</p><div className={styles.actions}><button onClick={() => setPending((items) => items.slice(1))} type="button">Devam et</button><Link href="/?tab=journal" onClick={() => setPending((items) => items.slice(1))}>Kayıtlarımda gör →</Link></div></section></div>;
}
