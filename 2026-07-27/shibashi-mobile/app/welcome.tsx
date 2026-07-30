import {useEventListener} from 'expo';
import {router} from 'expo-router';
import {useVideoPlayer,VideoView} from 'expo-video';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {colors} from '../constants/theme';

const introVideo=require('../assets/intro/intro-gate.mp4');
const introPoster=require('../assets/intro/intro-gate-poster-hq-v2.png');
const VIDEO_PLAYBACK_RATE=0.82;
const VIDEO_DURATION_MS=Math.round((10000/VIDEO_PLAYBACK_RATE)*1000);

export default function Welcome(){
 const[firstFrameReady,setFirstFrameReady]=useState(false);
 const navigationStarted=useRef(false);
 const player=useVideoPlayer(introVideo,current=>{
  current.loop=false;
  current.muted=true;
  current.playbackRate=VIDEO_PLAYBACK_RATE;
 });
 const finish=useCallback(()=>{
  if(navigationStarted.current)return;
  navigationStarted.current=true;
  router.replace('/auth');
 },[]);

 useEventListener(player,'playToEnd',finish);
 useEventListener(player,'statusChange',({status})=>{
  if(status==='error')finish();
 });

 useEffect(()=>{
  player.playbackRate=VIDEO_PLAYBACK_RATE;
  player.play();
  const timer=setTimeout(finish,VIDEO_DURATION_MS+1500);
  return()=>{clearTimeout(timer)};
 },[finish,player]);

 return <View style={w.root}>
  <Image accessibilityIgnoresInvertColors source={introPoster} resizeMode="cover" style={StyleSheet.absoluteFill}/>
  <VideoView
   contentFit="cover"
   nativeControls={false}
   onFirstFrameRender={()=>setFirstFrameReady(true)}
   player={player}
   playsInline
   style={[StyleSheet.absoluteFill,!firstFrameReady&&w.videoLoading]}
   surfaceType="textureView"
   useExoShutter={false}
  />
  <View style={w.scrim}/>
  <Pressable accessibilityLabel="Onboarding videosunu geç" onPress={finish} style={w.skip}>
   <Text style={w.skipText}>Atla</Text>
  </Pressable>
  <View style={w.copy}>
   <Text style={w.eyebrow}>İÇSEL YOLCULUK</Text>
   <Text style={w.title}>Günün ritmine yaklaş.</Text>
   <Text style={w.body}>Suyu, nefesi ve hareketin doğal hızını izle. Birazdan sana uygun ilk adımı birlikte seçeceğiz.</Text>
  </View>
 </View>;
}

const w=StyleSheet.create({
 root:{flex:1,backgroundColor:'#020604',overflow:'hidden'},
 videoLoading:{opacity:0},
 scrim:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(2,6,4,.18)',borderBottomWidth:260,borderBottomColor:'rgba(2,6,4,.52)'},
 copy:{position:'absolute',bottom:58,left:24,right:24,gap:7},
 eyebrow:{color:'#D8C394',fontSize:10,fontWeight:'900',letterSpacing:1.8},
 title:{color:colors.cream,fontFamily:'DMSerifDisplay_400Regular',fontSize:34,lineHeight:38},
 body:{color:colors.muted,fontSize:13,lineHeight:19,maxWidth:340},
 skip:{position:'absolute',right:18,top:56,minHeight:38,minWidth:72,paddingHorizontal:16,borderRadius:20,borderWidth:1,borderColor:'rgba(239,197,93,.4)',backgroundColor:'rgba(3,10,6,.66)',alignItems:'center',justifyContent:'center'},
 skipText:{color:'#F3D27A',fontSize:10,fontWeight:'800',letterSpacing:1.35,textTransform:'uppercase'},
});
