import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FormStep, FormSteps } from '../../../packages/gamification';

const key = (userId?: string) => `shibashi-form-steps-v1:${userId || 'guest'}`;
const listeners = new Set<() => void>();
export function subscribeFormSteps(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export async function loadFormSteps(userId?: string): Promise<FormSteps> {
  try { const value: unknown = JSON.parse(await AsyncStorage.getItem(key(userId)) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value as FormSteps : {}; }
  catch { return {}; }
}
export async function markFormStep(order: number, step: FormStep, userId?: string): Promise<FormSteps> {
  const current = await loadFormSteps(userId);
  if (!Number.isInteger(order) || order < 1 || order > 18 || current[order]?.[step]) return current;
  const next = { ...current, [order]: { ...current[order], [step]: true } };
  await AsyncStorage.setItem(key(userId), JSON.stringify(next));
  listeners.forEach(listener => listener());
  return next;
}
