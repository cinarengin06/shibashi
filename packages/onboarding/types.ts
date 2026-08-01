export type OnboardingStage='discover'|'profile'|'body-scan'|'first-movement'|'first-plan'|'completed';
export type ExperienceLevel='none'|'some'|'regular';
export type StandingCapacity='1-5'|'5-15'|'15-plus';
export type GuidancePreference='visual'|'audio'|'both';
export type ProtectedArea='lower-back'|'knee'|'shoulder'|'neck'|'none';
export type BodyView='front'|'side'|'back';

export type OnboardingPosePoint={name:string;x:number;y:number;z?:number;score?:number};
export type PoseSample={timestampMs:number;keypoints:OnboardingPosePoint[]};
export type PracticeMetric={id:string;label:string;value?:number;available:boolean;detail:string};

export interface BodyTraceObservation{id:string;status:'positive'|'attention'|'neutral';text:string;metricSource:string}
export interface BodyTraceResult{frontCaptured:boolean;sideCaptured:boolean;backCaptured:boolean;observations:BodyTraceObservation[];confidence:number;metrics:PracticeMetric[]}
export interface FirstMovementResult{overallScore?:number;completed:boolean;positiveFeedback?:string;correctionFeedback?:string;metrics:PracticeMetric[];confidence:number}
export interface FirstJourneyPlan{dailyMinutes:number;movementIds:string[];breathingPracticeId:string;awarenessPracticeId:string;reassessmentDay:number;reasonSummary:string;focuses:string[];recommendedShen:'po'|'zhi'|'hun'|'yi'|'shen'}
export interface OnboardingProfile{experienceLevel:ExperienceLevel;standingCapacity:StandingCapacity;protectedArea:ProtectedArea;guidancePreference:GuidancePreference;bodyTraceResult?:BodyTraceResult;firstMovementResult?:FirstMovementResult;firstJourneyPlan?:FirstJourneyPlan}
export interface OnboardingProgress{version:5;stage:OnboardingStage;profile:OnboardingProfile;updatedAt:string}

