import {Ionicons} from '@expo/vector-icons';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {useAudioPlayer,useAudioPlayerStatus} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';
import {router,useLocalSearchParams} from 'expo-router';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ImageBackground,LayoutChangeEvent,Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LivingGhostOverlay,LivingPoseOverlay} from '../../components/living-learning/LivingPoseOverlay';
import {colors,fonts} from '../../constants/theme';
import {getLivingPractice,livingSceneImages,livingSceneMusic,livingScenes,livingStepAt,normalizeLivingSceneId,type LivingComparisonResult,type LivingPosePoint,type LivingPracticeResult} from '../../data/livingLearning';
import {compareLivingMovement} from '../../services/living-learning/MovementComparisonService';
import {MediaPipePoseBridge,MediaPipePoseBridgeRef,PoseLandmark} from '../../services/pose/MediaPipePoseBridge';
import {useApp} from '../../store/AppStore';

const landmarkNames=['nose','left_eye_inner','left_eye','left_eye_outer','right_eye_inner','right_eye','right_eye_outer','left_ear','right_ear','mouth_left','mouth_right','left_shoulder','right_shoulder','left_elbow','right_elbow','left_wrist','right_wrist','left_pinky','right_pinky','left_index','right_index','left_thumb','right_thumb','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle','left_heel','right_heel','left_foot_index','right_foot_index'];

export default function LivingStoryScreen(){
 const{id}=useLocalSearchParams<{id?:string}>(),sceneId=normalizeLivingSceneId(id),scene=useMemo(()=>livingScenes.find(item=>item.id===sceneId)??livingScenes[0],[sceneId]),practice=useMemo(()=>getLivingPractice(scene.id),[scene.id]);
 const{completeStory,addSession}=useApp();
 const player=useAudioPlayer(livingSceneMusic[scene.id],{downloadFirst:true}),audioStatus=useAudioPlayerStatus(player);
 const[mode,setMode]=useState<'watch'|'camera'|'complete'>('watch'),[running,setRunning]=useState(false),[elapsedMs,setElapsedMs]=useState(0),[permission,requestPermission]=useCameraPermissions();
 const[ghostVisible,setGhostVisible]=useState(true),[pose,setPose]=useState<LivingPosePoint[]>([]),[imageSize,setImageSize]=useState({width:1,height:1}),[preview,setPreview]=useState({width:1,height:1}),[feedback,setFeedback]=useState('Tam bedenin göründüğünde ölçüm başlayacak.'),[liveScore,setLiveScore]=useState<number|null>(null),[result,setResult]=useState<LivingPracticeResult|null>(null),[saved,setSaved]=useState(false);
 const cameraRef=useRef<CameraView|null>(null),bridgeRef=useRef<MediaPipePoseBridgeRef|null>(null),samplesRef=useRef<LivingComparisonResult[]>([]),stepRef=useRef(livingStepAt(0,practice)),elapsedRef=useRef(0),lastStepRef=useRef(stepRef.current.id),completionRef=useRef(false);
 const activeStep=livingStepAt(elapsedMs,practice);stepRef.current=activeStep;elapsedRef.current=elapsedMs;

 useEffect(()=>{player.replace(livingSceneMusic[scene.id]);player.loop=true;player.volume=.28},[player,scene.id]);

 useEffect(()=>{if(!running)return;const timer=setInterval(()=>setElapsedMs(value=>Math.min(practice.durationMs,value+100)),100);return()=>clearInterval(timer)},[practice.durationMs,running]);
 useEffect(()=>{if(lastStepRef.current===activeStep.id)return;lastStepRef.current=activeStep.id;void Haptics.selectionAsync()},[activeStep.id]);
 useEffect(()=>{if(elapsedMs<practice.durationMs)return;if(mode==='watch'){setRunning(false);return}if(mode==='camera')finishCamera()},[elapsedMs,mode,practice.durationMs]); // eslint-disable-line react-hooks/exhaustive-deps

 useEffect(()=>{
  if(mode!=='camera'||!running||!permission?.granted)return;
  let cancelled=false,timer:ReturnType<typeof setTimeout>|undefined;
  const analyze=async()=>{
   if(cancelled||!cameraRef.current)return;
   try{
    const photo=await cameraRef.current.takePictureAsync({base64:true,quality:.42,skipProcessing:false,shutterSound:false});
    if(!photo?.base64)throw new Error('Kare alınamadı');
    const analysis=await bridgeRef.current?.analyze(photo.base64);
    if(!analysis)throw new Error('Model hazırlanıyor');
    if(cancelled)return;
    const named=toNamedPose(analysis.landmarks);setPose(named);setImageSize({width:analysis.imageWidth,height:analysis.imageHeight});
    const comparison=compareLivingMovement({landmarks:named,stepId:stepRef.current.id,elapsedMs:elapsedRef.current});
    if(!comparison){setLiveScore(null);setFeedback('Biraz geri çekil; başından ayaklarına kadar görün.');}
    else{samplesRef.current.push(comparison);if(samplesRef.current.length>180)samplesRef.current.shift();setLiveScore(comparison.movementScore);setFeedback(comparison.feedback)}
   }catch(error){if(!cancelled)setFeedback(error instanceof Error&&error.message.includes('hazır')?'Poz modeli hazırlanıyor…':'Kamera karesi okunamadı; sakin biçimde kadrajda kal.')}
   if(!cancelled)timer=setTimeout(()=>void analyze(),680);
  };
  timer=setTimeout(()=>void analyze(),350);
  return()=>{cancelled=true;if(timer)clearTimeout(timer)};
 },[mode,permission?.granted,running]);

 const resetTimeline=()=>{completionRef.current=false;samplesRef.current=[];setPose([]);setLiveScore(null);setFeedback('Tam bedenin göründüğünde ölçüm başlayacak.');setElapsedMs(0);lastStepRef.current='prepare'};
 const startWatch=()=>{resetTimeline();setRunning(true)};
 const openCamera=async()=>{
  if(!scene.available)return;
  if(!permission?.granted){const response=await requestPermission();if(!response.granted)return}
  resetTimeline();setMode('camera');setRunning(true);void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
 };
 const finishCamera=useCallback(()=>{
  if(completionRef.current)return;
  const samples=samplesRef.current;
  if(samples.length<5){setRunning(false);setElapsedMs(Math.max(0,practice.durationMs-5000));setFeedback('Ölçümü tamamlamak için tam bedeninle birkaç nefes daha kal.');return}
  completionRef.current=true;setRunning(false);
  const avg=(key:'movementScore'|'rhythmScore')=>Math.round(samples.reduce((sum,item)=>sum+item[key],0)/samples.length),best=[...samples].sort((a,b)=>b.movementScore-a.movementScore)[0],last=samples[samples.length-1];
  setResult({id:`living-${Date.now()}`,practiceId:practice.id,sceneId:scene.id,completedAt:new Date().toISOString(),durationSeconds:Math.round(practice.durationMs/1000),sampleCount:samples.length,movementScore:avg('movementScore'),breathRhythmScore:avg('rhythmScore'),bestSection:best.bestMetric,improvement:last.feedback==='Güzel, akışı koru.'?'Aynı yumuşaklığı hareketin başlangıcına da taşı.':last.feedback,masterSentence:`${scene.metaphor}; gücü zorlamadan, merkezinden yön ver.`,analysisSource:'mediapipe-33'});
  setMode('complete');void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
 },[practice,scene.id,scene.metaphor]);
 const save=()=>{if(!result||saved)return;completeStory(scene.id);addSession({id:result.id,practiceId:result.practiceId,date:result.completedAt,duration:Math.max(1,Math.round(result.durationSeconds/60)),postureScore:result.movementScore,balanceScore:result.movementScore,flowScore:result.movementScore,breathScore:result.breathRhythmScore,corrections:[result.improvement]});setSaved(true);void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)};
 const retry=()=>{resetTimeline();setResult(null);setSaved(false);setMode('camera');setRunning(true)};
 const onPreviewLayout=(event:LayoutChangeEvent)=>setPreview({width:event.nativeEvent.layout.width,height:event.nativeEvent.layout.height});

 if(mode==='complete'&&result)return <Completion result={result} practiceTitle={practice.title} saved={saved} onSave={save} onRetry={retry}/>;
 if(mode==='camera')return <View style={s.cameraRoot} onLayout={onPreviewLayout}>
  <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" mirror active={running}/><View pointerEvents="none" style={s.cameraShade}/>
  <LivingPoseOverlay pose={pose} width={preview.width} height={preview.height} imageWidth={imageSize.width} imageHeight={imageSize.height}/>
  {ghostVisible?<View pointerEvents="none" style={s.ghostWindow}><Text style={s.ghostLabel}>REFERANS</Text><LivingGhostOverlay step={activeStep}/></View>:null}
  <SafeAreaView style={s.cameraSafe} edges={['top','bottom']} pointerEvents="box-none">
   <View style={s.cameraTop}><Pressable onPress={()=>{setRunning(false);setMode('watch');resetTimeline()}} style={s.round}><Ionicons name="close" color={colors.cream} size={21}/></Pressable><View style={s.cameraStep}><Text style={s.cameraStepCount}>{practice.steps.findIndex(item=>item.id===activeStep.id)+1} / 5</Text><Text style={s.cameraStepTitle}>{activeStep.title}</Text></View><Pressable onPress={()=>setGhostVisible(value=>!value)} style={s.round}><Ionicons name={ghostVisible?'body':'body-outline'} color={colors.gold} size={20}/></Pressable></View>
   <View style={s.cameraCenter}><Text style={s.breath}>{activeStep.breathingCue}</Text></View>
   <View style={s.cameraBottom}><View style={s.feedback}><Text style={s.feedbackState}>{liveScore===null?'TAM BEDEN BEKLENİYOR':`CANLI UYUM · ${liveScore}`}</Text><Text style={s.feedbackText}>{feedback}</Text></View><View style={s.controls}><View style={s.progress}><View style={[s.progressFill,{width:`${elapsedMs/practice.durationMs*100}%`}]}/></View><Pressable onPress={()=>setRunning(value=>!value)} style={s.pause}><Ionicons name={running?'pause':'play'} size={20} color="#11150F"/></Pressable><Text style={s.time}>{Math.ceil((practice.durationMs-elapsedMs)/1000)} sn</Text></View></View>
  </SafeAreaView><MediaPipePoseBridge ref={bridgeRef}/>
 </View>;

 return <View style={s.watchRoot}>
  <ImageBackground source={livingSceneImages[scene.id]} style={StyleSheet.absoluteFill} imageStyle={s.watchImage}><LinearGradient colors={['rgba(7,10,8,.14)','rgba(7,10,8,.24)','rgba(7,10,8,.96)']} style={StyleSheet.absoluteFill}/></ImageBackground>
  <View style={[s.demoGhost,{transform:[{scale:activeStep.id==='extend'?1.06:activeStep.id==='push'?1.03:1}]}]}><LivingGhostOverlay step={activeStep} width={190} height={390}/></View>
  <SafeAreaView style={s.watchSafe} edges={['top','bottom']}>
   <View style={s.watchTop}><Pressable onPress={()=>router.back()} style={s.round}><Ionicons name="arrow-back" color={colors.cream} size={20}/></Pressable><View style={s.watchTopCopy}><Text style={s.watchKicker}>CANLI DENEYİM · HAREKET {practice.movementNumber}</Text><Text style={s.watchName}>{scene.name}</Text></View><Pressable onPress={()=>audioStatus.playing?player.pause():player.play()} style={s.round}><Ionicons name={audioStatus.playing?'volume-high-outline':'volume-mute-outline'} color={audioStatus.playing?colors.gold:colors.muted} size={20}/></Pressable></View>
   <View style={s.watchBottom}><Text style={s.quality}>{scene.subtitle.toUpperCase()} · {scene.tempo.toUpperCase()}</Text><Text style={s.watchTitle}>{practice.title}</Text><Text style={s.watchMetaphor}>{scene.description}</Text>
    <View style={s.stepDots}>{practice.steps.map((step,index)=><View key={step.id} style={[s.stepDot,step.id===activeStep.id&&s.stepDotActive]}><Text style={[s.stepNumber,step.id===activeStep.id&&s.stepNumberActive]}>{index+1}</Text><Text style={[s.stepText,step.id===activeStep.id&&s.stepTextActive]}>{step.title}</Text></View>)}</View>
    <View style={s.cue}><View style={s.cueOrb}/><View><Text style={s.cueLabel}>{activeStep.title.toUpperCase()}</Text><Text style={s.cueText}>{activeStep.breathingCue}</Text></View></View>
    <View style={s.watchActions}><Pressable onPress={running?()=>setRunning(false):startWatch} style={s.secondary}><Ionicons name={running?'pause':'play'} color={colors.cream} size={17}/><Text style={s.secondaryText}>{running?'Duraklat':elapsedMs>=practice.durationMs?'Yeniden izle':'Hareketi izle'}</Text></Pressable><Pressable onPress={openCamera} style={s.primary}><Ionicons name="camera" color="#11150F" size={18}/><Text style={s.primaryText}>Şimdi sen yap</Text></Pressable></View>
   </View>
  </SafeAreaView>
 </View>;
}

function Completion({result,practiceTitle,saved,onSave,onRetry}:{result:LivingPracticeResult;practiceTitle:string;saved:boolean;onSave:()=>void;onRetry:()=>void}){return <View style={s.completeRoot}><SafeAreaView edges={['top','bottom']} style={s.completeSafe}><View style={s.completeHalo}><Text style={s.completeScore}>{result.movementScore}</Text><Text style={s.completeOf}>/100</Text></View><Text style={s.completeKicker}>AKIŞ TAMAMLANDI</Text><Text style={s.completeTitle}>{practiceTitle}</Text><Text style={s.completeLead}>Hareketin ritmi ölçüldü. Bir sonraki çalışmada tek öneriyi yanında taşı.</Text><View style={s.metricGrid}><Metric label="SÜRE" value={`${result.durationSeconds} sn`}/><Metric label="HAREKET UYUMU" value={`%${result.movementScore}`}/><Metric label="YÖNLENDİRİLMİŞ RİTİM" value={`%${result.breathRhythmScore}`}/><Metric label="EN İYİ BÖLÜM" value={result.bestSection}/></View><View style={s.master}><Text style={s.masterLabel}>USTADAN BİR CÜMLE</Text><Text style={s.masterText}>“{result.masterSentence}”</Text><Text style={s.improvement}>{result.improvement}</Text></View><Pressable onPress={onSave} style={s.primaryWide}><Ionicons name={saved?'checkmark':'bookmark-outline'} color="#11150F" size={18}/><Text style={s.primaryText}>{saved?'Pratik kaydedildi':'Pratiği kaydet'}</Text></Pressable><Pressable onPress={onRetry} style={s.secondaryWide}><Text style={s.secondaryText}>Tekrar dene</Text></Pressable><Pressable onPress={()=>router.replace('/(tabs)')}><Text style={s.homeLink}>Ana sayfaya dön</Text></Pressable></SafeAreaView></View>}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text numberOfLines={2} style={s.metricValue}>{value}</Text></View>}
function toNamedPose(landmarks:PoseLandmark[]):LivingPosePoint[]{return landmarks.map((item,index)=>({name:landmarkNames[index]??`point-${index}`,x:item.x,y:item.y,score:item.visibility}))}

const s=StyleSheet.create({watchRoot:{flex:1,backgroundColor:'#0A0F0C'},watchImage:{resizeMode:'cover'},watchSafe:{flex:1,justifyContent:'space-between'},watchTop:{paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},round:{width:48,height:48,borderRadius:16,backgroundColor:'rgba(10,15,12,.68)',borderWidth:1,borderColor:'rgba(242,238,231,.16)',alignItems:'center',justifyContent:'center'},watchTopCopy:{alignItems:'center'},watchKicker:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:17,letterSpacing:1.4},watchName:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:18,marginTop:2},demoGhost:{position:'absolute',top:'11%',left:'20%',opacity:.8},watchBottom:{padding:20,gap:8},quality:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:16,letterSpacing:1.4},watchTitle:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:37,lineHeight:41},watchMetaphor:{fontFamily:fonts.sans,color:'#D0D2CC',fontSize:17,lineHeight:24,maxWidth:350},stepDots:{flexDirection:'row',gap:5,marginTop:8},stepDot:{flex:1,minHeight:48,alignItems:'center',gap:4},stepDotActive:{},stepNumber:{width:21,height:21,borderRadius:11,borderWidth:1,borderColor:'rgba(242,238,231,.18)',color:colors.muted,fontFamily:fonts.metric,fontSize:17,textAlign:'center',lineHeight:24},stepNumberActive:{backgroundColor:colors.gold,borderColor:colors.gold,color:'#11150F'},stepText:{fontFamily:fonts.sansMedium,color:colors.muted,fontSize:17},stepTextActive:{color:colors.cream},cue:{minHeight:62,padding:12,borderWidth:1,borderColor:'rgba(198,165,106,.22)',borderRadius:18,backgroundColor:'rgba(10,15,12,.7)',flexDirection:'row',alignItems:'center',gap:13},cueOrb:{width:33,height:33,borderRadius:17,borderWidth:1,borderColor:colors.gold,shadowColor:colors.gold,shadowOpacity:.25,shadowRadius:10},cueLabel:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:17,letterSpacing:1.2},cueText:{fontFamily:fonts.sansMedium,color:colors.cream,fontSize:17,marginTop:3},watchActions:{flexDirection:'row',gap:8,marginTop:4},primary:{flex:1,height:52,borderRadius:26,backgroundColor:colors.gold,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},primaryWide:{height:54,borderRadius:27,backgroundColor:colors.gold,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:5},primaryText:{fontFamily:fonts.sansBold,color:'#11150F',fontSize:16},secondary:{flex:1,height:52,borderRadius:26,borderWidth:1,borderColor:'rgba(242,238,231,.18)',backgroundColor:'rgba(10,15,12,.7)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},secondaryWide:{height:52,borderRadius:26,borderWidth:1,borderColor:'rgba(242,238,231,.16)',alignItems:'center',justifyContent:'center'},secondaryText:{fontFamily:fonts.sansBold,color:colors.cream,fontSize:17},cameraRoot:{flex:1,backgroundColor:'#050806'},cameraShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,8,5,.12)'},cameraSafe:{flex:1,justifyContent:'space-between'},cameraTop:{paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},cameraStep:{minWidth:125,height:48,borderRadius:24,backgroundColor:'rgba(10,15,12,.72)',borderWidth:1,borderColor:'rgba(242,238,231,.14)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},cameraStepCount:{fontFamily:fonts.metricStrong,color:'#A9D977',fontSize:16},cameraStepTitle:{fontFamily:fonts.sansMedium,color:colors.cream,fontSize:17},cameraCenter:{position:'absolute',top:102,left:0,right:0,alignItems:'center'},breath:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:20,backgroundColor:'rgba(10,15,12,.58)',paddingHorizontal:16,paddingVertical:9,borderRadius:18,overflow:'hidden'},ghostWindow:{position:'absolute',zIndex:4,right:9,top:'18%',width:142,height:258,borderRadius:58,backgroundColor:'rgba(10,15,12,.7)',borderWidth:1,borderColor:'rgba(243,207,139,.48)',alignItems:'center',overflow:'hidden',shadowColor:'#F3CF8B',shadowOpacity:.22,shadowRadius:14},ghostLabel:{fontFamily:fonts.sansBold,color:'#F3CF8B',fontSize:17,letterSpacing:1.2,marginTop:10},cameraBottom:{padding:16,gap:10},feedback:{alignSelf:'flex-start',maxWidth:'82%',padding:13,borderRadius:17,borderWidth:1,borderColor:'rgba(169,217,119,.25)',backgroundColor:'rgba(10,15,12,.78)',gap:4},feedbackState:{fontFamily:fonts.sansBold,color:'#A9D977',fontSize:17,letterSpacing:1.2},feedbackText:{fontFamily:fonts.sansMedium,color:colors.cream,fontSize:16,lineHeight:28},controls:{height:62,borderRadius:22,borderWidth:1,borderColor:'rgba(242,238,231,.13)',backgroundColor:'rgba(10,15,12,.82)',flexDirection:'row',alignItems:'center',paddingHorizontal:13,gap:12},progress:{height:3,flex:1,borderRadius:2,backgroundColor:'rgba(242,238,231,.13)',overflow:'hidden'},progressFill:{height:'100%',backgroundColor:colors.gold},pause:{width:48,height:48,borderRadius:24,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},time:{fontFamily:fonts.metric,color:colors.cream,fontSize:16,minWidth:34},completeRoot:{flex:1,backgroundColor:'#0A0F0C'},completeSafe:{flex:1,padding:22,alignItems:'center',justifyContent:'center',gap:15},completeHalo:{width:126,height:126,borderRadius:63,borderWidth:5,borderColor:'#A9D977',borderRightColor:colors.gold,flexDirection:'row',alignItems:'center',justifyContent:'center'},completeScore:{fontFamily:fonts.metricStrong,color:colors.cream,fontSize:41},completeOf:{fontFamily:fonts.metric,color:colors.muted,fontSize:17,alignSelf:'flex-end',marginBottom:31},completeKicker:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:16,letterSpacing:1.5},completeTitle:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:35},completeLead:{fontFamily:fonts.sans,color:colors.muted,fontSize:17,lineHeight:24,textAlign:'center',maxWidth:330},metricGrid:{width:'100%',flexDirection:'row',flexWrap:'wrap',gap:8},metric:{width:'48%',minHeight:70,borderWidth:1,borderColor:'rgba(242,238,231,.09)',borderRadius:16,backgroundColor:'rgba(23,29,25,.76)',padding:12,gap:5},metricLabel:{fontFamily:fonts.sansBold,color:colors.muted,fontSize:17,letterSpacing:1},metricValue:{fontFamily:fonts.sansStrong,color:colors.cream,fontSize:16},master:{width:'100%',borderWidth:1,borderColor:'rgba(198,165,106,.2)',borderRadius:18,padding:16,alignItems:'center',gap:7},masterLabel:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:17,letterSpacing:1.3},masterText:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:20,lineHeight:25,textAlign:'center'},improvement:{fontFamily:fonts.sans,color:colors.muted,fontSize:16,lineHeight:27,textAlign:'center'},homeLink:{fontFamily:fonts.sansMedium,color:colors.muted,fontSize:17,padding:9}});
