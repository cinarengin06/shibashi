import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {useMemo,useState} from 'react';
import {ImageBackground,Pressable,StyleSheet,Text,View} from 'react-native';
import {Card,Eyebrow,PrimaryButton,ProgressBar,Screen,Title} from '../../components/ui';
import {colors,radii} from '../../constants/theme';
import {baguaDirections,humanMapStages,JourneyTarget} from '../../data/journey';
import {getShen} from '../../data/fiveShen';
import {useApp} from '../../store/AppStore';

const mapImage=require('../../assets/journey/neijing-map.jpg');
const positions=[
 {left:'39%' as const,top:'1%' as const},{left:'68%' as const,top:'13%' as const},
 {left:'80%' as const,top:'40%' as const},{left:'68%' as const,top:'69%' as const},
 {left:'39%' as const,top:'81%' as const},{left:'10%' as const,top:'69%' as const},
 {left:'0%' as const,top:'40%' as const},{left:'10%' as const,top:'13%' as const},
];

export default function Journey(){
 const{profile,sessions,postureReports,completedStories}=useApp();
 const shen=getShen(profile.selectedShenId);
 const[view,setView]=useState<'bagua'|'map'>('bagua');
 const journeyXp=sessions.length*28+postureReports.length*42+completedStories.length*18;
 const unlocked=Math.max(1,Math.min(8,1+Math.floor(journeyXp/100)));
 const recommended=useMemo(()=>postureReports.length===0?6:sessions.length===0?2:(sessions.length+postureReports.length+completedStories.length)%8,[completedStories.length,postureReports.length,sessions.length]);
 const[activeIndex,setActiveIndex]=useState(recommended);
 const[mapIndex,setMapIndex]=useState(Math.min(7,Math.max(0,unlocked-1)));
 const direction=baguaDirections[activeIndex];
 const stage=humanMapStages[mapIndex];
 const mapUnlocked=Math.max(1,Math.min(8,1+Math.floor((sessions.length+completedStories.length+postureReports.length*2)/2)));
 const go=(target:JourneyTarget)=>{
  if(target==='posture')router.push('/posture');
  else if(target==='learning')router.push('/living-learning');
  else if(target==='practice')router.push('/(tabs)/practice');
  else if(target==='journal')router.push('/(tabs)/journal');
  else router.push('/(tabs)');
 };
 return <Screen>
  <Eyebrow>GÜNLÜK YAŞAM PUSULAN</Eyebrow>
  <Title>{profile.name}, bugün hangi yöne dönüyorsun?</Title>
  <Text style={j.lead}>Hayatındaki sekiz alanı sade pratiklerle destekler. Bu sekiz yönlü pusula Shibashi geleneğinde Bagua olarak anılır.</Text>
  <View style={j.switcher}>
   <Pressable onPress={()=>setView('bagua')} style={[j.switch,view==='bagua'&&{backgroundColor:shen.color}]}><Text style={[j.switchText,view==='bagua'&&j.switchTextOn]}>Yaşam Pusulası</Text></Pressable>
   <Pressable onPress={()=>setView('map')} style={[j.switch,view==='map'&&{backgroundColor:shen.color}]}><Text style={[j.switchText,view==='map'&&j.switchTextOn]}>Beden Haritası</Text></Pressable>
  </View>
  {view==='bagua'?<>
   <Card style={j.progressCard}>
    <View style={j.row}><View><Text style={j.label}>YOL PUANI</Text><Text style={j.progressTitle}>{unlocked}/8 yön açık</Text></View><Text style={[j.xp,{color:shen.color}]}>{journeyXp} XP</Text></View>
    <ProgressBar value={unlocked/8*100} color={shen.color}/>
   </Card>
   <View style={[j.compass,{borderColor:`${direction.color}55`}]}>
    <View style={[j.orbit,j.orbitOuter]}/><View style={[j.orbit,j.orbitInner]}/>
    {baguaDirections.map((item,index)=>{
     const isOpen=index<unlocked,isActive=index===activeIndex;
     return <Pressable accessibilityLabel={`${item.name}, ${item.element}, ${isOpen?'açık':'kilitli'}`} key={item.id} onPress={()=>setActiveIndex(index)} style={[j.node,positions[index],isActive&&{borderColor:item.color,backgroundColor:`${item.color}24`,transform:[{scale:1.08}]},!isOpen&&{opacity:.52}]}>
      <Text style={[j.trigram,{color:isActive?item.color:colors.cream}]}>{item.trigram}</Text>
      <Text numberOfLines={1} style={j.nodeName}>{item.module}</Text>
      {!isOpen&&<View style={j.lock}><Ionicons name="lock-closed" size={8} color={colors.ink}/></View>}
     </Pressable>;
    })}
    <View style={[j.center,{borderColor:direction.color}]}>
     <Text style={[j.taiji,{color:direction.color}]}>☯</Text><Text style={j.centerSmall}>{direction.element}</Text><Text style={j.centerTitle}>{direction.module}</Text>
    </View>
   </View>
   <Card style={[j.directionCard,{borderColor:`${direction.color}66`}]}>
    <View style={j.row}><View><Text style={[j.label,{color:direction.color}]}>BUGÜNÜN YÖNÜ</Text><Text style={j.directionTitle}>{direction.module}</Text><Text style={j.termNote}>Geleneksel adı: {direction.trigram} {direction.name} · {direction.element}</Text></View>{activeIndex===recommended&&<View style={[j.recommended,{backgroundColor:direction.color}]}><Text style={j.recommendedText}>ÖNERİLEN</Text></View>}</View>
    <Text style={j.body}>{direction.cue}</Text>
    <View style={j.energy}>{[['Beden (Jing)',Math.min(99,62+sessions.length*3)],['Canlılık (Qi)',Math.min(99,58+postureReports.length*4)],['Zihin (Shen)',shen.value]].map(([name,value])=><View key={String(name)} style={j.energyItem}><Text style={j.energyName}>{name}</Text><Text style={[j.energyValue,{color:direction.color}]}>{value}</Text></View>)}</View>
    <PrimaryButton label={`${direction.module} yönüne geç`} icon="arrow-forward" onPress={()=>go(direction.target)}/>
   </Card>
  </>:<>
   <Card style={j.progressCard}><View style={j.row}><View><Text style={j.label}>İLERLEME</Text><Text style={j.progressTitle}>{mapUnlocked}/8 durak</Text></View><Text style={[j.xp,{color:shen.color}]}>{Math.round(mapUnlocked/8*100)}%</Text></View><ProgressBar value={mapUnlocked/8*100} color={shen.color}/></Card>
   <ImageBackground source={mapImage} style={j.map} imageStyle={j.mapImage}>
    <View style={j.mapShade}/>
    <View style={j.river}/>
    {humanMapStages.map((item,index)=>{
     const isOpen=index<mapUnlocked,isActive=index===mapIndex;
     return <Pressable key={item.id} accessibilityLabel={`${index+1}. durak ${item.title}`} onPress={()=>setMapIndex(index)} style={[j.hotspot,{left:`${item.x-6}%`,top:`${item.y-4}%`},isActive&&{backgroundColor:shen.color,borderColor:colors.cream},!isOpen&&{opacity:.5}]}>
      <Text style={[j.hotspotText,isActive&&{color:colors.ink}]}>{isOpen?index+1:'·'}</Text>
     </Pressable>;
    })}
    <View style={j.mapCaption}><Text style={j.mapCaptionTop}>BEDEN HARİTASI</Text><Text style={j.mapCaptionTitle}>{stage.title}</Text></View>
   </ImageBackground>
   <Card style={[j.stageCard,{borderColor:`${shen.color}55`}]}>
    <View style={j.row}><View><Text style={[j.label,{color:shen.color}]}>DURAK {mapIndex+1}</Text><Text style={j.directionTitle}>{stage.title}</Text></View><Text style={[j.reward,{color:shen.color}]}>{stage.reward}</Text></View>
    <Text style={j.body}>{stage.text}</Text>
    <View style={j.benefits}>{stage.benefits.map(item=><View key={item} style={j.benefit}><Ionicons name="sparkles-outline" size={14} color={shen.color}/><Text style={j.benefitText}>{item}</Text></View>)}</View>
    <View style={j.note}><Text style={[j.label,{color:shen.color}]}>GÜNLÜK HAYATTA</Text><Text style={j.noteText}>{stage.dailyUse}</Text></View>
    <View style={j.note}><Text style={[j.label,{color:shen.color}]}>60 SANİYELİK MİKRO PRATİK</Text><Text style={j.noteText}>{stage.microPractice}</Text></View>
    <View style={j.mapActions}><Pressable onPress={()=>setMapIndex(v=>(v+7)%8)} style={j.smallButton}><Ionicons name="arrow-back" color={colors.cream} size={19}/><Text style={j.smallButtonText}>Önceki</Text></Pressable><Pressable onPress={()=>setMapIndex(v=>(v+1)%8)} style={[j.smallButton,{borderColor:shen.color}]}><Text style={[j.smallButtonText,{color:shen.color}]}>Sonraki</Text><Ionicons name="arrow-forward" color={shen.color} size={19}/></Pressable></View>
   </Card>
  </>}
 </Screen>;
}

const j=StyleSheet.create({
 lead:{color:colors.muted,fontSize:15,lineHeight:23,marginTop:-12},switcher:{height:48,borderRadius:radii.pill,padding:4,backgroundColor:colors.surface,flexDirection:'row'},switch:{flex:1,borderRadius:radii.pill,alignItems:'center',justifyContent:'center'},switchText:{color:colors.muted,fontSize:13,fontWeight:'800'},switchTextOn:{color:colors.ink},progressCard:{gap:12},row:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:10},label:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1.25},progressTitle:{color:colors.cream,fontSize:18,fontWeight:'800',marginTop:4},xp:{fontSize:18,fontWeight:'900'},compass:{alignSelf:'center',width:330,height:330,borderRadius:165,borderWidth:1,backgroundColor:'rgba(4,16,14,.9)',position:'relative'},orbit:{position:'absolute',borderRadius:999,borderWidth:1,borderColor:colors.line},orbitOuter:{inset:19},orbitInner:{inset:91},node:{position:'absolute',width:68,height:62,borderRadius:17,backgroundColor:'rgba(16,40,33,.96)',borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center',zIndex:2},trigram:{fontSize:22,lineHeight:24,fontWeight:'700'},nodeName:{color:colors.muted,fontSize:9,fontWeight:'800'},lock:{position:'absolute',right:4,top:4,width:14,height:14,borderRadius:7,backgroundColor:colors.muted,alignItems:'center',justifyContent:'center'},center:{position:'absolute',left:105,top:105,width:120,height:120,borderRadius:60,borderWidth:1,backgroundColor:'#071512',alignItems:'center',justifyContent:'center'},taiji:{fontSize:35},centerSmall:{color:colors.muted,fontSize:9,fontWeight:'800',textTransform:'uppercase'},centerTitle:{color:colors.cream,fontSize:13,fontWeight:'900',marginTop:2},directionCard:{gap:15},directionTitle:{color:colors.cream,fontSize:18,fontWeight:'800',marginTop:4},termNote:{color:colors.muted,fontSize:10,marginTop:4},recommended:{borderRadius:radii.pill,paddingHorizontal:8,paddingVertical:5},recommendedText:{color:colors.ink,fontSize:8,fontWeight:'900'},body:{color:colors.muted,fontSize:14,lineHeight:22},energy:{flexDirection:'row',gap:8},energyItem:{flex:1,backgroundColor:colors.deep,borderRadius:12,padding:11},energyName:{color:colors.muted,fontSize:10},energyValue:{fontSize:20,fontWeight:'900',marginTop:3},map:{height:520,borderRadius:radii.lg,overflow:'hidden',position:'relative',backgroundColor:colors.deep},mapImage:{borderRadius:radii.lg},mapShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,15,13,.30)'},river:{position:'absolute',width:3,top:68,bottom:72,left:'50%',backgroundColor:'rgba(240,200,122,.45)',borderRadius:3},hotspot:{position:'absolute',width:42,height:42,borderRadius:21,backgroundColor:colors.surface,borderColor:colors.gold,borderWidth:1.5,alignItems:'center',justifyContent:'center'},hotspotText:{color:colors.cream,fontSize:13,fontWeight:'900'},mapCaption:{position:'absolute',left:18,right:18,bottom:17,backgroundColor:'rgba(3,15,13,.78)',padding:13,borderRadius:14},mapCaptionTop:{color:colors.gold,fontSize:9,fontWeight:'900',letterSpacing:1.5},mapCaptionTitle:{color:colors.cream,fontSize:18,fontWeight:'800',marginTop:3},stageCard:{gap:14},reward:{fontSize:15,fontWeight:'900'},benefits:{gap:8},benefit:{flexDirection:'row',alignItems:'center',gap:8},benefitText:{color:colors.cream,fontSize:13},note:{backgroundColor:colors.deep,borderRadius:14,padding:13,gap:5},noteText:{color:colors.muted,fontSize:13,lineHeight:19},mapActions:{flexDirection:'row',gap:10},smallButton:{flex:1,height:46,borderRadius:radii.pill,borderWidth:1,borderColor:colors.line,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},smallButtonText:{color:colors.cream,fontSize:13,fontWeight:'800'},
});
