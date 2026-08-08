import {Ionicons} from '@expo/vector-icons';
import {Redirect} from 'expo-router';
import {useEffect,useState} from 'react';
import {ActivityIndicator,Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {colors} from '../constants/theme';
import {useApp} from '../store/AppStore';
import {useShenExperience} from '../store/ShenExperience';
const splashImage=require('../assets/shibashi-splash.png');

export default function Index(){
 const{ready}=useApp();
 const{playing,shen,soundEnabled,toggleSound}=useShenExperience();
 const[splashVisible,setSplashVisible]=useState(true);
 useEffect(()=>{const timer=setTimeout(()=>setSplashVisible(false),5000);return()=>clearTimeout(timer)},[]);
 if(splashVisible)return <View style={s.root}>
  <Image accessibilityLabel="Shibashi EFE açılış görseli" source={splashImage} resizeMode="contain" style={s.splash}/>
  <Pressable accessibilityLabel={soundEnabled?'Açılış müziğini sustur':'Açılış müziğini aç'} accessibilityRole="button" onPress={toggleSound} style={[s.sound,soundEnabled&&playing?s.soundActive:null]}>
   <Ionicons color={soundEnabled&&playing?'#F3D27A':'rgba(242,238,231,.64)'} name={soundEnabled&&playing?'volume-high-outline':'volume-mute-outline'} size={19}/>
   <Text style={[s.soundText,soundEnabled&&playing?s.soundTextActive:null]}>{soundEnabled&&playing?shen.name:'Sessiz'}</Text>
  </Pressable>
 </View>;
 if(!ready)return <View style={s.loading}><ActivityIndicator color={colors.gold}/></View>;
 return <Redirect href="/welcome"/>;
}

const s=StyleSheet.create({
 root:{alignItems:'center',backgroundColor:'#020604',flex:1,justifyContent:'center',overflow:'hidden'},
 splash:{height:'100%',width:'100%'},
 sound:{position:'absolute',right:18,top:56,minHeight:42,paddingHorizontal:13,borderRadius:22,borderWidth:1,borderColor:'rgba(242,238,231,.18)',backgroundColor:'rgba(3,10,6,.68)',flexDirection:'row',alignItems:'center',gap:7},
 soundActive:{borderColor:'rgba(243,210,122,.5)',shadowColor:'#F3D27A',shadowOpacity:.2,shadowRadius:12},
 soundText:{color:'rgba(242,238,231,.64)',fontSize:9,fontWeight:'800',letterSpacing:1.1,textTransform:'uppercase'},
 soundTextActive:{color:'#F3D27A'},
 loading:{flex:1,backgroundColor:colors.ink,alignItems:'center',justifyContent:'center'},
});
