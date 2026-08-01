export type Experience='Yeni'|'Biraz deneyimli'|'Düzenli pratik';
export type ShenId='hun'|'shen'|'yi'|'po'|'zhi';
export interface FiveShenProfile{id:ShenId;name:string;label:string;value:number;note:string;organ:string;bodyMap:string;color:string;color2:string;hero:string;dailyName:string;dailyPrompt:string;recommendation:string;bagua:string;baguaText:string;task:string;mapTitle:string;world:string;essence:string;symbol:string;element:string;practiceId:string}
import type{FirstJourneyPlan,OnboardingProfile,OnboardingStage}from'../../../packages/onboarding';
export interface UserProfile{name:string;experience:Experience;dailyGoal:number;reminders:boolean;onboardingDone:boolean;onboardingVersion:number;selectedShenId:ShenId;soundEnabled:boolean;authUserId?:string;authEmail?:string;avatarUrl?:string;onboardingCheckin?:{body:number;breath:number;energy:number;createdAt:string};onboardingStage?:OnboardingStage;onboardingProfile?:OnboardingProfile;firstJourneyPlan?:FirstJourneyPlan}
export interface ShibashiMovement{id:string;order:number;name:string;englishName:string;duration:number;difficulty:'Başlangıç'|'Orta';focus:string;gate:number;description:string;steps:string[];breath:string;mistakes:string[]}
export interface Practice{id:string;title:string;duration:number;focus:string;movementIds:string[];locked?:boolean}
export interface PoseFeedback{postureScore:number;balanceScore:number;flowScore:number;corrections:string[]}
export interface PracticeSession extends PoseFeedback{id:string;practiceId:string;date:string;duration:number;breathScore?:number;jing?:number;xp?:number}
export interface BaguaGate{id:number;name:string;theme:string;symbol:string;requirement:number}
export interface JournalEntry{id:string;date:string;mood:number;energy:number;note:string;shenId?:ShenId}
export interface Achievement{id:string;title:string;description:string;unlocked:boolean}
export interface EnergyState{jing:number;qi:number;shen:number}
export interface DailyRecommendation{practiceId:string;reason:string}
export type PostureView='front'|'side'|'back';
export type PostureAnalysisSource='mediapipe-33'|'vision-3d+mediapipe-33';
export interface PostureCapture{view:PostureView;score:number;shoulderScore:number;axisScore:number;hipScore:number;feedback:string;analysisSource?:PostureAnalysisSource;landmarkCount?:number;confidence?:number;bodyHeightMeters?:number;sampleCount?:number;measurements?:Record<string,number>;imageData?:string;landmarks?:Array<{x:number;y:number;z?:number;visibility?:number}>}
export interface PostureReport{id:string;date:string;score:number;captures:PostureCapture[];summary:string;asymmetrySignal:string;analysisSource?:PostureAnalysisSource}
export interface LivingStory{id:string;order:number;title:string;subtitle:string;duration:number;movementId:string;quote:string;description:string;lifeConnection:string;steps:string[];ambience:string[];locked?:boolean}
