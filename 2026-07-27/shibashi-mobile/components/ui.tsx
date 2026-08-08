import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React,{PropsWithChildren,useEffect,useRef} from 'react';
import {Animated,Pressable,ScrollView,StyleProp,StyleSheet,Text,useWindowDimensions,View,ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors,fonts,radii,spacing,type} from '../constants/theme';
import {fiveShen} from '../data/fiveShen';
import {shenBackgrounds} from '../data/shenAssets';
import {useShenExperience} from '../store/ShenExperience';
import {shenThemes} from '../../../packages/design-tokens';

export function Screen({children,scroll=true,style}:{children:React.ReactNode;scroll?:boolean;style?:ViewStyle}){
 const{width}=useWindowDimensions();
 const body=<View style={[s.content,style]}>{children}</View>;
 return <View style={[s.safe,{width}]}>
  <ShenBackdrop opacity={.22}/>
  <View style={s.scrim}/>
  <SafeAreaView style={s.safeClear} edges={['top']}>
   {scroll?<ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>{body}</ScrollView>:body}
  </SafeAreaView>
 </View>;
}

export function ShenBackdrop({opacity=1,borderRadius=0}:{opacity?:number;borderRadius?:number}){
 const{shen}=useShenExperience();
 const personality=shenThemes[shen.id];
 const fades=useRef(Object.fromEntries(fiveShen.map(item=>[item.id,new Animated.Value(item.id===shen.id?opacity:0)]))).current;

 useEffect(()=>{
  const animation=Animated.parallel(fiveShen.map(item=>Animated.timing(fades[item.id],{
   toValue:item.id===shen.id?opacity:0,
   duration:personality.transitionMs,
   useNativeDriver:true,
  })));
  animation.start();
  return()=>animation.stop();
 },[fades,opacity,personality.transitionMs,shen.id]);

 return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{borderRadius,overflow:'hidden'}]}>
  {fiveShen.map(item=><Animated.Image
   key={item.id}
   resizeMode="cover"
   source={shenBackgrounds[item.id]}
   style={[StyleSheet.absoluteFill,s.backgroundImage,{opacity:fades[item.id]}]}
  />)}
 </View>;
}

export function Eyebrow({children}:PropsWithChildren){return <Text style={s.eyebrow}>{children}</Text>}
export function Title({children}:PropsWithChildren){const{shen}=useShenExperience();const personality=shenThemes[shen.id];return <Text style={[s.title,{fontFamily:personality.headingWeight==='600'?fonts.displayStrong:personality.headingWeight==='500'?fonts.displayMedium:fonts.displayRegular,letterSpacing:shen.id==='zhi'?.4:shen.id==='yi'?-.35:shen.id==='shen'?.6:0}]}>{children}</Text>}
export function Section({title,action,children}:{title:string;action?:string;children:React.ReactNode}){
 return <View style={s.section}><View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text>{action&&<Text style={s.action}>{action}</Text>}</View>{children}</View>;
}
export function Card({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){
 const{shen}=useShenExperience();const personality=shenThemes[shen.id];
 return <View style={[s.card,{backgroundColor:personality.surface,borderColor:`${personality.primary}35`,borderRadius:Math.min(28,personality.controlRadius+8)},style]}>{children}</View>;
}
export function PrimaryButton({label,onPress,icon='arrow-forward',disabled=false}:{label:string;onPress:()=>void;icon?:keyof typeof Ionicons.glyphMap;disabled?:boolean}){
 const{shen}=useShenExperience();
 const personality=shenThemes[shen.id];
 return <Pressable disabled={disabled} onPress={()=>{Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);onPress()}} style={({pressed})=>[s.button,{borderRadius:personality.controlRadius},pressed&&s.buttonPressed,disabled&&s.buttonDisabled]}>
  <View style={[s.buttonInner,{backgroundColor:personality.button,borderColor:personality.light,borderRadius:personality.controlRadius}]}>
   <Text style={[s.buttonText,{color:personality.buttonInk}]}>{label}</Text><Ionicons name={icon} size={20} color={personality.buttonInk}/>
  </View>
 </Pressable>;
}
export function Metric({label,value,color=colors.jade}:{label:string;value:string|number;color?:string}){
 return <Card style={s.metric}><Text style={[s.metricValue,{color}]}>{value}</Text><Text style={s.muted}>{label}</Text></Card>;
}
export function ProgressBar({value,color=colors.gold}:{value:number;color?:string}){
 return <View style={s.track}><View style={[s.fill,{width:`${Math.max(2,Math.min(100,value))}%`,backgroundColor:color}]}/></View>;
}
export function BreathOrb({small=false}:{small?:boolean}){
 const a=useRef(new Animated.Value(.85)).current;
 useEffect(()=>{Animated.loop(Animated.sequence([Animated.timing(a,{toValue:1,duration:3600,useNativeDriver:true}),Animated.timing(a,{toValue:.85,duration:3600,useNativeDriver:true})])).start()},[a]);
 return <Animated.View style={[s.orb,small&&s.orbSmall,{transform:[{scale:a}]}]}><View style={s.orbRing}/><View style={s.orbCore}/></Animated.View>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:colors.ink,maxWidth:'100%',overflow:'hidden'},
 safeClear:{flex:1},
 backgroundImage:{height:'100%',width:'100%'},
 scrim:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'rgba(7,16,13,.88)'},
 scroll:{paddingBottom:130,width:'100%'},
 content:{alignSelf:'center',gap:spacing.lg,maxWidth:'100%',overflow:'hidden',paddingHorizontal:spacing.lg,width:'100%'},
 section:{gap:12},
 eyebrow:{color:colors.gold,fontFamily:fonts.sansBold,fontSize:type.label,letterSpacing:1.2,textTransform:'uppercase'},
 title:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:type.h1,lineHeight:41,letterSpacing:-.35},
 sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 sectionTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:type.h2,letterSpacing:-.2},
 action:{color:colors.gold,fontFamily:fonts.sansStrong,fontSize:type.label},
 card:{backgroundColor:colors.surface,borderColor:colors.line,borderWidth:1,borderRadius:20,padding:spacing.md,shadowColor:'#000',shadowOpacity:.12,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:2},
 button:{borderRadius:radii.md,overflow:'hidden',minHeight:54,shadowColor:'#000',shadowOpacity:.12,shadowRadius:10,shadowOffset:{width:0,height:6},elevation:2},
 buttonPressed:{opacity:.88},
 buttonDisabled:{opacity:.4},
 buttonInner:{minHeight:54,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,borderWidth:1,borderRadius:radii.md},
 buttonText:{color:colors.cream,fontFamily:fonts.sansBold,fontSize:type.button},
 metric:{flex:1,minWidth:92,gap:5,paddingVertical:14},
 metricValue:{fontFamily:fonts.displayStrong,fontSize:24},
 muted:{color:colors.muted,fontFamily:fonts.sans,fontSize:type.bodyCompact,lineHeight:27},
 track:{height:5,borderRadius:4,backgroundColor:'rgba(241,238,229,.09)',overflow:'hidden'},
 fill:{height:'100%',borderRadius:4},
 orb:{width:116,height:116,borderRadius:58,backgroundColor:'rgba(105,181,141,.12)',borderColor:'rgba(105,181,141,.32)',borderWidth:1,alignItems:'center',justifyContent:'center'},
 orbSmall:{width:68,height:68,borderRadius:34},
 orbRing:{position:'absolute',width:'78%',height:'78%',borderRadius:999,borderColor:'rgba(216,169,88,.32)',borderWidth:1},
 orbCore:{width:'48%',height:'48%',borderRadius:999,backgroundColor:'rgba(105,181,141,.35)'},
});
export const ui=s;
