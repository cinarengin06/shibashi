import type { EarnedMilestone } from "@/packages/gamification";

const key = (userId?: string) => `shibashi-earned-milestones-v1:${userId || "guest"}`;
export const milestonesChangedEvent = "shibashi-milestones-changed";
export function loadEarnedMilestones(userId?: string): EarnedMilestone[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(userId)) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is EarnedMilestone => typeof item?.id === "string" && typeof item?.earnedAt === "string") : [];
  } catch { return []; }
}
export function unlockMilestones(ids: string[], userId?: string): EarnedMilestone[] {
  const current = loadEarnedMilestones(userId);
  const known = new Set(current.map((item) => item.id));
  const unlocked = ids.filter((id) => !known.has(id)).map((id) => ({ id, earnedAt: new Date().toISOString() }));
  if (unlocked.length) {
    localStorage.setItem(key(userId), JSON.stringify([...current, ...unlocked]));
    window.dispatchEvent(new Event(milestonesChangedEvent));
  }
  return unlocked;
}
