import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {router} from 'expo-router';
import {ImageBackground,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors,fonts,radii} from '../constants/theme';
import {livingSceneImages,livingScenes} from '../data/livingLearning';
import {useApp} from '../store/AppStore';

export default function LivingLearning(){
 const{completedStories}=useApp();
 return <View style={s.root}>
  <SafeAreaView edges={['top']} style={s.safe}>
   <View style={s.top}><Pressable onPress={()=>router.back()} style={s.icon}><Ionicons name="arrow-back" size={20} color={colors.cream}/></Pressable><View style={s.topCopy}><Text style={s.kicker}>YAŞAYARAK ÖĞRENME</Text><Text style={s.topTitle}>Learn by Living</Text></View><View style={s.seal}><Text style={s.sealText}>太</Text></View></View>
   <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
    <View style={s.intro}><Text style={s.title}>Hareket, hayatın içinde anlam kazanır.</Text><Text style={s.lead}>Tai Chi hareketlerini hayatın içinden sahnelerle öğren. Sen neredeysen, pratiğin oraya gelir.</Text></View>
    <Pressable onPress={()=>router.push({pathname:'/living-story/[id]',params:{id:'bedroom'}})}>
     <ImageBackground source={livingSceneImages.bedroom} style={s.featured} imageStyle={s.image}>
      <LinearGradient colors={['rgba(5,9,7,.08)','rgba(5,9,7,.18)','rgba(5,9,7,.92)']} style={StyleSheet.absoluteFill}/>
      <View style={s.liveBadge}><View style={s.liveDot}/><Text style={s.liveText}>CANLI PRATİK</Text></View>
      <View style={s.featureCopy}><Text style={s.sceneQuality}>UYANIŞ · SICAK GÜN DOĞUMU</Text><Text style={s.featureTitle}>Yeni Gün</Text><Text style={s.metaphor}>Yorganı üzerinden kaldırır gibi bedenine sakin ve geniş bir alan aç.</Text><View style={s.begin}><Text style={s.beginText}>İlk akışı başlat</Text><Ionicons name="arrow-forward" size={17} color="#11150F"/></View></View>
     </ImageBackground>
    </Pressable>
    <View style={s.sectionHead}><View><Text style={s.kicker}>ALTI HAREKET · ALTI YAŞAM ANI</Text><Text style={s.sectionTitle}>Bugün hangi sahnenin içine girmek istersin?</Text></View><Text style={s.count}>{completedStories.length}/6</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scenes} snapToInterval={251} decelerationRate="fast">
     {livingScenes.map(scene=><Pressable key={scene.id} onPress={()=>router.push({pathname:'/living-story/[id]',params:{id:scene.id}})}>
      <ImageBackground source={livingSceneImages[scene.id]} style={s.sceneCard} imageStyle={s.image}>
       <LinearGradient colors={['rgba(5,9,7,.05)','rgba(5,9,7,.82)']} style={StyleSheet.absoluteFill}/>
       <View style={s.cardTop}><Text style={s.cardQuality}>{scene.subtitle.toUpperCase()}</Text><Text style={[s.cardState,s.cardStateLive]}>CANLI</Text></View>
       <View><Text style={s.cardTitle}>{scene.name}</Text><Text style={s.cardMetaphor}>{scene.metaphor}</Text><Text style={s.cardTempo}>{scene.tempo}</Text></View>
      </ImageBackground>
     </Pressable>)}
    </ScrollView>
    <View style={s.promise}><Text style={s.promiseLabel}>PRATİK AKIŞI</Text><View style={s.promiseRow}><Promise icon="images-outline" text="1 · Sahneyi seç"/><Promise icon="eye-outline" text="2 · Hareketi izle"/><Promise icon="body-outline" text="3 · Kendi bedeninle yap"/><Promise icon="camera-outline" text="4 · Anlık geri bildirim al"/><Promise icon="checkmark-circle-outline" text="5 · Akışı tamamla"/></View></View>
   </ScrollView>
  </SafeAreaView>
 </View>;
}
function Promise({icon,text}:{icon:keyof typeof Ionicons.glyphMap;text:string}){return <View style={s.promiseItem}><View style={s.promiseIcon}><Ionicons name={icon} size={17} color={colors.gold}/></View><Text style={s.promiseText}>{text}</Text></View>}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#0A0F0C'},safe:{flex:1},top:{height:70,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},icon:{width:42,height:42,borderRadius:15,borderWidth:1,borderColor:'rgba(242,238,231,.14)',alignItems:'center',justifyContent:'center'},topCopy:{alignItems:'center'},kicker:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:16,letterSpacing:1.7},topTitle:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:19,marginTop:2},seal:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:'rgba(198,165,106,.38)',alignItems:'center',justifyContent:'center'},sealText:{color:colors.gold,fontSize:17},content:{padding:18,paddingBottom:54,gap:24},intro:{gap:10,paddingHorizontal:2},title:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:34,lineHeight:38,letterSpacing:-.5},lead:{fontFamily:fonts.sans,color:colors.muted,fontSize:16,lineHeight:26,maxWidth:340},featured:{height:410,borderRadius:26,overflow:'hidden',padding:18,justifyContent:'space-between',borderWidth:1,borderColor:'rgba(198,165,106,.34)'},image:{borderRadius:26},liveBadge:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:10,paddingVertical:7,borderRadius:99,backgroundColor:'rgba(10,15,12,.68)'},liveDot:{width:6,height:6,borderRadius:3,backgroundColor:'#A9D977'},liveText:{fontFamily:fonts.sansBold,color:'#DDEAD2',fontSize:17,letterSpacing:1.2},featureCopy:{gap:6},sceneQuality:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:16,letterSpacing:1.4},featureTitle:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:39},metaphor:{fontFamily:fonts.sans,color:'#D5D6D0',fontSize:16,lineHeight:25,maxWidth:310},begin:{alignSelf:'flex-start',height:43,marginTop:8,paddingHorizontal:16,borderRadius:22,backgroundColor:colors.gold,flexDirection:'row',alignItems:'center',gap:8},beginText:{fontFamily:fonts.sansBold,color:'#11150F',fontSize:17},sectionHead:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},sectionTitle:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:25,lineHeight:29,marginTop:5,maxWidth:290},count:{fontFamily:fonts.metricStrong,color:colors.gold,fontSize:17},scenes:{gap:11,paddingRight:18},sceneCard:{width:240,height:290,padding:15,borderRadius:22,overflow:'hidden',justifyContent:'space-between',borderWidth:1,borderColor:'rgba(242,238,231,.12)'},cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cardQuality:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:17,letterSpacing:1.3},cardState:{fontFamily:fonts.sansBold,color:colors.muted,fontSize:17,letterSpacing:1,paddingHorizontal:7,paddingVertical:5,borderRadius:99,backgroundColor:'rgba(10,15,12,.68)'},cardStateLive:{color:'#CFE9B5'},cardTitle:{fontFamily:fonts.displayMedium,color:colors.cream,fontSize:28},cardMetaphor:{fontFamily:fonts.sansMedium,color:'#DBDBD5',fontSize:16,lineHeight:27,marginTop:4},cardTempo:{fontFamily:fonts.sans,color:colors.muted,fontSize:16,marginTop:8},promise:{borderWidth:1,borderColor:'rgba(198,165,106,.17)',borderRadius:radii.lg,backgroundColor:'rgba(23,29,25,.72)',padding:17,gap:15},promiseLabel:{fontFamily:fonts.sansBold,color:colors.gold,fontSize:17,letterSpacing:1.5},promiseRow:{gap:13},promiseItem:{flexDirection:'row',alignItems:'center',gap:11},promiseIcon:{width:34,height:34,borderRadius:17,borderWidth:1,borderColor:'rgba(198,165,106,.24)',alignItems:'center',justifyContent:'center'},promiseText:{fontFamily:fonts.sansMedium,color:'#D5D6D0',fontSize:17}});
