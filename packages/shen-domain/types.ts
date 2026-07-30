export type ShenId='hun'|'yi'|'po'|'zhi'|'xin';
export type ShenIdLike=ShenId|'shen';
export type ProgressTrend='growing'|'stable'|'needs-attention';

export interface ShenProfile{
 id:ShenId;
 name:string;
 element:string;
 shortMeaning:string;
 description:string;
 primaryColor:string;
 darkColor:string;
 lightColor:string;
 backgroundKey:string;
 practiceFocus:string[];
 movementQualities:string[];
 breathingPatternIds:string[];
 soundAtmosphereId:string;
 reflectionQuestionIds:string[];
 progressGoalIds:string[];
}

export interface ShenProgressDimensions{
 practiceConsistency:number;
 movementQuality:number;
 breathingAwareness:number;
 reflectionEngagement:number;
 practiceVariety:number;
 completionRate:number;
}

export interface UserShenProgress{
 shenId:ShenId;
 experience:number;
 level:number;
 practiceMinutes:number;
 completedPractices:number;
 reflectionCount:number;
 consistencyScore:number;
 movementQualityScore?:number;
 breathingConsistencyScore?:number;
 lastPracticedAt?:string;
 recentTrend:ProgressTrend;
 dimensions:ShenProgressDimensions;
}

export interface ShenPractice{
 id:string;
 shenId:ShenId;
 title:string;
 durationMinutes:number;
 description:string;
 movementIds:string[];
 breathingPatternId:string;
 movementQualityIds:string[];
 difficulty:'beginner'|'intermediate';
}

export interface BreathingPattern{
 id:string;
 shenId:ShenId;
 name:string;
 inhaleSeconds?:number;
 holdSeconds?:number;
 exhaleSeconds?:number;
 natural?:boolean;
 instruction:string;
}

export interface ReflectionQuestion{
 id:string;
 shenId:ShenId;
 text:string;
}

export interface ReflectionEntry{
 id:string;
 userId:string;
 shenId:ShenId;
 practiceId?:string;
 questionId:string;
 responseText?:string;
 selectedFeeling?:string;
 masterSentenceId?:string;
 createdAt:string;
}

export interface ProgressGoal{
 id:string;
 shenId:ShenId;
 title:string;
 description:string;
 target:number;
 metric:'practice'|'minutes'|'reflection'|'variety'|'breath'|'movement';
}

export interface SoundAtmosphere{
 id:string;
 name:string;
 shenId:ShenId;
 layers:{id:string;source:string|null;defaultVolume:number;loop:boolean;placeholder:boolean}[];
}

export interface MasterSentence{
 id:string;
 text:string;
 shenId?:ShenId;
 practiceId?:string;
 movementId?:string;
 tags:string[];
 difficulty?:'beginner'|'intermediate'|'advanced';
 createdAt:string;
}

export interface SavedMasterSentence{
 id:string;
 masterSentenceId:string;
 savedAt:string;
 practiceId?:string;
 movementId?:string;
 note?:string;
}

export interface ShenActivity{
 id:string;
 shenId:ShenId;
 type:'practice'|'breath'|'reflection';
 createdAt:string;
 minutes?:number;
 completed?:boolean;
 movementQuality?:number;
 breathingAwareness?:number;
 practiceId?:string;
}

export type GhostMode='follow'|'mirror'|'trace';
export type TraceMode='off'|'teacher'|'user'|'compare';
export interface PoseKeypoint{x:number;y:number;score?:number;name:string}
export interface ReferencePoseFrame{
 timestampMs:number;
 phase:string;
 keypoints:PoseKeypoint[];
 centerOfMass?:{x:number;y:number};
}
export interface GhostTeacherSequence{
 id:string;
 movementId:string;
 durationMs:number;
 frames:ReferencePoseFrame[];
 recommendedView:'front'|'side'|'back'|'diagonal';
 source:'reference-sequence';
}

export interface MovementComparison{
 timing:number;
 handPath:number;
 shoulderLevel:number;
 torsoDirection:number;
 kneeAngle:number;
 centerTransfer:number;
 flow:number;
 feedback:string[];
}

