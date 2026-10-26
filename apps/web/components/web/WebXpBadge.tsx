"use client";

import Link from "next/link";
import { useShibashiAuth } from "@/lib/supabase-auth";
import { useJourneyXp } from "@/lib/use-journey-xp";
import type { PracticeSnapshot } from "@/features/practice/types";
import styles from "./web-xp-badge.module.css";

export function WebXpBadge({ gallery }: { gallery?: PracticeSnapshot[] }) {
  const { user } = useShibashiAuth();
  const xp = useJourneyXp(user?.id, gallery);
  return <Link aria-label={xp === null ? "Yolculuk puanın yükleniyor. İstatistiklerine git" : `Toplam yolculuk puanın: ${xp} XP. İstatistiklerine git`} className={styles.badge} href="/?tab=journal" title="Toplam yolculuk puanın"><span aria-hidden="true">✦</span><strong>{xp ?? "—"}</strong><small>XP</small></Link>;
}
