import type {PostureCapture,PostureView} from '../../types';
import type {PoseLandmark} from './MediaPipePoseBridge';

export type PoseFrameReadiness={bodyReady:boolean;angleReady:boolean};

export function isLandmarkVisible(point:PoseLandmark|undefined,threshold=.38){
 return Boolean(point&&(point.visibility??0)>=threshold&&Number.isFinite(point.x)&&Number.isFinite(point.y));
}

export function evaluatePoseFrame(points:PoseLandmark[],view:PostureView):PoseFrameReadiness{
 if(points.length<33)return{bodyReady:false,angleReady:false};
 const headReady=[0,7,8].some(index=>isLandmarkVisible(points[index],.25));
 const torsoReady=[11,12,23,24].every(index=>isLandmarkVisible(points[index],.48));
 const legReady=[25,26].every(index=>isLandmarkVisible(points[index],.4));
 const feetReady=[27,28].every(index=>isLandmarkVisible(points[index],.34));
 const bodyReady=headReady&&torsoReady&&legReady&&feetReady;
 if(!bodyReady)return{bodyReady:false,angleReady:false};
 const shoulderCenterY=(points[11].y+points[12].y)/2;
 const ankleCenterY=(points[27].y+points[28].y)/2;
 const bodyHeight=Math.max(.1,Math.abs(ankleCenterY-shoulderCenterY));
 const shoulderWidth=Math.abs(points[11].x-points[12].x);
 const widthRatio=shoulderWidth/bodyHeight;
 const faceConfidence=[0,2,5,7,8].reduce((sum,index)=>sum+(points[index]?.visibility??0),0)/5;
 const anatomicalOrder=points[11].x-points[12].x;
 const angleReady=view==='side'
  ?widthRatio<.28
  :view==='front'
   ?widthRatio>=.24&&faceConfidence>=.5&&anatomicalOrder>-.025
   :widthRatio>=.24&&(faceConfidence<.5||anatomicalOrder<.025);
 return{bodyReady,angleReady};
}

export function getLandmarkMovement(previous:PoseLandmark[],current:PoseLandmark[]){
 if(previous.length<33||current.length<33)return Number.POSITIVE_INFINITY;
 const indexes=[0,11,12,23,24,25,26,27,28];
 return indexes.reduce((sum,index)=>{
  const first=previous[index],second=current[index];
  return sum+Math.hypot(first.x-second.x,first.y-second.y);
 },0)/indexes.length;
}

const clampScore=(value:number)=>Math.max(0,Math.min(100,Math.round(value)));
const scoreDeviation=(deviation:number,excellent:number,limit:number)=>{
 if(deviation<=excellent)return 100;
 return clampScore(100-(deviation-excellent)/(limit-excellent)*100);
};
const median=(values:number[])=>{
 const sorted=[...values].sort((a,b)=>a-b);
 const middle=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
};
const jointAngle=(first:PoseLandmark,center:PoseLandmark,last:PoseLandmark)=>{
 const a={x:first.x-center.x,y:first.y-center.y};
 const b={x:last.x-center.x,y:last.y-center.y};
 const denominator=Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y);
 if(!denominator)return 0;
 return Math.acos(Math.max(-1,Math.min(1,(a.x*b.x+a.y*b.y)/denominator)))*180/Math.PI;
};

export function createPostureCapture(view:PostureView,points:PoseLandmark[],confidence:number,analysisSource:PostureCapture['analysisSource']='mediapipe-33'):PostureCapture{
 if(points.length<33)throw new Error('Tam beden algılanamadı. Baş ve ayaklarını kadraja al.');
 const confidencePercent=Math.round(confidence*100);
 if(view==='side'){
  const best=(first:number,second:number)=>((points[first]?.visibility??0)>=(points[second]?.visibility??0)?points[first]:points[second]);
  const ear=best(7,8),shoulder=best(11,12),hip=best(23,24),knee=best(25,26),ankle=best(27,28);
  const verticalAngle=(upper:PoseLandmark,lower:PoseLandmark)=>Math.abs(Math.atan2(lower.x-upper.x,lower.y-upper.y)*180/Math.PI);
  const headAngle=verticalAngle(ear,shoulder);
  const torsoAngle=verticalAngle(shoulder,hip);
  const legAngle=verticalAngle(hip,ankle);
  const kneeAngle=jointAngle(hip,knee,ankle);
  const kneeDeviation=Math.abs(180-kneeAngle);
  const shoulderScore=scoreDeviation(headAngle,3,24);
  const torsoScore=scoreDeviation(torsoAngle,2,18);
  const legScore=scoreDeviation(legAngle,2,16);
  const kneeScore=scoreDeviation(kneeDeviation,3,24);
  const axisScore=clampScore(torsoScore*.45+legScore*.25+kneeScore*.3);
  const hipScore=scoreDeviation(Math.abs(torsoAngle-legAngle),2,16);
  const score=Math.round(shoulderScore*.3+axisScore*.45+hipScore*.25);
  return{
   view,score,shoulderScore,axisScore,hipScore,analysisSource,landmarkCount:33,confidence,sampleCount:1,
   measurements:{headForwardDegrees:headAngle,torsoLeanDegrees:torsoAngle,legLeanDegrees:legAngle,kneeFlexionDegrees:kneeDeviation},
   feedback:score>=82
    ?`Yan eksende kulak, omuz, kalça ve ayak bileği dengeli · güven %${confidencePercent}`
    :`Yan eksen: baş ${headAngle.toFixed(1)}°, gövde ${torsoAngle.toFixed(1)}°, diz sapması ${kneeDeviation.toFixed(1)}°`,
  };
 }
 const pairAngle=(left:number,right:number)=>{
  const a=points[left],b=points[right];
  return Math.abs(Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI);
 };
 const horizontalDeviation=(angle:number)=>Math.min(angle,Math.abs(180-angle));
 const shoulderTilt=horizontalDeviation(pairAngle(11,12));
 const hipTilt=horizontalDeviation(pairAngle(23,24));
 const kneeTilt=horizontalDeviation(pairAngle(25,26));
 const shoulderCenter={x:(points[11].x+points[12].x)/2,y:(points[11].y+points[12].y)/2};
 const hipCenter={x:(points[23].x+points[24].x)/2,y:(points[23].y+points[24].y)/2};
 const axisTilt=Math.abs(Math.atan2(shoulderCenter.x-hipCenter.x,hipCenter.y-shoulderCenter.y)*180/Math.PI);
 const shoulderScore=scoreDeviation(shoulderTilt,1.25,12);
 const hipScore=scoreDeviation(hipTilt,1.25,10);
 const axisScore=scoreDeviation(axisTilt,1.25,12);
 const balanceScore=scoreDeviation(kneeTilt,1.75,14);
 const score=Math.round(shoulderScore*.28+hipScore*.25+axisScore*.32+balanceScore*.15);
 return{
  view,score,shoulderScore,axisScore,hipScore,analysisSource,landmarkCount:33,confidence,sampleCount:1,
  measurements:{shoulderTiltDegrees:shoulderTilt,hipTiltDegrees:hipTilt,axisTiltDegrees:axisTilt,kneeLineTiltDegrees:kneeTilt},
  feedback:score>=82
   ?`33 noktalı ölçümde beden ekseni dengeli · güven %${confidencePercent}`
   :score>=68
    ?`Küçük hizalama farkları var · omuz ${shoulderTilt.toFixed(1)}°, kalça ${hipTilt.toFixed(1)}°`
    :`Eksen ${axisTilt.toFixed(1)}° sapıyor; çekimi daha dengeli bir duruşla tekrarla.`,
 };
}

export function aggregatePostureCaptures(view:PostureView,captures:PostureCapture[]):PostureCapture{
 if(!captures.length)throw new Error('Geçerli postür örneği bulunamadı.');
 const measurementKeys=[...new Set(captures.flatMap(item=>Object.keys(item.measurements??{})))];
 const measurements=Object.fromEntries(measurementKeys.map(key=>[key,median(captures.flatMap(item=>typeof item.measurements?.[key]==='number'?[item.measurements[key]]:[]))]));
 const score=Math.round(median(captures.map(item=>item.score)));
 const shoulderScore=Math.round(median(captures.map(item=>item.shoulderScore)));
 const axisScore=Math.round(median(captures.map(item=>item.axisScore)));
 const hipScore=Math.round(median(captures.map(item=>item.hipScore)));
 const confidence=median(captures.map(item=>item.confidence??0));
 const feedback=view==='side'
  ?`Medyan ölçüm · baş ${measurements.headForwardDegrees?.toFixed(1)??'—'}°, gövde ${measurements.torsoLeanDegrees?.toFixed(1)??'—'}°, ${captures.length} geçerli kare`
  :`Medyan ölçüm · omuz ${measurements.shoulderTiltDegrees?.toFixed(1)??'—'}°, kalça ${measurements.hipTiltDegrees?.toFixed(1)??'—'}°, ${captures.length} geçerli kare`;
 return{view,score,shoulderScore,axisScore,hipScore,confidence,feedback,analysisSource:captures[0].analysisSource,landmarkCount:33,sampleCount:captures.length,measurements};
}
