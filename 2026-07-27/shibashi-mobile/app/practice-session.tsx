import {Ionicons} from '@expo/vector-icons';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {router,useLocalSearchParams} from 'expo-router';
import * as Speech from 'expo-speech';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Animated,Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {compareMovement,getGhostSequence,getInterpolatedGhostFrame,getMasterSentence,getPracticeForShen,toDomainShenId,type PoseKeypoint,type ReferencePoseFrame} from '../../../packages/shen-domain';
import {PrimaryButton} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {movements,practices} from '../data/content';
import {livingGhostTeacherImages} from '../data/livingLearning';
import {MediaPipePoseBridge,MediaPipePoseBridgeRef,PoseLandmark} from '../services/pose/MediaPipePoseBridge';
import {useApp} from '../store/AppStore';

const mediaNames=['nose','left_eye_inner','left_eye','left_eye_outer','right_eye_inner','right_eye','right_eye_outer','left_ear','right_ear','mouth_left','mouth_right','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_pinky','right_pinky','left_index','right_index','left_thumb','right_thumb','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle','left_heel','right_heel','left_foot_index','right_foot_index'];
const fullBodyLandmarks=['left_shoulder','right_shoulder','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle'];

export default function PracticeSession(){
 const params=useLocalSearchParams<{practiceId?:string;movementId?:string;shenId?:string}>();
 const[permission,requestPermission]=useCameraPermissions();
 const{profile,practicePreferences,updatePracticePreferences}=useApp();
 const shenId=toDomainShenId(params.shenId||profile.selectedShenId);
 const domainPractice=getPracticeForShen(shenId).find(item=>item.id===params.practiceId);
 const legacyPractice=practices.find(item=>item.id===params.practiceId);
 const list=params.movementId?[params.movementId]:(domainPractice?.movementIds||legacyPractice?.movementIds||['movement-1']);
 const[started,setStarted]=useState(false);
 const[paused,setPaused]=useState(false);
 const[seconds,setSeconds]=useState(0);
 const[motionTime,setMotionTime]=useState(0);
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
 const secondsRef=useRef(0);
 const scoreSamplesRef=useRef({count:0,posture:0,balance:0,flow:0});
 const lastSpokenCueRef=useRef({text:'',at:0});
 const movement=movements.find(item=>item.id===list[index])||movements[0];
 const sequence=getGhostSequence(movement.id);
 const locked=!sequence;
 const sentence=useMemo(()=>getMasterSentence(shenId,movement.order-1),[shenId,movement.order]);
 const referenceFrame=getInterpolatedGhostFrame(sequence,motionTime);
 const fullBodyReady=fullBodyLandmarks.every(name=>(userPose.find(point=>point.name===name)?.score??0)>=.38);
 secondsRef.current=seconds;

 useEffect(()=>{if(!started||paused)return;const timer=setInterval(()=>setSeconds(value=>{const next=value+1;const nextIndex=Math.min(list.length-1,Math.floor(next/25));setIndex(nextIndex);return next}),1000);return()=>clearInterval(timer)},[started,paused,list.length]);
 useEffect(()=>{if(!started||paused)return;const timer=setInterval(()=>setMotionTime(value=>value+80),80);return()=>clearInterval(timer)},[started,paused]);
 useEffect(()=>()=>{void Speech.stop()},[]);
 useEffect(()=>{
  if(!started||paused||!voiceEnabled||!feedback)return;
  const now=Date.now();
  if(lastSpokenCueRef.current.text===feedback||now-lastSpokenCueRef.current.at<7000)return;
  lastSpokenCueRef.current={text:feedback,at:now};
  void Speech.stop();
  Speech.speak(feedback,{language:'tr-TR',rate:.86,pitch:1});
 },[feedback,paused,started,voiceEnabled]);

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
    const visibleCount=fullBodyLandmarks.filter(name=>(pose.find(point=>point.name===name)?.score??0)>=.38).length;
    if(visibleCount<fullBodyLandmarks.length){
     setFeedback('Biraz geri çekil. Omuzların, kalçan, dizlerin ve ayakların kadrajda olsun.');
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
    }
   }catch(error){if(!cancelled)setModelState(error instanceof Error&&error.message.includes('hazır')?'loading':'error')}
   if(!cancelled)timer=setTimeout(()=>void run(),720);
  };
  timer=setTimeout(()=>void run(),400);
  return()=>{cancelled=true;if(timer)clearTimeout(timer)};
 },[started,paused,permission?.granted,movement.id]);

 const speakNow=(text:string)=>{if(!voiceEnabled)return;lastSpokenCueRef.current={text,at:Date.now()};void Speech.stop();Speech.speak(text,{language:'tr-TR',rate:.86,pitch:1})};
 const startPractice=()=>{setStarted(true);setPaused(false);speakNow(`${movement.name}. Öğretmeni takip et ve nefesinle başla.`)};
 const toggleVoice=()=>setVoiceEnabled(current=>{const next=!current;updatePracticePreferences({voiceEnabled:next});if(!next)void Speech.stop();return next});
 const togglePause=()=>setPaused(current=>{const next=!current;speakNow(next?'Pratik duraklatıldı.':'Devam ediyoruz.');return next});
 const hasRealScore=modelState==='ready'&&validSamples>=3&&postureScore>0&&balanceScore>0&&score>0;
 const finish=()=>{if(!hasRealScore)return;void Speech.stop();router.replace({pathname:'/practice-result',params:{practiceId:params.practiceId||params.movementId||domainPractice?.id||'free',duration:Math.max(1,Math.ceil(seconds/60)),posture:postureScore,balance:balanceScore,flow:score,samples:validSamples,shenId,masterSentenceId:sentence.id,feedback,analysisSource:'mediapipe-33'}})};

 if(!permission)return <View style={c.permission}/>;
 if(!permission.granted)return <SafeAreaView style={c.permission}><View style={c.permissionIcon}><Ionicons name="camera-outline" size={42} color={colors.gold}/></View><Text style={c.permissionTitle}>Kamera rehberini aç</Text><Text style={c.permissionBody}>Görüntün kaydedilmez veya sunucuya gönderilmez. Poz ölçümü cihazdaki akışta işlenir.</Text><PrimaryButton label="Kameraya izin ver" icon="camera" onPress={requestPermission}/><Pressable onPress={()=>router.back()}><Text style={c.cancel}>Şimdi değil</Text></Pressable></SafeAreaView>;
 if(locked)return <SafeAreaView style={c.permission}><View style={c.permissionIcon}><Ionicons name="lock-closed" size={42} color={colors.gold}/></View><Text style={c.permissionTitle}>Bu hareket kilitli</Text><Text style={c.permissionBody}>Gerçek zamanlı analiz şu anda ilk üç harekette açık. Bu hareketin referans modeli hazır olduğunda otomatik açılacak.</Text><PrimaryButton label="Hareketlere dön" icon="arrow-back" onPress={()=>router.back()}/></SafeAreaView>;

 return <View style={c.root}>
  <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" active={!paused} mirror/>
  <View style={c.shade}/>
  <GhostCanvas frame={referenceFrame} ready={fullBodyReady} opacity={practicePreferences.ghostOpacity}/>
  <SafeAreaView style={c.overlay} pointerEvents="box-none">
   <View style={c.top}><Pressable onPress={()=>router.back()} style={c.icon}><Ionicons name="close" color={colors.cream} size={25}/></Pressable><View style={c.topCenter}><Text style={c.movementTitle}><Text style={c.stepCount}>{index+1} / {list.length}</Text>  {movement.name}</Text></View><Pressable onPress={toggleVoice} style={c.icon}><Ionicons name={voiceEnabled?'volume-high':'volume-mute'} color={voiceEnabled?colors.gold:colors.cream} size={23}/></Pressable></View>
   <View style={c.task}><Text style={c.taskText}>Öğretmeni taklit et</Text></View>
   {!started?<View style={c.setup}><Text style={c.setupTitle}>Öğretmen hazır</Text><Text style={c.setupText}>Telefonu sabitle, tam bedeninle sağdaki alana yerleş ve öğretmenin hareketini taklit et.</Text><View style={c.readyStatus}><Ionicons name={fullBodyReady?'checkmark-circle':'scan-outline'} color={fullBodyReady?colors.jade:colors.gold} size={21}/><Text style={c.readyStatusText}>{fullBodyReady?'Tam beden hazır':'2–3 metre geri çekil'}</Text></View><PrimaryButton label="Pratiği başlat" icon="play" onPress={startPractice}/></View>:<>
    <View style={c.feedback}><Ionicons name={modelState==='ready'?'checkmark-circle':'scan-outline'} color={modelState==='ready'?colors.jade:colors.gold} size={22}/><View style={c.feedbackCopy}><Text style={c.feedbackLabel}>{paused?'DURAKLATILDI':modelState==='ready'?'HAREKETİ İZLİYORUM':'TAM BEDENİNİ BEKLİYORUM'}</Text><Text style={c.feedbackText}>{paused?'Hazır olduğunda devam et.':feedback}</Text></View></View>
    <View style={c.bottom}><Pressable onPress={togglePause} style={c.pause}><Ionicons name={paused?'play':'pause'} color={colors.cream} size={24}/></Pressable><Pressable disabled={!hasRealScore} onPress={finish} style={[c.finish,!hasRealScore&&c.finishDisabled]}><Text style={[c.finishText,!hasRealScore&&c.finishTextDisabled]}>{hasRealScore?'Bitir ve değerlendir':'Bedenini algılıyorum'}</Text><Ionicons name={hasRealScore?'arrow-forward':'scan-outline'} color={hasRealScore?colors.ink:colors.muted} size={20}/></Pressable></View>
   </>}
  </SafeAreaView>
  <MediaPipePoseBridge ref={bridgeRef}/>
 </View>;
}

function GhostCanvas({frame,ready,opacity}:{frame?:ReferencePoseFrame;ready:boolean;opacity:number}){
 const fade=useRef(new Animated.Value(1)).current;
 const source=ghostImageForPhase(frame?.phase);
 useEffect(()=>{fade.setValue(.28);Animated.timing(fade,{toValue:Math.max(.82,opacity),duration:420,useNativeDriver:true}).start()},[fade,opacity,source]);
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  <View style={c.teacherStage}><View style={c.teacherHalo}/><Animated.Image fadeDuration={0} resizeMode="contain" source={source} style={[c.teacherImage,{opacity:fade}]}/><View style={c.teacherGround}/></View>
  <View style={[c.userGuide,ready&&c.userGuideReady]}/>
  {ready?<View style={c.bodyReady}><Ionicons name="checkmark-circle" color="#A9D977" size={21}/><Text style={c.bodyReadyText}>Tam beden hazır</Text></View>:null}
 </View>;
}

function ghostImageForPhase(phase?:string){
 if(!phase||phase.includes('hazırlık'))return livingGhostTeacherImages.prepare;
 if(phase.includes('yüksel'))return livingGhostTeacherImages.lift;
 if(phase.includes('aç')||phase.includes('uzama'))return livingGhostTeacherImages.extend;
 if(phase.includes('dönüş'))return livingGhostTeacherImages.push;
 return livingGhostTeacherImages.release;
}

function toNamedPose(landmarks:PoseLandmark[]):PoseKeypoint[]{return landmarks.map((item,index)=>({name:mediaNames[index]||`point-${index}`,x:item.x,y:item.y,score:item.visibility}))}

const c=StyleSheet.create({
 root:{flex:1,backgroundColor:colors.ink},
 shade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(5,10,7,.18)'},
 overlay:{flex:1,justifyContent:'space-between'},
 top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16},
 topCenter:{minHeight:50,minWidth:190,paddingHorizontal:20,borderRadius:25,backgroundColor:'rgba(17,23,19,.82)',borderWidth:1,borderColor:'rgba(242,238,231,.16)',alignItems:'center',justifyContent:'center'},
 movementTitle:{color:colors.cream,fontSize:18,fontWeight:'800'},stepCount:{color:'#A9D977'},
 icon:{width:50,height:50,borderRadius:17,backgroundColor:'rgba(17,23,19,.76)',borderWidth:1,borderColor:'rgba(242,238,231,.18)',alignItems:'center',justifyContent:'center'},
 task:{position:'absolute',top:76,alignSelf:'center',minHeight:46,paddingHorizontal:25,borderRadius:23,backgroundColor:'rgba(17,23,19,.76)',alignItems:'center',justifyContent:'center'},taskText:{color:colors.cream,fontSize:18,fontWeight:'700'},
 teacherStage:{position:'absolute',left:'1%',top:'22%',width:'49%',height:'55%',alignItems:'center',justifyContent:'flex-end'},teacherHalo:{position:'absolute',left:'7%',right:'7%',top:'2%',bottom:'2%',borderRadius:120,backgroundColor:'rgba(243,207,139,.08)',shadowColor:'#F3CF8B',shadowOpacity:.85,shadowRadius:26},teacherImage:{width:'100%',height:'100%',transform:[{scale:1.08}]},teacherGround:{position:'absolute',bottom:'1%',width:'72%',height:14,borderRadius:999,borderWidth:1,borderColor:'rgba(243,207,139,.58)',backgroundColor:'rgba(243,207,139,.11)',shadowColor:'#F3CF8B',shadowOpacity:.8,shadowRadius:15},
 userGuide:{position:'absolute',right:'5%',top:'25%',width:'44%',height:'52%',borderRadius:88,borderWidth:1.5,borderStyle:'dashed',borderColor:'rgba(242,238,231,.3)'},userGuideReady:{borderColor:'rgba(169,217,119,.9)',backgroundColor:'rgba(169,217,119,.025)'},bodyReady:{position:'absolute',right:'7%',top:'78%',flexDirection:'row',alignItems:'center',gap:7},bodyReadyText:{color:'#A9D977',fontSize:16,fontWeight:'800'},
 setup:{position:'absolute',left:18,right:18,bottom:30,alignItems:'center',backgroundColor:'rgba(17,23,19,.93)',borderRadius:28,borderWidth:1,borderColor:'rgba(242,238,231,.16)',padding:22,gap:13},
 setupTitle:{color:colors.cream,fontSize:25,fontWeight:'800'},
 setupText:{color:'rgba(242,238,231,.72)',fontSize:17,lineHeight:25,textAlign:'center'},
 readyStatus:{flexDirection:'row',alignItems:'center',gap:9,marginBottom:2},
 statusDot:{width:9,height:9,borderRadius:5,backgroundColor:colors.gold},statusDotReady:{backgroundColor:colors.jade},readyStatusText:{color:colors.cream,fontSize:16,fontWeight:'700'},
 feedback:{position:'absolute',left:18,right:18,bottom:112,flexDirection:'row',alignItems:'center',gap:11,backgroundColor:'rgba(10,15,12,.82)',borderRadius:18,borderWidth:1,borderColor:'rgba(242,238,231,.14)',padding:13},
 feedbackCopy:{flex:1},feedbackLabel:{color:colors.gold,fontSize:13,fontWeight:'900',letterSpacing:1},feedbackText:{color:colors.cream,fontSize:16,lineHeight:22,marginTop:3},
 bottom:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'rgba(10,15,12,.88)',paddingHorizontal:16,paddingVertical:13,borderTopWidth:1,borderColor:'rgba(242,238,231,.12)'},
 pause:{width:54,height:54,borderRadius:27,backgroundColor:'rgba(242,238,231,.1)',borderWidth:1,borderColor:'rgba(242,238,231,.18)',alignItems:'center',justifyContent:'center'},
 finish:{flex:1,height:54,flexDirection:'row',gap:8,borderRadius:radii.pill,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},
 finishDisabled:{backgroundColor:'rgba(242,238,231,.08)',borderWidth:1,borderColor:'rgba(242,238,231,.14)'},
 finishText:{color:colors.ink,fontSize:17,fontWeight:'900'},finishTextDisabled:{color:colors.muted},
 permission:{flex:1,backgroundColor:colors.ink,padding:28,alignItems:'center',justifyContent:'center',gap:20},
 permissionIcon:{width:90,height:90,borderRadius:45,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center'},
 permissionTitle:{color:colors.cream,fontSize:26,fontWeight:'700',textAlign:'center'},
 permissionBody:{color:colors.muted,fontSize:16,lineHeight:24,textAlign:'center'},
 cancel:{color:colors.muted,fontWeight:'600',padding:12},
});
