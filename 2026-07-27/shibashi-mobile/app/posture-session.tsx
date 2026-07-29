import {Ionicons} from '@expo/vector-icons';
import {CameraView,useCameraPermissions} from 'expo-camera';
import * as Speech from 'expo-speech';
import {router} from 'expo-router';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {PrimaryButton,ProgressBar} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {getShen} from '../data/fiveShen';
import {MediaPipePoseBridge,MediaPipePoseBridgeRef,PoseLandmark} from '../services/pose/MediaPipePoseBridge';
import {MockPoseAnalyzer} from '../services/pose/PoseAnalyzer';
import {useApp} from '../store/AppStore';
import {PostureCapture,PostureReport,PostureView} from '../types';

const views:PostureView[]=['front','side','back'];
const viewCopy:Record<PostureView,{title:string;instruction:string;icon:keyof typeof Ionicons.glyphMap}>={
 front:{title:'Ön görünüm',instruction:'Başın ve iki ayağın kadrajda olsun. Ağırlığını eşit dağıt.',icon:'body-outline'},
 side:{title:'Yan görünüm',instruction:'Sağa dön. Kulak, omuz, kalça ve ayak bileğini tek çizgide tut.',icon:'accessibility-outline'},
 back:{title:'Arka görünüm',instruction:'Arkanı dön. Omuzlarını bırak ve iki topuğu görünür tut.',icon:'scan-outline'},
};

type Metric={label:string;icon:keyof typeof Ionicons.glyphMap;value:number;measurement:string;confidence:number};

export default function PostureSession(){
 const[permission,requestPermission]=useCameraPermissions();
 const{profile,addPostureReport}=useApp();
 const shen=getShen(profile.selectedShenId);
 const analyzer=useMemo(()=>new MockPoseAnalyzer(),[]);
 const[index,setIndex]=useState(0);
 const[captures,setCaptures]=useState<PostureCapture[]>([]);
 const[result,setResult]=useState<PostureReport|null>(null);
 const[tick,setTick]=useState(0);
 const[stable,setStable]=useState(0);
 const[phase,setPhase]=useState<'scan'|'review'|'processing'>('scan');
 const[transitioning,setTransitioning]=useState(false);
 const[cameraReady,setCameraReady]=useState(false);
 const[analyzingCapture,setAnalyzingCapture]=useState(false);
 const[analysisError,setAnalysisError]=useState('');
 const[cameraError,setCameraError]=useState(false);
 const[tipVisible,setTipVisible]=useState(false);
 const view=views[index]??'front';
 const copy=viewCopy[view];
 const cameraRef=useRef<CameraView|null>(null);
 const poseBridgeRef=useRef<MediaPipePoseBridgeRef|null>(null);

 useEffect(()=>{
  void analyzer.startAnalysis();
  const timer=setInterval(()=>{void analyzer.processFrame();setTick(value=>value+1);setStable(value=>Math.min(5,value+1))},600);
  return()=>{clearInterval(timer);analyzer.stopAnalysis()};
 },[analyzer]);

 const scores=analyzer.snapshot();
 void tick;
 const metrics:Metric[]=[
  {label:'Gövde ekseni',icon:'body-outline',value:scores.flowScore,measurement:`${Math.max(0.6,(100-scores.flowScore)*.18).toFixed(1)}° sapma`,confidence:94},
  {label:'Omuz farkı',icon:'fitness-outline',value:Math.max(50,scores.postureScore-4),measurement:`${Math.max(0.4,(100-scores.postureScore)*.12).toFixed(1)}°`,confidence:92},
  {label:'Kalça farkı',icon:'resize-outline',value:scores.balanceScore,measurement:`${Math.max(0.5,(100-scores.balanceScore)*.1).toFixed(1)}°`,confidence:91},
  {label:'Diz ekseni',icon:'git-compare-outline',value:Math.max(50,scores.balanceScore-3),measurement:`${Math.max(1,(100-scores.balanceScore)*.22).toFixed(1)}°`,confidence:88},
  {label:'Baş öne eğimi',icon:'person-outline',value:Math.max(50,scores.flowScore-2),measurement:`${Math.max(1.5,(100-scores.flowScore)*.24).toFixed(1)}°`,confidence:86},
  {label:'Ağırlık dengesi',icon:'scale-outline',value:Math.max(50,scores.balanceScore-2),measurement:'%46 / %54',confidence:90},
 ];

 useEffect(()=>{
  const text=transitioning
   ?(index===1?'Şimdi yana dönün.':'Şimdi arkanızı dönün.')
   :phase==='review'
   ?'Çekim hazır.'
   :stable>=5
    ?'Pozun sabit. Şimdi çekim yapabilirsin.'
    :copy.instruction;
  Speech.stop();
  void Speech.speak(text,{language:'tr-TR',rate:0.94,pitch:1.02});
  return()=>{Speech.stop()};
 },[index,phase,stable,transitioning,copy.instruction]);

 const capture=async()=>{
  if(analyzingCapture||!cameraRef.current||!cameraReady||transitioning)return;
  setAnalyzingCapture(true);setAnalysisError('');
  try{
   const photo=await cameraRef.current.takePictureAsync({base64:true,quality:.72,skipProcessing:false});
   if(!photo?.base64)throw new Error('Kamera görüntüsü alınamadı');
   const analysis=await poseBridgeRef.current?.analyze(photo.base64);
   if(!analysis)throw new Error('Poz modeli hazır değil');
   const item=createRealCapture(view,analysis.landmarks,analysis.confidence);
   const nextCaptures=[...captures.filter(saved=>saved.view!==view),item];
   setCaptures(nextCaptures);
   setStable(0);
   if(index<2){
    setTransitioning(true);
    setIndex(value=>value+1);
    setTimeout(()=>setTransitioning(false),2200);
   }else{
    setPhase('processing');
    setTimeout(()=>{
     const average=Math.round(nextCaptures.reduce((sum,saved)=>sum+saved.score,0)/Math.max(1,nextCaptures.length));
     setResult({id:Date.now().toString(),date:new Date().toISOString(),score:average,captures:nextCaptures,summary:average>=82?'Beden eksenin dengeli ve sakin.':average>=68?'Temel hat dengeli; küçük ayarlar gelişimi hızlandırır.':'Merkez ve omuz hattı için yumuşak tekrar öneriliyor.',asymmetrySignal:average>=80?'Sağ-sol farkı düşük':'Omuz ve kalça hattını yeniden dengele'});
     setPhase('scan');
    },1400);
   }
  }catch(error){setAnalysisError(error instanceof Error?error.message:'Analiz tamamlanamadı')}
  finally{setAnalyzingCapture(false)}
 };

 const save=()=>{if(!result)return;addPostureReport(result);router.replace('/posture')};
 const restart=()=>{setIndex(0);setCaptures([]);setResult(null);setStable(0);setTransitioning(false);setPhase('scan')};

 useEffect(()=>{
  if(cameraReady&&!analyzingCapture&&!transitioning&&phase==='scan'&&stable>=5) void capture();
 },[stable,cameraReady,analyzingCapture,transitioning,phase]);

 if(!permission)return <View style={styles.permission}/>;
 if(!permission.granted)return <SafeAreaView style={styles.permission}>
  <View style={[styles.permissionIcon,{borderColor:shen.color}]}><Ionicons name="scan-outline" size={42} color={shen.color}/></View>
  <Text style={styles.permissionTitle}>Beden aynasını aç</Text>
  <Text style={styles.permissionBody}>Üç kısa görünüm için kameraya ihtiyacımız var. Görüntün sunucuya yüklenmez; yalnızca cihazındaki analiz akışında kullanılır.</Text>
  <PrimaryButton label="Kameraya izin ver" icon="camera" onPress={requestPermission}/>
  <Pressable onPress={()=>router.back()}><Text style={styles.cancel}>Şimdi değil</Text></Pressable>
 </SafeAreaView>;

 if(result)return <SafeAreaView style={styles.result}>
  <ScrollView contentContainerStyle={styles.resultContent}>
   <View style={styles.resultTop}><Text style={[styles.resultLabel,{color:shen.color}]}>POSTÜR RAPORUN HAZIR</Text><Text style={styles.resultTitle}>Beden çizgin görünür oldu.</Text><Text style={styles.resultBody}>{result.summary}</Text></View>
   <View style={[styles.overall,{borderColor:shen.color}]}><Text style={[styles.overallValue,{color:shen.color}]}>{result.score}</Text><Text style={styles.overallLabel}>GENEL POSTÜR</Text></View>
   <View style={styles.captureList}>{result.captures.map(item=><View key={item.view} style={styles.captureRow}><View style={[styles.captureIcon,{backgroundColor:`${shen.color}18`}]}><Ionicons name={viewCopy[item.view].icon} color={shen.color} size={21}/></View><View style={styles.flex}><Text style={styles.captureTitle}>{viewCopy[item.view].title}</Text><Text style={styles.captureFeedback}>{item.feedback}</Text></View><Text style={[styles.captureScore,{color:shen.color}]}>{item.score}</Text></View>)}</View>
   <View style={styles.insight}><Ionicons name="sparkles" color={shen.color} size={20}/><View style={styles.flex}><Text style={[styles.insightTitle,{color:shen.color}]}>Kişisel öneri</Text><Text style={styles.insightBody}>{result.asymmetrySignal}. Bir sonraki pratikte dizleri kilitlemeden omuzları aşağı bırak.</Text></View></View>
   <PrimaryButton label="Analizi kaydet" icon="checkmark" onPress={save}/>
   <Pressable onPress={restart} style={styles.retake}><Text style={styles.retakeText}>Yeniden çek</Text></Pressable>
  </ScrollView>
 </SafeAreaView>;

 if(phase==='processing')return <SafeAreaView style={styles.permission}><Ionicons name="scan-outline" size={52} color={shen.color}/><Text style={styles.permissionTitle}>Postürün işleniyor</Text><Text style={styles.permissionBody}>Baş, omuz, gövde, kalça, diz ve ayak bileği hattını üç açıdan karşılaştırıyoruz.</Text><ProgressBar value={72} color={shen.color}/></SafeAreaView>;

 return <SafeAreaView style={styles.root}>
  <View style={styles.topbar}>
    <Pressable onPress={()=>router.back()} style={styles.topButton}><Ionicons name="close" color={colors.cream} size={23}/></Pressable>
    <View style={styles.progressPill}><Text style={styles.progressNumber}>{index+1} / 3</Text><View style={styles.progressDotActive}/><Text style={styles.progressLabel}>{copy.title.replace(' görünüm','')}</Text><Text style={styles.progressChevron}>⌄</Text></View>
    <Pressable onPress={()=>setTipVisible(value=>!value)} style={styles.topButton}><Ionicons name="help-circle-outline" color={colors.gold} size={25}/></Pressable>
  </View>
  <ScrollView contentContainerStyle={styles.sessionContent} showsVerticalScrollIndicator={false}>
   <View style={[styles.cameraStage,{borderColor:`${shen.color}55`}]}>
    <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" active zoom={0} onCameraReady={()=>{setCameraReady(true);setCameraError(false)}} onMountError={()=>{setCameraError(true);setCameraReady(false)}} mirror/>
    <View style={styles.cameraShade}/>
    <View style={styles.livePill}><View style={[styles.liveDot,{backgroundColor:cameraReady?colors.jade:colors.gold}]}/><Text style={styles.liveText}>{cameraReady?'CANLI':'HAZIRLANIYOR'}</Text></View>
    <PoseGuide posture={scores.postureScore} flow={scores.flowScore} balance={scores.balanceScore}/>
    {(!cameraReady||cameraError||analyzingCapture||Boolean(analysisError))&&<View style={styles.cameraMessage}><Ionicons name={cameraError||analysisError?'warning-outline':analyzingCapture?'analytics-outline':'camera-outline'} size={22} color={shen.color}/><Text style={styles.cameraMessageText}>{analysisError||(analyzingCapture?'33 noktalı gerçek poz analizi yapılıyor…':cameraError?'Kamera açılamadı. Ayarlar içinden kamera iznini aç.':'Kamera hazırlanıyor…')}</Text></View>}
   </View>

   {tipVisible&&<View style={styles.tip}><Text style={styles.tipTitle}>Doğru ölçüm için</Text><Text style={styles.tipText}>Telefonu yaklaşık 1,5–2 metre uzağa koy. Yeni geniş kadrajda başın ve ayakların aynı anda görünürken beş saniye sabit kal.</Text></View>}

   <View style={styles.captureInstruction}>
    <Text style={styles.mobileCountdown}>{cameraReady&&!transitioning&&stable>=5?'5':transitioning?'•':cameraReady?String(Math.max(1,5-stable)):'•'}</Text>
    <View style={styles.flex}><Text style={[styles.stepLabel,{color:shen.color}]}>{transitioning?(index===1?'Şimdi yana dönün':'Şimdi arkanızı dönün'):cameraReady&&stable>=5?'Hareketsiz durun':'Kadraja girin'}</Text><Text style={styles.instruction}>{transitioning?'Hazır olduğunuzda sabit durun':'Tam bedeniniz görünür olduğunda ölçüm başlayacak'}</Text></View>
   </View>

   <View style={styles.angleSteps}>{views.map((item)=><View key={item} style={[styles.angleStep,item===view&&styles.angleStepActive]}><View style={styles.angleStepIcon}><Ionicons name={viewCopy[item].icon} color={item===view?colors.cream:colors.muted} size={18}/></View><Text style={styles.angleStepText}>{viewCopy[item].title.replace(' görünüm','')}</Text></View>)}</View>

   <View style={styles.analysisCard}>
    <View style={styles.scoreSection}>
     <Text style={styles.sectionLabel}>GENEL SKOR</Text>
     <View style={[styles.scoreRing,{borderColor:scoreTone(scores.postureScore)}]}><Text style={styles.scoreValue}>{scores.postureScore}</Text><Text style={styles.scoreUnit}>/100</Text></View>
     <Text style={[styles.scoreStatus,{color:scoreTone(scores.postureScore)}]}>{scoreLabel(scores.postureScore)}</Text>
    </View>
    <View style={styles.detailsSection}>
     <Text style={styles.sectionLabel}>DETAYLI ANALİZ</Text>
     {metrics.map(metric=><MetricRow key={metric.label} metric={metric}/>)}
    </View>
   </View>
   <View style={styles.confidenceCard}><Ionicons name="analytics-outline" color={shen.color} size={18}/><View style={styles.flex}><Text style={styles.confidenceTitle}>MediaPipe 33 noktalı ölçüm</Text><Text style={styles.confidenceText}>Çekim sırasında 33 anatomik referans cihazında analiz edilir. Sarı ve kırmızı noktalar dikkat isteyen bölgeleri gösterir.</Text></View></View>
   <MediaPipePoseBridge ref={poseBridgeRef}/>

   <View style={styles.sessionNav}>
    <Pressable onPress={()=>router.replace('/(tabs)')} style={styles.sessionNavItem}><Ionicons name="home-outline" color={colors.muted} size={22}/><Text style={styles.sessionNavText}>Ana Sayfa</Text></Pressable>
    <Pressable onPress={()=>router.replace('/(tabs)/practice')} style={styles.sessionNavItem}><Ionicons name="play-circle-outline" color={colors.muted} size={23}/><Text style={styles.sessionNavText}>Pratik</Text></Pressable>
    <View style={styles.sessionNavActive}><View style={[styles.sessionNavOrb,{borderColor:shen.color}]}><Ionicons name="body-outline" color={shen.color} size={25}/></View><Text style={[styles.sessionNavText,{color:shen.color}]}>Analiz</Text></View>
    <Pressable onPress={()=>router.replace('/(tabs)/journal')} style={styles.sessionNavItem}><Ionicons name="book-outline" color={colors.muted} size={22}/><Text style={styles.sessionNavText}>Journal</Text></Pressable>
    <Pressable onPress={()=>router.replace('/(tabs)/profile')} style={styles.sessionNavItem}><Ionicons name="person-outline" color={colors.muted} size={22}/><Text style={styles.sessionNavText}>Profil</Text></Pressable>
   </View>
  </ScrollView>
 </SafeAreaView>;
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

function createRealCapture(view:PostureView,points:PoseLandmark[],confidence:number):PostureCapture{
 if(points.length<33)throw new Error('Tam beden algılanamadı. Baş ve ayaklarını kadraja al.');
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
 const shoulderScore=Math.round(Math.max(30,100-shoulderTilt*7));
 const hipScore=Math.round(Math.max(30,100-hipTilt*8));
 const axisScore=Math.round(Math.max(30,100-axisTilt*6));
 const balanceScore=Math.round(Math.max(30,100-kneeTilt*5));
 const score=Math.round(shoulderScore*.28+hipScore*.25+axisScore*.32+balanceScore*.15);
 const confidencePercent=Math.round(confidence*100);
 return{
  view,score,shoulderScore,axisScore,hipScore,
  feedback:score>=82
   ?`33 noktalı ölçümde beden ekseni dengeli · güven %${confidencePercent}`
   :score>=68
    ?`Küçük hizalama farkları var · omuz ${shoulderTilt.toFixed(1)}°, kalça ${hipTilt.toFixed(1)}°`
    :`Eksen ${axisTilt.toFixed(1)}° sapıyor; çekimi daha dengeli bir duruşla tekrarla.`,
 };
}

function Joint({color,style}:{color:string;style?:object}){return <View style={[styles.joint,style,{backgroundColor:color,shadowColor:color}]}/>}

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
 sessionContent:{gap:12,paddingBottom:28,paddingHorizontal:14},
 cameraStage:{aspectRatio:.58,backgroundColor:'#020403',borderRadius:24,borderWidth:1,overflow:'hidden',position:'relative',width:'100%'},
 cameraShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,14,10,.25)'},
 overlay:{flex:1},
 flex:{flex:1},
 topbar:{zIndex:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:4},
 topButton:{width:46,height:46,borderRadius:15,backgroundColor:'rgba(5,13,8,.68)',borderWidth:1,borderColor:'rgba(216,169,88,.32)',alignItems:'center',justifyContent:'center'},
 heading:{alignItems:'center',gap:4},
 progressPill:{alignItems:'center',backgroundColor:'rgba(5,8,6,.92)',borderRadius:999,flexDirection:'row',gap:8,paddingHorizontal:18,paddingVertical:10},
 progressNumber:{color:'#A8D973',fontSize:18,fontWeight:'500'},
 progressDotActive:{backgroundColor:'#A8D973',borderRadius:4,height:6,width:6},
 progressLabel:{color:colors.cream,fontSize:16,fontWeight:'500'},
 progressChevron:{color:colors.muted,fontSize:18},
 headingTitle:{color:colors.cream,fontSize:16,fontWeight:'600',letterSpacing:2},
 headingSubtitle:{color:'rgba(243,235,221,.62)',fontSize:11},
 livePill:{position:'absolute',zIndex:8,top:14,alignSelf:'center',height:32,paddingHorizontal:12,borderRadius:16,backgroundColor:'rgba(5,13,8,.72)',borderWidth:1,borderColor:'rgba(216,169,88,.32)',flexDirection:'row',alignItems:'center',gap:7},
 liveDot:{width:7,height:7,borderRadius:4},
 liveText:{color:colors.cream,fontSize:10,fontWeight:'800',letterSpacing:1.3},
 stageProgress:{flexDirection:'row',gap:7,marginHorizontal:10},
 progressDot:{height:2,flex:1,borderRadius:2,backgroundColor:'rgba(255,255,255,.26)'},
 guide:{position:'absolute',zIndex:3,top:'15%',bottom:'8%',left:'25%',right:'25%',alignItems:'center'},
 head:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:'rgba(255,255,255,.9)'},
 centerAxis:{width:2,height:'78%',opacity:.9},
 shoulderLine:{position:'absolute',top:76,left:0,right:0,flexDirection:'row',alignItems:'center'},
 hipLine:{position:'absolute',top:190,left:'17%',right:'17%',flexDirection:'row',alignItems:'center'},
 guideLine:{height:1,flex:1,backgroundColor:'rgba(255,255,255,.82)'},
 joint:{width:14,height:14,borderRadius:7,borderWidth:2,borderColor:'#FFF',shadowOpacity:.95,shadowRadius:6,elevation:6},
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
 leg:{width:2,height:'100%',backgroundColor:'#72C83D'},
 arm:{borderColor:'#F5A623',borderLeftWidth:2,height:115,position:'absolute',top:82,width:20},
 armLeft:{left:-18,transform:[{rotate:'17deg'}]},
 armRight:{right:-18,transform:[{rotate:'-17deg'}]},
 footLine:{borderBottomWidth:1,bottom:0,left:'14%',position:'absolute',right:'14%'},
 callout:{position:'absolute',zIndex:6,minWidth:94,paddingHorizontal:9,paddingVertical:7,borderRadius:11,backgroundColor:'rgba(9,15,10,.84)',borderWidth:1,borderColor:'rgba(216,169,88,.28)'},
 calloutLabel:{color:colors.cream,fontSize:8},
 calloutValue:{fontSize:9,fontWeight:'700',marginTop:2},
 calloutShoulder:{right:62,top:'28%'},
 calloutSpine:{left:12,top:'42%'},
 calloutHip:{right:62,top:'51%'},
 calloutWeight:{left:12,bottom:'10%'},
 colorLegend:{position:'absolute',left:10,top:12,zIndex:9,backgroundColor:'rgba(5,13,8,.82)',borderRadius:12,borderWidth:1,borderColor:'rgba(255,255,255,.18)',paddingHorizontal:9,paddingVertical:7,gap:5},
 legendItem:{flexDirection:'row',alignItems:'center',gap:5},
 legendDot:{width:8,height:8,borderRadius:4,borderWidth:1,borderColor:'#FFF'},
 legendText:{color:colors.cream,fontSize:8,fontWeight:'700'},
 toolRail:{backgroundColor:'rgba(8,12,9,.86)',borderColor:'rgba(216,169,88,.28)',borderRadius:20,borderWidth:1,paddingVertical:5,position:'absolute',right:8,top:'47%',transform:[{translateY:-90}],zIndex:8},
 railButton:{alignItems:'center',gap:2,justifyContent:'center',minHeight:49,width:50},
 railLabel:{color:colors.cream,fontSize:7,lineHeight:9,textAlign:'center'},
 tools:{flexDirection:'row',gap:8},
 toolButton:{alignItems:'center',backgroundColor:'rgba(13,17,19,.94)',borderColor:colors.line,borderRadius:15,borderWidth:1,flex:1,minHeight:58,justifyContent:'center',gap:4,paddingHorizontal:6},
 toolLabel:{color:colors.cream,fontSize:9,lineHeight:12,textAlign:'center'},
 cameraMessage:{position:'absolute',zIndex:10,top:'43%',left:20,right:20,padding:14,borderRadius:14,backgroundColor:'rgba(7,21,18,.88)',flexDirection:'row',alignItems:'center',gap:10},
 cameraMessageText:{color:colors.cream,fontSize:13,flex:1},
 tip:{padding:14,borderRadius:16,backgroundColor:'rgba(7,21,18,.94)',borderWidth:1,borderColor:'rgba(216,169,88,.3)'},
 tipTitle:{color:colors.gold,fontSize:12,fontWeight:'800'},
 tipText:{color:colors.cream,fontSize:11,lineHeight:16,marginTop:4},
 bottomPanel:{paddingHorizontal:14,paddingTop:12,paddingBottom:10,gap:10,backgroundColor:'rgba(6,17,12,.97)',borderRadius:22,borderWidth:1,borderColor:'rgba(216,169,88,.3)'},
 captureInstruction:{flexDirection:'row',alignItems:'center',gap:9},
 actionArea:{gap:10},
 privacy:{color:colors.muted,flex:1,fontSize:9,lineHeight:13},
 sessionNav:{alignItems:'center',backgroundColor:'rgba(8,12,10,.96)',borderColor:'rgba(216,169,88,.24)',borderRadius:22,borderWidth:1,display:'none',flexDirection:'row',justifyContent:'space-around',marginTop:4,minHeight:76,paddingHorizontal:4},
 sessionNavItem:{alignItems:'center',flex:1,gap:4,justifyContent:'center'},
 sessionNavActive:{alignItems:'center',flex:1,gap:2,justifyContent:'center'},
 sessionNavOrb:{alignItems:'center',backgroundColor:'rgba(216,169,88,.08)',borderRadius:25,borderWidth:1,height:50,justifyContent:'center',marginTop:-22,shadowColor:colors.gold,shadowOpacity:.3,shadowRadius:12,width:50},
 sessionNavText:{color:colors.muted,fontSize:8},
 viewIcon:{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'},
 stepLabel:{fontSize:8,fontWeight:'900',letterSpacing:1},
 instruction:{color:colors.muted,fontSize:10,lineHeight:14,marginTop:2},
 mobileCountdown:{color:colors.cream,fontSize:52,fontWeight:'400',lineHeight:58,minWidth:60,textAlign:'center'},
 angleSteps:{alignItems:'center',backgroundColor:'rgba(8,12,10,.96)',borderColor:colors.line,borderRadius:20,borderWidth:1,flexDirection:'row',justifyContent:'space-around',paddingHorizontal:8,paddingVertical:10},
 angleStep:{alignItems:'center',flex:1,gap:4,opacity:.58},
 angleStepActive:{opacity:1},
 angleStepIcon:{alignItems:'center',backgroundColor:'rgba(255,255,255,.04)',borderRadius:20,height:38,justifyContent:'center',width:38},
 angleStepText:{color:colors.cream,fontSize:10},
 stability:{fontSize:15,fontWeight:'900'},
 analysisCard:{display:'none',minHeight:250,borderRadius:22,borderWidth:1,borderColor:'rgba(216,169,88,.3)',backgroundColor:'rgba(8,14,10,.96)',padding:14,flexDirection:'row',shadowColor:'#000',shadowOpacity:.38,shadowRadius:20,shadowOffset:{width:0,height:12},elevation:8},
 scoreSection:{width:110,alignItems:'center',paddingRight:12,borderRightWidth:1,borderColor:'rgba(216,169,88,.24)'},
 detailsSection:{flex:1,paddingLeft:12,gap:6},
 sectionLabel:{alignSelf:'stretch',color:colors.cream,fontSize:9,letterSpacing:1.2},
 scoreRing:{width:78,height:78,borderRadius:39,borderWidth:7,alignItems:'center',justifyContent:'center',marginTop:7},
 scoreValue:{color:colors.cream,fontSize:25,fontWeight:'600'},
 scoreUnit:{color:colors.muted,fontSize:9},
 scoreStatus:{fontSize:11,fontWeight:'800',marginTop:5},
 scoreCopy:{color:colors.muted,fontSize:8,lineHeight:11,textAlign:'center',marginTop:2},
 metricRow:{flexDirection:'row',alignItems:'center',gap:7},
 metricIcon:{width:27,height:27,borderRadius:8,borderWidth:1,borderColor:'rgba(216,169,88,.28)',alignItems:'center',justifyContent:'center'},
 metricBody:{flex:1,gap:4},
 metricTop:{flexDirection:'row',justifyContent:'space-between'},
 metricName:{color:colors.cream,fontSize:9},
 metricStatus:{fontSize:8,fontWeight:'800'},
 metricTrack:{height:3,borderRadius:2,backgroundColor:'rgba(255,255,255,.1)',overflow:'hidden'},
 metricFill:{height:'100%',borderRadius:2},
 metricConfidence:{color:'rgba(243,235,221,.45)',fontSize:7},
 confidenceCard:{display:'none',flexDirection:'row',alignItems:'center',gap:10,padding:12,borderRadius:15,backgroundColor:'rgba(7,21,18,.94)',borderWidth:1,borderColor:'rgba(216,169,88,.28)'},
 confidenceTitle:{color:colors.cream,fontSize:12,fontWeight:'800'},
 confidenceText:{color:colors.muted,fontSize:10,lineHeight:15,marginTop:2},
 permission:{flex:1,backgroundColor:colors.ink,padding:28,alignItems:'center',justifyContent:'center',gap:20},
 permissionIcon:{width:90,height:90,borderRadius:45,backgroundColor:colors.surface,borderWidth:1,alignItems:'center',justifyContent:'center'},
 permissionTitle:{color:colors.cream,fontSize:26,fontWeight:'800',textAlign:'center'},
 permissionBody:{color:colors.muted,fontSize:16,lineHeight:24,textAlign:'center'},
 cancel:{color:colors.muted,fontWeight:'700',padding:12},
 result:{flex:1,backgroundColor:colors.ink},
 resultContent:{padding:24,gap:18},
 resultTop:{gap:7},
 resultLabel:{fontSize:10,fontWeight:'900',letterSpacing:1.4},
 resultTitle:{color:colors.cream,fontSize:28,fontWeight:'800'},
 resultBody:{color:colors.muted,fontSize:14,lineHeight:21},
 overall:{width:150,height:150,borderRadius:75,borderWidth:5,alignSelf:'center',alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},
 overallValue:{fontSize:46,fontWeight:'900'},
 overallLabel:{color:colors.muted,fontSize:9,fontWeight:'900',letterSpacing:1},
 captureList:{gap:8},
 captureRow:{minHeight:66,borderRadius:radii.md,backgroundColor:colors.surface,padding:10,flexDirection:'row',alignItems:'center',gap:10},
 captureIcon:{width:43,height:43,borderRadius:22,alignItems:'center',justifyContent:'center'},
 captureTitle:{color:colors.cream,fontSize:13,fontWeight:'800'},
 captureFeedback:{color:colors.muted,fontSize:10,marginTop:3},
 captureScore:{fontSize:20,fontWeight:'900'},
 insight:{borderRadius:radii.md,backgroundColor:colors.surface,padding:13,flexDirection:'row',gap:10},
 insightTitle:{fontSize:11,fontWeight:'900'},
 insightBody:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:3},
 retake:{height:44,alignItems:'center',justifyContent:'center'},
 retakeText:{color:colors.muted,fontWeight:'700'},
});
