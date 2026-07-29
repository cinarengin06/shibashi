import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {VideoView,useVideoPlayer} from 'expo-video';
import {LinearGradient} from 'expo-linear-gradient';
import {useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors,radii,spacing} from '../constants/theme';
import {useShenExperience} from '../store/ShenExperience';

const introVideo=require('../assets/intro/intro-gate.mp4');
export default function Welcome(){
 const[ready,setReady]=useState(false);const{shen,playing,toggleSound}=useShenExperience();
 const player=useVideoPlayer(introVideo,p=>{p.loop=true;p.muted=true;p.playbackRate=.62;p.play()});
 return <View style={w.root}>
  <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="cover" onFirstFrameRender={()=>setReady(true)}/>
  <LinearGradient colors={['rgba(2,11,9,.12)','rgba(3,13,11,.42)','rgba(3,13,11,.96)']} style={StyleSheet.absoluteFill}/>
  <SafeAreaView style={w.safe}>
   <View style={w.top}><Text style={w.brand}>SHIBASHI</Text><Pressable onPress={toggleSound} style={w.sound}><Ionicons name={playing?'volume-medium':'volume-mute'} color={shen.color} size={20}/></Pressable></View>
   <View style={w.content}><View style={[w.gate,{borderColor:`${shen.color}88`}]}><Ionicons name="leaf-outline" color={shen.color} size={36}/></View><Text style={[w.eyebrow,{color:shen.color}]}>KENDİNE BİR AN AYIR</Text><Text style={w.title}>Günün içinde yeniden kendine dön.</Text><Text style={w.body}>Birkaç dakikalık yumuşak hareketler, sakin nefesler ve sana iyi gelecek küçük rutinler.</Text><Pressable onPress={()=>router.replace('/onboarding')} style={[w.enter,{backgroundColor:shen.color}]}><Text style={w.enterText}>Seni tanıyalım</Text><Ionicons name="arrow-forward" color={colors.ink} size={20}/></Pressable><Pressable onPress={()=>router.replace('/onboarding')}><Text style={w.skip}>{ready?'Videoyu geç':'Devam et'}</Text></Pressable></View>
  </SafeAreaView>
 </View>
}
const w=StyleSheet.create({root:{flex:1,backgroundColor:colors.ink},safe:{flex:1,justifyContent:'space-between',paddingHorizontal:spacing.lg},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{color:colors.cream,fontSize:13,fontWeight:'900',letterSpacing:3},sound:{width:44,height:44,borderRadius:22,backgroundColor:'rgba(3,13,11,.55)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.line},content:{alignItems:'center',paddingBottom:4},gate:{width:86,height:86,borderRadius:43,borderWidth:1,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(3,13,11,.48)',marginBottom:20},gateSymbol:{fontSize:38},eyebrow:{fontSize:11,fontWeight:'900',letterSpacing:2.2,marginBottom:10},title:{color:colors.cream,fontSize:36,lineHeight:42,fontWeight:'700',textAlign:'center',letterSpacing:-1},body:{color:colors.muted,fontSize:16,lineHeight:24,textAlign:'center',marginTop:13,marginBottom:26},enter:{height:56,borderRadius:radii.pill,paddingHorizontal:24,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,alignSelf:'stretch'},enterText:{color:colors.ink,fontSize:16,fontWeight:'900'},skip:{color:colors.muted,fontSize:13,fontWeight:'700',padding:16,marginBottom:4}});
