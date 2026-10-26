import AsyncStorage from '@react-native-async-storage/async-storage';
import { uniqueMovementOrders } from '../../../packages/eight-gates';
import type { JourneyRecord } from '../../../packages/gamification';

const key = (userId?: string) => `shibashi-completed-movements-v1:${userId || 'guest'}`;
const recordKey = (userId?: string) => `shibashi-completed-movement-records-v1:${userId || 'guest'}`;
const listeners = new Set<() => void>();
export function subscribeMovementCompletion(listener:()=>void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

export async function loadMovementCompletionRecords(userId?: string): Promise<JourneyRecord[]> {
  try {
    const value: unknown = JSON.parse(await AsyncStorage.getItem(recordKey(userId)) || '[]');
    return Array.isArray(value) ? value.filter((record): record is JourneyRecord => Number.isInteger(record?.order) && record.order >= 1 && record.order <= 18 && typeof record.date === 'string') : [];
  } catch { return []; }
}

export async function loadCompletedMovements(userId?: string): Promise<number[]> {
  try {
    const stored = await AsyncStorage.getItem(key(userId));
    const parsed: unknown = JSON.parse(stored ?? '[]');
    return Array.isArray(parsed) ? uniqueMovementOrders(parsed.filter((value): value is number => typeof value === 'number')) : [];
  } catch { return []; }
}

export async function markMovementCompleted(order: number, userId?: string): Promise<number[]> {
  const previous = await loadCompletedMovements(userId);
  const next = uniqueMovementOrders([...previous, order]);
  if (next.length !== previous.length) {
    await AsyncStorage.setItem(key(userId), JSON.stringify(next));
    const records = await loadMovementCompletionRecords(userId);
    await AsyncStorage.setItem(recordKey(userId), JSON.stringify([...records, {order,date:new Date().toISOString()}]));
    listeners.forEach(listener=>listener());
  }
  return next;
}
