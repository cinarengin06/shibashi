import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';
import React,{PropsWithChildren,useEffect,useRef} from 'react';
import {Animated,ImageBackground,Pressable,ScrollView,StyleProp,StyleSheet,Text,View,ViewStyle} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors,fonts,radii,spacing,type} from '../constants/theme';
import {useShenExperience} from '../store/ShenExperience';

export function Screen({children,scroll=true,style}:{children:React.ReactNode;scroll?:boolean;style?:ViewStyle}){
 const{background}=useShenExperience();
 const body=<View style={[s.content,style]}>{children}</View>;
 return <ImageBackground source={background} style={s.safe} imageStyle={s.backgroundImage}>
  <View style={s.scrim}/>
  <SafeAreaView style={s.safeClear} edges={['top']}>
   {scroll?<ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>{body}</ScrollView>:body}
  </SafeAreaView>
 </ImageBackground>;
}

export function Eyebrow({children}:PropsWithChildren){return <Text style={s.eyebrow}>{children}</Text>}
export function Title({children}:PropsWithChildren){return <Text style={s.title}>{children}</Text>}
export function Section({title,action,children}:{title:string;action?:string;children:React.ReactNode}){
 return <View style={s.section}><View style={s.sectionHead}><Text style={s.sectionTitle}>{title}</Text>{action&&<Text style={s.action}>{action}</Text>}</View>{children}</View>;
}
export function Card({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){
 return <View style={[s.card,style]}>{children}</View>;
}
export function PrimaryButton({label,onPress,icon='arrow-forward',disabled=false}:{label:string;onPress:()=>void;icon?:keyof typeof Ionicons.glyphMap;disabled?:boolean}){
 const{shen}=useShenExperience();
 return <Pressable disabled={disabled} onPress={()=>{Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);onPress()}} style={({pressed})=>[s.button,pressed&&s.buttonPressed,disabled&&s.buttonDisabled]}>
  <LinearGradient colors={[shen.color2,shen.color]} start={{x:0,y:.5}} end={{x:1,y:.5}} style={s.buttonInner}>
   <Text style={s.buttonText}>{label}</Text><Ionicons name={icon} size={20} color={colors.ink}/>
  </LinearGradient>
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
 safe:{flex:1,backgroundColor:colors.ink},
 safeClear:{flex:1},
 backgroundImage:{opacity:.34},
 scrim:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'rgba(4,6,8,.80)'},
 scroll:{paddingBottom:130},
 content:{paddingHorizontal:spacing.lg,gap:spacing.lg},
 section:{gap:12},
 eyebrow:{color:colors.gold,fontFamily:fonts.sansBold,fontSize:11,letterSpacing:1.8,textTransform:'uppercase'},
 title:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:type.h1,lineHeight:35,letterSpacing:-.6},
 sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 sectionTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:type.h2,letterSpacing:-.2},
 action:{color:colors.gold,fontFamily:fonts.sansStrong,fontSize:13},
 card:{backgroundColor:'rgba(13,17,19,.92)',borderColor:'rgba(245,240,232,.11)',borderWidth:1,borderRadius:radii.lg,padding:spacing.md,shadowColor:'#000',shadowOpacity:.2,shadowRadius:18,shadowOffset:{width:0,height:10},elevation:5},
 button:{borderRadius:radii.pill,overflow:'hidden',minHeight:54,shadowColor:'#000',shadowOpacity:.22,shadowRadius:14,shadowOffset:{width:0,height:8},elevation:4},
 buttonPressed:{opacity:.84,transform:[{scale:.985}]},
 buttonDisabled:{opacity:.4},
 buttonInner:{minHeight:54,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10},
 buttonText:{color:colors.ink,fontFamily:fonts.sansBold,fontSize:15},
 metric:{flex:1,minWidth:92,gap:5,paddingVertical:14},
 metricValue:{fontFamily:fonts.displayStrong,fontSize:24},
 muted:{color:colors.muted,fontFamily:fonts.sans,fontSize:13,lineHeight:19},
 track:{height:7,borderRadius:4,backgroundColor:'rgba(243,235,221,.10)',overflow:'hidden'},
 fill:{height:'100%',borderRadius:4},
 orb:{width:116,height:116,borderRadius:58,backgroundColor:'rgba(105,181,141,.12)',borderColor:'rgba(105,181,141,.32)',borderWidth:1,alignItems:'center',justifyContent:'center'},
 orbSmall:{width:68,height:68,borderRadius:34},
 orbRing:{position:'absolute',width:'78%',height:'78%',borderRadius:999,borderColor:'rgba(216,169,88,.32)',borderWidth:1},
 orbCore:{width:'48%',height:'48%',borderRadius:999,backgroundColor:'rgba(105,181,141,.35)'},
});
export const ui=s;
