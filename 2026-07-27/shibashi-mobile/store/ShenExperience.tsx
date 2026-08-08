import {setAudioModeAsync,useAudioPlayer,useAudioPlayerStatus} from 'expo-audio';
import React,{createContext,PropsWithChildren,useContext,useEffect,useState} from 'react';
import {Platform} from 'react-native';
import {getShen} from '../data/fiveShen';
import {shenBackgrounds,shenMusic} from '../data/shenAssets';
import {useApp} from './AppStore';

type ShenExperienceState={
 shen:ReturnType<typeof getShen>;
 background:ReturnType<typeof getBackground>;
 soundEnabled:boolean;
 playing:boolean;
 toggleSound:()=>void;
};
const getBackground=(id:Parameters<typeof getShen>[0])=>shenBackgrounds[getShen(id).id];
const Context=createContext<ShenExperienceState|null>(null);

export function ShenExperienceProvider({children}:PropsWithChildren){
 const{profile,saveProfile}=useApp();const shen=getShen(profile.selectedShenId),musicShenId=shen.id;const player=useAudioPlayer(shenMusic[musicShenId],{downloadFirst:true});const status=useAudioPlayerStatus(player);const[webAudioUnlocked,setWebAudioUnlocked]=useState(false);
 useEffect(()=>{void setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:false,interruptionMode:'mixWithOthers'})},[]);
 useEffect(()=>{player.pause();player.replace(shenMusic[musicShenId]);player.loop=true;player.volume=.3;if(profile.soundEnabled&&(Platform.OS!=='web'||webAudioUnlocked))player.play()},[musicShenId,player,profile.soundEnabled,webAudioUnlocked]);
 const toggleSound=()=>{if(Platform.OS==='web'&&profile.soundEnabled&&!status.playing){setWebAudioUnlocked(true);player.play();return}saveProfile({soundEnabled:!profile.soundEnabled})};
 return <Context.Provider value={{shen,background:shenBackgrounds[shen.id],soundEnabled:profile.soundEnabled,playing:status.playing,toggleSound}}>{children}</Context.Provider>;
}
export function useShenExperience(){const v=useContext(Context);if(!v)throw new Error('ShenExperienceProvider missing');return v}
