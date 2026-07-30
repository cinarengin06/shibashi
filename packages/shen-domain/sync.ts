export const SHIBASHI_SYNC_SCHEMA_VERSION=1;

export type SyncRecord={id?:string;date?:string;createdAt?:string;savedAt?:string;[key:string]:unknown};

export interface ShibashiSyncPayload{
 schemaVersion:typeof SHIBASHI_SYNC_SCHEMA_VERSION;
 updatedAt:string;
 profile:Record<string,unknown>;
 history:{
  sessions:SyncRecord[];
  entries:SyncRecord[];
  postureReports:SyncRecord[];
 };
 journey:{
  completedStories:string[];
  shenActivities:SyncRecord[];
  reflections:SyncRecord[];
  savedMasterSentences:SyncRecord[];
 };
 preferences:Record<string,unknown>;
}

export type SyncStatus='local'|'syncing'|'synced'|'offline'|'error';

const MAX_SYNC_STRING_LENGTH=64_000;
const NON_PORTABLE_URL_PATTERN=/^(?:blob:|data:(?:image|audio|video|application\/octet-stream)[/;])/i;

function compactSyncValue(value:unknown,seen:WeakSet<object>):unknown{
 if(typeof value==='string'){
  if(NON_PORTABLE_URL_PATTERN.test(value)||value.length>MAX_SYNC_STRING_LENGTH)return undefined;
  return value;
 }
 if(value===null||typeof value!=='object')return value;
 if(seen.has(value))return undefined;
 seen.add(value);
 if(Array.isArray(value)){
  const compacted=value.map(item=>compactSyncValue(item,seen)).filter(item=>item!==undefined);
  seen.delete(value);
  return compacted;
 }
 const compacted=Object.fromEntries(
  Object.entries(value)
   .map(([key,item])=>[key,compactSyncValue(item,seen)] as const)
   .filter(([,item])=>item!==undefined),
 );
 seen.delete(value);
 return compacted;
}

/**
 * Keeps sync packets JSON-safe and small. Camera snapshots remain in local
 * device history; only their measurements and other portable metadata sync.
 */
export function compactSyncPayload(payload:ShibashiSyncPayload):ShibashiSyncPayload{
 return compactSyncValue(payload,new WeakSet<object>()) as ShibashiSyncPayload;
}

const recordKey=(value:SyncRecord,index:number)=>{
 const stable=value.id??value.date??value.createdAt??value.savedAt;
 return typeof stable==='string'&&stable?stable:`record-${index}-${JSON.stringify(value)}`;
};

export function mergeSyncRecords<T extends SyncRecord>(first:T[]=[],second:T[]=[]):T[]{
 const records=new Map<string,T>();
 [...first,...second].forEach((value,index)=>records.set(recordKey(value,index),value));
 return [...records.values()].sort((left,right)=>{
  const leftDate=String(left.date??left.createdAt??left.savedAt??'');
  const rightDate=String(right.date??right.createdAt??right.savedAt??'');
  return rightDate.localeCompare(leftDate);
 });
}

export function createEmptySyncPayload():ShibashiSyncPayload{
 return{
  schemaVersion:SHIBASHI_SYNC_SCHEMA_VERSION,
  updatedAt:new Date(0).toISOString(),
  profile:{},
  history:{sessions:[],entries:[],postureReports:[]},
  journey:{completedStories:[],shenActivities:[],reflections:[],savedMasterSentences:[]},
  preferences:{},
 };
}

export function mergeSyncPayloads(server:ShibashiSyncPayload|undefined,client:ShibashiSyncPayload):ShibashiSyncPayload{
 const remote=server??createEmptySyncPayload();
 const clientIsNewer=Date.parse(client.updatedAt)>=Date.parse(remote.updatedAt);
 return{
  schemaVersion:SHIBASHI_SYNC_SCHEMA_VERSION,
  updatedAt:new Date(Math.max(Date.parse(remote.updatedAt)||0,Date.parse(client.updatedAt)||0,Date.now())).toISOString(),
  profile:clientIsNewer?{...remote.profile,...client.profile}:{...client.profile,...remote.profile},
  history:{
   sessions:mergeSyncRecords(remote.history.sessions,client.history.sessions),
   entries:mergeSyncRecords(remote.history.entries,client.history.entries),
   postureReports:mergeSyncRecords(remote.history.postureReports,client.history.postureReports),
  },
  journey:{
   completedStories:[...new Set([...remote.journey.completedStories,...client.journey.completedStories])],
   shenActivities:mergeSyncRecords(remote.journey.shenActivities,client.journey.shenActivities),
   reflections:mergeSyncRecords(remote.journey.reflections,client.journey.reflections),
   savedMasterSentences:mergeSyncRecords(remote.journey.savedMasterSentences,client.journey.savedMasterSentences),
  },
  preferences:clientIsNewer?{...remote.preferences,...client.preferences}:{...client.preferences,...remote.preferences},
 };
}
