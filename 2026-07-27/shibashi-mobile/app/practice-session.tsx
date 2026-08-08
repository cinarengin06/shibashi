import {Ionicons} from '@expo/vector-icons';
import {CameraType,CameraView,useCameraPermissions} from 'expo-camera';
import {router,useLocalSearchParams} from 'expo-router';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg,{Circle,Line,Polyline} from 'react-native-svg';
import {compareMovement,getGhostSequence,getInterpolatedGhostFrame,getMasterSentence,getPracticeForShen,toDomainShenId,type GhostMode,type PoseKeypoint,type ReferencePoseFrame,type TraceMode} from '../../../packages/shen-domain';
import {PrimaryButton} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {movements,practices} from '../data/content';
import {MediaPipePoseBridge,MediaPipePoseBridgeRef,PoseLandmark} from '../services/pose/MediaPipePoseBridge';
import {useApp} from '../store/AppStore';

type TrailPoint={x:number;y:number;at:number};
const skeletonConnections=[['left_shoulder','right_shoulder'],['left_shoulder','left_elbow'],['left_elbow','left_wrist'],['right_shoulder','right_elbow'],['right_elbow','right_wrist'],['left_shoulder','left_hip'],['right_shoulder','right_hip'],['left_hip','right_hip'],['left_hip','left_knee'],['left_knee','left_ankle'],['right_hip','right_knee'],['right_knee','right_ankle']]as const;
const mediaNames=['nose','left_eye_inner','left_eye','left_eye_outer','right_eye_inner','right_eye','right_eye_outer','left_ear','right_ear','mouth_left','mouth_right','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_pinky','right_pinky','left_index','right_index','left_thumb','right_thumb','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle','left_heel','right_heel','left_foot_index','right_foot_index'];

export default function PracticeSession(){
 const params=useLocalSearchParams<{practiceId?:string;movementId?:string;shenId?:string}>();
 const[permission,requestPermission]=useCameraPermissions();
 const{profile,practicePreferences,updatePracticePreferences}=useApp();
 const shenId=toDomainShenId(params.shenId||profile.selectedShenId);
 const domainPractice=getPracticeForShen(shenId).find(item=>item.id===params.practiceId);
 const legacyPractice=practices.find(item=>item.id===params.practiceId);
 const list=params.movementId?[params.movementId]:(domainPractice?.movementIds||legacyPractice?.movementIds||['movement-1']);
 const[facing,setFacing]=useState<CameraType>('front');
 const[started,setStarted]=useState(false);
 const[paused,setPaused]=useState(false);
 const[seconds,setSeconds]=useState(0);
 const[motionTime,setMotionTime]=useState(0);
 const[ghostMode,setGhostMode]=useState<GhostMode>(practicePreferences.ghostMode);
 const[traceMode,setTraceMode]=useState<TraceMode>(practicePreferences.traceMode);
 const[voiceEnabled,setVoiceEnabled]=useState(practicePreferences.voiceEnabled);
 const[userPose,setUserPose]=useState<PoseKeypoint[]>([]);
 const[feedback,setFeedback]=useState('Tam bedenin göründüğünde hareket karşılaştırması başlayacak.');
 const[score,setScore]=useState(0);
 const[postureScore,setPostureScore]=useState(0);
 const[balanceScore,setBalanceScore]=useState(0);
 const[validSamples,setValidSamples]=useState(0);
 const[modelState,setModelState]=useState<'loading'|'ready'|'error'>('loading');
 const[index,setIndex]=useState(0);
 const cameraRef=useRef<CameraView|null>(null);
 const bridgeRef=useRef<MediaPipePoseBridgeRef|null>(null);
 const trailRef=useRef<Record<'left'|'right'|'center',TrailPoint[]>>({left:[],right:[],center:[]});
 const secondsRef=useRef(0);
 const scoreSamplesRef=useRef({count:0,posture:0,balance:0,flow:0});
 const[trailVersion,setTrailVersion]=useState(0);
 const movement=movements.find(item=>item.id===list[index])||movements[0];
 const sequence=getGhostSequence(movement.id);
 const locked=!sequence;
 const sentence=useMemo(()=>getMasterSentence(shenId,movement.order-1),[shenId,movement.order]);
 const referenceFrame=getInterpolatedGhostFrame(sequence,motionTime);
 secondsRef.current=seconds;

 useEffect(()=>{if(!started||paused)return;const timer=setInterval(()=>setSeconds(value=>{const next=value+1;const nextIndex=Math.min(list.length-1,Math.floor(next/25));setIndex(nextIndex);return next}),1000);return()=>clearInterval(timer)},[started,paused,list.length]);
 useEffect(()=>{if(!started||paused)return;const timer=setInterval(()=>setMotionTime(value=>value+80),80);return()=>clearInterval(timer)},[started,paused]);

 useEffect(()=>{
  if(!started||paused||!permission?.granted)return;
  let cancelled=false;let timer:ReturnType<typeof setTimeout>|undefined;
  const run=async()=>{
   if(cancelled||!cameraRef.current)return;
   try{
    const photo=await cameraRef.current.takePictureAsync({base64:true,quality:.34,skipProcessing:false,shutterSound:false});
    if(!photo?.base64)throw new Error('Kare alınamadı');
    const analysis=await bridgeRef.current?.analyze(photo.base64);
    if(!analysis)throw new Error('Model hazırlanıyor');
    if(cancelled)return;
    const pose=toNamedPose(analysis.landmarks);
    setUserPose(pose);setModelState('ready');
    updateTrails(pose,trailRef.current);setTrailVersion(value=>value+1);
    const required=['left_shoulder','right_shoulder','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'];
    const visibleCount=required.filter(name=>(pose.find(point=>point.name===name)?.score??0)>=.38).length;
    if(visibleCount<required.length){
     setFeedback('Puanlama için omuz, kalça, diz ve ayak bileklerinin tamamı görünmeli.');
     if(!cancelled)timer=setTimeout(()=>void run(),720);
     return;
    }
    const liveReference=getInterpolatedGhostFrame(sequence,secondsRef.current*1000);
    if(liveReference){
     const result=compareMovement(pose,liveReference.keypoints);
     const posture=Math.round((result.shoulderLevel+result.torsoDirection+result.kneeAngle)/3);
     const balance=result.centerTransfer;
     const samples=scoreSamplesRef.current;
     samples.count+=1;samples.posture+=posture;samples.balance+=balance;samples.flow+=result.flow;
     const nextPosture=Math.round(samples.posture/samples.count),nextBalance=Math.round(samples.balance/samples.count),nextFlow=Math.round(samples.flow/samples.count);
     setPostureScore(nextPosture);setBalanceScore(nextBalance);setScore(nextFlow);setValidSamples(samples.count);setFeedback(result.feedback[0]||'Akışını sakin biçimde sürdür.');
    }else setFeedback('Bu hareket için Ghost Teacher henüz hazırlanıyor. Normal rehberlikle devam edebilirsin.');
   }catch(error){if(!cancelled)setModelState(error instanceof Error&&error.message.includes('hazır')?'loading':'error')}
   if(!cancelled)timer=setTimeout(()=>void run(),720);
  };
  timer=setTimeout(()=>void run(),400);
  return()=>{cancelled=true;if(timer)clearTimeout(timer)};
 },[started,paused,permission?.granted,movement.id]);

 const setGhost=(mode:GhostMode)=>{setGhostMode(mode);updatePracticePreferences({ghostMode:mode})};
 const setTrace=(mode:TraceMode)=>{setTraceMode(mode);updatePracticePreferences({traceMode:mode})};
 const hasRealScore=modelState==='ready'&&validSamples>=3&&postureScore>0&&balanceScore>0&&score>0;
 const finish=()=>{if(!hasRealScore)return;router.replace({pathname:'/practice-result',params:{practiceId:params.practiceId||params.movementId||domainPractice?.id||'free',duration:Math.max(1,Math.ceil(seconds/60)),posture:postureScore,balance:balanceScore,flow:score,samples:validSamples,shenId,masterSentenceId:sentence.id,feedback,analysisSource:'mediapipe-33'}})};

 if(!permission)return <View style={c.permission}/>;
 if(!permission.granted)return <SafeAreaView style={c.permission}><View style={c.permissionIcon}><Ionicons name="camera-outline" size={42} color={colors.gold}/></View><Text style={c.permissionTitle}>Kamera rehberini aç</Text><Text style={c.permissionBody}>Görüntün kaydedilmez veya sunucuya gönderilmez. Poz ölçümü cihazdaki akışta işlenir.</Text><PrimaryButton label="Kameraya izin ver" icon="camera" onPress={requestPermission}/><Pressable onPress={()=>router.back()}><Text style={c.cancel}>Şimdi değil</Text></Pressable></SafeAreaView>;
 if(locked)return <SafeAreaView style={c.permission}><View style={c.permissionIcon}><Ionicons name="lock-closed" size={42} color={colors.gold}/></View><Text style={c.permissionTitle}>Bu hareket kilitli</Text><Text style={c.permissionBody}>Gerçek zamanlı analiz şu anda ilk üç harekette açık. Bu hareketin referans modeli hazır olduğunda otomatik açılacak.</Text><PrimaryButton label="Hareketlere dön" icon="arrow-back" onPress={()=>router.back()}/></SafeAreaView>;

 return <View style={c.root}>
  <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} active={!paused} mirror={facing==='front'}/>
  <View style={c.shade}/>
  <GhostCanvas frame={referenceFrame} ghostMode={ghostMode} traceMode={traceMode} userPose={userPose} trails={trailRef.current} trailVersion={trailVersion} opacity={practicePreferences.ghostOpacity} sequence={sequence} timeMs={motionTime}/>
  <SafeAreaView style={c.overlay} pointerEvents="box-none">
   <View style={c.top}><Pressable onPress={()=>router.back()} style={c.icon}><Ionicons name="close" color={colors.cream} size={23}/></Pressable><View style={c.topCenter}><Text style={c.movementTitle}>{movement.name}</Text><Text style={c.progress}>{index+1}/{list.length} · {seconds}s</Text></View><Pressable onPress={()=>setVoiceEnabled(value=>!value)} style={c.icon}><Ionicons name={voiceEnabled?'volume-high':'volume-mute'} color={colors.cream} size={22}/></Pressable></View>
   {!started?<View style={c.setup}><Text style={c.intentLabel}>BU PRATİĞİN NİYETİ</Text><Text style={c.intent}>“{sentence.text}”</Text><Text style={c.setupText}>{sequence?'Referans hareket hazır. Modunu seçip kamerada tam bedenini görünür kıl.':'Bu hareket için referans sequence henüz hazırlanıyor; normal pratik kullanılacak.'}</Text><ModeRow active={ghostMode} options={[['follow','Takip'],['mirror','Ayna'],['trace','İz']]} onSelect={value=>setGhost(value as GhostMode)}/><ModeRow active={traceMode} options={[['off','Kapalı'],['teacher','Öğretmen'],['user','Ben'],['compare','Karşılaştır']]} onSelect={value=>setTrace(value as TraceMode)}/><PrimaryButton label="Pratiği başlat" icon="play" onPress={()=>setStarted(true)}/></View>:<>
    {seconds<5||paused?<View style={c.intentFloat}><Text style={c.intentLabel}>BU PRATİĞİN NİYETİ</Text><Text style={c.intentSmall}>“{sentence.text}”</Text></View>:null}
    <View style={c.feedback}><Text style={c.feedbackLabel}>{validSamples>0?`GERÇEK ÖLÇÜM · DURUŞ ${postureScore} · DENGE ${balanceScore} · AKIŞ ${score} · ${validSamples} KARE`:modelState==='loading'?'MEDIAPIPE HAZIRLANIYOR':'TAM BEDEN BEKLENİYOR'}</Text><Text style={c.feedbackText}>{feedback}</Text></View>
    <View style={c.bottom}><View style={c.controls}><Control icon="body-outline" label={`Ghost · ${ghostMode==='follow'?'Takip':ghostMode==='mirror'?'Ayna':'İz'}`} onPress={()=>setGhost(ghostMode==='follow'?'mirror':ghostMode==='mirror'?'trace':'follow')}/><Control icon="analytics-outline" label={`İz · ${traceMode==='off'?'Kapalı':traceMode==='teacher'?'Öğretmen':traceMode==='user'?'Ben':'İkisi'}`} onPress={()=>setTrace(traceMode==='off'?'teacher':traceMode==='teacher'?'user':traceMode==='user'?'compare':'off')}/><Control icon={voiceEnabled?'volume-high-outline':'volume-mute-outline'} label="Ses" onPress={()=>setVoiceEnabled(value=>!value)}/><Control icon={paused?'play':'pause'} label={paused?'Sürdür':'Duraklat'} onPress={()=>setPaused(value=>!value)}/></View><Pressable disabled={!hasRealScore} onPress={finish} style={[c.finish,!hasRealScore&&c.finishDisabled]}><Text style={[c.finishText,!hasRealScore&&c.finishTextDisabled]}>{hasRealScore?'Bitir ve değerlendir':'Tam bedenini algıla'}</Text></Pressable></View>
   </>}
  </SafeAreaView>
  <MediaPipePoseBridge ref={bridgeRef}/>
 </View>;
}

function GhostCanvas({frame,ghostMode,traceMode,userPose,trails,opacity,sequence,timeMs}:{frame?:ReferencePoseFrame;ghostMode:GhostMode;traceMode:TraceMode;userPose:PoseKeypoint[];trails:Record<'left'|'right'|'center',TrailPoint[]>;trailVersion:number;opacity:number;sequence:ReturnType<typeof getGhostSequence>;timeMs:number}){
 const ghost=frame?.keypoints??[];const mirror=ghostMode==='mirror',visibleOpacity=Math.max(.58,opacity);
 const point=(points:PoseKeypoint[],name:string)=>points.find(item=>item.name===name);
 const line=(points:PoseKeypoint[],start:string,end:string,color:string,width:number,key:string,alpha=1)=>{const a=point(points,start),b=point(points,end);if(!a||!b)return null;return <Line key={key} x1={(mirror?1-a.x:a.x)*100} y1={a.y*100} x2={(mirror?1-b.x:b.x)*100} y2={b.y*100} stroke={color} strokeOpacity={alpha} strokeWidth={width}/>};
 const trailPoints=(items:TrailPoint[],flip=false)=>items.map(item=>`${(flip?1-item.x:item.x)*100},${item.y*100}`).join(' ');
 const teacherTime=sequence?timeMs%sequence.durationMs:0;
 const teacherTrail=(name:string)=>sequence?.frames.filter(item=>item.timestampMs<=teacherTime&&teacherTime-item.timestampMs<=2500).flatMap(item=>item.keypoints.filter(point=>point.name===name).map(point=>({x:point.x,y:point.y,at:item.timestampMs})))??[];
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg viewBox="5 2 90 96" width="100%" height="100%" preserveAspectRatio="none">
  {frame&&ghostMode!=='trace'&&skeletonConnections.map(([a,b],index)=>line(ghost,a,b,'#F3CF8B',.58,`g-${index}`,visibleOpacity))}
  {frame&&ghostMode!=='trace'&&ghost.map(item=><Circle key={`gp-${item.name}`} cx={(mirror?1-item.x:item.x)*100} cy={item.y*100} r=".82" fill="#FFF0BD" stroke="#F3CF8B" strokeWidth=".18" fillOpacity={visibleOpacity}/>)}
  {userPose.length>0&&skeletonConnections.map(([a,b],index)=>line(userPose,a,b,'#A9D977',.28,`u-${index}`,.85))}
  {(ghostMode==='trace'||traceMode==='teacher'||traceMode==='compare')&&frame?<><Polyline points={trailPoints(teacherTrail('left_wrist'),mirror)} fill="none" stroke="#C6A56A" strokeOpacity=".45" strokeWidth=".35"/><Polyline points={trailPoints(teacherTrail('right_wrist'),mirror)} fill="none" stroke="#C6A56A" strokeOpacity=".45" strokeWidth=".35"/></>:null}
  {(traceMode==='user'||traceMode==='compare')&&(['left','right','center']as const).map(name=><Polyline key={name} points={trailPoints(trails[name],true)} fill="none" stroke={name==='center'?'#F2EEE7':'#A9D977'} strokeOpacity={name==='center'?'.52':'.78'} strokeWidth={name==='center'?'.25':'.38'}/>)}
 </Svg></View>;
}
function ModeRow({active,options,onSelect}:{active:string;options:[string,string][];onSelect:(value:string)=>void}){return <View style={c.modeRow}>{options.map(([id,label])=><Pressable key={id} onPress={()=>onSelect(id)} style={[c.mode,active===id&&c.modeOn]}><Text style={[c.modeText,active===id&&c.modeTextOn]}>{label}</Text></Pressable>)}</View>}
function Control({icon,label,onPress}:{icon:keyof typeof Ionicons.glyphMap;label:string;onPress:()=>void}){return <Pressable onPress={onPress} style={c.control}><Ionicons name={icon} color={colors.cream} size={19}/><Text style={c.controlText}>{label}</Text></Pressable>}
function toNamedPose(landmarks:PoseLandmark[]):PoseKeypoint[]{return landmarks.map((item,index)=>({name:mediaNames[index]||`point-${index}`,x:item.x,y:item.y,score:item.visibility}))}
function updateTrails(pose:PoseKeypoint[],trails:Record<'left'|'right'|'center',TrailPoint[]>){const now=Date.now();const get=(name:string)=>pose.find(item=>item.name===name);const left=get('left_wrist'),right=get('right_wrist'),leftHip=get('left_hip'),rightHip=get('right_hip');if(left)trails.left.push({x:left.x,y:left.y,at:now});if(right)trails.right.push({x:right.x,y:right.y,at:now});if(leftHip&&rightHip)trails.center.push({x:(leftHip.x+rightHip.x)/2,y:(leftHip.y+rightHip.y)/2,at:now});for(const key of ['left','right','center']as const)trails[key]=trails[key].filter(item=>now-item.at<=2500).slice(-20)}
const c=StyleSheet.create({root:{flex:1,backgroundColor:colors.ink},shade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(5,10,7,.2)'},overlay:{flex:1,justifyContent:'space-between'},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16},topCenter:{alignItems:'center'},movementTitle:{color:colors.cream,fontSize:16,fontWeight:'700'},progress:{color:colors.muted,fontSize:16,marginTop:2},icon:{width:48,height:48,borderRadius:15,backgroundColor:'rgba(17,23,19,.82)',borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},setup:{position:'absolute',left:18,right:18,bottom:34,backgroundColor:'rgba(17,23,19,.96)',borderRadius:22,borderWidth:1,borderColor:colors.line,padding:18,gap:13},intentLabel:{color:colors.gold,fontSize:16,fontWeight:'900',letterSpacing:1.2},intent:{color:colors.cream,fontSize:22,lineHeight:30,fontFamily:'Newsreader_600SemiBold'},setupText:{color:colors.muted,fontSize:17,lineHeight:28},modeRow:{flexDirection:'row',gap:6},mode:{flex:1,minHeight:48,borderRadius:12,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},modeOn:{backgroundColor:colors.gold,borderColor:colors.gold},modeText:{color:colors.muted,fontSize:16,fontWeight:'700'},modeTextOn:{color:colors.ink},intentFloat:{position:'absolute',top:82,left:18,right:18,backgroundColor:'rgba(17,23,19,.86)',borderRadius:15,padding:12,borderWidth:1,borderColor:colors.line},intentSmall:{color:colors.cream,fontSize:16,lineHeight:25,marginTop:4},feedback:{position:'absolute',left:18,right:18,bottom:145,backgroundColor:'rgba(10,15,12,.88)',borderRadius:15,borderWidth:1,borderColor:colors.line,padding:12},feedbackLabel:{color:colors.gold,fontSize:16,fontWeight:'900',letterSpacing:1},feedbackText:{color:colors.cream,fontSize:16,lineHeight:24,marginTop:4},bottom:{backgroundColor:'rgba(10,15,12,.94)',padding:14,gap:10,borderTopWidth:1,borderColor:colors.line},controls:{flexDirection:'row',gap:6},control:{flex:1,minHeight:55,alignItems:'center',justifyContent:'center',gap:4},controlText:{color:colors.muted,fontSize:17,textAlign:'center'},finish:{height:48,borderRadius:radii.pill,borderWidth:1,borderColor:colors.gold,alignItems:'center',justifyContent:'center'},finishDisabled:{borderColor:colors.line,opacity:.7},finishText:{color:colors.cream,fontSize:16,fontWeight:'800'},finishTextDisabled:{color:colors.muted},permission:{flex:1,backgroundColor:colors.ink,padding:28,alignItems:'center',justifyContent:'center',gap:20},permissionIcon:{width:90,height:90,borderRadius:45,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},permissionTitle:{color:colors.cream,fontSize:26,fontWeight:'700',textAlign:'center'},permissionBody:{color:colors.muted,fontSize:16,lineHeight:24,textAlign:'center'},cancel:{color:colors.muted,fontWeight:'600',padding:12}});
