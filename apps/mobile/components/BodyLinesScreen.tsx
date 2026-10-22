import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { meridianLivingSteps, meridianMovements } from '../../../packages/meridian-knowledge';
import { colors } from '../constants/theme';
import { shibashiPosters, shibashiVideos } from '../data/shibashiMedia';
import { compareShibashiPose, referenceAt, type ReferenceMovement } from '../services/pose/shibashiComparison';
import { MediaPipePoseBridge, type MediaPipePoseBridgeRef, type PoseLandmark } from '../services/pose/MediaPipePoseBridge';
import { deleteShibashiPhoto, loadShibashiPhotos, saveShibashiPhoto, type ShibashiPhoto } from '../services/shibashiPhotos';
import referenceData from '../data/teacherPoseSamples.json';

const targetKey = 'shibashi-learning-target-score';
const references = referenceData as unknown as Record<string, ReferenceMovement>;
const links: [number, number][] = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
const dots = [0,11,12,13,14,15,16,23,24,25,26,27,28];
const praise = [{ emoji: '✨', text: 'Harika!' }, { emoji: '🌟', text: 'Müthiş!' }, { emoji: '🎉', text: 'Süpersin!' }];

type Phase = 'watch' | 'framing' | 'cue' | 'playing' | 'result';

export function BodyLinesScreen() {
  const params = useLocalSearchParams<{ movementOrder?: string }>();
  const requested = Number(params.movementOrder);
  const [order, setOrder] = useState(Number.isInteger(requested) && requested >= 1 && requested <= 18 ? requested : 1);
  const [photos, setPhotos] = useState<ShibashiPhoto[]>([]);
  const [selected, setSelected] = useState<ShibashiPhoto | null>(null);
  useEffect(() => { void loadShibashiPhotos().then(setPhotos); }, []);
  const choose = (next: number) => { setOrder(next); void Haptics.selectionAsync(); };
  const removePhoto = (photo: ShibashiPhoto) => Alert.alert('Fotoğrafı sil?', 'Bu fotoğraf cihazından kalıcı olarak silinecek.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: () => { void deleteShibashiPhoto(photo.id).then(items => { setPhotos(items); setSelected(null); }); } },
  ]);
  return <SafeAreaView style={s.root} edges={['top']}><ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
    <View style={s.top}><Pressable accessibilityLabel="Geri dön" onPress={() => router.back()} style={s.icon}><Ionicons name="arrow-back" size={23} color={colors.cream}/></Pressable><Text style={s.topTitle}>18 hareketle öğren</Text><Pressable accessibilityLabel="Fotoğraflarım" onPress={() => { void loadShibashiPhotos().then(setPhotos); }} style={s.icon}><Ionicons name="images-outline" size={22} color={colors.cream}/></Pressable></View>
    <MovementStage key={order} order={order} onNext={() => choose(order % 18 + 1)} onPhoto={photo => setPhotos(items => [photo, ...items])}/>
    <Text style={s.sectionTitle}>18 hareket</Text>
    <View style={s.grid}>{meridianMovements.map(item => <Pressable key={item.order} onPress={() => choose(item.order)} style={[s.tile, item.order === order && s.tileActive]} accessibilityState={{ selected: item.order === order }}><Image source={shibashiPosters[item.order]} style={s.tileImage}/><View style={s.tileShade}/><Text style={s.tileNumber}>{String(item.order).padStart(2,'0')}</Text><Text numberOfLines={2} style={s.tileTitle}>{item.sourceTitle}</Text></Pressable>)}</View>
    <View style={s.galleryHead}><Text style={s.sectionTitle}>Fotoğraflarım</Text><Text style={s.muted}>{photos.length} fotoğraf</Text></View>
    {photos.length ? <View style={s.photoGrid}>{photos.map(photo => <Pressable key={photo.id} onPress={() => setSelected(photo)} style={s.photoTile}><Image source={{uri:photo.uri}} style={s.photoImage}/><Text style={s.photoScore}>%{photo.score}</Text></Pressable>)}</View> : <Text style={s.muted}>Hareket sırasında hedef uyuma ulaştığında fotoğrafların burada görünür.</Text>}
  </ScrollView><Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}><View style={s.modal}><Pressable onPress={() => setSelected(null)} style={s.modalClose}><Ionicons name="close" size={26} color="white"/></Pressable>{selected && <><Image source={{uri:selected.uri}} style={s.modalImage} resizeMode="contain"/><Text style={s.modalTitle}>{selected.name} · %{selected.score}</Text><Text style={s.muted}>{new Date(selected.savedAt).toLocaleString('tr-TR')}</Text><Pressable onPress={() => removePhoto(selected)} style={s.delete}><Ionicons name="trash-outline" size={18} color="white"/><Text style={s.deleteText}>Fotoğrafı sil</Text></Pressable></>}</View></Modal></SafeAreaView>;
}

function MovementStage({ order, onNext, onPhoto }: { order: number; onNext: () => void; onPhoto: (photo: ShibashiPhoto) => void }) {
  const movement = meridianMovements.find(item => item.order === order) ?? meridianMovements[0];
  const reference = references[String(order)];
  const player = useVideoPlayer(shibashiVideos[order], instance => { instance.loop = true; instance.muted = true; });
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const bridgeRef = useRef<MediaPipePoseBridgeRef>(null);
  const [phase, setPhaseState] = useState<Phase>('watch');
  const phaseRef = useRef<Phase>('watch');
  const setPhase = (next: Phase) => { phaseRef.current = next; setPhaseState(next); };
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const scoreRef = useRef<number | null>(null);
  const [target, setTarget] = useState(70);
  const targetRef = useRef(70);
  const [message, setMessage] = useState('Hoca videosunu izle, ardından pratik yap.');
  const [pose, setPose] = useState<PoseLandmark[]>([]);
  const [jointScores, setJointScores] = useState<Record<number,number>>({});
  const [cameraSize, setCameraSize] = useState({width:1,height:1});
  const [progressWidth, setProgressWidth] = useState(1);
  const [celebration, setCelebration] = useState<{emoji:string;text:string}|null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [succeeded, setSucceeded] = useState(false);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoCountRef = useRef(0);
  const lastPhotoAt = useRef(0);
  const startAt = useRef(0);
  const lastVideoTime = useRef(0);
  const loops = useRef(0);
  const sampleCount = useRef(0);
  const bestScore = useRef(0);
  const lastPose = useRef<{user:PoseLandmark[];teacher:NonNullable<ReturnType<typeof referenceAt>>}|null>(null);
  const completeRef = useRef(false);
  useEffect(() => { void AsyncStorage.getItem(targetKey).then(value => { const saved = Number(value); if (value && saved >= 0 && saved <= 100) { setTarget(saved); targetRef.current = saved; } }); }, []);
  useEffect(() => () => { phaseRef.current='watch'; void Speech.stop(); player.pause(); if (celebrationTimer.current) clearTimeout(celebrationTimer.current); }, [player]);
  useEffect(() => { const listener = player.addListener('playingChange', ({isPlaying}) => setVideoPlaying(isPlaying)); return () => listener.remove(); }, [player]);
  const updateTarget = (next:number) => { const value = Math.max(0,Math.min(100,Math.round(next/5)*5)); setTarget(value); targetRef.current = value; void AsyncStorage.setItem(targetKey,String(value)); };
  const speak = (text:string, done?:()=>void) => { void Speech.stop(); Speech.speak(text,{language:'tr-TR',rate:.86,onDone:done,onError:done}); };
  const begin = async () => {
    if (!permission?.granted) { const response = await requestPermission(); if (!response.granted) { Alert.alert('Kamera izni gerekli','Pratik için kameraya izin vermelisin.'); return; } }
    player.pause(); player.currentTime = 0; setVideoPlaying(false);
    setScore(null); scoreRef.current=null; setSucceeded(false); setPose([]); setJointScores({}); setPhotoCount(0); photoCountRef.current=0; lastPhotoAt.current=0; loops.current=0; sampleCount.current=0; bestScore.current=0; completeRef.current=false; lastPose.current=null;
    setMessage('Bedenini kamerada göstermek için biraz geri çekil.'); setPhase('framing');
  };
  const finish = () => { if (completeRef.current) return; completeRef.current=true; player.pause(); setPhase('result'); const passed=bestScore.current>=targetRef.current && sampleCount.current>=5; setSucceeded(passed); setMessage(passed?'Başardın, şimdi sıradaki harekete geçebilirsin.':'Bir kez daha dene; tam bedenin görünürken hocayı takip et.'); if (passed) { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); speak('Başardın, şimdi sıradakine geç.'); } };
  useEffect(() => {
    if (phase !== 'framing' && phase !== 'cue' && phase !== 'playing') return;
    if (!permission?.granted) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const scan = async () => {
      try {
        if (!cameraRef.current || !bridgeRef.current?.ready) { if (!cancelled) timer=setTimeout(scan,700); return; }
        const capture = await cameraRef.current.takePictureAsync({base64:true,quality:.38,skipProcessing:false,shutterSound:false});
        if (cancelled) return;
        if (!capture?.base64) throw new Error('Kamera karesi alınamadı.');
        const analysis = await bridgeRef.current.analyze(capture.base64);
        if (cancelled) return;
        setPose(analysis.landmarks);
        const videoSeconds = player.currentTime;
        const teacher = referenceAt(reference,videoSeconds);
        if (!teacher) throw new Error('Bu video için referans poz bulunamadı.');
        const previous = lastPose.current;
        const comparison = compareShibashiPose(analysis.landmarks,teacher,analysis.imageWidth/analysis.imageHeight,reference.aspect,previous ?? undefined);
        if (!comparison.fullBody) {
          setMessage('Bedenini kamerada göstermek için biraz geri çekil.');
          if (phaseRef.current === 'playing') { setScore(null); scoreRef.current=null; lastPose.current=null; }
        } else if (phaseRef.current === 'framing') {
          setPhase('cue'); setMessage('Hareketi sen de yapmaya hazır ol.');
          const startVideo = () => { if (phaseRef.current === 'cue') { player.currentTime=0; player.play(); startAt.current=Date.now(); lastVideoTime.current=0; setPhase('playing'); setMessage('Hocayla birlikte hareket et.'); } };
          speak('Hareketi sen de yapmaya hazır ol.', startVideo);
          setTimeout(startVideo, 2600);
        } else if (phaseRef.current === 'playing' && comparison.score !== null) {
          sampleCount.current++;
          lastPose.current={user:analysis.landmarks,teacher};
          setJointScores(comparison.joints);
          bestScore.current=Math.max(bestScore.current,comparison.score);
          const previousScore=scoreRef.current;
          const smoothed=previousScore===null?Math.min(35,comparison.score):previousScore+Math.max(-6,Math.min(6,comparison.score-previousScore));
          scoreRef.current=smoothed; setScore(Math.round(smoothed));
          const now=Date.now();
          if (smoothed>=targetRef.current && photoCountRef.current<3 && now-lastPhotoAt.current>=3000 && capture.uri) {
            lastPhotoAt.current=now;
            const index=photoCountRef.current++;
            setPhotoCount(photoCountRef.current); setCelebration(praise[index]);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void saveShibashiPhoto(capture.uri,order,movement.sourceTitle,comparison.score).then(onPhoto).catch(() => setMessage('Fotoğraf kaydedilemedi; cihazında boş alanı kontrol et.'));
            if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
            celebrationTimer.current=setTimeout(() => setCelebration(null),1800);
          }
          if (videoSeconds + .35 < lastVideoTime.current) loops.current++;
          lastVideoTime.current=videoSeconds;
          if (loops.current>=2 || Date.now()-startAt.current>=Math.max(20000,reference.duration*2000+2500)) finish();
        }
      } catch { if (!cancelled) setMessage('Kamera veya poz analizi hazırlanıyor.'); }
      if (!cancelled && phaseRef.current !== 'result') timer=setTimeout(scan,650);
    };
    timer=setTimeout(scan,500);
    return () => { cancelled=true; clearTimeout(timer); };
  }, [phase === 'watch' || phase === 'result', permission?.granted, order]);
  const steps = meridianLivingSteps[order-1] || [];
  return <View style={s.stage}>
    <Text style={s.number}>HAREKET {String(order).padStart(2,'0')} / 18</Text><Text style={s.title}>{movement.sourceTitle}</Text>
    <Text style={s.description}>{steps[0] || 'Önce hocayı izle, sonra aynı hareketi kendi ritminle dene.'}</Text>{phase==='watch' && steps.length>1 && <View style={s.steps}>{steps.slice(1).map((step,index)=><Text key={step} style={s.step}>{index+2}. {step}</Text>)}</View>}
    <View style={[s.mediaRow,phase === 'watch' && s.mediaOnly]}>
      <View style={s.media}><VideoView player={player} style={s.video} contentFit="contain" nativeControls={phase==='watch'} surfaceType="textureView"/><Text style={s.mediaLabel}>HOCA</Text>{phase==='watch' && !videoPlaying && <Pressable onPress={() => player.play()} style={s.playOverlay}><Ionicons name="play" size={35} color={colors.ink}/></Pressable>}</View>
      {phase!=='watch' && <View style={s.media}><CameraView ref={cameraRef} facing="front" mirror active={phase!=='result'} style={s.camera}/><View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={event => setCameraSize(event.nativeEvent.layout)}><PoseOverlay pose={pose} scores={jointScores} target={target} width={cameraSize.width} height={cameraSize.height}/></View><Text style={s.mediaLabel}>SEN</Text>{phase==='framing' && <View pointerEvents="none" style={s.warning}><Text style={s.warningText}>Bedenini kamerada göstermek için biraz geri çekil.</Text></View>}</View>}
    </View>
    {phase==='watch' && <><Pressable onPress={() => videoPlaying?player.pause():player.play()} style={s.secondary}><Ionicons name={videoPlaying?'pause':'play'} size={20} color={colors.cream}/><Text style={s.secondaryText}>{videoPlaying?'Videoyu duraklat':'Hoca videosunu oynat'}</Text></Pressable><Pressable onPress={() => {void begin();}} style={s.primary}><Text style={s.primaryText}>Pratik yaparak öğren</Text><Ionicons name="arrow-forward" size={21} color={colors.ink}/></Pressable></>}
    {phase!=='watch' && <><View style={s.scoreRow}><View><Text style={s.scoreLabel}>CANLI UYUM</Text><Text style={[s.score,{color:score!==null && score>=target?colors.jade:colors.cream}]}>{score===null?'—':`%${score}`}</Text></View><Text style={s.photoCounter}>{photoCount}/3 fotoğraf</Text></View><View style={s.progress} accessibilityRole="adjustable" accessibilityLabel="Hedef uyum" accessibilityValue={{min:0,max:100,now:target}} onAccessibilityAction={event => updateTarget(target + (event.nativeEvent.actionName==='increment'?5:-5))} accessibilityActions={[{name:'increment'},{name:'decrement'}]} onLayout={event => setProgressWidth(event.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={event => updateTarget(event.nativeEvent.locationX/progressWidth*100)} onResponderMove={event => { const next=Math.max(0,Math.min(100,Math.round(event.nativeEvent.locationX/progressWidth*20)*5)); setTarget(next); targetRef.current=next; }} onResponderRelease={event => updateTarget(event.nativeEvent.locationX/progressWidth*100)}><View style={[s.progressFill,{width:`${score??0}%`,backgroundColor:score!==null&&score>=target?colors.jade:colors.gold}]}/><View style={[s.targetMark,{left:`${target}%`}]}/></View><View style={s.targetRow}><Text style={s.muted}>Hedef uyum: %{target}</Text><View style={s.targetButtons}><Pressable accessibilityLabel="Hedefi azalt" onPress={() => updateTarget(target-5)} style={s.targetButton}><Ionicons name="remove" size={20} color={colors.cream}/></Pressable><Pressable accessibilityLabel="Hedefi artır" onPress={() => updateTarget(target+5)} style={s.targetButton}><Ionicons name="add" size={20} color={colors.cream}/></Pressable></View></View><Text style={s.message}>{message}</Text>{celebration && <Text style={s.celebration}>{celebration.emoji} {celebration.text}</Text>}</>}
    {phase==='result' && <View style={s.result}><Text style={s.resultTitle}>{succeeded?'Başardın!':'Yeniden deneyelim'}</Text><Text style={s.resultScore}>En yüksek uyum: %{bestScore.current}</Text><Pressable onPress={() => {void begin();}} style={s.secondary}><Ionicons name="refresh" size={20} color={colors.cream}/><Text style={s.secondaryText}>Tekrar dene</Text></Pressable>{succeeded && <Pressable onPress={onNext} style={s.primary}><Text style={s.primaryText}>Sıradaki hareket</Text><Ionicons name="arrow-forward" size={20} color={colors.ink}/></Pressable>}</View>}
    {phase==='framing' && <Pressable onPress={() => {setPhase('watch');player.pause();}} style={s.secondary}><Text style={s.secondaryText}>Videoya dön</Text></Pressable>}
    {(phase==='framing'||phase==='cue'||phase==='playing') && <MediaPipePoseBridge ref={bridgeRef}/>}
  </View>;
}

function PoseOverlay({pose,scores,target,width,height}:{pose:PoseLandmark[];scores:Record<number,number>;target:number;width:number;height:number}) {
  if (!pose.length) return null;
  const x=(i:number)=> (1-pose[i].x)*width;
  const y=(i:number)=> pose[i].y*height;
  const color=(i:number)=>scores[i]===undefined?'#f0d88b':scores[i]>=target?'#80f5a2':'#ff7474';
  return <Svg width={width} height={height}>{links.map(([a,b])=>pose[a]?.visibility>=.4&&pose[b]?.visibility>=.4?<Line key={`${a}-${b}`} x1={x(a)} y1={y(a)} x2={x(b)} y2={y(b)} stroke={Math.min(scores[a]??0,scores[b]??0)>=target?'#80f5a2':'#ff7474'} strokeWidth={3}/>:null)}{dots.map(i=>pose[i]?.visibility>=.4?<Circle key={i} cx={x(i)} cy={y(i)} r={4} fill={color(i)}/>:null)}</Svg>;
}

const s=StyleSheet.create({
 root:{flex:1,backgroundColor:colors.ink},page:{padding:16,paddingBottom:100,gap:16},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},topTitle:{color:colors.cream,fontSize:21,fontWeight:'800'},icon:{width:42,height:42,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderRadius:21},stage:{gap:14,padding:16,backgroundColor:colors.surface,borderRadius:24,borderWidth:1,borderColor:colors.line},number:{color:colors.gold,fontSize:13,fontWeight:'900',letterSpacing:1.3},title:{color:colors.cream,fontSize:29,fontWeight:'800'},description:{color:colors.muted,fontSize:16,lineHeight:23},steps:{gap:5},step:{color:colors.muted,fontSize:14,lineHeight:21},mediaRow:{flexDirection:'row',gap:8,height:360},mediaOnly:{height:430},media:{flex:1,backgroundColor:'#07110e',borderRadius:16,overflow:'hidden',position:'relative'},video:{width:'100%',height:'100%'},camera:{width:'100%',height:'100%'},mediaLabel:{position:'absolute',left:8,top:8,color:'white',backgroundColor:'rgba(0,0,0,.66)',fontSize:11,fontWeight:'900',paddingHorizontal:7,paddingVertical:5,borderRadius:5},playOverlay:{position:'absolute',alignSelf:'center',top:'42%',width:62,height:62,borderRadius:31,backgroundColor:colors.gold,alignItems:'center',justifyContent:'center'},warning:{position:'absolute',left:6,right:6,bottom:9,backgroundColor:'rgba(4,11,9,.88)',borderRadius:9,padding:8},warningText:{color:'white',fontSize:13,fontWeight:'800',textAlign:'center',lineHeight:18},primary:{minHeight:52,backgroundColor:colors.gold,borderRadius:15,paddingHorizontal:17,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9},primaryText:{color:colors.ink,fontSize:17,fontWeight:'900'},secondary:{minHeight:48,borderColor:colors.line,borderWidth:1,borderRadius:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},secondaryText:{color:colors.cream,fontSize:15,fontWeight:'800'},scoreRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},scoreLabel:{color:colors.muted,fontSize:12,fontWeight:'900',letterSpacing:1},score:{fontSize:52,fontWeight:'900',lineHeight:62},photoCounter:{color:colors.gold,fontSize:13,fontWeight:'800'},progress:{height:12,backgroundColor:colors.deep,borderRadius:6,position:'relative',overflow:'visible'},progressFill:{height:12,borderRadius:6},targetMark:{position:'absolute',top:-4,width:3,height:20,backgroundColor:'white',borderRadius:2},targetRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},targetButtons:{flexDirection:'row',gap:8},targetButton:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:colors.deep},muted:{color:colors.muted,fontSize:14,lineHeight:20},message:{color:colors.cream,fontSize:15,lineHeight:22},celebration:{fontSize:25,fontWeight:'900',color:colors.jade,textAlign:'center'},result:{gap:12},resultTitle:{color:colors.jade,fontSize:26,fontWeight:'900'},resultScore:{color:colors.cream,fontSize:18,fontWeight:'700'},sectionTitle:{color:colors.cream,fontSize:22,fontWeight:'900'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},tile:{width:'31.7%',height:126,borderRadius:13,overflow:'hidden',borderWidth:2,borderColor:'transparent',backgroundColor:colors.surface},tileActive:{borderColor:'#57a7ff'},tileImage:{width:'100%',height:'100%'},tileShade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.32)'},tileNumber:{position:'absolute',top:6,left:7,color:'white',fontSize:14,fontWeight:'900'},tileTitle:{position:'absolute',left:7,right:5,bottom:7,color:'white',fontSize:12,fontWeight:'800',lineHeight:16},galleryHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},photoGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},photoTile:{width:'31.7%',aspectRatio:.75,borderRadius:12,overflow:'hidden'},photoImage:{width:'100%',height:'100%'},photoScore:{position:'absolute',bottom:6,right:6,color:'white',fontWeight:'900',backgroundColor:'rgba(0,0,0,.7)',borderRadius:6,padding:4},modal:{flex:1,backgroundColor:'rgba(0,0,0,.96)',alignItems:'center',justifyContent:'center',gap:12,padding:18},modalClose:{position:'absolute',right:20,top:55,zIndex:2,padding:8},modalImage:{width:'100%',height:'70%'},modalTitle:{color:'white',fontSize:20,fontWeight:'900'},delete:{flexDirection:'row',gap:8,alignItems:'center',padding:12,backgroundColor:colors.danger,borderRadius:10},deleteText:{color:'white',fontWeight:'800'}
});
