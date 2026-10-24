import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

export type ShibashiPhoto = { id: string; uri: string; order: number; name: string; score: number; savedAt: string };
const storageKey = 'shibashi-18-photos-v1';
const directory = new Directory(Paths.document, 'shibashi-photos');
const listeners = new Set<() => void>();
export function subscribeShibashiPhotos(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function notifyPhotosChanged() { listeners.forEach(listener => listener()); }

export async function loadShibashiPhotos(): Promise<ShibashiPhoto[]> {
  try { return JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]') as ShibashiPhoto[]; }
  catch { return []; }
}

export async function saveShibashiPhoto(sourceUri: string, order: number, name: string, score: number) {
  directory.create({ idempotent: true, intermediates: true });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const target = new File(directory, `${id}.jpg`);
  await new File(sourceUri).copy(target);
  const photo: ShibashiPhoto = { id, uri: target.uri, order, name, score, savedAt: new Date().toISOString() };
  const current = await loadShibashiPhotos();
  await AsyncStorage.setItem(storageKey, JSON.stringify([photo, ...current]));
  notifyPhotosChanged();
  return photo;
}

export async function deleteShibashiPhoto(id: string) {
  const current = await loadShibashiPhotos();
  const photo = current.find(item => item.id === id);
  if (!photo) return current;
  const next = current.filter(item => item.id !== id);
  await AsyncStorage.setItem(storageKey, JSON.stringify(next));
  notifyPhotosChanged();
  try { const file = new File(photo.uri); if (file.exists) file.delete(); } catch { /* metadata is already removed */ }
  return next;
}
