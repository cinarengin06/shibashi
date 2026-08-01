import type{GhostMode,ReflectionEntry,SavedMasterSentence,ShenActivity,TraceMode}from'./types';

export const SHEN_STORAGE_SCHEMA_VERSION=1;
export interface ShenLocalState{
 schemaVersion:typeof SHEN_STORAGE_SCHEMA_VERSION;
 shenActivities:ShenActivity[];
 reflections:ReflectionEntry[];
 savedMasterSentences:SavedMasterSentence[];
 practicePreferences:{ghostMode:GhostMode;traceMode:TraceMode;ghostOpacity:number;voiceEnabled:boolean};
}

export function migrateShenLocalState(value:Partial<ShenLocalState>|undefined):ShenLocalState{
 return{
  schemaVersion:SHEN_STORAGE_SCHEMA_VERSION,
  shenActivities:Array.isArray(value?.shenActivities)?value.shenActivities:[],
  reflections:Array.isArray(value?.reflections)?value.reflections:[],
  savedMasterSentences:Array.isArray(value?.savedMasterSentences)?value.savedMasterSentences:[],
  practicePreferences:{ghostMode:value?.practicePreferences?.ghostMode??'follow',traceMode:value?.practicePreferences?.traceMode??'compare',ghostOpacity:Math.max(.52,value?.practicePreferences?.ghostOpacity??.58),voiceEnabled:value?.practicePreferences?.voiceEnabled??true},
 };
}
