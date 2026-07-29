import AsyncStorage from '@react-native-async-storage/async-storage';
import React,{createContext,PropsWithChildren,useContext,useEffect,useState} from 'react';
import {JournalEntry,PostureReport,PracticeSession,UserProfile} from '../types';
type State={ready:boolean;profile:UserProfile;sessions:PracticeSession[];entries:JournalEntry[];postureReports:PostureReport[];completedStories:string[];saveProfile:(p:Partial<UserProfile>)=>void;addSession:(s:PracticeSession)=>void;addEntry:(e:JournalEntry)=>void;addPostureReport:(r:PostureReport)=>void;completeStory:(id:string)=>void;reset:()=>void};
const initial:UserProfile={name:'Gezgin',experience:'Yeni',dailyGoal:10,reminders:true,onboardingDone:false,onboardingVersion:0,selectedShenId:'shen',soundEnabled:true};
const Context=createContext<State|null>(null);
export function AppProvider({children}:PropsWithChildren){
 const [ready,setReady]=useState(false),[profile,setProfile]=useState(initial),[sessions,setSessions]=useState<PracticeSession[]>([]),[entries,setEntries]=useState<JournalEntry[]>([]),[postureReports,setPostureReports]=useState<PostureReport[]>([]),[completedStories,setCompletedStories]=useState<string[]>([]);
 useEffect(()=>{AsyncStorage.getItem('shibashi-state').then(raw=>{if(raw){const x=JSON.parse(raw);setProfile({...initial,...x.profile});setSessions(x.sessions||[]);setEntries(x.entries||[]);setPostureReports(x.postureReports||[]);setCompletedStories(x.completedStories||[])}}).finally(()=>setReady(true))},[]);
 const persist=(p=profile,s=sessions,e=entries,r=postureReports,l=completedStories)=>AsyncStorage.setItem('shibashi-state',JSON.stringify({profile:p,sessions:s,entries:e,postureReports:r,completedStories:l}));
 const saveProfile=(patch:Partial<UserProfile>)=>setProfile(old=>{const next={...old,...patch};void persist(next,sessions,entries,postureReports,completedStories);return next});
 const addSession=(v:PracticeSession)=>setSessions(old=>{const next=[v,...old];void persist(profile,next,entries,postureReports,completedStories);return next});
 const addEntry=(v:JournalEntry)=>setEntries(old=>{const next=[v,...old];void persist(profile,sessions,next,postureReports,completedStories);return next});
 const addPostureReport=(v:PostureReport)=>setPostureReports(old=>{const next=[v,...old];void persist(profile,sessions,entries,next,completedStories);return next});
 const completeStory=(id:string)=>setCompletedStories(old=>{if(old.includes(id))return old;const next=[...old,id];void persist(profile,sessions,entries,postureReports,next);return next});
 const reset=()=>{setProfile(initial);setSessions([]);setEntries([]);setPostureReports([]);setCompletedStories([]);void AsyncStorage.removeItem('shibashi-state')};
 return <Context.Provider value={{ready,profile,sessions,entries,postureReports,completedStories,saveProfile,addSession,addEntry,addPostureReport,completeStory,reset}}>{children}</Context.Provider>;
}
export function useApp(){const v=useContext(Context);if(!v)throw new Error('AppProvider missing');return v}
