import Svg,{Circle,Line} from 'react-native-svg';
import {livingReferencePoses,type LivingMovementStep,type LivingPosePoint} from '../../data/livingLearning';

const connections=[['left_shoulder','right_shoulder'],['left_shoulder','left_elbow'],['left_elbow','left_wrist'],['right_shoulder','right_elbow'],['right_elbow','right_wrist'],['left_shoulder','left_hip'],['right_shoulder','right_hip'],['left_hip','right_hip'],['left_hip','left_knee'],['left_knee','left_ankle'],['right_hip','right_knee'],['right_knee','right_ankle']]as const;

export function LivingPoseOverlay({pose,width,height,imageWidth,imageHeight,mirror=true}:{pose:readonly LivingPosePoint[];width:number;height:number;imageWidth:number;imageHeight:number;mirror?:boolean}){
 const scale=Math.max(width/Math.max(1,imageWidth),height/Math.max(1,imageHeight)),offsetX=(width-imageWidth*scale)/2,offsetY=(height-imageHeight*scale)/2;
 const get=(name:string)=>{const item=pose.find(point=>point.name===name&&(point.score??1)>=.38);if(!item)return null;const x=item.x*imageWidth*scale+offsetX;return{x:mirror?width-x:x,y:item.y*imageHeight*scale+offsetY}};
 return <Svg pointerEvents="none" width={width} height={height} style={{position:'absolute',left:0,top:0}}>
  {connections.map(([a,b])=>{const p1=get(a),p2=get(b);return p1&&p2?<Line key={`${a}-${b}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(169,217,119,.86)" strokeWidth={2} strokeLinecap="round"/>:null})}
  {[...new Set(connections.flat())].map(name=>{const item=get(name);return item?<Circle key={name} cx={item.x} cy={item.y} r={4.2} fill="#F2EEE7" stroke="#A9D977" strokeWidth={2}/>:null})}
 </Svg>;
}

export function LivingGhostOverlay({step,width=92,height=190}:{step:LivingMovementStep;width?:number;height?:number}){
 const pose=livingReferencePoses[step.referencePoseId]??[],get=(name:string)=>pose.find(item=>item.name===name);
 return <Svg width={width} height={height} viewBox="5 2 90 96" opacity={.72}>
  <Circle cx={50} cy={18} r={5.4} fill="rgba(255,240,189,.16)" stroke="#FFF0BD" strokeWidth={1.6}/>
  {connections.map(([a,b])=>{const p1=get(a),p2=get(b);return p1&&p2?<Line key={`${a}-${b}`} x1={p1.x*100} y1={p1.y*100} x2={p2.x*100} y2={p2.y*100} stroke="#FFF0BD" strokeWidth={2} strokeLinecap="round"/>:null})}
  {pose.map(item=><Circle key={item.name} cx={item.x*100} cy={item.y*100} r={2} fill="#F3CF8B" stroke="#FFF0BD" strokeWidth={.35}/>)}
 </Svg>;
}
