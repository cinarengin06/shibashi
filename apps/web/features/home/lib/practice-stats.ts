import type { ShenActivity } from "@/packages/shen-domain";
import type { PracticeSnapshot } from "@/features/practice/types";

export type RecordedPractice = { id: string; createdAt: string; movementId?: number };

const legacySessionWindowMs = 45_000;

export function localDayKey(value: string | Date): string | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function recordedPractices(photos: PracticeSnapshot[], activities: ShenActivity[]): RecordedPractice[] {
  const sessions = new Map<string, RecordedPractice>();
  const lastLegacyByMovement = new Map<number, { id: string; time: number }>();
  const photoActivityIds = new Set<string>();

  [...photos].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).forEach((photo) => {
    const time = Date.parse(photo.createdAt);
    if (!Number.isFinite(time) || !Number.isInteger(photo.movementId)) return;
    photoActivityIds.add(`activity-${photo.id}`);
    let id = photo.sessionId?.trim();
    if (!id && photo.id.startsWith("shibashi18-")) {
      const previous = lastLegacyByMovement.get(photo.movementId);
      id = previous && time - previous.time <= legacySessionWindowMs
        ? previous.id
        : `legacy-photo-${photo.id}`;
      lastLegacyByMovement.set(photo.movementId, { id, time });
    }
    if (!id) id = `record-${photo.id}`;
    if (!sessions.has(id)) sessions.set(id, { id, createdAt: photo.createdAt, movementId: photo.movementId });
  });

  activities.forEach((activity) => {
    if (activity.type !== "practice" || activity.completed === false || !localDayKey(activity.createdAt)) return;
    if (photoActivityIds.has(activity.id) || sessions.has(activity.id)) return;
    const activityTime = Date.parse(activity.createdAt);
    const movementId = Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1]);
    const matchesSavedSession = [...sessions.values()].some((session) =>
      Math.abs(Date.parse(session.createdAt) - activityTime) <= 10_000 &&
      (!Number.isInteger(movementId) || session.movementId === movementId),
    );
    if (matchesSavedSession) return;
    sessions.set(activity.id, { id: activity.id, createdAt: activity.createdAt });
  });

  return [...sessions.values()];
}

export function recentDates(now = new Date()): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
}
