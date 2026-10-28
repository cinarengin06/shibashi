import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Alert, Image, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { getMovementEnergyTag, meridianLivingSteps, meridianMovements } from '../../../packages/meridian-knowledge';
import { colors } from '../constants/theme';
import { shibashiPosters, shibashiVideos } from '../data/shibashiMedia';
import { useMovementNarration } from '../hooks/useMovementNarration';
import { safeMediaAction } from '../services/safeMediaAction';
import { compareShibashiPose, referenceAt, type ReferenceMovement } from '../services/pose/shibashiComparison';
import { MediaPipePoseBridge, type MediaPipePoseBridgeRef, type PoseLandmark } from '../services/pose/MediaPipePoseBridge';
import { deleteShibashiPhoto, loadShibashiPhotos, saveShibashiPhoto, type ShibashiPhoto } from '../services/shibashiPhotos';
import { loadCompletedMovements, markMovementCompleted } from '../services/movementCompletion';
import { markMovementPracticed } from '../services/movementPractice';
import { markFormStep } from '../services/formSteps';
import referenceData from '../data/teacherPoseSamples.json';
import { shenThemes } from '../../../packages/design-tokens';
import { useApp } from '../store/AppStore';
import { KeepAwakeWhileCamera } from './navigation/KeepAwakeWhileCamera';
import { FormCatalogScreen } from './FormCatalogScreen';
import { FormMetaTags } from './FormMetaTags';
import { readFormCatalogFilters } from '../../../packages/form-catalog';

const targetKey = 'shibashi-learning-target-score-v3';
const minimumTarget = 25;
const references = referenceData as unknown as Record<string, ReferenceMovement>;
const links: [number, number][] = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
const dots = [0,11,12,13,14,15,16,23,24,25,26,27,28];
const praise = [{ emoji: '✨', text: 'Harika!' }, { emoji: '🌟', text: 'Müthiş!' }, { emoji: '🎉', text: 'Süpersin!' }];

type Phase = 'watch' | 'mini' | 'framing' | 'cue' | 'playing' | 'result';

export function BodyLinesScreen() {
  const {profile} = useApp();
  const theme = shenThemes[profile.selectedShenId];
  const params = useLocalSearchParams<{ movementOrder?: string; energy?: string; status?: string; organ?: string; gate?: string; section?: string }>();
  const requested = Number(params.movementOrder);
  const requestedValid=Number.isInteger(requested)&&requested>=1&&requested<=18;
  const [order, setOrder] = useState(Number.isInteger(requested) && requested >= 1 && requested <= 18 ? requested : 1);
  const [mode,setMode]=useState<'catalog'|'detail'>(requestedValid?'detail':'catalog');
  const [catalogFilters,setCatalogFilters]=useState(()=>readFormCatalogFilters(params));
  useEffect(()=>setCatalogFilters(readFormCatalogFilters(params)),[params.energy,params.status,params.organ,params.gate]);
  const [switching, setSwitching] = useState(false);
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const photosY = useRef(0);
  const [photos, setPhotos] = useState<ShibashiPhoto[]>([]);
  const [completedOrders, setCompletedOrders] = useState<number[]>([]);
  const [selected, setSelected] = useState<ShibashiPhoto | null>(null);
  const currentPhotos = photos.filter(photo => photo.order === order);
  useEffect(() => { void loadShibashiPhotos().then(setPhotos); }, []);
  useEffect(() => { void loadCompletedMovements(profile.authUserId).then(setCompletedOrders); }, [profile.authUserId]);
  const choose = (next: number) => {
    if (next < 1 || next > 18) return;
    setMode('detail');
    if (next === order) return;
    if (switchTimer.current) clearTimeout(switchTimer.current);
    setSwitching(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    switchTimer.current = setTimeout(() => { setOrder(next); setSwitching(false); switchTimer.current = null; }, 350);
    void Haptics.selectionAsync();
  };
  useEffect(() => {
    if (requestedValid) choose(requested);
    else setMode('catalog');
  }, [requested]);
  useEffect(() => () => { if (switchTimer.current) clearTimeout(switchTimer.current); }, []);
  const removePhoto = (photo: ShibashiPhoto) => Alert.alert('Fotoğrafı sil?', 'Bu fotoğraf cihazından kalıcı olarak silinecek.', [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: () => { void deleteShibashiPhoto(photo.id).then(items => { setPhotos(items); setSelected(null); }); } },
  ]);
  if(mode==='catalog')return <FormCatalogScreen completedOrders={completedOrders} initialFilters={catalogFilters} initialSection={params.section==='preparation'?'preparation':'forms'} onFiltersChange={setCatalogFilters} onSelect={choose} onBack={()=>router.replace('/(tabs)' )}/>;
  return <SafeAreaView style={[s.root,{backgroundColor:theme.surface}]} edges={[]}><ScrollView ref={scrollRef} contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
    <View style={s.top}><Pressable accessibilityLabel="18 Form kataloğuna dön" onPress={() => setMode('catalog')} style={s.icon}><Ionicons name="arrow-back" size={23} color={colors.cream}/></Pressable><Text style={s.topTitle}>18 Form</Text><Pressable accessibilityLabel="Fotoğraflarım" onPress={() => { void loadShibashiPhotos().then(setPhotos); }} style={s.icon}><Ionicons name="images-outline" size={22} color={colors.cream}/></Pressable></View>
    {!switching&&<MovementStage key={order} order={order} completed={completedOrders.includes(order)} onComplete={completed => setCompletedOrders(items => [...new Set([...items, completed])])} onNext={() => choose(order % 18 + 1)} onPhoto={photo => setPhotos(items => [photo, ...items])} onOpenPhotos={() => scrollRef.current?.scrollTo({y:photosY.current,animated:true})}/>}
    <Text style={s.sectionTitle}>18 Form</Text>
    <View style={s.grid}>{meridianMovements.map(item => { const tag=getMovementEnergyTag(item.order); return <Pressable key={item.order} onPress={() => choose(item.order)} style={[s.tile, item.order === order && s.tileActive]} accessibilityLabel={`${item.order}. form: ${item.sourceTitle}, ${tag.quality}, ${tag.action}, ${completedOrders.includes(item.order)?'tamamlandı':'başlanmadı'}`} accessibilityState={{ selected: item.order === order }}><Image source={shibashiPosters[item.order]} style={s.tileImage}/><View style={s.tileShade}/><Text style={s.tileNumber}>{String(item.order).padStart(2,'0')}</Text><View pointerEvents="none" style={s.tilePlay}><Ionicons name="play" size={15} color="#142017"/></View>{completedOrders.includes(item.order) && <Text style={{ position:'absolute',right:6,top:6,color:'#A8DCB3',backgroundColor:'rgba(3,15,10,.85)',paddingHorizontal:5,paddingVertical:3,borderRadius:5,fontSize:10,fontWeight:'800' }}>✓ Tamamlandı</Text>}<Text numberOfLines={2} style={s.tileTitle}>{item.sourceTitle}</Text><View style={s.tileMeta}><FormMetaTags order={item.order} compact/></View></Pressable>; })}</View>
    <View onLayout={event => { photosY.current=event.nativeEvent.layout.y; }} style={s.galleryHead}><Text style={s.sectionTitle}>Fotoğraflarım</Text><Text style={s.muted}>{currentPhotos.length} fotoğraf</Text></View>
    <Text style={s.muted}>{order}. form · {meridianMovements[order-1]?.sourceTitle}</Text>
    {currentPhotos.length ? <View style={s.photoGrid}>{currentPhotos.map(photo => <Pressable key={photo.id} onPress={() => setSelected(photo)} style={s.photoTile}><Image source={{uri:photo.uri}} style={s.photoImage}/><Text style={s.photoScore}>%{photo.score}</Text></Pressable>)}</View> : <Text style={s.muted}>Bu formda hedef uyuma ulaştığında fotoğrafların burada görünür.</Text>}
  </ScrollView><Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}><View style={s.modal}><Pressable onPress={() => setSelected(null)} style={s.modalClose}><Ionicons name="close" size={26} color="white"/></Pressable>{selected && <><Image source={{uri:selected.uri}} style={s.modalImage} resizeMode="contain"/><Text style={s.modalTitle}>{selected.name} · %{selected.score}</Text><Text style={s.muted}>{new Date(selected.savedAt).toLocaleString('tr-TR')}</Text><Pressable onPress={() => removePhoto(selected)} style={s.delete}><Ionicons name="trash-outline" size={18} color="white"/><Text style={s.deleteText}>Fotoğrafı sil</Text></Pressable></>}</View></Modal></SafeAreaView>;
}

function MovementStage({ order, completed, onComplete, onNext, onPhoto, onOpenPhotos }: { order: number; completed: boolean; onComplete: (order:number) => void; onNext: () => void; onPhoto: (photo: ShibashiPhoto) => void; onOpenPhotos: () => void }) {
  const {profile} = useApp();
  const theme = shenThemes[profile.selectedShenId];
  const movement = meridianMovements.find(item => item.order === order) ?? meridianMovements[0];
  const reference = references[String(order)];
  const player = useVideoPlayer(shibashiVideos[order], instance => { instance.loop = true; instance.muted = true; });
  const videoViewRef = useRef<VideoView>(null);
  const [showFirstVisitTips, setShowFirstVisitTips] = useState(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem('shibashi-form-guide-v1').then(value => { if (active) setShowFirstVisitTips(value !== 'done'); }).catch(() => { if (active) setShowFirstVisitTips(true); });
    return () => { active = false; };
  }, []);
  const dismissFirstVisitTips = () => { setShowFirstVisitTips(false); void AsyncStorage.setItem('shibashi-form-guide-v1','done').catch(() => {}); };
  useMovementNarration(order, player);
  useFocusEffect(useCallback(() => () => {
    safeMediaAction(() => player.pause());
    void Speech.stop();
  }, [player]));
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const bridgeRef = useRef<MediaPipePoseBridgeRef>(null);
  const [phase, setPhaseState] = useState<Phase>('watch');
  const phaseRef = useRef<Phase>('watch');
  const setPhase = (next: Phase) => { phaseRef.current = next; setPhaseState(next); };
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const scoreRef = useRef<number | null>(null);
  const [target, setTarget] = useState(minimumTarget);
  const targetRef = useRef(minimumTarget);
  const targetSaveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [message, setMessage] = useState('Hoca videosunu izle, ardından kameranla uyumunu gör.');
  const [pose, setPose] = useState<PoseLandmark[]>([]);
  const [poseImageSize, setPoseImageSize] = useState({width:1,height:1});
  const [jointScores, setJointScores] = useState<Record<number,number>>({});
  const [cameraSize, setCameraSize] = useState({width:1,height:1});
  const [miniBounds, setMiniBounds] = useState({width:0,height:0});
  const [celebration, setCelebration] = useState<{emoji:string;text:string}|null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [succeeded, setSucceeded] = useState(false);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoCountRef = useRef(0);
  const photoPending = useRef(false);
  const captureSession = useRef(0);
  const lastPhotoAt = useRef(0);
  const startAt = useRef(0);
  const lastVideoTime = useRef(0);
  const loops = useRef(0);
  const sampleCount = useRef(0);
  const bestScore = useRef(0);
  const lastPose = useRef<{user:PoseLandmark[];teacher:NonNullable<ReturnType<typeof referenceAt>>}|null>(null);
  const completeRef = useRef(false);
  const completionRequestedRef = useRef(completed);
  const targetReachedAt = useRef<number | null>(null);
  useEffect(() => { void AsyncStorage.getItem(targetKey).then(value => { const saved = Number(value); if (value !== null && Number.isFinite(saved) && saved >= minimumTarget && saved <= 100) { setTarget(saved); targetRef.current = saved; } }); }, []);
  useEffect(() => () => { if (targetSaveTimer.current) clearTimeout(targetSaveTimer.current); }, []);
  useEffect(() => () => { phaseRef.current='watch'; void Speech.stop(); if (celebrationTimer.current) clearTimeout(celebrationTimer.current); }, [player]);
  useEffect(() => { const listener = player.addListener('playingChange', ({isPlaying}) => { setVideoPlaying(isPlaying); if (isPlaying) void markFormStep(order,'watched',profile.authUserId).catch(() => {}); }); return () => listener.remove(); }, [player,order,profile.authUserId]);
  useEffect(() => { player.timeUpdateEventInterval = .5; const listener = player.addListener('timeUpdate', ({currentTime}) => { if (player.duration > 1 && currentTime >= player.duration - .6) void markFormStep(order,'videoCompleted',profile.authUserId).catch(() => {}); }); return () => listener.remove(); }, [player,order,profile.authUserId]);
  const updateTarget = (next:number) => { const value = Math.max(minimumTarget,Math.min(100,Math.round(next/5)*5)); setTarget(value); targetRef.current = value; if (targetSaveTimer.current) clearTimeout(targetSaveTimer.current); targetSaveTimer.current=setTimeout(() => { void AsyncStorage.setItem(targetKey,String(targetRef.current)); },180); };
  const completeForm = () => { if (completed || completionRequestedRef.current) return; completionRequestedRef.current=true; void markMovementCompleted(order, profile.authUserId).then(() => { onComplete(order); void markFormStep(order,'completed',profile.authUserId).catch(() => {}); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }).catch(() => { completionRequestedRef.current=false; setMessage('Tamamlama kaydedilemedi. Yeniden dene.'); }); };
  const speak = (text:string, done?:()=>void) => { void Speech.stop(); Speech.speak(text,{language:'tr-TR',rate:.86,onDone:done,onError:done}); };
  const begin = async () => {
    if (!permission?.granted) { const response = await requestPermission(); if (!response.granted) { Alert.alert('Kamera izni gerekli','Kamerayı açmak için izin vermelisin.'); return; } }
    void markFormStep(order, 'attempted', profile.authUserId).catch(() => {});
    safeMediaAction(() => player.pause()); player.currentTime = 0; setVideoPlaying(false);
    resetTracking();
    setMessage('Bedenini kamerada göstermek için biraz geri çekil.'); setPhase('framing');
  };
  const resetTracking = () => { captureSession.current++; setScore(null); scoreRef.current=null; setSucceeded(false); setPose([]); setJointScores({}); setPhotoCount(0); photoCountRef.current=0; photoPending.current=false; lastPhotoAt.current=0; loops.current=0; sampleCount.current=0; bestScore.current=0; completeRef.current=false; targetReachedAt.current=null; lastPose.current=null; };
  const closeMini = () => { captureSession.current++; photoPending.current=false; setCelebration(null); safeMediaAction(() => player.pause()); setPhase('watch'); };
  const openMini = async () => {
    if (!permission?.granted) { const response = await requestPermission(); if (!response.granted) { Alert.alert('Kamera izni gerekli','Kamerayı açmak için izin vermelisin.'); return; } }
    void markFormStep(order, 'attempted', profile.authUserId).catch(() => {});
    resetTracking();
    setPhase('mini');
    setMessage('Tam bedenin görünürken hocayla birlikte hareket et.');
    safeMediaAction(() => player.play());
  };
  const finish = () => { if (completeRef.current) return; completeRef.current=true; safeMediaAction(() => player.pause()); setPhase('result'); const passed=bestScore.current>=targetRef.current && sampleCount.current>=5; setSucceeded(passed); setMessage(passed?'Başardın, şimdi sıradaki harekete geçebilirsin.':'Bir kez daha dene; tam bedenin görünürken hocayı takip et.'); if (passed) { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); speak('Başardın, şimdi sıradakine geç.'); } };
  useEffect(() => {
    if (phase !== 'mini' && phase !== 'framing' && phase !== 'cue' && phase !== 'playing') return;
    if (!permission?.granted) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const scan = async () => {
      try {
        if (bridgeRef.current?.error) { setMessage('Poz modeli açılamadı. İnternet bağlantını kontrol edip yeniden dene.'); if (!cancelled) timer=setTimeout(scan,1500); return; }
        if (!cameraRef.current || !bridgeRef.current?.ready) { setMessage('Kamera ve poz modeli hazırlanıyor.'); if (!cancelled) timer=setTimeout(scan,700); return; }
        const capture = await cameraRef.current.takePictureAsync({base64:true,quality:.38,skipProcessing:false,shutterSound:false});
        if (cancelled) return;
        if (!capture?.base64) throw new Error('Kamera karesi alınamadı.');
        const analysis = await bridgeRef.current.analyze(capture.base64);
        if (cancelled) return;
        setPose(analysis.landmarks);
        setPoseImageSize({width:analysis.imageWidth,height:analysis.imageHeight});
        const videoSeconds = player.currentTime;
        const teacher = referenceAt(reference,videoSeconds);
        if (!teacher) throw new Error('Bu video için referans poz bulunamadı.');
        const previous = lastPose.current;
        const comparison = compareShibashiPose(analysis.landmarks,teacher,analysis.imageWidth/analysis.imageHeight,reference.aspect,previous ?? undefined);
        setJointScores(comparison.joints);
        if (!comparison.fullBody) {
          targetReachedAt.current=null;
          setMessage('Bedenini kamerada göstermek için biraz geri çekil.');
          if (phaseRef.current === 'playing' || phaseRef.current === 'mini') { setScore(null); scoreRef.current=null; lastPose.current=null; }
        } else if (phaseRef.current === 'framing') {
          setPhase('cue'); setMessage('Hareketi sen de yapmaya hazır ol.');
          const startVideo = () => { if (phaseRef.current === 'cue') { void Speech.stop(); player.currentTime=0; safeMediaAction(() => player.play()); startAt.current=Date.now(); lastVideoTime.current=0; setPhase('playing'); setMessage('Hocayla birlikte hareket et.'); } };
          speak('Hareketi sen de yapmaya hazır ol.', startVideo);
          setTimeout(startVideo, 2600);
        } else if (phaseRef.current === 'mini' && !player.playing) {
          targetReachedAt.current=null;
          setScore(null); scoreRef.current=null; lastPose.current=null; setMessage('Uyumu ölçmek için hoca videosunu oynat.');
        } else if ((phaseRef.current === 'playing' || phaseRef.current === 'mini') && comparison.score !== null) {
          sampleCount.current++;
          lastPose.current={user:analysis.landmarks,teacher};
          bestScore.current=Math.max(bestScore.current,comparison.score);
          const previousScore=scoreRef.current;
          const smoothed=previousScore===null?Math.min(35,comparison.score):previousScore+Math.max(-6,Math.min(6,comparison.score-previousScore));
          scoreRef.current=smoothed; setScore(Math.round(smoothed));
          const now=Date.now();
          if (smoothed>=targetRef.current && comparison.score>=targetRef.current) {
            targetReachedAt.current??=now;
            if (now-targetReachedAt.current>=1000 && !completed) { setSucceeded(true); completeForm(); setMessage('✓ Harikasın! Hedef uyuma ulaştın.'); }
          } else targetReachedAt.current=null;
          if (smoothed>=targetRef.current && comparison.score>=targetRef.current && photoCountRef.current<3 && !photoPending.current && now-lastPhotoAt.current>=3000 && capture.uri) {
            lastPhotoAt.current=now;
            photoPending.current=true;
            const session = captureSession.current;
            void saveShibashiPhoto(capture.uri,order,movement.sourceTitle,comparison.score).then(photo => {
              onPhoto(photo);
              void markMovementPracticed(order,profile.authUserId,photo.savedAt).catch(()=>{});
              if (session !== captureSession.current) return;
              photoCountRef.current++;
              setPhotoCount(photoCountRef.current); setCelebration(praise[photoCountRef.current-1]);
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
              celebrationTimer.current=setTimeout(() => setCelebration(null),1800);
            }).catch(() => { if (session === captureSession.current) setMessage('Fotoğraf kaydedilemedi; cihazında boş alanı kontrol et.'); }).finally(() => { if (session === captureSession.current) photoPending.current=false; });
          }
          if (videoSeconds + .35 < lastVideoTime.current) loops.current++;
          lastVideoTime.current=videoSeconds;
          if (phaseRef.current === 'playing' && (loops.current>=2 || Date.now()-startAt.current>=Math.max(20000,reference.duration*2000+2500))) finish();
        }
      } catch { if (!cancelled) setMessage('Kamera veya poz analizi hazırlanıyor.'); }
      if (!cancelled && phaseRef.current !== 'result') timer=setTimeout(scan,Platform.OS==='android'?1500:650);
    };
    timer=setTimeout(scan,500);
    return () => { cancelled=true; clearTimeout(timer); };
  }, [phase === 'watch' || phase === 'result', permission?.granted, order]);
  const steps = meridianLivingSteps[order-1] || [];
  const energyTag = getMovementEnergyTag(order);
  return <View style={[s.stage,{backgroundColor:theme.surface,borderColor:`${theme.primary}55`}]}>
    {phase!=='watch' && phase!=='result' && <KeepAwakeWhileCamera />}
    <View style={s.titleRow}><Text style={s.title}>{movement.sourceTitle}</Text><Text style={[s.energyTag,{color:energyTag.quality==='Yang'?'#F6CF8A':'#A7DDF1',borderColor:energyTag.quality==='Yang'?'#C68A4C':'#6BAFC5'}]}>{energyTag.quality} · {energyTag.action}</Text></View>
    <View style={[s.mediaRow,(phase === 'watch' || phase === 'mini') && s.mediaOnly]}>
      <View style={s.media} onLayout={event => { const {width,height}=event.nativeEvent.layout; setMiniBounds(current => current.width===width && current.height===height ? current : {width,height}); }}>
        <VideoView ref={videoViewRef} player={player} style={s.video} contentFit="contain" nativeControls={videoPlaying && (phase==='watch'||phase==='mini')} surfaceType="textureView"/>
        <Text style={s.mediaLabel}>HOCA</Text>
        {(phase==='watch'||phase==='mini') && !videoPlaying && <Pressable accessibilityRole="button" accessibilityLabel="Hareketi Başlat" onPress={() => { safeMediaAction(() => player.play()); void videoViewRef.current?.enterFullscreen().catch(() => {}); }} style={s.playOverlay}><Ionicons name="play" size={27} color={colors.ink}/><Text style={s.playOverlayText}>Hareketi Başlat</Text></Pressable>}
        {showFirstVisitTips && phase==='watch' && !videoPlaying && <View style={s.videoGuideTip}><Text style={s.guideTitle}>1/3 · Önce hocayı izle</Text><Text style={s.guideText}>Hareketi Başlat videoyu tam ekranda açar.</Text><Pressable accessibilityRole="button" onPress={dismissFirstVisitTips}><Text style={s.guideAction}>İpuçlarını geç</Text></Pressable></View>}
        {phase==='mini' && <MovableMiniCamera bounds={miniBounds} cameraRef={cameraRef} onClose={closeMini} score={score} target={target} succeeded={succeeded} pose={pose} jointScores={jointScores} imageSize={poseImageSize}/>}
        {phase==='mini' && <View pointerEvents="none" style={s.teacherScore}><Text style={s.teacherScoreLabel}>CANLI UYUM</Text><Text style={[s.teacherScoreValue,{color:score!==null&&score>=target?colors.jade:colors.cream}]}>{score===null?'—':`%${score}`}</Text></View>}
      </View>
      {phase!=='watch' && phase!=='mini' && <View style={s.media}><CameraView ref={cameraRef} facing="front" flash="off" enableTorch={false} mirror active={phase!=='result'} style={s.camera}/><View pointerEvents="none" style={[StyleSheet.absoluteFill,s.poseLayer]} onLayout={event => setCameraSize(event.nativeEvent.layout)}><PoseOverlay pose={pose} scores={jointScores} target={target} width={cameraSize.width} height={cameraSize.height} imageSize={poseImageSize}/></View><Text style={s.mediaLabel}>SEN</Text>{phase==='framing' && <View pointerEvents="none" style={s.warning}><Text style={s.warningText}>Bedenini kamerada göstermek için biraz geri çekil.</Text></View>}</View>}
    </View>
    {(phase==='watch'||phase==='mini') && <View style={s.steps}><Text style={[s.stepsHeading,{color:theme.primary}]}>HAREKETİ NASIL YAPARSIN?</Text>{(steps.length ? steps : ['Önce hocayı izle, sonra kameranla kendi ritmini takip et.']).map((step,index)=><View key={`${order}-${index}`} style={s.stepRow}><View style={[s.stepNumber,{borderColor:`${theme.primary}66`}]}><Text style={[s.stepNumberText,{color:theme.primary}]}>{index+1}</Text></View><Text style={s.step}>{step}</Text></View>)}</View>}
    {(phase==='watch'||phase==='mini') && <>
      {videoPlaying && <Pressable onPress={() => safeMediaAction(() => player.pause())} style={s.secondary}><Ionicons name="pause" size={20} color={colors.cream}/><Text style={s.secondaryText}>Videoyu Durdur</Text></Pressable>}
      <Pressable onPress={() => { if (phase==='mini') closeMini(); else void openMini(); }} style={[s.primary,{backgroundColor:theme.button}]}><Ionicons name={phase==='mini'?'close':'camera-outline'} size={20} color={theme.buttonInk}/><Text style={[s.primaryText,{color:theme.buttonInk}]}>{phase==='mini'?'Pratiği Bitir':'Kameranı Aç ve Başla'}</Text></Pressable>
      {showFirstVisitTips && <View style={s.guideTip}><Text style={s.guideTitle}>2/3 · Kendin dene</Text><Text style={s.guideText}>Bu düğme kameranı açar. Hocayı takip ederken canlı uyumunu görürsün.</Text></View>}
      {completed
        ? <View style={[s.successNotice,{borderColor:`${theme.primary}88`,backgroundColor:theme.surfaceRaised}]}><Text style={[s.successTitle,{color:theme.primary}]}>✓ Form tamamlandı</Text><Text style={s.successText}>Bu hareket yolculuğuna eklendi. Dilersen kamerayla tekrar deneyebilirsin.</Text></View>
        : <Pressable accessibilityRole="button" onPress={completeForm} style={[s.completeAction,{borderColor:`${theme.primary}88`}]}><Ionicons name="checkmark-circle-outline" size={20} color={theme.primary}/><Text style={[s.completeActionText,{color:theme.primary}]}>Formu Tamamladım</Text></Pressable>}
      {showFirstVisitTips && <View style={s.guideTip}><Text style={s.guideTitle}>3/3 · Formu tamamla</Text><Text style={s.guideText}>Hedef uyuma ulaşırsan form otomatik tamamlanır. İstersen bu düğmeyle kendin de işaretleyebilirsin.</Text><Pressable accessibilityRole="button" onPress={dismissFirstVisitTips}><Text style={s.guideAction}>Anladım, ipuçlarını kapat</Text></Pressable></View>}
      <View style={[s.targetSetting,{borderColor:`${theme.primary}44`}]}><View style={s.targetRow}><Text style={s.targetLabel}>Otomatik tamamlama hedefi</Text><Text style={[s.targetValue,{color:theme.primary}]}>%{target}</Text></View><TargetScoreControl target={target} score={score} onChange={updateTarget} /><Text style={s.targetDescription}>Hedefe ulaştığında form kendiliğinden tamamlanır.</Text>{phase==='mini' && succeeded && <Text style={[s.successTitle,{color:theme.primary}]}>✓ Harikasın! Hedef uyuma ulaştın.</Text>}</View>
      <Pressable accessibilityRole="button" onPress={onOpenPhotos} style={[s.photosLink,{borderColor:`${theme.primary}44`}]}><Text style={s.photosLinkText}>▧  Bu formun fotoğrafları</Text><Text style={[s.photosLinkAction,{color:theme.primary}]}>Görüntüle →</Text></Pressable>
    </>}
    {phase!=='watch' && phase!=='mini' && <><View style={s.scoreRow}><View><Text style={s.scoreLabel}>CANLI UYUM</Text><Text style={[s.score,{color:score!==null && score>=target?colors.jade:colors.cream}]}>{score===null?'—':`%${score}`}</Text></View><Text style={s.photoCounter}>{photoCount}/3 fotoğraf</Text></View><TargetScoreControl target={target} score={score} onChange={updateTarget} /><View style={s.targetRow}><Text style={s.muted}>Hedef uyum: %{target}</Text><View style={s.targetButtons}><Pressable accessibilityLabel="Hedefi azalt" onPress={() => updateTarget(target-5)} style={s.targetButton}><Ionicons name="remove" size={20} color={colors.cream}/></Pressable><Pressable accessibilityLabel="Hedefi artır" onPress={() => updateTarget(target+5)} style={s.targetButton}><Ionicons name="add" size={20} color={colors.cream}/></Pressable></View></View><Text style={s.message}>{message}</Text>{celebration && <Text style={s.celebration}>{celebration.emoji} {celebration.text}</Text>}</>}
    {phase==='result' && <View style={s.result}><Text style={s.resultTitle}>{succeeded?'Başardın!':'Yeniden deneyelim'}</Text><Text style={s.resultScore}>En yüksek uyum: %{bestScore.current}</Text><Pressable onPress={() => {void begin();}} style={s.secondary}><Ionicons name="refresh" size={20} color={colors.cream}/><Text style={s.secondaryText}>Tekrar dene</Text></Pressable>{succeeded && <Pressable onPress={onNext} style={s.primary}><Text style={s.primaryText}>Sıradaki hareket</Text><Ionicons name="arrow-forward" size={20} color={colors.ink}/></Pressable>}</View>}
    {phase==='framing' && <Pressable onPress={() => {setPhase('watch');safeMediaAction(() => player.pause());}} style={s.secondary}><Text style={s.secondaryText}>Videoya dön</Text></Pressable>}
    {(phase==='mini'||phase==='framing'||phase==='cue'||phase==='playing') && <MediaPipePoseBridge ref={bridgeRef}/>}
  </View>;
}

type MiniFrame = { x:number; y:number; width:number; height:number };
type MiniCorner = 'move' | 'nw' | 'ne' | 'sw' | 'se';
const fit = (value:number, low:number, high:number) => Math.max(low,Math.min(high,value));

function MovableMiniCamera({bounds,cameraRef,onClose,score,target,succeeded,pose,jointScores,imageSize}:{bounds:{width:number;height:number};cameraRef:RefObject<CameraView|null>;onClose:()=>void;score:number|null;target:number;succeeded:boolean;pose:PoseLandmark[];jointScores:Record<number,number>;imageSize:{width:number;height:number}}) {
  const [frame,setFrame] = useState<MiniFrame>({x:0,y:0,width:145,height:193});
  const [overlaySize,setOverlaySize] = useState({width:145,height:193});
  const frameRef = useRef(frame);
  const boundsRef = useRef(bounds);
  const startRef = useRef(frame);
  const placed = useRef(false);
  const update = (next:MiniFrame) => { frameRef.current=next; setFrame(next); };
  useEffect(() => {
    boundsRef.current=bounds;
    if (!bounds.width || !bounds.height) return;
    const width=Math.min(frameRef.current.width,bounds.width-12,(bounds.height-12)*.75);
    const height=width*4/3;
    update({width,height,x:placed.current?fit(frameRef.current.x,0,bounds.width-width):bounds.width-width-9,y:placed.current?fit(frameRef.current.y,0,bounds.height-height):bounds.height-height-10});
    placed.current=true;
  },[bounds.width,bounds.height]);
  const responders = useMemo(() => {
    const make = (mode:MiniCorner) => PanResponder.create({
      onStartShouldSetPanResponder:()=>true,
      onMoveShouldSetPanResponder:()=>true,
      onPanResponderTerminationRequest:()=>false,
      onPanResponderGrant:()=>{startRef.current=frameRef.current;},
      onPanResponderMove:(_,gesture) => {
        const area=boundsRef.current, start=startRef.current;
        if (!area.width || !area.height) return;
        if (mode==='move') {
          update({...start,x:fit(start.x+gesture.dx,0,area.width-start.width),y:fit(start.y+gesture.dy,0,area.height-start.height)});
          return;
        }
        const west=mode.includes('w'), north=mode.includes('n');
        const horizontal=west?-gesture.dx:gesture.dx;
        const vertical=north?-gesture.dy:gesture.dy;
        const change=Math.abs(horizontal)>=Math.abs(vertical)*.75?horizontal:vertical*.75;
        const anchorX=west?start.x+start.width:start.x;
        const anchorY=north?start.y+start.height:start.y;
        const maxWidth=Math.min(west?anchorX:area.width-anchorX,(north?anchorY:area.height-anchorY)*.75);
        const width=fit(start.width+change,Math.min(120,maxWidth),maxWidth);
        const height=width*4/3;
        update({width,height,x:west?anchorX-width:anchorX,y:north?anchorY-height:anchorY});
      },
    });
    return {move:make('move'),nw:make('nw'),ne:make('ne'),sw:make('sw'),se:make('se')};
  },[]);
  return <View style={[s.miniCamera,bounds.width?{left:frame.x,top:frame.y,width:frame.width,height:frame.height}:{right:9,bottom:10,width:145,height:193}]}>
    <CameraView ref={cameraRef} facing="front" flash="off" enableTorch={false} mirror style={s.camera}/>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill,s.poseLayer]} onLayout={event => { const {width,height}=event.nativeEvent.layout; setOverlaySize(current => current.width===width&&current.height===height?current:{width,height}); }}><PoseOverlay pose={pose} scores={jointScores} target={target} width={overlaySize.width} height={overlaySize.height} imageSize={imageSize} compact/></View>
    <View accessibilityLabel="Kamera penceresini taşı" accessibilityRole="adjustable" style={s.miniDragHandle} {...responders.move.panHandlers}><Text style={s.miniDragText}>⋮⋮  Taşı</Text></View>
    <Pressable accessibilityLabel="Küçük kamerayı kapat" onPress={onClose} style={s.miniClose}><Ionicons name="close" size={17} color="white"/></Pressable>
    {succeeded && <View pointerEvents="none" style={{position:'absolute',left:5,right:5,bottom:6,backgroundColor:'rgba(7,72,35,.94)',borderColor:colors.jade,borderWidth:1,borderRadius:8,padding:5,alignItems:'center'}}><Text style={{color:'#E0FFE8',fontSize:11,fontWeight:'900'}}>✓ Harikasın!</Text></View>}
    {score===null && <View pointerEvents="none" style={s.miniHint}><Text style={s.miniHintText}>Tam bedenin görünsün</Text></View>}
    {(['nw','ne','sw','se'] as const).map(corner => <View accessibilityLabel={`Kamera penceresini ${corner} köşesinden boyutlandır`} accessibilityRole="adjustable" key={corner} style={[s.miniResizeHandle,{nw:s.miniResizeNW,ne:s.miniResizeNE,sw:s.miniResizeSW,se:s.miniResizeSE}[corner]]} {...responders[corner].panHandlers}/>)}
  </View>;
}

function TargetScoreControl({target,score,onChange}:{target:number;score:number|null;onChange:(value:number)=>void}) {
  const [width,setWidth] = useState(1);
  const setFromTouch = (x:number) => onChange(x / width * 100);
  return <View
    accessibilityRole="adjustable"
    accessibilityLabel="Hedef uyum"
    accessibilityHint="Çubuğu sürükle veya artır ve azalt hareketlerini kullan"
    accessibilityValue={{min:minimumTarget,max:100,now:target}}
    accessibilityActions={[{name:'increment'},{name:'decrement'}]}
    onAccessibilityAction={event => onChange(target+(event.nativeEvent.actionName==='increment'?5:-5))}
    onLayout={event => setWidth(Math.max(1,event.nativeEvent.layout.width))}
    onStartShouldSetResponder={() => true}
    onMoveShouldSetResponder={() => true}
    onResponderTerminationRequest={() => false}
    onResponderGrant={event => setFromTouch(event.nativeEvent.locationX)}
    onResponderMove={event => setFromTouch(event.nativeEvent.locationX)}
    style={{height:44,justifyContent:'center'}}
  >
    <View pointerEvents="none" style={s.progress}>
      <View style={[s.progressFill,{width:`${score??0}%`,backgroundColor:score!==null&&score>=target?colors.jade:colors.gold}]}/>
      <View style={[s.targetMark,{left:`${target}%`,width:5}]}/>
    </View>
  </View>;
}

function PoseOverlay({pose,scores,target,width,height,imageSize,compact=false}:{pose:PoseLandmark[];scores:Record<number,number>;target:number;width:number;height:number;imageSize:{width:number;height:number};compact?:boolean}) {
  if (!pose.length) return null;
  const scale=Math.max(width/Math.max(1,imageSize.width),height/Math.max(1,imageSize.height));
  const drawnWidth=imageSize.width*scale, drawnHeight=imageSize.height*scale;
  const offsetX=(width-drawnWidth)/2, offsetY=(height-drawnHeight)/2;
  const x=(i:number)=> width-(pose[i].x*drawnWidth+offsetX);
  const y=(i:number)=> pose[i].y*drawnHeight+offsetY;
  const color=(i:number)=>scores[i]===undefined?'#f0d88b':scores[i]>=target?'#80f5a2':'#ff7474';
  return <Svg width={width} height={height}>{links.map(([a,b])=>pose[a]?.visibility>=.4&&pose[b]?.visibility>=.4?<Line key={`${a}-${b}`} x1={x(a)} y1={y(a)} x2={x(b)} y2={y(b)} stroke={scores[a]===undefined||scores[b]===undefined?'#f0d88b':Math.min(scores[a],scores[b])>=target?'#80f5a2':'#ff7474'} strokeWidth={compact?3.5:3}/>:null)}{dots.map(i=>pose[i]?.visibility>=.4?<Circle key={i} cx={x(i)} cy={y(i)} r={compact?4.5:4} fill={color(i)}/>:null)}</Svg>;
}

const s=StyleSheet.create({
 stepsHeading:{fontSize:11,fontWeight:'900',letterSpacing:1.3,marginBottom:4},
 stepRow:{flexDirection:'row',alignItems:'flex-start',gap:10},
 stepNumber:{width:23,height:23,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center'},
 stepNumberText:{fontSize:11,fontWeight:'900'},
 completeAction:{minHeight:44,borderWidth:1,borderRadius:13,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
 completeActionText:{fontSize:13,fontWeight:'800'},
 successNotice:{borderWidth:1,borderRadius:13,padding:13,gap:4},
 successTitle:{fontSize:14,fontWeight:'900'},
 successText:{color:colors.cream,fontSize:12,lineHeight:17},
 targetLabel:{color:colors.muted,fontSize:12,fontWeight:'700'},
 targetValue:{fontSize:15,fontWeight:'900'},
 targetDescription:{color:colors.muted,fontSize:11,lineHeight:16},
 photosLink:{borderTopWidth:1,minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:4},
 photosLinkText:{color:colors.cream,fontSize:12,fontWeight:'700'},
 photosLinkAction:{fontSize:11,fontWeight:'900'},
 guideTip:{borderWidth:1,borderColor:'rgba(223,188,120,.6)',borderRadius:12,backgroundColor:'rgba(18,31,25,.96)',padding:10,gap:5},
 videoGuideTip:{position:'absolute',left:10,right:10,bottom:10,borderWidth:1,borderColor:'rgba(223,188,120,.75)',borderRadius:12,backgroundColor:'rgba(8,20,16,.95)',padding:10,gap:4},
 guideTitle:{color:'#E6C47E',fontSize:11,fontWeight:'900'},
 guideText:{color:colors.cream,fontSize:12,lineHeight:17},
 guideAction:{color:'#E6C47E',fontSize:12,fontWeight:'800',paddingVertical:4},
 titleRow:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8},
 energyTag:{fontSize:12,fontWeight:'800',paddingHorizontal:10,paddingVertical:6,borderWidth:1,borderRadius:99,backgroundColor:'rgba(7,22,28,.76)'},
 tileMeta:{position:'absolute',left:7,right:6,bottom:6},tileEnergy:{position:'absolute',bottom:7,left:7,right:5,fontSize:10,fontWeight:'800',backgroundColor:'rgba(3,15,13,.9)',paddingHorizontal:4,paddingVertical:3,borderRadius:5,overflow:'hidden'},
 poseLayer:{zIndex:2,elevation:5},
 teacherScore:{position:'absolute',left:10,bottom:12,zIndex:6,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:12,paddingVertical:7,borderRadius:12,backgroundColor:'rgba(3,15,11,.9)',borderWidth:1,borderColor:'rgba(131,223,166,.7)'},
 teacherScoreLabel:{color:colors.cream,fontSize:10,fontWeight:'900',letterSpacing:1},
 teacherScoreValue:{fontSize:31,fontWeight:'900',fontVariant:['tabular-nums']},
 root:{flex:1,backgroundColor:colors.ink},page:{padding:16,paddingBottom:100,gap:16},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},topTitle:{color:colors.cream,fontSize:21,fontWeight:'800'},icon:{width:42,height:42,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderRadius:21},stage:{gap:14,padding:16,backgroundColor:colors.surface,borderRadius:24,borderWidth:1,borderColor:colors.line},number:{color:colors.gold,fontSize:13,fontWeight:'900',letterSpacing:1.3},title:{color:colors.cream,fontSize:29,fontWeight:'800'},description:{color:colors.muted,fontSize:16,lineHeight:23},steps:{gap:11},step:{color:colors.cream,fontSize:13,lineHeight:20,flex:1},mediaRow:{flexDirection:'row',gap:8,height:360},mediaOnly:{height:430},media:{flex:1,backgroundColor:'#07110e',borderRadius:16,overflow:'hidden',position:'relative'},video:{width:'100%',height:'100%'},camera:{width:'100%',height:'100%'},mediaLabel:{position:'absolute',left:8,top:8,color:'white',backgroundColor:'rgba(0,0,0,.66)',fontSize:11,fontWeight:'900',paddingHorizontal:7,paddingVertical:5,borderRadius:5},playOverlay:{position:'absolute',alignSelf:'center',top:'40%',minWidth:170,minHeight:76,borderRadius:18,backgroundColor:'rgba(223,188,120,.95)',alignItems:'center',justifyContent:'center',gap:3,paddingHorizontal:14},playOverlayText:{color:colors.ink,fontSize:13,fontWeight:'800'},warning:{position:'absolute',left:6,right:6,bottom:9,backgroundColor:'rgba(4,11,9,.88)',borderRadius:9,padding:8},warningText:{color:'white',fontSize:13,fontWeight:'800',textAlign:'center',lineHeight:18},primary:{minHeight:52,backgroundColor:colors.gold,borderRadius:15,paddingHorizontal:17,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9},primaryText:{color:colors.ink,fontSize:17,fontWeight:'900'},secondary:{minHeight:48,borderColor:colors.line,borderWidth:1,borderRadius:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},secondaryText:{color:colors.cream,fontSize:15,fontWeight:'800'},miniCamera:{position:'absolute',borderRadius:15,overflow:'hidden',borderWidth:2,borderColor:colors.jade,backgroundColor:colors.deep,elevation:12},miniDragHandle:{position:'absolute',left:24,right:36,top:0,height:34,zIndex:3,backgroundColor:'rgba(3,15,9,.85)',alignItems:'center',justifyContent:'center'},miniDragText:{color:colors.cream,fontSize:11,fontWeight:'800'},miniResizeHandle:{position:'absolute',width:24,height:24,zIndex:5,backgroundColor:colors.jade,borderWidth:2,borderColor:colors.deep},miniResizeNW:{left:0,top:0,borderBottomRightRadius:10},miniResizeNE:{right:0,top:0,borderBottomLeftRadius:10},miniResizeSW:{left:0,bottom:0,borderTopRightRadius:10},miniResizeSE:{right:0,bottom:0,borderTopLeftRadius:10},miniClose:{position:'absolute',right:5,top:35,zIndex:4,width:28,height:28,borderRadius:14,backgroundColor:'rgba(0,0,0,.75)',alignItems:'center',justifyContent:'center'},miniScore:{position:'absolute',left:0,right:0,bottom:0,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',paddingHorizontal:7,paddingTop:16,paddingBottom:7,backgroundColor:'rgba(2,12,8,.85)'},miniScoreLabel:{color:colors.cream,fontSize:9,fontWeight:'900'},miniScoreValue:{fontSize:25,fontWeight:'900',lineHeight:28},miniHint:{position:'absolute',left:6,right:6,top:70,backgroundColor:'rgba(2,12,8,.82)',borderRadius:7,padding:5},miniHintText:{color:'white',fontSize:10,fontWeight:'800',textAlign:'center'},miniButton:{minHeight:46,borderRadius:14,borderWidth:1,borderColor:colors.jade,backgroundColor:'rgba(103,184,137,.12)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},miniButtonText:{color:colors.jade,fontSize:15,fontWeight:'800'},targetSetting:{gap:10,paddingTop:16,marginTop:8,borderTopWidth:1},scoreRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},scoreLabel:{color:colors.muted,fontSize:12,fontWeight:'900',letterSpacing:1},score:{fontSize:52,fontWeight:'900',lineHeight:62},photoCounter:{color:colors.gold,fontSize:13,fontWeight:'800'},progress:{height:12,backgroundColor:colors.deep,borderRadius:6,position:'relative',overflow:'visible'},progressFill:{height:12,borderRadius:6},targetMark:{position:'absolute',top:-4,width:3,height:20,backgroundColor:'white',borderRadius:2},targetRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},targetButtons:{flexDirection:'row',gap:8},targetButton:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:colors.deep},muted:{color:colors.muted,fontSize:14,lineHeight:20},message:{color:colors.cream,fontSize:15,lineHeight:22},celebration:{fontSize:25,fontWeight:'900',color:colors.jade,textAlign:'center'},result:{gap:12},resultTitle:{color:colors.jade,fontSize:26,fontWeight:'900'},resultScore:{color:colors.cream,fontSize:18,fontWeight:'700'},sectionTitle:{color:colors.cream,fontSize:22,fontWeight:'900'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},tile:{width:'48%',height:182,borderRadius:13,overflow:'hidden',borderWidth:2,borderColor:'transparent',backgroundColor:colors.surface},tileActive:{borderColor:'#57a7ff'},tileImage:{width:'100%',height:'100%'},tileShade:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,0,0,.32)'},tilePlay:{position:'absolute',left:'50%',top:'44%',marginLeft:-17,marginTop:-17,width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',paddingLeft:2,backgroundColor:colors.gold,borderWidth:1,borderColor:'rgba(255,255,255,.72)'},tileNumber:{position:'absolute',top:6,left:7,color:'white',fontSize:14,fontWeight:'900'},tileTitle:{position:'absolute',left:7,right:5,bottom:75,color:'white',fontSize:12,fontWeight:'800',lineHeight:16},galleryHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},photoGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},photoTile:{width:'31.7%',aspectRatio:.75,borderRadius:12,overflow:'hidden'},photoImage:{width:'100%',height:'100%'},photoScore:{position:'absolute',bottom:6,right:6,color:'white',fontWeight:'900',backgroundColor:'rgba(0,0,0,.7)',borderRadius:6,padding:4},modal:{flex:1,backgroundColor:'rgba(0,0,0,.96)',alignItems:'center',justifyContent:'center',gap:12,padding:18},modalClose:{position:'absolute',right:20,top:55,zIndex:2,padding:8},modalImage:{width:'100%',height:'70%'},modalTitle:{color:'white',fontSize:20,fontWeight:'900'},delete:{flexDirection:'row',gap:8,alignItems:'center',padding:12,backgroundColor:colors.danger,borderRadius:10},deleteText:{color:'white',fontWeight:'800'}
});
