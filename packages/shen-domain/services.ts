import{masterSentences,reflectionQuestions,shenPractices}from'./content';
import{shenProfiles,toDomainShenId}from'./config';
import type{MovementComparison,PoseKeypoint,ShenActivity,ShenIdLike,UserShenProgress}from'./types';
const clamp=(value:number)=>Math.max(0,Math.min(100,Math.round(value)));
const daysSince=(date?:string)=>date?Math.max(0,(Date.now()-new Date(date).getTime())/86400000):99;

export function calculateShenProgress(activities:ShenActivity[],shenLike:ShenIdLike):UserShenProgress{
 const shenId=toDomainShenId(shenLike);
 const own=activities.filter(item=>item.shenId===shenId);
 const practices=own.filter(item=>item.type==='practice');
 const reflections=own.filter(item=>item.type==='reflection');
 const breaths=own.filter(item=>item.type==='breath');
 const last=own.map(item=>item.createdAt).sort().at(-1);
 const recent7=own.filter(item=>daysSince(item.createdAt)<=7);
 const recent14=own.filter(item=>daysSince(item.createdAt)<=14);
 const uniquePractices=new Set(practices.map(item=>item.practiceId).filter(Boolean)).size;
 const measuredMovement=practices.flatMap(item=>typeof item.movementQuality==='number'?[item.movementQuality]:[]);
 const dimensions={
  practiceConsistency:clamp(recent7.filter(item=>item.type==='practice').length/4*100),
  movementQuality:measuredMovement.length?clamp(measuredMovement.reduce((sum,value)=>sum+value,0)/measuredMovement.length):0,
  breathingAwareness:clamp((breaths.length+practices.filter(item=>(item.breathingAwareness??0)>0).length)/Math.max(1,practices.length+2)*100),
  reflectionEngagement:clamp(reflections.length/Math.max(2,practices.length)*100),
  practiceVariety:clamp(uniquePractices/3*100),
  completionRate:clamp(practices.filter(item=>item.completed!==false).length/Math.max(1,practices.length)*100),
 };
 const experience=practices.length*35+own.reduce((sum,item)=>sum+(item.minutes??0)*2,0)+reflections.length*15;
 const trend=recent7.length>recent14.length/2?'growing':daysSince(last)>10?'needs-attention':'stable';
 return{shenId,experience,level:1+Math.floor(experience/240),practiceMinutes:practices.reduce((sum,item)=>sum+(item.minutes??0),0),completedPractices:practices.filter(item=>item.completed!==false).length,reflectionCount:reflections.length,consistencyScore:dimensions.practiceConsistency,movementQualityScore:dimensions.movementQuality,breathingConsistencyScore:dimensions.breathingAwareness,lastPracticedAt:last,recentTrend:trend,dimensions};
}

export function getProgressLabel(progress:UserShenProgress){
 if(progress.recentTrend==='needs-attention')return'Son günlerde daha az çalışıldı';
 const average=Object.values(progress.dimensions).reduce((a,b)=>a+b,0)/6;
 if(average>=72)return'Dengeli ilerliyor';
 if(progress.recentTrend==='growing')return'Gelişiyor';
 return'Biraz daha ilgi isteyebilir';
}

export function getShenRecommendation(progresses:UserShenProgress[]){
 const stable=progresses.sort((a,b)=>b.dimensions.practiceConsistency-a.dimensions.practiceConsistency)[0];
 const variety=progresses.sort((a,b)=>a.dimensions.practiceVariety-b.dimensions.practiceVariety)[0];
 const breath=progresses.sort((a,b)=>a.dimensions.breathingAwareness-b.dimensions.breathingAwareness)[0];
 const reflection=progresses.sort((a,b)=>a.dimensions.reflectionEngagement-b.dimensions.reflectionEngagement)[0];
 if(stable?.dimensions.practiceConsistency>=70&&variety?.dimensions.practiceVariety<45)return'İstikrarın güçlü. Bu hafta Hun alanını yeni bir akışla genişletebilirsin.';
 if(breath?.dimensions.breathingAwareness<40)return'Hareket düzenin oturuyor. Po pratiğiyle nefese biraz daha alan açabilirsin.';
 if(reflection?.dimensions.reflectionEngagement<35)return'Son pratiklerinden birini tek cümleyle hatırlamak, Yi yolculuğunu destekleyebilir.';
 return'Son pratiklerin dengeli ilerliyor. Geçişleri biraz uzatmak Zhi kalitesini derinleştirebilir.';
}

export const getPracticeForShen=(id:ShenIdLike)=>shenPractices.filter(item=>item.shenId===toDomainShenId(id));
export const getQuestionForShen=(id:ShenIdLike,seed=0)=>{const list=reflectionQuestions.filter(item=>item.shenId===toDomainShenId(id));return list[Math.abs(seed)%list.length]};
export const getMasterSentence=(id:ShenIdLike,seed=0)=>{const list=masterSentences.filter(item=>item.shenId===toDomainShenId(id));return list[Math.abs(seed)%list.length]};

export function compareMovement(user:PoseKeypoint[],reference:PoseKeypoint[]):MovementComparison{
 const byName=(points:PoseKeypoint[])=>new Map(points.map(item=>[item.name,item]));
 const a=byName(user),b=byName(reference);
 const distance=(name:string)=>{const first=a.get(name),second=b.get(name);return first&&second?Math.hypot(first.x-second.x,first.y-second.y):.3};
 const hands=clamp(100-(distance('left_wrist')+distance('right_wrist'))*180);
 const shoulders=clamp(100-Math.abs(distance('left_shoulder')-distance('right_shoulder'))*200);
 const center=clamp(100-(distance('left_hip')+distance('right_hip'))*140);
 const flow=clamp((hands+shoulders+center)/3);
 const feedback:string[]=[];
 if(hands>=72)feedback.push('Kol yolun doğru yönde. Geçişi biraz daha yavaşlat.');
 else feedback.push('Ellerin referans yoluna yaklaşırken omuzlarını yumuşak tut.');
 if(center<68)feedback.push('Ağırlığı ön ayağa daha kademeli aktarabilirsin.');
 return{timing:flow,handPath:hands,shoulderLevel:shoulders,torsoDirection:center,kneeAngle:center,centerTransfer:center,flow,feedback:feedback.slice(0,2)};
}

export const emptyProgress=()=>shenProfiles.map(profile=>calculateShenProgress([],profile.id));
