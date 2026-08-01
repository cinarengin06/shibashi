export type Practice2PosePoint={name:string;x:number;y:number;z?:number;score?:number};
export type Practice2MetricId='alignment'|'weightDistribution'|'kneeAngles'|'torsoBalance'|'armPosition'|'shoulderHipLevel'|'stability'|'timing'|'movementPath'|'armSync'|'fluidity'|'torsoRotation'|'weightTransfer'|'kneeAngle'|'range'|'startMatch'|'endMatch';
export type Practice2Metric={id:Practice2MetricId;label:string;value:number|null;detail:string;available:boolean};
export type Practice2Analysis={overallScore:number|null;confidence:number;metrics:Practice2Metric[];correction?:string;positive?:string};
export type Practice2PoseSample={timestampMs:number;keypoints:Practice2PosePoint[]};
export type Practice2ReferenceFrame={timestampMs:number;phaseId:string;keypoints:readonly Practice2PosePoint[]};
export type Practice2Phase={id:string;title:string;startMs:number;endMs:number;breath:string};
export type Practice2Movement={id:string;order:number;name:string;traditionalName:string;durationMs:number;referenceImage:string;phases:readonly Practice2Phase[];referenceFrames:readonly Practice2ReferenceFrame[]};

export interface StaticPracticeDefinition {
 id:string;
 title:string;
 englishTitle:string;
 order:number;
 referenceImage:string;
 cameraView:'front'|'side'|'diagonal';
 holdDurationMs:number;
 focusMetrics:string[];
 breathingCue:string;
 shortInstruction:string;
 targetAngles?:Record<string,number>;
 tolerances?:Record<string,number>;
}

export interface ShortFlowStep {
 practiceId:string;
 durationMs:number;
 cue:string;
}

export interface ShortFlowDefinition {
 id:string;
 title:string;
 order:number;
 durationMinutes:number;
 level:'Başlangıç'|'Orta'|'İleri';
 focus:string;
 description:string;
 steps:ShortFlowStep[];
}
