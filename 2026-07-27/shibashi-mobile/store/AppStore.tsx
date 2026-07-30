import AsyncStorage from '@react-native-async-storage/async-storage';
import React,{createContext,PropsWithChildren,useContext,useEffect,useRef,useState} from 'react';
import {
 SHEN_STORAGE_SCHEMA_VERSION,
 SHIBASHI_SYNC_SCHEMA_VERSION,
 migrateShenLocalState,
 type GhostMode,
 type ReflectionEntry,
 type SavedMasterSentence,
 type ShenActivity,
 type ShibashiSyncPayload,
 type SyncRecord,
 type SyncStatus,
 type TraceMode,
}from'../../../packages/shen-domain';
import {getSyncCode,isValidSyncCode,replaceSyncCode,syncShibashiState} from '../services/sync/ShibashiSync';
import {JournalEntry,PostureReport,PracticeSession,UserProfile} from '../types';

type PracticePreferences={ghostMode:GhostMode;traceMode:TraceMode;ghostOpacity:number;voiceEnabled:boolean};
type PersistedState={
 profile:UserProfile;
 sessions:PracticeSession[];
 entries:JournalEntry[];
 postureReports:PostureReport[];
 completedStories:string[];
 shenActivities:ShenActivity[];
 reflections:ReflectionEntry[];
 savedMasterSentences:SavedMasterSentence[];
 practicePreferences:PracticePreferences;
};
type State=PersistedState&{
 ready:boolean;
 syncStatus:SyncStatus;
 syncCode:string;
 lastSyncedAt?:string;
 syncMessage?:string;
 syncNow:()=>Promise<void>;
 setSyncCode:(code:string)=>Promise<boolean>;
 saveProfile:(p:Partial<UserProfile>)=>void;
 addSession:(s:PracticeSession)=>void;
 addEntry:(e:JournalEntry)=>void;
 addPostureReport:(r:PostureReport)=>void;
 completeStory:(id:string)=>void;
 addShenActivity:(activity:ShenActivity)=>void;
 addReflection:(entry:ReflectionEntry)=>void;
 saveMasterSentence:(entry:SavedMasterSentence)=>void;
 removeMasterSentence:(masterSentenceId:string)=>void;
 updatePracticePreferences:(patch:Partial<PracticePreferences>)=>void;
 reset:()=>void;
};

const initialProfile:UserProfile={name:'Gezgin',experience:'Yeni',dailyGoal:10,reminders:true,onboardingDone:false,onboardingVersion:0,selectedShenId:'shen',soundEnabled:true};
const initialPreferences:PracticePreferences={ghostMode:'follow',traceMode:'compare',ghostOpacity:.28,voiceEnabled:true};
const initialData:PersistedState={profile:initialProfile,sessions:[],entries:[],postureReports:[],completedStories:[],shenActivities:[],reflections:[],savedMasterSentences:[],practicePreferences:initialPreferences};
const Context=createContext<State|null>(null);

function migratePersistedState(value:Partial<PersistedState>|undefined):PersistedState{
 const domain=migrateShenLocalState(value);
 return{
  profile:{...initialProfile,...value?.profile},
  sessions:Array.isArray(value?.sessions)?value.sessions:[],
  entries:Array.isArray(value?.entries)?value.entries:[],
  postureReports:Array.isArray(value?.postureReports)?value.postureReports:[],
  completedStories:Array.isArray(value?.completedStories)?value.completedStories:[],
  shenActivities:domain.shenActivities,
  reflections:domain.reflections,
  savedMasterSentences:domain.savedMasterSentences,
  practicePreferences:domain.practicePreferences,
 };
}

function toSyncPayload(data:PersistedState):ShibashiSyncPayload{
 return{
  schemaVersion:SHIBASHI_SYNC_SCHEMA_VERSION,
  updatedAt:new Date().toISOString(),
  profile:{...data.profile},
  history:{sessions:data.sessions as unknown as SyncRecord[],entries:data.entries as unknown as SyncRecord[],postureReports:data.postureReports as unknown as SyncRecord[]},
  journey:{completedStories:data.completedStories,shenActivities:data.shenActivities as unknown as SyncRecord[],reflections:data.reflections as unknown as SyncRecord[],savedMasterSentences:data.savedMasterSentences as unknown as SyncRecord[]},
  preferences:{...data.practicePreferences},
 };
}

function fromSyncPayload(payload:ShibashiSyncPayload):PersistedState{
 return migratePersistedState({
  profile:payload.profile as unknown as UserProfile,
  sessions:payload.history.sessions.map(toAppPracticeSession).filter((value):value is PracticeSession=>Boolean(value)),
  entries:payload.history.entries as unknown as JournalEntry[],
  postureReports:payload.history.postureReports.map(toAppPostureReport).filter((value):value is PostureReport=>Boolean(value)),
  completedStories:payload.journey.completedStories,
  shenActivities:payload.journey.shenActivities as unknown as ShenActivity[],
  reflections:payload.journey.reflections as unknown as ReflectionEntry[],
  savedMasterSentences:payload.journey.savedMasterSentences as unknown as SavedMasterSentence[],
  practicePreferences:payload.preferences as unknown as PracticePreferences,
 });
}

function toAppPracticeSession(record:SyncRecord):PracticeSession|null{
 if(typeof record.id!=='string')return null;
 if(typeof record.practiceId==='string'&&typeof record.duration==='number'&&typeof record.flowScore==='number')return record as unknown as PracticeSession;
 const score=Number(record.score??0);
 const createdAt=typeof record.createdAt==='string'?record.createdAt:typeof record.date==='string'?record.date:new Date().toISOString();
 return{id:record.id,practiceId:`movement-${Number(record.movementId??1)}`,date:createdAt,duration:Number(record.duration??0),postureScore:score,balanceScore:score,flowScore:score,corrections:[]};
}

function toAppPostureReport(record:SyncRecord):PostureReport|null{
 if(typeof record.id!=='string'||typeof record.score!=='number')return null;
 if(Array.isArray(record.captures))return record as unknown as PostureReport;
 const sourceCaptures=record.captures as Partial<Record<'front'|'side'|'back',{analysis?:Record<string,unknown>}>>|undefined;
 const captures=(['front','side','back'] as const).map(view=>{
  const analysis=sourceCaptures?.[view]?.analysis;
  return{view,score:Math.round((Number(analysis?.axisScore??record.score)+Number(analysis?.shoulderScore??record.score)+Number(analysis?.hipScore??record.score))/3),shoulderScore:Number(analysis?.shoulderScore??record.score),axisScore:Number(analysis?.axisScore??record.score),hipScore:Number(analysis?.hipScore??record.score),feedback:String(analysis?.feedback??'Web ölçümü senkronize edildi.'),analysisSource:'mediapipe-33' as const,landmarkCount:33};
 });
 const createdAt=typeof record.createdAt==='string'?record.createdAt:typeof record.date==='string'?record.date:new Date().toISOString();
 return{id:record.id,date:createdAt,score:record.score,captures,summary:String(record.summary??'Web postür ölçümü senkronize edildi.'),asymmetrySignal:String(record.asymmetrySignal??'Postür hattı takipte.'),analysisSource:'mediapipe-33'};
}

async function persist(data:PersistedState){
 await AsyncStorage.setItem('shibashi-state',JSON.stringify({schemaVersion:SHEN_STORAGE_SCHEMA_VERSION,...data}));
}

export function AppProvider({children}:PropsWithChildren){
 const[ready,setReady]=useState(false);
 const[data,setData]=useState<PersistedState>(initialData);
 const[syncStatus,setSyncStatus]=useState<SyncStatus>('local');
 const[syncCode,setSyncCodeState]=useState('');
 const[lastSyncedAt,setLastSyncedAt]=useState<string>();
 const[syncMessage,setSyncMessage]=useState<string>();
 const dataRef=useRef(data);
 const syncTimerRef=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 dataRef.current=data;

 useEffect(()=>{
  Promise.all([AsyncStorage.getItem('shibashi-state'),getSyncCode()]).then(([raw,code])=>{
   if(raw){
    try{setData(migratePersistedState(JSON.parse(raw) as PersistedState))}
    catch{void AsyncStorage.removeItem('shibashi-state')}
   }
   setSyncCodeState(code);
  }).finally(()=>setReady(true));
 },[]);

 const applySyncResult=(result:Awaited<ReturnType<typeof syncShibashiState>>)=>{
  setSyncStatus(result.status);
  setSyncCodeState(result.syncCode);
  setSyncMessage(result.message);
  if(result.syncedAt)setLastSyncedAt(result.syncedAt);
  if(!result.payload)return;
  const merged=fromSyncPayload(result.payload);
  if(JSON.stringify(merged)===JSON.stringify(dataRef.current))return;
  dataRef.current=merged;
  setData(merged);
  void persist(merged);
 };

 const runSync=async()=>{
  if(!ready)return;
  setSyncStatus('syncing');
  applySyncResult(await syncShibashiState(toSyncPayload(dataRef.current),syncCode||undefined));
 };

 useEffect(()=>{
  if(!ready||!syncCode)return;
  if(syncTimerRef.current)clearTimeout(syncTimerRef.current);
  syncTimerRef.current=setTimeout(()=>void runSync(),1200);
  return()=>{if(syncTimerRef.current)clearTimeout(syncTimerRef.current)};
 },[data,ready,syncCode]);

 useEffect(()=>{
  if(!ready)return;
  const retry=()=>void runSync();
  const timer=setInterval(retry,45_000);
  return()=>clearInterval(timer);
 },[ready,syncCode]);

 const update=(recipe:(current:PersistedState)=>PersistedState)=>{
  setData(current=>{
   const next=recipe(current);
   dataRef.current=next;
   void persist(next);
   return next;
  });
 };
 const saveProfile=(patch:Partial<UserProfile>)=>update(current=>({...current,profile:{...current.profile,...patch}}));
 const addSession=(value:PracticeSession)=>update(current=>({...current,sessions:[value,...current.sessions]}));
 const addEntry=(value:JournalEntry)=>update(current=>({...current,entries:[value,...current.entries]}));
 const addPostureReport=(value:PostureReport)=>update(current=>({...current,postureReports:[value,...current.postureReports]}));
 const completeStory=(id:string)=>update(current=>current.completedStories.includes(id)?current:{...current,completedStories:[...current.completedStories,id]});
 const addShenActivity=(value:ShenActivity)=>update(current=>({...current,shenActivities:[value,...current.shenActivities]}));
 const addReflection=(value:ReflectionEntry)=>update(current=>({...current,reflections:[value,...current.reflections],shenActivities:[{id:`activity-${value.id}`,shenId:value.shenId,type:'reflection',createdAt:value.createdAt,practiceId:value.practiceId},...current.shenActivities]}));
 const saveMasterSentence=(value:SavedMasterSentence)=>update(current=>current.savedMasterSentences.some(item=>item.masterSentenceId===value.masterSentenceId)?current:{...current,savedMasterSentences:[value,...current.savedMasterSentences]});
 const removeMasterSentence=(id:string)=>update(current=>({...current,savedMasterSentences:current.savedMasterSentences.filter(item=>item.masterSentenceId!==id)}));
 const updatePracticePreferences=(patch:Partial<PracticePreferences>)=>update(current=>({...current,practicePreferences:{...current.practicePreferences,...patch}}));
 const changeSyncCode=async(code:string)=>{
  if(!isValidSyncCode(code))return false;
  const normalized=await replaceSyncCode(code);
  setSyncCodeState(normalized);
  setSyncStatus('syncing');
  applySyncResult(await syncShibashiState(toSyncPayload(dataRef.current),normalized));
  return true;
 };
 const reset=()=>{
  dataRef.current=initialData;
  setData(initialData);
  setSyncStatus('local');
  setLastSyncedAt(undefined);
  setSyncMessage(undefined);
  void AsyncStorage.removeItem('shibashi-state');
  void replaceSyncCode().then(setSyncCodeState);
 };

 return <Context.Provider value={{ready,...data,syncStatus,syncCode,lastSyncedAt,syncMessage,syncNow:runSync,setSyncCode:changeSyncCode,saveProfile,addSession,addEntry,addPostureReport,completeStory,addShenActivity,addReflection,saveMasterSentence,removeMasterSentence,updatePracticePreferences,reset}}>{children}</Context.Provider>;
}

export function useApp(){
 const value=useContext(Context);
 if(!value)throw new Error('AppProvider missing');
 return value;
}
