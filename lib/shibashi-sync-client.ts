"use client";

import {
 compactSyncPayload,
 hasSupabaseSyncConfig,
 syncShibashiStateWithSupabase,
 type ShibashiSyncPayload,
 type SyncStatus,
} from '@/packages/shen-domain';
import {supabaseAuth} from '@/lib/supabase-auth';

const CODE_KEY='shibashi-sync-code';
const QUEUE_KEY='shibashi-sync-queue';
const MAX_BROWSER_QUEUE_LENGTH=450_000;

export type BrowserSyncResult={status:SyncStatus;syncCode:string;payload?:ShibashiSyncPayload;syncedAt?:string;message?:string};

function randomBlock(){
 const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 return Array.from({length:4},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join('');
}

export function normalizeBrowserSyncCode(value:string){
 return value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').match(/.{1,4}/g)?.slice(0,3).join('-')??'';
}

export function isValidBrowserSyncCode(value:string){
 return /^[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2}$/.test(normalizeBrowserSyncCode(value));
}

export function getBrowserSyncCode(){
 let current:string|null=null;
 try{current=window.localStorage.getItem(CODE_KEY)}catch{}
 if(current&&isValidBrowserSyncCode(current))return normalizeBrowserSyncCode(current);
 const created=`${randomBlock()}-${randomBlock()}-${randomBlock()}`;
 try{window.localStorage.setItem(CODE_KEY,created)}catch{}
 return created;
}

export function setBrowserSyncCode(value:string){
 if(!isValidBrowserSyncCode(value))return null;
 const normalized=normalizeBrowserSyncCode(value);
 try{window.localStorage.setItem(CODE_KEY,normalized)}catch{}
 return normalized;
}

function persistBrowserQueue(payload:ShibashiSyncPayload){
 try{
  const serialized=JSON.stringify(payload);
  window.localStorage.removeItem(QUEUE_KEY);
  if(serialized.length<=MAX_BROWSER_QUEUE_LENGTH)window.localStorage.setItem(QUEUE_KEY,serialized);
 }catch{
  try{window.localStorage.removeItem(QUEUE_KEY)}catch{}
 }
}

export async function syncBrowserState(payload:ShibashiSyncPayload,requestedCode?:string):Promise<BrowserSyncResult>{
 const syncCode=requestedCode&&isValidBrowserSyncCode(requestedCode)?normalizeBrowserSyncCode(requestedCode):getBrowserSyncCode();
 const compactPayload=compactSyncPayload(payload);
 persistBrowserQueue(compactPayload);
 const controller=new AbortController();
 const timeout=window.setTimeout(()=>controller.abort(),9000);
 try{
  const supabaseConfig={
   supabaseUrl:process.env.NEXT_PUBLIC_SUPABASE_URL,
   publishableKey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
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
   window.localStorage.removeItem(QUEUE_KEY);
   return{status:'synced',syncCode,payload:result.payload,syncedAt:result.syncedAt};
  }

  const response=await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({syncCode,payload:compactPayload}),signal:controller.signal});
  const result=await response.json() as {ok?:boolean;payload?:ShibashiSyncPayload;syncedAt?:string;error?:string};
  if(!response.ok||!result.ok)throw new Error(result.error??'Senkronizasyon sunucusu yanıt vermedi.');
  window.localStorage.removeItem(QUEUE_KEY);
  return{status:'synced',syncCode,payload:result.payload,syncedAt:result.syncedAt};
 }catch(error){
  return{status:'offline',syncCode,message:error instanceof Error?error.message:'Bağlantı kurulamadı.'};
 }finally{window.clearTimeout(timeout)}
}
