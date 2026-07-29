import {Redirect} from 'expo-router';
import {useEffect,useState} from 'react';
import {ActivityIndicator,Image,StyleSheet,View} from 'react-native';
import {colors} from '../constants/theme';
import {useApp} from '../store/AppStore';
const splashImage=require('../assets/shibashi-splash.png');

export default function Index(){
 const{ready}=useApp();
 const[splashVisible,setSplashVisible]=useState(true);
 useEffect(()=>{const timer=setTimeout(()=>setSplashVisible(false),5000);return()=>clearTimeout(timer)},[]);
 if(splashVisible)return <View style={s.root}>
  <Image accessibilityLabel="Shibashi EFE açılış görseli" source={splashImage} resizeMode="contain" style={s.splash}/>
 </View>;
 if(!ready)return <View style={s.loading}><ActivityIndicator color={colors.gold}/></View>;
 return <Redirect href="/welcome"/>;
}

const s=StyleSheet.create({
 root:{alignItems:'center',backgroundColor:'#020604',flex:1,justifyContent:'center',overflow:'hidden'},
 splash:{height:'100%',width:'100%'},
 loading:{flex:1,backgroundColor:colors.ink,alignItems:'center',justifyContent:'center'},
});
