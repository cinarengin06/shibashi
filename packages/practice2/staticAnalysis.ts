import{practice2MinimumLandmarks,staticMetricWeights}from'./config';
import{bowStanceTarget}from'./data';
import{angle,distance,errorScore,metric,normalizePose,visible,weightedScore}from'./math';
import type{Practice2Analysis,Practice2Metric,Practice2PosePoint,Practice2PoseSample}from'./types';

export function analyzeStaticPractice(current:readonly Practice2PoseSample[],now:Practice2PoseSample,target:readonly Practice2PosePoint[]=bowStanceTarget):Practice2Analysis{
 const pose=now.keypoints,required=['left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'],count=required.filter(name=>visible(pose,name)).length,confidence=count/required.length;
 if(count<practice2MinimumLandmarks)return{overallScore:null,confidence,metrics:[],correction:'Başından ayaklarına kadar kadrajda kal.'};
 const p=(name:string)=>visible(pose,name)!,t=(name:string)=>visible(target,name)!;
 const shoulderTilt=Math.abs((p('left_shoulder').y-p('right_shoulder').y)-(t('left_shoulder').y-t('right_shoulder').y)),hipTilt=Math.abs((p('left_hip').y-p('right_hip').y)-(t('left_hip').y-t('right_hip').y));
 const shoulderScore=errorScore(shoulderTilt,.08),hipScore=errorScore(hipTilt,.08);
 const frontKnee=angle(p('left_hip'),p('left_knee'),p('left_ankle')),backKnee=angle(p('right_hip'),p('right_knee'),p('right_ankle')),targetFront=angle(t('left_hip'),t('left_knee'),t('left_ankle')),targetBack=angle(t('right_hip'),t('right_knee'),t('right_ankle'));
 const kneeScore=Math.round((errorScore(Math.abs(frontKnee-targetFront),55)+errorScore(Math.abs(backKnee-targetBack),45))/2);
 const shoulderMid={x:(p('left_shoulder').x+p('right_shoulder').x)/2,y:(p('left_shoulder').y+p('right_shoulder').y)/2,name:'shoulder'},hipMid={x:(p('left_hip').x+p('right_hip').x)/2,y:(p('left_hip').y+p('right_hip').y)/2,name:'hip'};
 const torsoScore=errorScore(Math.abs(shoulderMid.x-hipMid.x),.13);
 const normalized=normalizePose(pose),normalizedTarget=normalizePose(target);let armScore:number|null=null;
 if(normalized&&normalizedTarget){const get=(items:typeof normalized,name:string)=>visible(items,name)!;armScore=Math.round((errorScore(distance(get(normalized,'left_wrist'),get(normalizedTarget,'left_wrist')),1.15)+errorScore(distance(get(normalized,'right_wrist'),get(normalizedTarget,'right_wrist')),1.15))/2)}
 const alignment=Math.round((shoulderScore+hipScore+torsoScore+kneeScore)/4),stability=stabilityScore(current.slice(-12));
 const metrics:Practice2Metric[]=[metric('alignment','Duruş hizası',alignment,'Omuz, kalça ve ayak ekseni'),metric('weightDistribution','Ağırlık dağılımı',null,'Tek kameradan güvenilir biçimde ölçülemiyor'),metric('kneeAngles','Diz açıları',kneeScore,`Ön ${Math.round(frontKnee)}° · Arka ${Math.round(backKnee)}°`),metric('torsoBalance','Gövde dengesi',torsoScore,'Gövdenin dik ekseni'),metric('armPosition','Kol konumu',armScore,'Bilek, dirsek ve omuz ilişkisi'),metric('shoulderHipLevel','Omuz ve kalça hizası',Math.round((shoulderScore+hipScore)/2),'Yatay çizgi dengesi'),metric('stability','Sabit kalma',stability,stability===null?'En az dört ölçüm karesi gerekli':'Son ölçümlerdeki salınım')];
 const overallScore=weightedScore(metrics,staticMetricWeights),values=metrics.filter(item=>item.value!==null).sort((a,b)=>(a.value??0)-(b.value??0)),weak=values[0],strong=values[values.length-1];
 const correction=!weak||weak.value!<72?undefined:weak.id==='kneeAngles'?'Ön dizini biraz daha bük.':weak.id==='torsoBalance'?'Gövdeni biraz daha dik tut.':weak.id==='armPosition'?'Kollarını hedef çizgiye biraz yaklaştır.':weak.id==='shoulderHipLevel'?'Omuzlarını yumuşatıp hizala.':'Ayaklarını ve merkezini hedefe yaklaştır.';
 const positive=strong?.value&&strong.value>=78?(strong.id==='armPosition'?'Kolların aynı hizada.':strong.id==='shoulderHipLevel'?'Omuzların rahat ve dengeli.':'Duruşun sakin biçimde kökleniyor.'):undefined;
 return{overallScore,confidence,metrics,correction,positive};
}

export const analyzeStaticBowStance=analyzeStaticPractice;

function stabilityScore(samples:readonly Practice2PoseSample[]){if(samples.length<4)return null;const centers=samples.map(sample=>{const ls=visible(sample.keypoints,'left_shoulder'),rs=visible(sample.keypoints,'right_shoulder'),lh=visible(sample.keypoints,'left_hip'),rh=visible(sample.keypoints,'right_hip');if(!ls||!rs||!lh||!rh)return null;return{x:(lh.x+rh.x)/2,y:(ls.y+rs.y+lh.y+rh.y)/4,scale:distance(ls,rs)}}).filter((item):item is{x:number;y:number;scale:number}=>Boolean(item));if(centers.length<4)return null;const mean={x:centers.reduce((sum,item)=>sum+item.x,0)/centers.length,y:centers.reduce((sum,item)=>sum+item.y,0)/centers.length},motion=centers.reduce((sum,item)=>sum+Math.hypot(item.x-mean.x,item.y-mean.y)/Math.max(.001,item.scale),0)/centers.length;return errorScore(motion,.08)}
