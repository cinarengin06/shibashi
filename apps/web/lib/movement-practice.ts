import { localDateKey, type JourneyRecord } from "@/packages/gamification";

const key=(userId?:string)=>`shibashi-form-practice-days-v1:${userId||"guest"}`;

export function loadMovementPracticeRecords(userId?:string):JourneyRecord[] {
  try { const value:unknown=JSON.parse(localStorage.getItem(key(userId))??"[]"); return Array.isArray(value)?value.filter((item):item is JourneyRecord=>Number.isInteger(item?.order)&&item.order>=1&&item.order<=18&&typeof item.date==="string"):[]; }
  catch { return []; }
}

export function markMovementPracticed(order:number,userId?:string,date=new Date().toISOString()):void {
  if(!Number.isInteger(order)||order<1||order>18||!localDateKey(date))return;
  try {
    const records=loadMovementPracticeRecords(userId);
    if(records.some(item=>item.order===order&&localDateKey(item.date)===localDateKey(date)))return;
    localStorage.setItem(key(userId),JSON.stringify([...records,{order,date}]));
  } catch { /* Practice photos remain usable when local storage is unavailable. */ }
}
