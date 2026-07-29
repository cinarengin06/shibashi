import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';
import {router} from 'expo-router';
import {ImageBackground,Pressable,StyleSheet,Text,View} from 'react-native';
import {Screen} from '../../components/ui';
import {colors,fonts,radii,spacing} from '../../constants/theme';
import {practices} from '../../data/content';
import {getShen} from '../../data/fiveShen';
import {useApp} from '../../store/AppStore';
import {useShenExperience} from '../../store/ShenExperience';

const everydayModes=[
 {id:'po' as const,label:'Sakinlik',icon:'moon-outline' as const},
 {id:'hun' as const,label:'Yenilenme',icon:'leaf-outline' as const},
 {id:'yi' as const,label:'Odak',icon:'locate-outline' as const},
 {id:'shen' as const,label:'İyi hisset',icon:'heart-outline' as const},
 {id:'zhi' as const,label:'Güçlen',icon:'footsteps-outline' as const},
];

export default function Today(){
 const{profile,saveProfile,sessions,postureReports,completedStories}=useApp();
 const{background,playing,toggleSound}=useShenExperience();
 const shen=getShen(profile.selectedShenId);
 const practice=practices.find(item=>item.id===shen.practiceId)??practices[0];
 const completed=sessions.filter(item=>new Date(item.date).toDateString()===new Date().toDateString()).reduce((total,item)=>total+item.duration,0);
 const energy=[{label:'Beden',term:'Jing',value:68},{label:'Canlılık',term:'Qi',value:76},{label:'Zihin',term:'Shen',value:82}];
 const chooseShen=(id:Parameters<typeof saveProfile>[0]['selectedShenId'])=>{if(!id)return;void Haptics.selectionAsync();saveProfile({selectedShenId:id})};

 return <Screen>
  <View style={s.header}>
   <View style={s.brand}><Text style={[s.brandMark,{color:shen.color}]}>☯</Text><View><Text style={s.brandName}>SHIBASHI</Text><Text style={s.brandMeta}>HAREKET · NEFES · GÜNLÜK DENGE</Text></View></View>
   <Pressable accessibilityLabel="Bildirimler" style={s.notify}><Ionicons name="notifications-outline" color={colors.cream} size={19}/><View style={[s.notifyDot,{backgroundColor:shen.color}]}/></Pressable>
  </View>

  <View style={s.modePicker}>{everydayModes.map(item=>{const active=item.id===shen.id;return <Pressable key={item.id} onPress={()=>chooseShen(item.id)} style={[s.modeChoice,active&&{borderColor:shen.color,backgroundColor:`${shen.color}16`}]}><Ionicons name={item.icon} color={active?shen.color:colors.muted} size={18}/><Text style={[s.modeChoiceText,active&&{color:shen.color}]}>{item.label}</Text></Pressable>})}</View>

  <ImageBackground source={background} style={[s.sanctuary,{borderColor:`${shen.color}42`}]} imageStyle={s.sanctuaryImage}>
   <LinearGradient colors={['rgba(3,5,7,.04)','rgba(3,5,7,.18)','rgba(3,5,7,.97)']} locations={[0,.42,1]} style={s.sanctuaryShade}>
    <View style={s.soundRow}>
     <Text style={[s.eyebrow,{color:shen.color}]}>{shen.element.toUpperCase()}</Text>
     <Pressable onPress={toggleSound} style={[s.sound,{borderColor:`${shen.color}66`}]}><Ionicons name={playing?'pause':'musical-notes-outline'} color={shen.color} size={16}/></Pressable>
    </View>
    <View style={s.sanctuaryBody}>
     <View style={s.titleRow}><Text style={s.shenTitle}>{shen.dailyName}</Text><Text style={[s.han,{color:shen.color}]}>{shen.symbol}</Text></View>
     <Text style={[s.essence,{color:shen.color}]}>{shen.label}</Text>
     <Text style={s.prompt}>{shen.dailyPrompt}</Text>
     <Text style={s.tradition}>Shibashi geleneğindeki karşılığı: {shen.name} Shen · {shen.element}</Text>
    </View>

    <View style={s.energyRow}>
     {energy.map(item=><View key={item.label} style={[s.energyOrb,{borderColor:`${shen.color}55`}]}><Text style={s.energyLabel}>{item.label}</Text><Text style={s.energyValue}>{item.value}<Text style={[s.percent,{color:shen.color}]}>%</Text></Text><Text style={s.energyTerm}>{item.term}</Text></View>)}
    </View>

    <View style={[s.ritual,{borderColor:`${shen.color}40`}]}>
     <View style={[s.ritualIcon,{backgroundColor:`${shen.color}16`,borderColor:`${shen.color}45`}]}><Text style={[s.ritualSymbol,{color:shen.color}]}>☯</Text></View>
     <View style={s.ritualCopy}><Text style={[s.ritualKicker,{color:shen.color}]}>GÜNLÜK PRATİĞİN</Text><Text style={s.ritualTitle}>{practice.title}</Text><Text style={s.ritualMeta}>{practice.movementIds.length} hareket · {practice.duration} dakika</Text></View>
     <Pressable onPress={()=>{void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);router.push(`/practice-session?practiceId=${practice.id}`)}} style={[s.start,{backgroundColor:shen.color}]}><Ionicons name="arrow-forward" color={colors.ink} size={20}/></Pressable>
    </View>
   </LinearGradient>
  </ImageBackground>

  <View style={s.sectionHead}><View><Text style={[s.eyebrow,{color:shen.color}]}>İÇSEL HARİTAN</Text><Text style={s.sectionTitle}>Bugünün dengesi</Text></View><Text style={[s.mode,{color:shen.color}]}>{shen.dailyName}</Text></View>

  <View style={s.path}>
   <PathItem icon="sparkles-outline" title="Yaşayarak Öğren" detail={`${completedStories.length}/18 hikâye · gündelik sahneler`} color={shen.color} onPress={()=>router.push('/living-learning')}/>
   <PathItem icon="scan-outline" title="Postür Aynası" detail={postureReports.length?`${postureReports.length} analiz · son skor ${postureReports[0].score}`:'İlk üç açılı taramanı al'} color={shen.color} onPress={()=>router.push('/posture')}/>
   <PathItem icon="compass-outline" title="Yolculuk Haritan" detail={`${Math.max(1,Math.min(8,1+Math.floor((sessions.length*28+postureReports.length*42+completedStories.length*18)/100)))}/8 yaşam yönü açık · gelenekte Bagua`} color={shen.color} onPress={()=>router.push('/(tabs)/journey')}/>
  </View>

  <View style={[s.needCard,{borderColor:`${shen.color}30`}]}>
   <Text style={[s.eyebrow,{color:shen.color}]}>ŞİMDİKİ İHTİYACIN</Text>
   <Text style={s.needTitle}>Kendine nasıl bir alan açmak istersin?</Text>
   <View style={s.needOptions}>
    {[
     {icon:'leaf-outline' as const,label:'Sakinleşmek'},
     {icon:'sunny-outline' as const,label:'Canlanmak'},
     {icon:'moon-outline' as const,label:'Bırakmak'},
    ].map(item=><Pressable key={item.label} onPress={()=>router.push(`/practice-session?practiceId=${practice.id}`)} style={s.needOption}><Ionicons name={item.icon} color={shen.color} size={19}/><Text style={s.needLabel}>{item.label}</Text></Pressable>)}
   </View>
  </View>

  <Text style={[s.quote,{color:shen.color}]}>“{shen.hero}”</Text>
  <Text style={s.todayMeta}>{completed}/{profile.dailyGoal} dakika · bugünkü ritmin</Text>
 </Screen>
}

function PathItem({icon,title,detail,color,onPress}:{icon:keyof typeof Ionicons.glyphMap;title:string;detail:string;color:string;onPress:()=>void}){
 return <Pressable onPress={onPress} style={[s.pathItem,{borderColor:`${color}30`}]}><View style={[s.pathIcon,{backgroundColor:`${color}14`}]}><Ionicons name={icon} color={color} size={21}/></View><View style={s.pathCopy}><Text style={s.pathTitle}>{title}</Text><Text style={s.pathDetail}>{detail}</Text></View><Ionicons name="chevron-forward" color={color} size={17}/></Pressable>
}

const s=StyleSheet.create({
 header:{alignItems:'center',flexDirection:'row',justifyContent:'space-between',paddingTop:4},
 brand:{alignItems:'center',flexDirection:'row',gap:10},
 brandMark:{fontFamily:fonts.display,fontSize:29,textShadowColor:'rgba(255,255,255,.15)',textShadowRadius:12},
 brandName:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:19,letterSpacing:3.4},
 brandMeta:{color:colors.muted,fontFamily:fonts.sansStrong,fontSize:7,letterSpacing:1.5,marginTop:1},
 modePicker:{backgroundColor:'rgba(5,7,8,.72)',borderColor:colors.line,borderRadius:22,borderWidth:1,flexDirection:'row',gap:4,padding:5},
 modeChoice:{alignItems:'center',borderColor:'transparent',borderRadius:16,borderWidth:1,flex:1,gap:3,justifyContent:'center',minHeight:58,padding:4},
 modeChoiceText:{color:colors.muted,fontFamily:fonts.sansStrong,fontSize:8,textAlign:'center'},
 notify:{alignItems:'center',backgroundColor:'rgba(5,7,8,.7)',borderColor:colors.line,borderRadius:21,borderWidth:1,height:42,justifyContent:'center',position:'relative',width:42},
 notifyDot:{borderRadius:3,height:5,position:'absolute',right:6,top:6,width:5},
 sanctuary:{borderRadius:30,borderWidth:1,minHeight:610,overflow:'hidden',shadowColor:'#000',shadowOffset:{width:0,height:22},shadowOpacity:.42,shadowRadius:32,elevation:10},
 sanctuaryImage:{borderRadius:30},
 sanctuaryShade:{flex:1,minHeight:610,padding:spacing.lg},
 soundRow:{alignItems:'center',flexDirection:'row',justifyContent:'space-between'},
 eyebrow:{fontFamily:fonts.sansBold,fontSize:9,letterSpacing:1.8},
 sound:{alignItems:'center',backgroundColor:'rgba(5,7,8,.6)',borderRadius:19,borderWidth:1,height:38,justifyContent:'center',width:38},
 sanctuaryBody:{flex:1,justifyContent:'flex-end',paddingBottom:22},
 titleRow:{alignItems:'baseline',flexDirection:'row',gap:11},
 shenTitle:{color:colors.cream,fontFamily:fonts.displayRegular,fontSize:55,letterSpacing:-2.2,lineHeight:58,textShadowColor:'#000',textShadowOffset:{width:0,height:8},textShadowRadius:22},
 han:{fontFamily:fonts.display,fontSize:29,textShadowColor:'rgba(255,255,255,.18)',textShadowRadius:14},
 essence:{fontFamily:fonts.display,fontSize:18,letterSpacing:.2,marginBottom:8},
 prompt:{color:'rgba(245,240,232,.68)',fontFamily:fonts.sans,fontSize:12,lineHeight:19,maxWidth:330},
 tradition:{color:'rgba(245,240,232,.45)',fontFamily:fonts.sans,fontSize:9,lineHeight:14,marginTop:8},
 energyRow:{flexDirection:'row',justifyContent:'space-around',marginBottom:18},
 energyOrb:{alignItems:'center',backgroundColor:'rgba(5,7,8,.68)',borderRadius:36,borderWidth:1,height:72,justifyContent:'center',shadowColor:'#000',shadowOpacity:.26,shadowRadius:10,width:72},
 energyLabel:{color:colors.muted,fontFamily:fonts.display,fontSize:12},
 energyTerm:{color:colors.muted,fontFamily:fonts.sans,fontSize:7,opacity:.7},
 energyValue:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:21,lineHeight:23},
 percent:{fontFamily:fonts.sansMedium,fontSize:8},
 ritual:{alignItems:'center',backgroundColor:'rgba(5,7,8,.78)',borderRadius:19,borderWidth:1,flexDirection:'row',gap:11,padding:11},
 ritualIcon:{alignItems:'center',borderRadius:14,borderWidth:1,height:48,justifyContent:'center',width:48},
 ritualSymbol:{fontFamily:fonts.display,fontSize:22},
 ritualCopy:{flex:1,gap:2},
 ritualKicker:{fontFamily:fonts.sansBold,fontSize:7,letterSpacing:1.4},
 ritualTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:17},
 ritualMeta:{color:colors.muted,fontFamily:fonts.sans,fontSize:9},
 start:{alignItems:'center',borderRadius:14,height:46,justifyContent:'center',width:46},
 sectionHead:{alignItems:'flex-end',flexDirection:'row',justifyContent:'space-between',marginTop:4},
 sectionTitle:{color:colors.cream,fontFamily:fonts.display,fontSize:30,lineHeight:32},
 mode:{fontFamily:fonts.displayStrong,fontSize:14},
 path:{gap:9},
 pathItem:{alignItems:'center',backgroundColor:'rgba(11,15,17,.9)',borderRadius:19,borderWidth:1,flexDirection:'row',gap:12,minHeight:78,padding:12},
 pathIcon:{alignItems:'center',borderRadius:22,height:44,justifyContent:'center',width:44},
 pathCopy:{flex:1,gap:3},
 pathTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:17},
 pathDetail:{color:colors.muted,fontFamily:fonts.sans,fontSize:10},
 needCard:{backgroundColor:'rgba(11,15,17,.92)',borderRadius:radii.lg,borderWidth:1,gap:13,padding:spacing.lg},
 needTitle:{color:colors.cream,fontFamily:fonts.display,fontSize:25,lineHeight:28},
 needOptions:{flexDirection:'row',gap:7},
 needOption:{alignItems:'center',backgroundColor:'rgba(255,255,255,.025)',borderColor:colors.line,borderRadius:16,borderWidth:1,flex:1,gap:6,minHeight:72,justifyContent:'center',padding:6},
 needLabel:{color:colors.cream,fontFamily:fonts.sansMedium,fontSize:9,textAlign:'center'},
 quote:{fontFamily:fonts.display,fontSize:18,fontStyle:'italic',lineHeight:25,paddingHorizontal:20,textAlign:'center'},
 todayMeta:{color:colors.muted,fontFamily:fonts.sans,fontSize:9,letterSpacing:.8,textAlign:'center'},
});
