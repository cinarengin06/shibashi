import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EarnedMilestone } from '../../../packages/gamification';

const key = (userId?: string) => `shibashi-earned-milestones-v1:${userId || 'guest'}`;
const listeners = new Set<() => void>();
export function subscribeMilestones(listener:()=>void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export async function loadEarnedMilestones(userId?: string): Promise<EarnedMilestone[]> {
  try { const value: unknown = JSON.parse(await AsyncStorage.getItem(key(userId)) || '[]'); return Array.isArray(value) ? value.filter((item):item is EarnedMilestone => typeof item?.id === 'string' && typeof item?.earnedAt === 'string') : []; }
  catch { return []; }
}
export async function unlockMilestones(ids:string[], userId?:string):Promise<EarnedMilestone[]> {
  const current = await loadEarnedMilestones(userId);
  const known = new Set(current.map(item => item.id));
  const unlocked = ids.filter(id => !known.has(id)).map(id => ({id,earnedAt:new Date().toISOString()}));
  if (unlocked.length) { await AsyncStorage.setItem(key(userId),JSON.stringify([...current,...unlocked])); listeners.forEach(listener => listener()); }
  return unlocked;
}
