import AsyncStorage from '@react-native-async-storage/async-storage';
import { uniqueMovementOrders } from '../../../packages/eight-gates';

const key = (userId?: string) => `shibashi-completed-movements-v1:${userId || 'guest'}`;

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
  if (next.length !== previous.length) await AsyncStorage.setItem(key(userId), JSON.stringify(next));
  return next;
}
