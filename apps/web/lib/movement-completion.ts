import { uniqueMovementOrders } from "@/packages/eight-gates";

const key = (userId?: string) => `shibashi-completed-movements-v1:${userId || "guest"}`;
export const movementCompletionEvent = "shibashi-movement-completed";

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
    window.dispatchEvent(new Event(movementCompletionEvent));
  }
  return next;
}
