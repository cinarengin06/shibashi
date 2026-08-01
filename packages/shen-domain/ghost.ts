import type{GhostTeacherSequence,PoseKeypoint,ReferencePoseFrame}from'./types';
const names=['nose','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle']as const;
const frame=(timestampMs:number,phase:string,armLift:number,shift:number):GhostTeacherSequence['frames'][number]=>{
 const raw:[[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number]]=[
  [.5+shift,.12],[.42+shift,.27],[.58+shift,.27],[.36+shift,.38-armLift*.08],[.64+shift,.38-armLift*.08],[.31+shift,.5-armLift*.24],[.69+shift,.5-armLift*.24],[.45+shift,.52],[.55+shift,.52],[.44+shift,.7],[.56+shift,.7],[.43+shift,.9],[.57+shift,.9],
 ];
 return{timestampMs,phase,keypoints:raw.map(([x,y],index)=>({name:names[index],x,y,score:1}as PoseKeypoint)),centerOfMass:{x:.5+shift,y:.54}};
};
export const ghostTeacherSequences:GhostTeacherSequence[]=[
 {id:'ghost-movement-1',movementId:'movement-1',durationMs:8000,recommendedView:'front',source:'reference-sequence',frames:[
  frame(0,'hazırlık',0,0),frame(1000,'yükselme',.25,0),frame(2000,'yükselme',.55,0),frame(3000,'açılma',.8,-.015),frame(4000,'açık',1,-.025),frame(5000,'iniş',.7,-.01),frame(6500,'iniş',.3,0),frame(8000,'kapanış',0,0),
 ]},
 {id:'ghost-movement-2',movementId:'movement-2',durationMs:8000,recommendedView:'front',source:'reference-sequence',frames:[
  frame(0,'hazırlık',0,0),frame(1000,'açılma',.35,-.01),frame(2000,'açılma',.7,-.02),frame(3000,'açık',1,-.03),frame(4200,'dönüş',.75,.02),frame(5400,'dönüş',.45,.035),frame(6800,'kapanış',.2,.01),frame(8000,'kapanış',0,0),
 ]},
 {id:'ghost-movement-3',movementId:'movement-3',durationMs:8000,recommendedView:'front',source:'reference-sequence',frames:[
  frame(0,'hazırlık',0,0),frame(900,'yükselme',.3,.01),frame(1900,'yükselme',.65,.025),frame(3000,'uzama',.95,.04),frame(4300,'uzama',1,.05),frame(5600,'iniş',.6,.02),frame(6900,'iniş',.25,-.01),frame(8000,'kapanış',0,0),
 ]},
];
export const getGhostSequence=(movementId:string)=>ghostTeacherSequences.find(item=>item.movementId===movementId);
export function getInterpolatedGhostFrame(sequence:GhostTeacherSequence|undefined,elapsedMs:number){
 if(!sequence?.frames.length)return undefined;
 const time=((elapsedMs%sequence.durationMs)+sequence.durationMs)%sequence.durationMs;
 const nextIndex=sequence.frames.findIndex(item=>item.timestampMs>=time);
 const next=nextIndex<0?sequence.frames[0]:sequence.frames[nextIndex];
 const previous=nextIndex<=0?sequence.frames[sequence.frames.length-1]:sequence.frames[nextIndex-1];
 const previousTime=nextIndex<=0?previous.timestampMs-sequence.durationMs:previous.timestampMs;
 const nextTime=nextIndex<=0?next.timestampMs:next.timestampMs;
 const ratio=Math.max(0,Math.min(1,(time-previousTime)/Math.max(1,nextTime-previousTime)));
 const previousByName=new Map(previous.keypoints.map(item=>[item.name,item]));
 return{
  timestampMs:time,
  phase:ratio<.5?previous.phase:next.phase,
  keypoints:next.keypoints.map(point=>{const before=previousByName.get(point.name)??point;return{...point,x:before.x+(point.x-before.x)*ratio,y:before.y+(point.y-before.y)*ratio}}),
  centerOfMass:next.centerOfMass&&previous.centerOfMass?{x:previous.centerOfMass.x+(next.centerOfMass.x-previous.centerOfMass.x)*ratio,y:previous.centerOfMass.y+(next.centerOfMass.y-previous.centerOfMass.y)*ratio}:next.centerOfMass,
 } satisfies ReferencePoseFrame;
}
