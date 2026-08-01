import{practice2VisibilityThreshold}from'./config';
import type{Practice2Metric,Practice2MetricId,Practice2PosePoint}from'./types';
export const clamp=(value:number,min=0,max=100)=>Math.min(max,Math.max(min,value));
export const visible=(pose:readonly Practice2PosePoint[],name:string)=>pose.find(point=>point.name===name&&(point.score??1)>=practice2VisibilityThreshold);
export const distance=(a:Practice2PosePoint,b:Practice2PosePoint)=>Math.hypot(a.x-b.x,a.y-b.y);
export function angle(a:Practice2PosePoint,b:Practice2PosePoint,c:Practice2PosePoint){const ab={x:a.x-b.x,y:a.y-b.y},cb={x:c.x-b.x,y:c.y-b.y},d=Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);if(!d)return 0;return Math.acos(clamp((ab.x*cb.x+ab.y*cb.y)/d,-1,1))*180/Math.PI}
export const errorScore=(error:number,tolerance:number)=>Math.round(clamp(100*(1-error/Math.max(.0001,tolerance))));
export const metric=(id:Practice2MetricId,label:string,value:number|null,detail:string):Practice2Metric=>({id,label,value,detail,available:value!==null});
export function normalizePose(pose:readonly Practice2PosePoint[]){const ls=visible(pose,'left_shoulder'),rs=visible(pose,'right_shoulder'),lh=visible(pose,'left_hip'),rh=visible(pose,'right_hip');if(!ls||!rs||!lh||!rh)return null;const centerX=(lh.x+rh.x)/2,centerY=(ls.y+rs.y+lh.y+rh.y)/4,scale=Math.max(.001,distance(ls,rs));return pose.map(point=>({...point,x:(point.x-centerX)/scale,y:(point.y-centerY)/scale}))}
export function weightedScore(metrics:readonly Practice2Metric[],weights:Partial<Record<Practice2MetricId,number>>){let sum=0,total=0;for(const item of metrics){const weight=weights[item.id]??0;if(item.value===null||!weight)continue;sum+=item.value*weight;total+=weight}return total?Math.round(sum/total):null}
