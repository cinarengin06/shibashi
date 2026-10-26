import { uniqueMovementOrders } from "@/packages/eight-gates";
import type { JourneyRecord } from "@/packages/gamification";

const key = (userId?: string) => `shibashi-completed-movements-v1:${userId || "guest"}`;
const recordKey = (userId?: string) => `shibashi-completed-movement-records-v1:${userId || "guest"}`;
export const movementCompletionEvent = "shibashi-movement-completed";

export function loadMovementCompletionRecords(userId?: string): JourneyRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(recordKey(userId)) ?? "[]");
    return Array.isArray(value) ? value.filter((record): record is JourneyRecord => Number.isInteger(record?.order) && record.order >= 1 && record.order <= 18 && typeof record.date === "string") : [];
  } catch { return []; }
}

export function loadCompletedMovements(userId?: string): number[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key(userId)) ?? "[]");
    return Array.isArray(parsed) ? uniqueMovementOrders(parsed.filter((value): value is number => typeof value === "number")) : [];
  } catch { return []; }
}

export function markMovementCompleted(order: number, userId?: string): number[] {
  const previous = loadCompletedMovements(userId);
  const next = uniqueMovementOrders([...previous, order]);
  if (next.length !== previous.length) {
    window.localStorage.setItem(key(userId), JSON.stringify(next));
    window.localStorage.setItem(recordKey(userId), JSON.stringify([...loadMovementCompletionRecords(userId), {order,date:new Date().toISOString()}]));
    window.dispatchEvent(new Event(movementCompletionEvent));
  }
  return next;
}
