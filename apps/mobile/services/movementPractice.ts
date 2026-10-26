import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateKey, type JourneyRecord } from '../../../packages/gamification';

const key = (userId?:string) => `shibashi-form-practice-days-v1:${userId||'guest'}`;

export async function loadMovementPracticeRecords(userId?:string):Promise<JourneyRecord[]> {
  try { const value:unknown=JSON.parse(await AsyncStorage.getItem(key(userId))||'[]'); return Array.isArray(value)?value.filter((item):item is JourneyRecord=>Number.isInteger(item?.order)&&item.order>=1&&item.order<=18&&typeof item.date==='string'):[]; }
  catch { return []; }
}

export async function markMovementPracticed(order:number,userId?:string,date=new Date().toISOString()):Promise<void> {
  if(!Number.isInteger(order)||order<1||order>18||!localDateKey(date))return;
  const records=await loadMovementPracticeRecords(userId);
  if(records.some(item=>item.order===order&&localDateKey(item.date)===localDateKey(date)))return;
  await AsyncStorage.setItem(key(userId),JSON.stringify([...records,{order,date}]));
}
