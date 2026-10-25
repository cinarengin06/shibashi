import type { SyncRecord } from "@/packages/shen-domain";
import { movements } from "@/features/practice/data/movements";
import type { PracticeSnapshot } from "@/features/practice/types";
import type { PostureAssessmentCapture, PostureReport } from "@/features/posture/types";
import type { PostureView } from "@/packages/posture-analysis";
import { formatSnapshotDate, formatSnapshotTime, portableHistoryImage } from "./local-history-storage";

export function toWebPracticeSnapshot(record:SyncRecord):PracticeSnapshot|null {
 if(typeof record.id!=="string")return null;
 if(typeof record.movementId==="number"&&typeof record.score==="number"){
  const movement=movements.find(item=>item.id===record.movementId)??movements[0];
  const createdAt=typeof record.createdAt==="string"?record.createdAt:typeof record.date==="string"?record.date:new Date().toISOString();
  return{
   ...(record as unknown as PracticeSnapshot),
   id:record.id,
   createdAt,
   dateKey:typeof record.dateKey==="string"?record.dateKey:formatSnapshotDate(new Date(createdAt)),
   timeLabel:typeof record.timeLabel==="string"?record.timeLabel:formatSnapshotTime(new Date(createdAt)),
   movementId:record.movementId,
   movementName:typeof record.movementName==="string"?record.movementName:movement?.name??"App pratiği",
   score:record.score,
   shenName:typeof record.shenName==="string"?record.shenName:"App",
   imageData:portableHistoryImage(record.imageData,""),
  };
 }
 const createdAt=typeof record.date==="string"?record.date:typeof record.createdAt==="string"?record.createdAt:new Date().toISOString();
 const score=Number(record.flowScore??record.postureScore??record.balanceScore??0);
 const movementMatch=String(record.practiceId??"").match(/\d+/);
 const movementId=movementMatch?Number(movementMatch[0]):1;
 const movement=movements.find(item=>item.id===movementId)??movements[0];
 return{
  id:record.id,
  dateKey:formatSnapshotDate(new Date(createdAt)),
  timeLabel:formatSnapshotTime(new Date(createdAt)),
  createdAt,
  movementId,
  movementName:movement?.name??"App pratiği",
  score:Number.isFinite(score)?score:0,
  shenName:"App",
  imageData:"",
 };
}

export function toWebPostureReport(record:SyncRecord):PostureReport|null {
 if(typeof record.id!=="string"||typeof record.score!=="number")return null;
 if(record.captures&&!Array.isArray(record.captures))return record as unknown as PostureReport;
 const date=typeof record.date==="string"?record.date:new Date().toISOString();
 const sourceCaptures=Array.isArray(record.captures)?record.captures as Array<Record<string,unknown>>:[];
 const captureFor=(view:PostureView):PostureAssessmentCapture=>{
  const source=sourceCaptures.find(item=>item.view===view);
  const axisScore=Number(source?.axisScore??record.score);
  const shoulderScore=Number(source?.shoulderScore??record.score);
  const hipScore=Number(source?.hipScore??record.score);
  const measurements=(source?.measurements&&typeof source.measurements==="object"?source.measurements:{}) as Record<string,unknown>;
  const sourceConfidence=Number(source?.confidence??0);
  const confidence=Math.round(sourceConfidence<=1?sourceConfidence*100:sourceConfidence);
  const shoulderTilt=Number(view==="side"?measurements.headForwardDegrees:measurements.shoulderTiltDegrees);
  const hipTilt=Number(view==="side"?measurements.legLeanDegrees:measurements.hipTiltDegrees);
  const spineShift=Number(view==="side"?measurements.torsoLeanDegrees:measurements.axisTiltDegrees);
  return{
   view,
   createdAt:date,
   imageData:"",
   analysis:{axisScore,confidence,shoulderScore,hipScore,shoulderTilt:Number.isFinite(shoulderTilt)?shoulderTilt:0,hipTilt:Number.isFinite(hipTilt)?hipTilt:0,spineShift:Number.isFinite(spineShift)?spineShift:0,flags:[],feedback:String(source?.feedback??"App ölçümü senkronize edildi."),view},
  };
 };
 const score=record.score;
 return{
  id:record.id,
  score,
  observationVersion:record.observationVersion===2?2:undefined,
  createdAt:date,
  dateKey:formatSnapshotDate(new Date(date)),
  timeLabel:formatSnapshotTime(new Date(date)),
  captures:{front:captureFor("front"),side:captureFor("side"),back:captureFor("back")},
  asymmetrySignal:"değerlendirilmedi",
  flags:[],
  summary:String(record.summary??"App postür ölçümü senkronize edildi."),
  trendText:String(record.trendText??"App ile eşitlendi"),
 };
}

