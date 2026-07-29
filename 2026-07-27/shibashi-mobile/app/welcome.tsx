import {router} from 'expo-router';
import {useEffect,useRef} from 'react';
import {Animated,Easing,Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {colors} from '../constants/theme';

const splashImage=require('../assets/shibashi-splash.png');
export default function Welcome(){
 const opacity=useRef(new Animated.Value(0)).current;
 const scale=useRef(new Animated.Value(1.012)).current;

 useEffect(()=>{
  const motion=Animated.parallel([
   Animated.timing(opacity,{toValue:1,duration:700,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
   Animated.timing(scale,{toValue:1.035,duration:5000,easing:Easing.inOut(Easing.cubic),useNativeDriver:true}),
  ]);
  motion.start();
  const timer=setTimeout(()=>router.replace('/onboarding'),5000);
  return()=>{clearTimeout(timer);motion.stop()};
 },[opacity,scale]);

 return <View style={w.root}>
  <Animated.View style={[StyleSheet.absoluteFill,{opacity,transform:[{scale}]}]}>
   <Image source={splashImage} resizeMode="cover" fadeDuration={0} style={StyleSheet.absoluteFill}/>
  </Animated.View>
  <Pressable accessibilityLabel="Açılışı geç" onPress={()=>router.replace('/onboarding')} style={w.skip}>
   <Text style={w.skipText}>Dokun ve başla</Text>
   <View style={w.progressTrack}><Animated.View style={[w.progress,{transform:[{scaleX:scale.interpolate({inputRange:[1.012,1.035],outputRange:[0,1]})}]}]}/></View>
  </Pressable>
 </View>
}
const w=StyleSheet.create({
 root:{flex:1,backgroundColor:colors.ink,overflow:'hidden'},
 skip:{position:'absolute',bottom:28,left:'50%',transform:[{translateX:-76}],width:152,minHeight:42,paddingHorizontal:14,borderRadius:24,borderWidth:1,borderColor:'rgba(239,197,93,.48)',backgroundColor:'rgba(3,10,6,.66)',alignItems:'center',justifyContent:'center',gap:5},
 skipText:{color:'#f3d27a',fontSize:10,fontWeight:'800',letterSpacing:1.35,textTransform:'uppercase'},
 progressTrack:{height:2,width:54,overflow:'hidden',borderRadius:2,backgroundColor:'rgba(243,210,122,.2)'},
 progress:{height:2,width:54,borderRadius:2,backgroundColor:'#f3d27a',transformOrigin:'left'},
});
