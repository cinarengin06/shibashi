"use client";

import { useEffect, useState } from "react";
import { journeyRewards, type JourneyRecord } from "@/packages/gamification";
import type { PracticeSnapshot } from "@/features/practice/types";
import { isCapturedPracticePhoto } from "@/features/home/utils/practice-photo";
import { formStepsEvent, loadFormSteps } from "@/lib/form-steps";
import { loadCompletedMovements, loadMovementCompletionRecords, movementCompletionEvent } from "@/lib/movement-completion";
import { loadMovementPracticeRecords } from "@/lib/movement-practice";
import { loadPracticeSnapshotsFromIndexedDb } from "@/lib/local-history-storage";

export function useJourneyXp(userId?: string, gallery?: PracticeSnapshot[]) {
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setXp(null);
    const refresh = async () => {
      const photos = gallery ?? await loadPracticeSnapshotsFromIndexedDb().catch(() => [] as PracticeSnapshot[]);
      if (!active) return;
      const photoRecords: JourneyRecord[] = photos
        .filter((photo) => isCapturedPracticePhoto(photo.imageData))
        .map((photo) => ({ order: photo.movementId, date: photo.createdAt }));
      const completionRecords = loadMovementCompletionRecords(userId);
      const practiceRecords = [...loadMovementPracticeRecords(userId), ...photoRecords];
      const completedOrders = new Set([...loadCompletedMovements(userId), ...photoRecords.map((record) => record.order)]);
      setXp(journeyRewards(completedOrders, [...completionRecords, ...practiceRecords], loadFormSteps(userId), practiceRecords).xp);
    };
    void refresh();
    window.addEventListener(movementCompletionEvent, refresh);
    window.addEventListener(formStepsEvent, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener(movementCompletionEvent, refresh);
      window.removeEventListener(formStepsEvent, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [userId, gallery]);

  return xp;
}
