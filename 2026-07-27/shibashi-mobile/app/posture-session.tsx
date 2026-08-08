import {Ionicons} from '@expo/vector-icons';
import {CameraView,useCameraPermissions} from 'expo-camera';
import {useAudioPlayer} from 'expo-audio';
import * as Speech from 'expo-speech';
import {router} from 'expo-router';
import {useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View,type LayoutChangeEvent} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg,{Circle,Line} from 'react-native-svg';
import {PrimaryButton} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {getShen} from '../data/fiveShen';
import {analyzeWithAppleVision3D,isAppleVision3DAvailable} from '../services/pose/AppleVisionPose3D';
import {MediaPipePoseBridge,MediaPipePoseBridgeRef,PoseLandmark} from '../services/pose/MediaPipePoseBridge';
import {aggregatePostureCaptures,createPostureCapture,evaluatePoseFrame,getLandmarkMovement,isLandmarkVisible} from '../services/pose/PostureMetrics';
import {useApp} from '../store/AppStore';
import {PostureCapture,PostureReport,PostureView} from '../types';

const views:PostureView[]=['front','side','back'];
const viewCopy:Record<PostureView,{title:string;instruction:string;icon:keyof typeof Ionicons.glyphMap}>={
 front:{title:'Ön görünüm',instruction:'Başın ve iki ayağın kadrajda olsun. Ağırlığını eşit dağıt.',icon:'body-outline'},
 side:{title:'Yan görünüm',instruction:'Sağa dön. Kulak, omuz, kalça ve ayak bileğini tek çizgide tut.',icon:'accessibility-outline'},
 back:{title:'Arka görünüm',instruction:'Arkanı dön. Omuzlarını bırak ve iki topuğu görünür tut.',icon:'scan-outline'},
};

type Metric={label:string;icon:keyof typeof Ionicons.glyphMap;value:number;measurement:string;confidence:number};
type ScanState='model-loading'|'find-body'|'wrong-angle'|'hold'|'capturing'|'turning'|'error';
type FrameSize={width:number;height:number};

const scanCopy:Record<PostureView,{start:string;turn:string;waiting:string}>={
 front:{start:'Kameraya dön. Başın ve ayakların göründüğünde ölçüm başlayacak.',turn:'Kameraya dön.',waiting:'Önden görünümünü algılıyorum.'},
 side:{start:'Şimdi yana dön. Yan duruşun algılandığında üç saniye bekle.',turn:'Şimdi yana dön.',waiting:'Yan görünümünü algılıyorum.'},
 back:{start:'Şimdi arkaya dön. Arka görünüm algılandığında üç saniye bekle.',turn:'Şimdi arkaya dön.',waiting:'Arka görünümünü algılıyorum.'},
};

export default function PostureSession(){
 const[permission,requestPermission]=useCameraPermissions();
 const{profile,addPostureReport}=useApp();
 const shen=getShen(profile.selectedShenId);
 const[index,setIndex]=useState(0);
 const[captures,setCaptures]=useState<PostureCapture[]>([]);
 const[result,setResult]=useState<PostureReport|null>(null);
 const[phase,setPhase]=useState<'scan'|'review'|'processing'>('scan');
 const[scanState,setScanState]=useState<ScanState>('model-loading');
 const[countdown,setCountdown]=useState(3);
 const[liveLandmarks,setLiveLandmarks]=useState<PoseLandmark[]>([]);
 const[analysisImageSize,setAnalysisImageSize]=useState<FrameSize>({width:1,height:1});
 const[previewSize,setPreviewSize]=useState<FrameSize>({width:1,height:1});
 const[frameConfidence,setFrameConfidence]=useState(0);
 const[liveScore,setLiveScore]=useState<number|null>(null);
 const[validSampleCount,setValidSampleCount]=useState(0);
 const[cameraReady,setCameraReady]=useState(false);
 const[analysisError,setAnalysisError]=useState('');
 const[vision3DActive,setVision3DActive]=useState(false);
 const[cameraError,setCameraError]=useState(false);
 const[tipVisible,setTipVisible]=useState(false);
 const[saving,setSaving]=useState(false);
 const view=views[index]??'front';
 const copy=viewCopy[view];
 const cameraRef=useRef<CameraView|null>(null);
 const poseBridgeRef=useRef<MediaPipePoseBridgeRef|null>(null);
 const scanSessionRef=useRef(0);
 const holdStartedAtRef=useRef<number|null>(null);
 const previousLandmarksRef=useRef<PoseLandmark[]>([]);
 const stableCapturesRef=useRef<PostureCapture[]>([]);
 const capturesRef=useRef<PostureCapture[]>([]);
 const speakingRef=useRef('');
 const frontVoice=useAudioPlayer(require('../assets/audio/posture/tai/front-3s.mp3'),{downloadFirst:true});
 const sideVoice=useAudioPlayer(require('../assets/audio/posture/tai/side-3s.mp3'),{downloadFirst:true});
 const backVoice=useAudioPlayer(require('../assets/audio/posture/tai/back-3s.mp3'),{downloadFirst:true});

 useEffect(()=>setVision3DActive(isAppleVision3DAvailable()),[]);

 const speakOnce=(key:string,text:string)=>{
  if(speakingRef.current===key)return;
  speakingRef.current=key;
  Speech.stop();
  void Speech.speak(text,{language:'tr-TR',rate:0.9,pitch:1});
 };

 useEffect(()=>{
  if(!permission?.granted||!cameraReady||phase!=='scan')return;
  if(speakingRef.current===`view-${view}`)return;
  speakingRef.current=`view-${view}`;
  Speech.stop();
  const player=view==='front'?frontVoice:view==='side'?sideVoice:backVoice;
  frontVoice.pause();sideVoice.pause();backVoice.pause();
  void player.seekTo(0).then(()=>player.play());
 },[view,cameraReady,phase,permission?.granted]);

 useEffect(()=>()=>{Speech.stop();frontVoice.pause();sideVoice.pause();backVoice.pause();scanSessionRef.current+=1},[]);

 useEffect(()=>{
  if(!cameraReady||cameraError||phase!=='scan')return;
  const session=scanSessionRef.current+1;
  scanSessionRef.current=session;
  holdStartedAtRef.current=null;
  previousLandmarksRef.current=[];
  stableCapturesRef.current=[];
  setLiveLandmarks([]);
  setLiveScore(null);
  setValidSampleCount(0);
  setCountdown(3);
  setScanState('model-loading');
  let timer:ReturnType<typeof setTimeout>|undefined;

  const schedule=(delay=650)=>{timer=setTimeout(()=>void inspectFrame(),delay)};
  const inspectFrame=async()=>{
   if(scanSessionRef.current!==session||!cameraRef.current)return;
   try{
    const photo=await cameraRef.current.takePictureAsync({base64:true,quality:.38,skipProcessing:false,shutterSound:false});
    if(!photo?.base64)throw new Error('Kamera karesi alınamadı');
    const analysis=await poseBridgeRef.current?.analyze(photo.base64);
    if(!analysis)throw new Error('MediaPipe modeli hazırlanıyor');
    if(scanSessionRef.current!==session)return;
    setLiveLandmarks(analysis.landmarks);
    setAnalysisImageSize({width:analysis.imageWidth,height:analysis.imageHeight});
    setFrameConfidence(analysis.confidence);
    setAnalysisError('');
    const frame=evaluatePoseFrame(analysis.landmarks,view);
    if(!frame.bodyReady){
     holdStartedAtRef.current=null;previousLandmarksRef.current=[];stableCapturesRef.current=[];
     setLiveScore(null);setValidSampleCount(0);setCountdown(3);setScanState('find-body');schedule();return;
    }
    if(!frame.angleReady){
     holdStartedAtRef.current=null;previousLandmarksRef.current=analysis.landmarks;stableCapturesRef.current=[];
     setLiveScore(null);setValidSampleCount(0);setCountdown(3);setScanState('wrong-angle');schedule();return;
    }
    const movement=getLandmarkMovement(previousLandmarksRef.current,analysis.landmarks);
    previousLandmarksRef.current=analysis.landmarks;
    if(movement>.026){
     holdStartedAtRef.current=Date.now();
     stableCapturesRef.current=[];
     setLiveScore(null);setValidSampleCount(0);setCountdown(3);setScanState('hold');schedule();return;
    }
    const frameCapture=createPostureCapture(view,analysis.landmarks,analysis.confidence);
    stableCapturesRef.current=[...stableCapturesRef.current,frameCapture].slice(-12);
    const rollingCapture=aggregatePostureCaptures(view,stableCapturesRef.current);
    setLiveScore(rollingCapture.score);
    setValidSampleCount(stableCapturesRef.current.length);
    holdStartedAtRef.current??=Date.now();
    const elapsed=Date.now()-holdStartedAtRef.current;
    setCountdown(Math.max(0,Math.ceil((3000-elapsed)/1000)));
    setScanState('hold');
    if(elapsed<3000||stableCapturesRef.current.length<4){schedule();return}

    setScanState('capturing');
    const vision3D=vision3DActive?await analyzeWithAppleVision3D(photo.base64).catch(()=>null):null;
    const source=vision3D?'vision-3d+mediapipe-33' as const:'mediapipe-33' as const;
    const item={
     ...aggregatePostureCaptures(view,stableCapturesRef.current),
     analysisSource:source,
     bodyHeightMeters:vision3D?.bodyHeightMeters,
     // Son sabit kareyi rapora ekle: geçmişteki model doğrudan kişinin kendi görüntüsünün üzerine oturur.
     imageData:`data:image/jpeg;base64,${photo.base64}`,
     landmarks:analysis.landmarks.map(point=>({x:point.x,y:point.y,z:point.z,visibility:point.visibility})),
    };
    const nextCaptures=[...capturesRef.current.filter(saved=>saved.view!==view),item];
    capturesRef.current=nextCaptures;
    setCaptures(nextCaptures);
    if(index<2){
     const nextIndex=index+1;
     setScanState('turning');
     timer=setTimeout(()=>setIndex(nextIndex),1400);
     return;
    }

    setCameraReady(false);
    setLiveLandmarks([]);
    const average=Math.round(nextCaptures.reduce((sum,saved)=>sum+saved.score,0)/Math.max(1,nextCaptures.length));
    setResult({id:Date.now().toString(),date:new Date().toISOString(),score:average,captures:nextCaptures,analysisSource:nextCaptures.some(saved=>saved.analysisSource==='vision-3d+mediapipe-33')?'vision-3d+mediapipe-33':'mediapipe-33',summary:average>=82?'Beden eksenin dengeli ve sakin.':average>=68?'Temel hat dengeli; küçük ayarlar gelişimi hızlandırır.':'Merkez ve omuz hattı için yumuşak tekrar öneriliyor.',asymmetrySignal:average>=80?'Sağ-sol farkı düşük':'Omuz ve kalça hattını yeniden dengele'});
    setPhase('processing');
   }catch(error){
    if(scanSessionRef.current!==session)return;
    const message=error instanceof Error?error.message:'Analiz tamamlanamadı';
    if(message.includes('hazır'))setScanState('model-loading');
    else{setScanState('error');setAnalysisError(message)}
    schedule(900);
   }
  };
  schedule(350);
  return()=>{scanSessionRef.current+=1;if(timer)clearTimeout(timer)};
 },[cameraReady,cameraError,index,phase,view]);

 useEffect(()=>{
  if(phase!=='processing'||!result)return;
  const timer=setTimeout(()=>setPhase('review'),1700);
  return()=>clearTimeout(timer);
 },[phase,result]);

 const save=()=>{
  if(!result||saving)return;
  setSaving(true);
  addPostureReport(result);
  requestAnimationFrame(()=>router.dismissTo('/posture'));
 };
 const restart=()=>{capturesRef.current=[];speakingRef.current='';setIndex(0);setCaptures([]);setResult(null);setCountdown(3);setScanState('model-loading');setPhase('scan')};

 if(!permission)return <View style={styles.permission}/>;
 if(!permission.granted)return <SafeAreaView style={styles.permission}>
  <View style={[styles.permissionIcon,{borderColor:shen.color}]}><Ionicons name="scan-outline" size={42} color={shen.color}/></View>
  <Text style={styles.permissionTitle}>Beden aynasını aç</Text>
  <Text style={styles.permissionBody}>Üç kısa görünüm için kameraya ihtiyacımız var. Görüntün sunucuya yüklenmez; yalnızca cihazındaki analiz akışında kullanılır.</Text>
  <PrimaryButton label="Kameraya izin ver" icon="camera" onPress={requestPermission}/>
  <Pressable onPress={()=>router.back()}><Text style={styles.cancel}>Şimdi değil</Text></Pressable>
 </SafeAreaView>;

 if(phase==='processing')return <SafeAreaView style={styles.permission}><ActivityIndicator color={shen.color} size="large"/><Text style={styles.permissionTitle}>BİTTİ</Text><Text style={styles.permissionBody}>Üç gerçek ölçümün medyanını karşılaştırıyor; baş, omuz, gövde, kalça, diz ve ayak bileği raporunu hazırlıyoruz.</Text></SafeAreaView>;

 if(result)return <SafeAreaView style={styles.result}>
  <ScrollView contentContainerStyle={styles.resultContent}>
   <View style={styles.resultTop}><Text style={[styles.resultLabel,{color:shen.color}]}>POSTÜR RAPORUN HAZIR</Text><Text style={styles.resultTitle}>Beden çizgin görünür oldu.</Text><Text style={styles.resultBody}>{result.summary}</Text></View>
   <View style={[styles.overall,{borderColor:shen.color}]}><Text style={[styles.overallValue,{color:shen.color}]}>{result.score}</Text><Text style={styles.overallLabel}>GENEL POSTÜR</Text></View>
   <View style={styles.captureList}>{result.captures.map(item=><View key={item.view} style={styles.captureRow}><View style={[styles.captureIcon,{backgroundColor:`${shen.color}18`}]}><Ionicons name={viewCopy[item.view].icon} color={shen.color} size={21}/></View><View style={styles.flex}><Text style={styles.captureTitle}>{viewCopy[item.view].title}</Text><Text style={styles.captureFeedback}>{item.feedback}</Text></View><Text style={[styles.captureScore,{color:shen.color}]}>{item.score}</Text></View>)}</View>
   <View style={styles.insight}><Ionicons name="sparkles" color={shen.color} size={20}/><View style={styles.flex}><Text style={[styles.insightTitle,{color:shen.color}]}>Kişisel öneri</Text><Text style={styles.insightBody}>{result.asymmetrySignal}. Bir sonraki pratikte dizleri kilitlemeden omuzları aşağı bırak.</Text></View></View>
   <PrimaryButton label={saving?'Kaydediliyor…':'Analizi kaydet'} icon="checkmark" onPress={save}/>
   <Pressable onPress={restart} style={styles.retake}><Text style={styles.retakeText}>Yeniden çek</Text></Pressable>
  </ScrollView>
 </SafeAreaView>;

 return <SafeAreaView style={styles.root}>
  <View style={styles.topbar}>
    <Pressable onPress={()=>router.back()} style={styles.topButton}><Ionicons name="close" color={colors.cream} size={23}/></Pressable>
    <View style={styles.progressPill}><Text style={styles.progressNumber}>{index+1} / 3</Text><View style={styles.progressDotActive}/><Text style={styles.progressLabel}>{copy.title.replace(' görünüm','')}</Text><Text style={styles.progressChevron}>⌄</Text></View>
    <Pressable onPress={()=>setTipVisible(value=>!value)} style={styles.topButton}><Ionicons name="help-circle-outline" color={colors.gold} size={25}/></Pressable>
  </View>
  <View style={styles.sessionContent}>
   <View onLayout={(event:LayoutChangeEvent)=>{const{width,height}=event.nativeEvent.layout;setPreviewSize(current=>current.width===width&&current.height===height?current:{width,height})}} style={[styles.cameraStage,{borderColor:`${shen.color}55`}]}>
    <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" active zoom={0} onCameraReady={()=>{setCameraReady(true);setCameraError(false)}} onMountError={()=>{setCameraError(true);setCameraReady(false)}} mirror/>
    <View style={styles.cameraShade}/>
    <View style={styles.livePill}><View style={[styles.liveDot,{backgroundColor:scanState==='hold'?colors.jade:colors.gold}]}/><Text style={styles.liveText}>{liveScore!==null?`CANLI MEDYAN · ${liveScore} · ${validSampleCount} KARE`:scanState==='hold'?`${vision3DActive?'VISION 3D + ':''}33 NOKTA · %${Math.round(frameConfidence*100)}`:'ALGILANIYOR'}</Text></View>
    <LivePoseOverlay imageSize={analysisImageSize} landmarks={liveLandmarks} previewSize={previewSize} view={view}/>
    {(!cameraReady||cameraError||scanState==='model-loading'||scanState==='error')&&<View style={styles.cameraMessage}><Ionicons name={cameraError||analysisError?'warning-outline':'analytics-outline'} size={22} color={shen.color}/><Text style={styles.cameraMessageText}>{analysisError||(cameraError?'Kamera açılamadı. Ayarlar içinden kamera iznini aç.':scanState==='model-loading'?'Gerçek 33 noktalı poz modeli hazırlanıyor…':'Kamera hazırlanıyor…')}</Text></View>}
    <View style={styles.captureInstruction}>
     <Text style={styles.mobileCountdown}>{scanState==='hold'?String(countdown):scanState==='capturing'?'✓':'•'}</Text>
     <Text style={[styles.stepLabel,{color:shen.color}]}>{getScanInstruction(scanState,view)}</Text>
     <Text style={styles.scanDetail}>{getScanDetail(scanState,view)}</Text>
    </View>
    <View style={styles.angleSteps}>{views.map((item)=><View key={item} style={[styles.angleStep,item===view&&styles.angleStepActive]}><Ionicons name={viewCopy[item].icon} color={item===view?colors.cream:colors.muted} size={17}/><Text style={styles.angleStepText}>{viewCopy[item].title.replace(' görünüm','')}</Text></View>)}</View>
   </View>

   {tipVisible&&<View style={styles.tip}><Text style={styles.tipTitle}>Doğru ölçüm için</Text><Text style={styles.tipText}>Telefonu yaklaşık 1,5–2 metre uzağa koy. Başın ve ayakların aynı anda görünürken üç saniye hareketsiz dur.</Text></View>}
   <MediaPipePoseBridge ref={poseBridgeRef}/>
  </View>
 </SafeAreaView>;
}

const livePoseConnections=[
 [7,11],[8,12],[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32],
] as const;
const livePosePoints=[0,7,8,11,12,13,14,15,16,23,24,25,26,27,28,29,30,31,32] as const;

function LivePoseOverlay({imageSize,landmarks,previewSize,view}:{imageSize:FrameSize;landmarks:PoseLandmark[];previewSize:FrameSize;view:PostureView}){
 if(landmarks.length<33||imageSize.width<=1||imageSize.height<=1||previewSize.width<=1||previewSize.height<=1)return null;
 const scale=Math.max(previewSize.width/imageSize.width,previewSize.height/imageSize.height);
 const renderedWidth=imageSize.width*scale;
 const renderedHeight=imageSize.height*scale;
 const offsetX=(previewSize.width-renderedWidth)/2;
 const offsetY=(previewSize.height-renderedHeight)/2;
 const project=(point:PoseLandmark)=>({
  x:offsetX+point.x*renderedWidth,
  y:offsetY+point.y*renderedHeight,
 });
 const readiness=evaluatePoseFrame(landmarks,view);
 let quality:PostureCapture|null=null;
 if(readiness.angleReady){
  try{quality=createPostureCapture(view,landmarks,1)}catch{}
 }
 const scoreFor=(index:number)=>{
  if(!quality)return null;
  if(index===0||index===7||index===8||(index>=11&&index<=16))return quality.shoulderScore;
  if(index===23||index===24)return quality.hipScore;
  return quality.axisScore;
 };
 const colorFor=(score:number|null)=>score===null?'#7EC8D4':score>=82?'#79D69E':score>=62?'#F3B84F':'#FF5B57';
 return <View pointerEvents="none" style={styles.realPoseOverlay}>
  <Svg height="100%" viewBox={`0 0 ${previewSize.width} ${previewSize.height}`} width="100%" preserveAspectRatio="none">
   <Line x1={previewSize.width/2} y1={previewSize.height*.06} x2={previewSize.width/2} y2={previewSize.height*.96} stroke="rgba(126,200,212,.58)" strokeDasharray="8 7" strokeWidth="1.1"/>
   {view!=='side'?<><Line x1={previewSize.width*.1} y1={project(landmarks[11]).y} x2={previewSize.width*.9} y2={project(landmarks[11]).y} stroke="rgba(242,238,231,.24)" strokeDasharray="5 7" strokeWidth="1"/><Line x1={previewSize.width*.15} y1={project(landmarks[23]).y} x2={previewSize.width*.85} y2={project(landmarks[23]).y} stroke="rgba(242,238,231,.18)" strokeDasharray="5 7" strokeWidth="1"/></>:null}
   {livePoseConnections.map(([startIndex,endIndex])=>{
    const start=landmarks[startIndex],end=landmarks[endIndex];
    if(!isLandmarkVisible(start)||!isLandmarkVisible(end))return null;
    const a=project(start),b=project(end);
    const scores=[scoreFor(startIndex),scoreFor(endIndex)].filter((score):score is number=>score!==null);
    const color=colorFor(scores.length?Math.min(...scores):null);
    return <Line key={`${startIndex}-${endIndex}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth="2.5" strokeLinecap="round"/>;
   })}
   {livePosePoints.map(pointIndex=>{
    const point=landmarks[pointIndex];
    if(!isLandmarkVisible(point))return null;
    const projected=project(point);
    const color=colorFor(scoreFor(pointIndex));
    return <Circle key={pointIndex} cx={projected.x} cy={projected.y} r="7.5" fill={color} fillOpacity=".2" stroke={color} strokeWidth="1.2"/>;
   })}
   {livePosePoints.map(pointIndex=>{const point=landmarks[pointIndex];if(!isLandmarkVisible(point))return null;const projected=project(point);return <Circle key={`core-${pointIndex}`} cx={projected.x} cy={projected.y} r="3.5" fill={colorFor(scoreFor(pointIndex))} stroke="#F2EEE7" strokeWidth=".8"/>})}
  </Svg>
 </View>;
}

function getScanInstruction(state:ScanState,view:PostureView){
 if(state==='model-loading')return'Analiz hazırlanıyor';
 if(state==='find-body')return'Tam bedenini kadraja al';
 if(state==='wrong-angle')return scanCopy[view].turn;
 if(state==='hold')return'Hareketsiz kal';
 if(state==='capturing')return`${viewCopy[view].title} kaydedildi`;
 if(state==='turning')return'Görünüm tamamlandı';
 if(state==='error')return'Analiz yeniden deneniyor';
 return scanCopy[view].waiting;
}

function getScanDetail(state:ScanState,view:PostureView){
 if(state==='find-body')return'Başın, omuzların, kalçan, dizlerin ve ayakların birlikte görünmeli.';
 if(state==='wrong-angle')return`${viewCopy[view].title} henüz doğrulanmadı; doğru yöne geçince sayaç başlayacak.`;
 if(state==='hold')return'Üç saniye boyunca aynı duruşu koru.';
 if(state==='capturing'||state==='turning')return'Gerçek MediaPipe ölçümü alındı.';
 return scanCopy[view].waiting;
}

function PoseGuide({posture,flow,balance}:{posture:number;flow:number;balance:number}){
 const shoulder=scoreTone(posture-4),spine=scoreTone(flow),hip=scoreTone(balance),knee=scoreTone(balance-3),good=scoreTone(90);
 return <View pointerEvents="none" style={styles.guide}>
  <View style={styles.head}/>
  <View style={[styles.centerAxis,{backgroundColor:spine}]}/>
  <Joint color={spine} style={styles.neckJoint}/>
  <View style={styles.shoulderLine}><Joint color={shoulder}/><View style={[styles.guideLine,{backgroundColor:shoulder}]}/><Joint color={shoulder}/></View>
  <View style={styles.hipLine}><Joint color={hip}/><View style={[styles.guideLine,{backgroundColor:hip}]}/><Joint color={hip}/></View>
  <View style={[styles.arm,styles.armLeft,{borderColor:shoulder}]}/>
  <View style={[styles.arm,styles.armRight,{borderColor:shoulder}]}/>
  <View style={styles.legLines}><View style={styles.leg}/><View style={styles.leg}/></View>
  <Joint color={knee} style={styles.leftKnee}/><Joint color={knee} style={styles.rightKnee}/>
  <Joint color={good} style={styles.leftAnkle}/><Joint color={good} style={styles.rightAnkle}/>
  <View style={[styles.footLine,{borderColor:good}]}/>
 </View>;
}

function Joint({color,style}:{color:string;style?:object}){return <View style={[styles.joint,style,{backgroundColor:color}]}/>}

function LegendDot({color,label}:{color:string;label:string}){return <View style={styles.legendItem}><View style={[styles.legendDot,{backgroundColor:color}]}/><Text style={styles.legendText}>{label}</Text></View>}

function MetricCallout({label,value,tone,style}:{label:string;value:string;tone:'good'|'mid';style:object}){
 return <View style={[styles.callout,style]}><Text style={styles.calloutLabel}>{label}</Text><Text style={[styles.calloutValue,{color:tone==='good'?'#8BCF42':'#F2A52A'}]}>{value}</Text></View>;
}

function ToolButton({icon,label,onPress}:{icon:keyof typeof Ionicons.glyphMap;label:string;onPress:()=>void}){
 return <Pressable onPress={onPress} style={styles.toolButton}><Ionicons name={icon} color={colors.gold} size={21}/><Text style={styles.toolLabel}>{label}</Text></Pressable>;
}

function RailButton({icon,label,onPress}:{icon:keyof typeof Ionicons.glyphMap;label:string;onPress:()=>void}){
 return <Pressable onPress={onPress} style={styles.railButton}><Ionicons name={icon} color={colors.gold} size={18}/><Text style={styles.railLabel}>{label}</Text></Pressable>;
}

function MetricRow({metric}:{metric:Metric}){
 const color=scoreTone(metric.value);
 return <View style={styles.metricRow}><View style={styles.metricIcon}><Ionicons name={metric.icon} color={color} size={16}/></View><View style={styles.metricBody}><View style={styles.metricTop}><Text style={styles.metricName}>{metric.label}</Text><Text style={[styles.metricStatus,{color}]}>{metric.measurement} · {scoreLabel(metric.value)}</Text></View><View style={styles.metricTrack}><View style={[styles.metricFill,{backgroundColor:color,width:`${metric.value}%`}]}/></View><Text style={styles.metricConfidence}>Güven %{metric.confidence}</Text></View></View>;
}

function scoreTone(value:number){return value>=82?'#A8D973':value>=68?'#D7A85B':'#B96B5A'}
function scoreLabel(value:number){return value>=82?'İyi':value>=68?'Orta':'Dikkat'}

const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:colors.ink},
 sessionContent:{flex:1,gap:12,paddingBottom:12,paddingHorizontal:12,paddingTop:8},
 cameraStage:{flex:1,backgroundColor:'#020403',borderRadius:22,borderWidth:1,overflow:'hidden',position:'relative',width:'100%'},
 cameraShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,14,10,.25)'},
 realPoseOverlay:{...StyleSheet.absoluteFillObject,zIndex:5},
 overlay:{flex:1},
 flex:{flex:1},
 topbar:{zIndex:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:4},
 topButton:{width:46,height:46,borderRadius:15,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},
 heading:{alignItems:'center',gap:4},
 progressPill:{alignItems:'center',backgroundColor:colors.surface,borderColor:colors.line,borderWidth:1,borderRadius:16,flexDirection:'row',gap:8,paddingHorizontal:16,paddingVertical:10},
 progressNumber:{color:'#A8D973',fontSize:18,fontWeight:'500'},
 progressDotActive:{backgroundColor:'#A8D973',borderRadius:4,height:6,width:6},
 progressLabel:{color:colors.cream,fontSize:16,fontWeight:'500'},
 progressChevron:{color:colors.muted,fontSize:18},
 headingTitle:{color:colors.cream,fontSize:16,fontWeight:'600',letterSpacing:2},
 headingSubtitle:{color:'rgba(243,235,221,.62)',fontSize:16},
 livePill:{position:'absolute',zIndex:8,top:14,alignSelf:'center',height:30,paddingHorizontal:11,borderRadius:15,backgroundColor:'rgba(17,23,19,.82)',borderWidth:1,borderColor:colors.line,flexDirection:'row',alignItems:'center',gap:7},
 liveDot:{width:7,height:7,borderRadius:4},
 liveText:{color:colors.cream,fontSize:16,fontWeight:'800',letterSpacing:1.3},
 stageProgress:{flexDirection:'row',gap:7,marginHorizontal:10},
 progressDot:{height:2,flex:1,borderRadius:2,backgroundColor:'rgba(255,255,255,.26)'},
 guide:{position:'absolute',zIndex:3,top:'15%',bottom:'8%',left:'25%',right:'25%',alignItems:'center'},
 head:{width:48,height:48,borderRadius:22,borderWidth:1,borderColor:'rgba(255,255,255,.9)'},
 centerAxis:{width:2,height:'78%',opacity:.9},
 shoulderLine:{position:'absolute',top:76,left:0,right:0,flexDirection:'row',alignItems:'center'},
 hipLine:{position:'absolute',top:190,left:'17%',right:'17%',flexDirection:'row',alignItems:'center'},
 guideLine:{height:1,flex:1,backgroundColor:'rgba(255,255,255,.82)'},
 joint:{width:12,height:12,borderRadius:6,borderWidth:1.5,borderColor:'rgba(242,238,231,.9)'},
 neckJoint:{position:'absolute',top:54,left:'50%',marginLeft:-7},
 chestJoint:{position:'absolute',top:120,left:'50%',marginLeft:-7},
 waistJoint:{position:'absolute',top:176,left:'50%',marginLeft:-7},
 elbowJoint:{position:'absolute',top:43,left:-8},
 wristJoint:{position:'absolute',bottom:-7,left:-8},
 leftKnee:{position:'absolute',top:'65%',left:'29%'},
 rightKnee:{position:'absolute',top:'65%',right:'29%'},
 leftAnkle:{position:'absolute',bottom:-3,left:'28%'},
 rightAnkle:{position:'absolute',bottom:-3,right:'28%'},
 legLines:{position:'absolute',top:200,bottom:0,left:'30%',right:'30%',flexDirection:'row',justifyContent:'space-between'},
 leg:{width:1.5,height:'100%',backgroundColor:'#7FB46B'},
 arm:{borderColor:'#D7A85B',borderLeftWidth:1.5,height:115,position:'absolute',top:82,width:20},
 armLeft:{left:-18,transform:[{rotate:'17deg'}]},
 armRight:{right:-18,transform:[{rotate:'-17deg'}]},
 footLine:{borderBottomWidth:1,bottom:0,left:'14%',position:'absolute',right:'14%'},
 callout:{position:'absolute',zIndex:6,minWidth:94,paddingHorizontal:9,paddingVertical:7,borderRadius:11,backgroundColor:'rgba(9,15,10,.84)',borderWidth:1,borderColor:'rgba(216,169,88,.28)'},
 calloutLabel:{color:colors.cream,fontSize:17},
 calloutValue:{fontSize:16,fontWeight:'700',marginTop:2},
 calloutShoulder:{right:62,top:'28%'},
 calloutSpine:{left:12,top:'42%'},
 calloutHip:{right:62,top:'51%'},
 calloutWeight:{left:12,bottom:'10%'},
 colorLegend:{position:'absolute',left:10,top:12,zIndex:9,backgroundColor:'rgba(5,13,8,.82)',borderRadius:12,borderWidth:1,borderColor:'rgba(255,255,255,.18)',paddingHorizontal:9,paddingVertical:7,gap:5},
 legendItem:{flexDirection:'row',alignItems:'center',gap:5},
 legendDot:{width:8,height:8,borderRadius:4,borderWidth:1,borderColor:'#FFF'},
 legendText:{color:colors.cream,fontSize:17,fontWeight:'700'},
 toolRail:{backgroundColor:'rgba(8,12,9,.86)',borderColor:'rgba(216,169,88,.28)',borderRadius:20,borderWidth:1,paddingVertical:5,position:'absolute',right:8,top:'47%',transform:[{translateY:-90}],zIndex:8},
 railButton:{alignItems:'center',gap:2,justifyContent:'center',minHeight:49,width:50},
 railLabel:{color:colors.cream,fontSize:17,lineHeight:27,textAlign:'center'},
 tools:{flexDirection:'row',gap:8},
 toolButton:{alignItems:'center',backgroundColor:'rgba(13,17,19,.94)',borderColor:colors.line,borderRadius:15,borderWidth:1,flex:1,minHeight:58,justifyContent:'center',gap:4,paddingHorizontal:6},
 toolLabel:{color:colors.cream,fontSize:16,lineHeight:28,textAlign:'center'},
 cameraMessage:{position:'absolute',zIndex:10,top:'43%',left:20,right:20,padding:14,borderRadius:14,backgroundColor:'rgba(7,21,18,.88)',flexDirection:'row',alignItems:'center',gap:10},
 cameraMessageText:{color:colors.cream,fontSize:16,flex:1},
 tip:{padding:14,borderRadius:16,backgroundColor:'rgba(7,21,18,.94)',borderWidth:1,borderColor:'rgba(216,169,88,.3)'},
 tipTitle:{color:colors.gold,fontSize:17,fontWeight:'800'},
 tipText:{color:colors.cream,fontSize:16,lineHeight:27,marginTop:4},
 bottomPanel:{paddingHorizontal:14,paddingTop:12,paddingBottom:10,gap:10,backgroundColor:'rgba(6,17,12,.97)',borderRadius:22,borderWidth:1,borderColor:'rgba(216,169,88,.3)'},
 captureInstruction:{position:'absolute',bottom:92,left:20,right:20,zIndex:8,alignItems:'center',gap:2},
 actionArea:{gap:10},
 privacy:{color:colors.muted,flex:1,fontSize:16,lineHeight:13},
 sessionNav:{alignItems:'center',backgroundColor:'rgba(8,12,10,.96)',borderColor:'rgba(216,169,88,.24)',borderRadius:22,borderWidth:1,display:'none',flexDirection:'row',justifyContent:'space-around',marginTop:4,minHeight:76,paddingHorizontal:4},
 sessionNavItem:{alignItems:'center',flex:1,gap:4,justifyContent:'center'},
 sessionNavActive:{alignItems:'center',flex:1,gap:2,justifyContent:'center'},
 sessionNavOrb:{alignItems:'center',backgroundColor:'rgba(216,169,88,.08)',borderRadius:25,borderWidth:1,height:50,justifyContent:'center',marginTop:-22,shadowColor:colors.gold,shadowOpacity:.3,shadowRadius:12,width:50},
 sessionNavText:{color:colors.muted,fontSize:17},
 viewIcon:{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'},
 stepLabel:{fontSize:17,fontWeight:'700',letterSpacing:.2},
 scanDetail:{color:colors.muted,fontSize:16,lineHeight:25,marginTop:3,maxWidth:300,textAlign:'center'},
 instruction:{color:colors.muted,fontSize:16,lineHeight:25,marginTop:2},
 mobileCountdown:{color:colors.cream,fontSize:52,fontWeight:'400',lineHeight:58,minWidth:60,textAlign:'center'},
 angleSteps:{position:'absolute',bottom:16,left:16,right:16,zIndex:8,alignItems:'center',backgroundColor:'rgba(17,23,19,.9)',borderColor:colors.line,borderRadius:16,borderWidth:1,flexDirection:'row',justifyContent:'space-around',paddingHorizontal:8,paddingVertical:9},
 angleStep:{alignItems:'center',flex:1,gap:4,opacity:.58},
 angleStepActive:{opacity:1},
 angleStepIcon:{alignItems:'center',backgroundColor:'rgba(255,255,255,.04)',borderRadius:20,height:38,justifyContent:'center',width:38},
 angleStepText:{color:colors.cream,fontSize:16},
 stability:{fontSize:17,fontWeight:'900'},
 analysisCard:{display:'none',minHeight:250,borderRadius:22,borderWidth:1,borderColor:'rgba(216,169,88,.3)',backgroundColor:'rgba(8,14,10,.96)',padding:14,flexDirection:'row',shadowColor:'#000',shadowOpacity:.38,shadowRadius:20,shadowOffset:{width:0,height:12},elevation:8},
 scoreSection:{width:110,alignItems:'center',paddingRight:12,borderRightWidth:1,borderColor:'rgba(216,169,88,.24)'},
 detailsSection:{flex:1,paddingLeft:12,gap:6},
 sectionLabel:{alignSelf:'stretch',color:colors.cream,fontSize:16,letterSpacing:1.2},
 scoreRing:{width:78,height:78,borderRadius:39,borderWidth:7,alignItems:'center',justifyContent:'center',marginTop:7},
 scoreValue:{color:colors.cream,fontSize:25,fontWeight:'600'},
 scoreUnit:{color:colors.muted,fontSize:16},
 scoreStatus:{fontSize:16,fontWeight:'800',marginTop:5},
 scoreCopy:{color:colors.muted,fontSize:17,lineHeight:11,textAlign:'center',marginTop:2},
 metricRow:{flexDirection:'row',alignItems:'center',gap:7},
 metricIcon:{width:27,height:27,borderRadius:8,borderWidth:1,borderColor:'rgba(216,169,88,.28)',alignItems:'center',justifyContent:'center'},
 metricBody:{flex:1,gap:4},
 metricTop:{flexDirection:'row',justifyContent:'space-between'},
 metricName:{color:colors.cream,fontSize:16},
 metricStatus:{fontSize:17,fontWeight:'800'},
 metricTrack:{height:3,borderRadius:2,backgroundColor:'rgba(255,255,255,.1)',overflow:'hidden'},
 metricFill:{height:'100%',borderRadius:2},
 metricConfidence:{color:'rgba(243,235,221,.45)',fontSize:17},
 confidenceCard:{display:'none',flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:15,backgroundColor:'rgba(7,21,18,.94)',borderWidth:1,borderColor:'rgba(216,169,88,.28)'},
 confidenceTitle:{color:colors.cream,fontSize:17,fontWeight:'800'},
 confidenceText:{color:colors.muted,fontSize:16,lineHeight:15,marginTop:2},
 permission:{flex:1,backgroundColor:colors.ink,padding:28,alignItems:'center',justifyContent:'center',gap:20},
 permissionIcon:{width:90,height:90,borderRadius:45,backgroundColor:colors.surface,borderWidth:1,alignItems:'center',justifyContent:'center'},
 permissionTitle:{color:colors.cream,fontSize:26,fontWeight:'800',textAlign:'center'},
 permissionBody:{color:colors.muted,fontSize:16,lineHeight:24,maxWidth:360,textAlign:'center',width:'100%'},
 cancel:{color:colors.muted,fontWeight:'700',padding:12},
 result:{flex:1,backgroundColor:colors.ink},
 resultContent:{padding:24,gap:18},
 resultTop:{gap:7},
 resultLabel:{fontSize:16,fontWeight:'900',letterSpacing:1.4},
 resultTitle:{color:colors.cream,fontSize:28,fontWeight:'800'},
 resultBody:{color:colors.muted,fontSize:16,lineHeight:26},
 overall:{width:150,height:150,borderRadius:75,borderWidth:5,alignSelf:'center',alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},
 overallValue:{fontSize:46,fontWeight:'900'},
 overallLabel:{color:colors.muted,fontSize:16,fontWeight:'900',letterSpacing:1},
 captureList:{gap:8},
 captureRow:{minHeight:66,borderRadius:radii.md,backgroundColor:colors.surface,padding:10,flexDirection:'row',alignItems:'center',gap:10},
 captureIcon:{width:43,height:43,borderRadius:22,alignItems:'center',justifyContent:'center'},
 captureTitle:{color:colors.cream,fontSize:16,fontWeight:'800'},
 captureFeedback:{color:colors.muted,fontSize:16,marginTop:3},
 captureScore:{fontSize:20,fontWeight:'900'},
 insight:{borderRadius:radii.md,backgroundColor:colors.surface,padding:13,flexDirection:'row',gap:10},
 insightTitle:{fontSize:16,fontWeight:'900'},
 insightBody:{color:colors.muted,fontSize:17,lineHeight:28,marginTop:3},
 retake:{height:44,alignItems:'center',justifyContent:'center'},
 retakeText:{color:colors.muted,fontWeight:'700'},
});
