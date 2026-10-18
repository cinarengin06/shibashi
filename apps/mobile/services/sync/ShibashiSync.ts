import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
 compactSyncPayload,
 hasSupabaseSyncConfig,
 syncShibashiStateWithSupabase,
 type ShibashiSyncPayload,
 type SyncStatus,
} from '../../../../packages/shen-domain';
import {supabaseAuth} from '../auth/SupabaseAuth';

const CODE_KEY='shibashi-sync-code';
const QUEUE_KEY='shibashi-sync-queue';

export type SyncResult={
 status:SyncStatus;
 syncCode:string;
 payload?:ShibashiSyncPayload;
 syncedAt?:string;
 message?:string;
};

function randomBlock(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 return Array.from({length:4},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join('');
}

export function createSyncCode(){
 return `${randomBlock()}-${randomBlock()}-${randomBlock()}`;
}

export function normalizeSyncCode(value:string){
 return value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').match(/.{1,4}/g)?.slice(0,3).join('-')??'';
}

export function isValidSyncCode(value:string){
 return /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2}$/.test(normalizeSyncCode(value));
}

export async function getSyncCode(){
 const stored=await AsyncStorage.getItem(CODE_KEY);
 if(stored&&isValidSyncCode(stored))return normalizeSyncCode(stored);
 const created=createSyncCode();
 await AsyncStorage.setItem(CODE_KEY,created);
 return created;
}

export async function replaceSyncCode(value?:string){
 const next=value&&isValidSyncCode(value)?normalizeSyncCode(value):createSyncCode();
 await AsyncStorage.multiSet([[CODE_KEY,next],[QUEUE_KEY,'']]);
 return next;
}

function resolveSyncEndpoint(){
 const configured=process.env.EXPO_PUBLIC_SHIBASHI_SYNC_URL?.trim();
 if(configured)return `${configured.replace(/\/$/,'')}/api/sync`;
 const config=Constants.expoConfig as (typeof Constants.expoConfig&{hostUri?:string})|null;
 const expoGo=Constants.expoGoConfig as (typeof Constants.expoGoConfig&{debuggerHost?:string})|undefined;
 const hostUri=config?.hostUri??expoGo?.debuggerHost;
 const hostname=hostUri?.split(':')[0];
 return hostname?`http://${hostname}:3005/api/sync`:null;
}

export async function syncShibashiState(payload:ShibashiSyncPayload,code?:string):Promise<SyncResult>{
 const syncCode=code&&isValidSyncCode(code)?normalizeSyncCode(code):await getSyncCode();
 const compactPayload=compactSyncPayload(payload);
 try{await AsyncStorage.setItem(QUEUE_KEY,JSON.stringify(compactPayload))}catch{await AsyncStorage.removeItem(QUEUE_KEY).catch(()=>undefined)}

 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),9000);
 try{
  const supabaseConfig={
   supabaseUrl:process.env.EXPO_PUBLIC_SUPABASE_URL,
   publishableKey:process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
  if(hasSupabaseSyncConfig(supabaseConfig)){
   const{data:{session}}=await supabaseAuth?.auth.getSession()??{data:{session:null}};
   const result=await syncShibashiStateWithSupabase({
    accessToken:session?.access_token,
    config:supabaseConfig,
    payload:compactPayload,
    signal:controller.signal,
    syncCode,
   });
   await AsyncStorage.removeItem(QUEUE_KEY);
   return{status:'synced',syncCode,payload:result.payload,syncedAt:result.syncedAt};
  }

  const endpoint=resolveSyncEndpoint();
  if(!endpoint)return{status:'offline',syncCode,message:'Production senkronizasyon adresi yapılandırılmadı.'};
  const response=await fetch(endpoint,{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({syncCode,payload:compactPayload}),
   signal:controller.signal,
  });
  const result=await response.json() as {ok?:boolean;payload?:ShibashiSyncPayload;syncedAt?:string;error?:string};
  if(!response.ok||!result.ok)throw new Error(result.error??'Senkronizasyon sunucusu yanıt vermedi.');
  await AsyncStorage.removeItem(QUEUE_KEY);
  return{status:'synced',syncCode,payload:result.payload,syncedAt:result.syncedAt};
 }catch(error){
  return{status:'offline',syncCode,message:error instanceof Error?error.message:'Bağlantı kurulamadı.'};
 }finally{clearTimeout(timeout)}
}

export async function getQueuedSyncPayload(){
 const queued=await AsyncStorage.getItem(QUEUE_KEY);
 if(!queued)return null;
 try{return JSON.parse(queued) as ShibashiSyncPayload}catch{return null}
}
