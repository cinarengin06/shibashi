import AsyncStorage from '@react-native-async-storage/async-storage';
import {makeRedirectUri} from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import {createClient,processLock} from '@supabase/supabase-js';
import {AppState,Platform} from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl=process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseAuth=supabaseUrl&&supabasePublishableKey
 ? createClient(supabaseUrl,supabasePublishableKey,{
    auth:{
     ...(Platform.OS!=='web'?{storage:AsyncStorage}:{}),
     autoRefreshToken:true,
     detectSessionInUrl:false,
     lock:processLock,
     persistSession:true,
    },
   })
 : null;

WebBrowser.maybeCompleteAuthSession();

if(Platform.OS!=='web'&&supabaseAuth){
 AppState.addEventListener('change',state=>{
  if(state==='active')supabaseAuth.auth.startAutoRefresh();
  else supabaseAuth.auth.stopAutoRefresh();
 });
}

export const mobileAuthRedirectUrl=makeRedirectUri({
 path:'auth/callback',
 scheme:'shibashi',
});

async function createSessionFromUrl(url:string){
 if(!supabaseAuth)throw new Error('Supabase Auth yapılandırılmadı.');
 const{params,errorCode}=QueryParams.getQueryParams(url);
 if(errorCode)throw new Error(errorCode);
 const accessToken=params.access_token;
 const refreshToken=params.refresh_token;
 if(!accessToken||!refreshToken)throw new Error('Google oturumu tamamlanamadı.');
 const{data,error}=await supabaseAuth.auth.setSession({
  access_token:accessToken,
  refresh_token:refreshToken,
 });
 if(error)throw error;
 return data.session;
}

export async function signInWithGoogle(){
 if(!supabaseAuth)throw new Error('Supabase Auth yapılandırılmadı.');
 const{data,error}=await supabaseAuth.auth.signInWithOAuth({
  provider:'google',
  options:{
   redirectTo:mobileAuthRedirectUrl,
   skipBrowserRedirect:true,
  },
 });
 if(error)throw error;
 if(!data.url)throw new Error('Google giriş adresi oluşturulamadı.');
 const result=await WebBrowser.openAuthSessionAsync(data.url,mobileAuthRedirectUrl);
 if(result.type!=='success')return null;
 return createSessionFromUrl(result.url);
}

export async function signOut(){
 if(!supabaseAuth)return;
 const{error}=await supabaseAuth.auth.signOut();
 if(error)throw error;
}
