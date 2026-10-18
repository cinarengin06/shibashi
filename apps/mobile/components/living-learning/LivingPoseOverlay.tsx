import {useEffect,useRef} from 'react';
import {Animated,StyleSheet,View} from 'react-native';
import Svg,{Circle,Line} from 'react-native-svg';
import {livingGhostTeacherImages,type LivingMovementStep,type LivingPosePoint} from '../../data/livingLearning';

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
 const opacity=useRef(new Animated.Value(.35)).current;
 useEffect(()=>{opacity.setValue(.35);Animated.timing(opacity,{toValue:.92,duration:360,useNativeDriver:true}).start()},[opacity,step.id]);
 return <View style={[g.stage,{width,height}]}>
  <View style={g.halo}/><View style={g.ground}/>
  <Animated.Image fadeDuration={0} resizeMode="contain" source={livingGhostTeacherImages[step.id]} style={[g.teacher,{opacity}]}/>
 </View>;
}

const g=StyleSheet.create({stage:{alignItems:'center',justifyContent:'center',position:'relative'},halo:{position:'absolute',left:'11%',right:'11%',top:'8%',bottom:'9%',borderRadius:999,backgroundColor:'rgba(243,207,139,.07)',shadowColor:'#F3CF8B',shadowOpacity:.7,shadowRadius:24},ground:{position:'absolute',bottom:'5%',width:'58%',height:11,borderRadius:999,borderWidth:1,borderColor:'rgba(243,207,139,.58)',backgroundColor:'rgba(243,207,139,.08)',shadowColor:'#F3CF8B',shadowOpacity:.75,shadowRadius:13},teacher:{width:'100%',height:'100%',transform:[{scale:1.02}]}});
