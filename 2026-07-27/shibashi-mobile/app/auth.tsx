import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {useEffect,useState} from 'react';
import {ImageBackground,Pressable,SafeAreaView,StyleSheet,Text,View} from 'react-native';
import {colors} from '../constants/theme';
import {signInWithGoogle,supabaseAuth} from '../services/auth/SupabaseAuth';
import {useApp} from '../store/AppStore';

const authBackground=require('../assets/intro/intro-gate-poster-hq-v2.png');

export default function Auth(){
 const{saveProfile}=useApp();
 const[mode,setMode]=useState<'login'|'signup'>('login');
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState('');

 useEffect(()=>{
  if(!supabaseAuth){setLoading(false);return}
  void supabaseAuth.auth.getUser().then(({data})=>{
   if(data.user){
    saveGoogleProfile(data.user);
    router.replace('/onboarding');
   }else setLoading(false);
  });
 },[]);

 const saveGoogleProfile=(user:{id:string;email?:string;user_metadata?:Record<string,unknown>})=>{
  const fullName=typeof user.user_metadata?.full_name==='string'
   ? user.user_metadata.full_name
   : typeof user.user_metadata?.name==='string'
    ? user.user_metadata.name
    : undefined;
  const avatarUrl=typeof user.user_metadata?.avatar_url==='string'
   ? user.user_metadata.avatar_url
   : undefined;
  saveProfile({
   authEmail:user.email,
   authUserId:user.id,
   avatarUrl,
   ...(fullName?{name:fullName}:{}),
  });
 };

 const continueWithGoogle=async()=>{
  setLoading(true);setError('');
  try{
   const session=await signInWithGoogle();
   if(!session){setLoading(false);return}
   saveGoogleProfile(session.user);
   router.replace('/onboarding');
  }catch(value){
   setError(value instanceof Error?value.message:'Google girişi tamamlanamadı.');
   setLoading(false);
  }
 };

 return <ImageBackground source={authBackground} resizeMode="cover" style={a.background}>
  <View style={a.shade}/>
  <SafeAreaView style={a.safe}>
   <View style={a.card}>
    <View style={a.mark}><Text style={a.markText}>☯</Text></View>
    <Text style={a.eyebrow}>SHIBASHI EFE</Text>
    <Text style={a.title}>{mode==='login'?'Yolculuğuna kaldığın yerden devam et.':'İlerlemeni yanında taşı.'}</Text>
    <Text style={a.body}>{mode==='login'?'Pratiklerini, postür ölçümlerini ve günlük notlarını güvenle eşitle.':'Tek bir Google hesabıyla web ve mobile kayıtlarını aynı yerde tut.'}</Text>
    <View style={a.mode}>
     <Pressable onPress={()=>setMode('login')} style={[a.modeButton,mode==='login'&&a.modeActive]}><Text style={[a.modeText,mode==='login'&&a.modeTextActive]}>Giriş yap</Text></Pressable>
     <Pressable onPress={()=>setMode('signup')} style={[a.modeButton,mode==='signup'&&a.modeActive]}><Text style={[a.modeText,mode==='signup'&&a.modeTextActive]}>Hesap oluştur</Text></Pressable>
    </View>
    <Pressable disabled={loading||!supabaseAuth} onPress={()=>void continueWithGoogle()} style={[a.google,loading&&a.disabled]}>
     <View style={a.googleMark}><Text style={a.googleLetter}>G</Text></View>
     <Text style={a.googleText}>{loading?'Google hazırlanıyor…':mode==='login'?'Google ile giriş yap':'Google ile kayıt ol'}</Text>
    </Pressable>
    {!!error&&<View style={a.error}><Ionicons name="alert-circle-outline" color="#E5A197" size={18}/><Text style={a.errorText}>{error}</Text></View>}
    {!supabaseAuth&&<Text style={a.errorText}>Supabase Auth yapılandırılmadı.</Text>}
    <Pressable onPress={()=>router.replace('/onboarding')} style={a.skip}><Text style={a.skipText}>Şimdilik hesapsız devam et</Text></Pressable>
    <Text style={a.privacy}>Google şifren Shibashi ile paylaşılmaz. Oturumun cihazında güvenli biçimde saklanır.</Text>
   </View>
  </SafeAreaView>
 </ImageBackground>;
}

const a=StyleSheet.create({
 background:{backgroundColor:'#030705',flex:1},
 shade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,7,5,.7)'},
 safe:{alignItems:'center',flex:1,justifyContent:'center',padding:18},
 card:{backgroundColor:'rgba(7,15,11,.92)',borderColor:'rgba(216,195,148,.28)',borderRadius:28,borderWidth:1,gap:14,maxWidth:460,padding:26,shadowColor:'#000',shadowOffset:{width:0,height:24},shadowOpacity:.55,shadowRadius:38,width:'100%'},
 mark:{alignItems:'center',alignSelf:'center',borderColor:'rgba(216,195,148,.48)',borderRadius:31,borderWidth:1,height:62,justifyContent:'center',width:62},
 markText:{color:'#D8C394',fontSize:31},
 eyebrow:{color:'#D8C394',fontSize:10,fontWeight:'900',letterSpacing:1.8,textAlign:'center'},
 title:{color:colors.cream,fontFamily:'DMSerifDisplay_400Regular',fontSize:34,lineHeight:38,textAlign:'center'},
 body:{color:colors.muted,fontSize:14,lineHeight:21,textAlign:'center'},
 mode:{backgroundColor:'rgba(255,255,255,.045)',borderColor:'rgba(255,255,255,.08)',borderRadius:24,borderWidth:1,flexDirection:'row',padding:4},
 modeButton:{alignItems:'center',borderRadius:20,flex:1,justifyContent:'center',minHeight:42},
 modeActive:{backgroundColor:'rgba(126,158,100,.25)'},
 modeText:{color:colors.muted,fontSize:13,fontWeight:'700'},
 modeTextActive:{color:colors.cream},
 google:{alignItems:'center',backgroundColor:'#F7F5EF',borderRadius:27,flexDirection:'row',gap:12,justifyContent:'center',minHeight:54,paddingHorizontal:18},
 disabled:{opacity:.58},
 googleMark:{alignItems:'center',height:25,justifyContent:'center',width:25},
 googleLetter:{color:'#4285F4',fontSize:20,fontWeight:'900'},
 googleText:{color:'#151915',fontSize:14,fontWeight:'800'},
 error:{alignItems:'center',backgroundColor:'rgba(161,61,50,.14)',borderColor:'rgba(210,101,86,.3)',borderRadius:13,borderWidth:1,flexDirection:'row',gap:8,padding:11},
 errorText:{color:'#E5A197',flex:1,fontSize:12,lineHeight:17},
 skip:{alignItems:'center',padding:7},
 skipText:{color:colors.muted,fontSize:13,fontWeight:'700'},
 privacy:{color:'rgba(180,187,179,.62)',fontSize:10,lineHeight:15,textAlign:'center'},
});
