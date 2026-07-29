import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';
import {router} from 'expo-router';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {Screen,ShenBackdrop} from '../../components/ui';
import {colors,fonts,radii,spacing} from '../../constants/theme';
import {practices} from '../../data/content';
import {getShen} from '../../data/fiveShen';
import {useApp} from '../../store/AppStore';
import {useShenExperience} from '../../store/ShenExperience';

const everydayModes=[
 {id:'hun' as const,label:'Hun',icon:'leaf-outline' as const},
 {id:'shen' as const,label:'Xin',icon:'heart-outline' as const},
 {id:'yi' as const,label:'Yi',icon:'ellipse-outline' as const},
 {id:'po' as const,label:'Po',icon:'moon-outline' as const},
 {id:'zhi' as const,label:'Zhi',icon:'water-outline' as const},
];

export default function Today(){
 const{profile,saveProfile,sessions,postureReports,completedStories}=useApp();
 const{playing,toggleSound}=useShenExperience();
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

  <View style={s.modePicker}>{everydayModes.map(item=>{const active=item.id===shen.id;return <Pressable key={item.id} onPress={()=>chooseShen(item.id)} style={[s.modeChoice,active&&{backgroundColor:`${shen.color}18`}]}><Ionicons name={item.icon} color={active?colors.cream:colors.muted} size={15}/><Text style={[s.modeChoiceText,active&&s.modeChoiceTextActive]}>{item.label}</Text>{active?<View style={s.modeUnderline}/>:null}</Pressable>})}</View>

  <View style={[s.sanctuary,{borderColor:`${shen.color}42`}]}>
   <ShenBackdrop borderRadius={24}/>
   <LinearGradient colors={['rgba(7,16,13,.20)','rgba(7,16,13,.48)','rgba(7,16,13,.98)']} locations={[0,.42,1]} style={s.sanctuaryShade}>
    <View style={s.soundRow}>
     <Text style={[s.eyebrow,{color:shen.color}]}>{shen.name.toUpperCase()} · {shen.element.split('•')[0].trim().toUpperCase()}</Text>
     <Pressable onPress={toggleSound} style={s.sound}><Ionicons name={playing?'pause':'musical-notes-outline'} color={colors.gold} size={15}/></Pressable>
    </View>
    <View style={s.sanctuaryBody}>
     <View style={s.titleRow}><Text style={s.shenTitle}>{shen.dailyName}</Text><Text style={[s.han,{color:shen.color}]}>{shen.symbol}</Text></View>
     <Text style={s.essence}>{shen.label}</Text>
     <Text style={s.prompt}>{shen.dailyPrompt}</Text>
    </View>

    <View style={s.balanceCard}>
     <Text style={s.balanceTitle}>İçsel Denge</Text>
     {energy.map(item=><View key={item.label} style={s.balanceMetric}><View style={s.balanceLabel}><Text style={s.energyLabel}>{item.label}</Text><Text style={s.energyTerm}>{item.term}</Text></View><View style={s.balanceTrack}><View style={[s.balanceFill,{backgroundColor:shen.color,width:`${item.value}%`}]} /></View><Text style={s.energyValue}>{item.value}%</Text></View>)}
    </View>

    <View style={s.ritual}>
     <View style={s.ritualCopy}><Text style={s.ritualKicker}>BUGÜNÜN AKIŞI</Text><Text style={s.ritualTitle}>{practice.title}</Text><Text style={s.ritualMeta}>{practice.movementIds.length} hareket · {practice.duration} dakika</Text></View>
     <Pressable onPress={()=>{void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);router.push(`/practice-session?practiceId=${practice.id}`)}} style={s.start}><Text style={s.startText}>Günün Pratiğine Başla</Text><Ionicons name="arrow-forward" color={colors.gold} size={17}/></Pressable>
    </View>
   </LinearGradient>
  </View>

  <View style={s.sectionHead}><View><Text style={[s.eyebrow,{color:shen.color}]}>İÇSEL HARİTAN</Text><Text style={s.sectionTitle}>Bugünün dengesi</Text></View><Text style={[s.mode,{color:shen.color}]}>{shen.dailyName}</Text></View>

  <View style={s.path}>
   <PathItem icon="sparkles-outline" title="Yaşayarak Öğren" detail={`${completedStories.length}/18 hikâye · gündelik sahneler`} color={shen.color} onPress={()=>router.push('/living-learning')}/>
   <PathItem icon="scan-outline" title="Postür Aynası" detail={postureReports.length?`${postureReports.length} analiz · son skor ${postureReports[0].score}`:'İlk üç açılı taramanı al'} color={shen.color} onPress={()=>router.push('/posture')}/>
   <PathItem icon="chatbubble-ellipses-outline" title="Yaşam Rehberleri" detail="İhtiyacına göre sekiz farklı rehberle konuş" color={shen.color} onPress={()=>router.push('/coaches')}/>
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
 modePicker:{backgroundColor:colors.surface,borderColor:colors.line,borderRadius:18,borderWidth:1,flexDirection:'row',gap:2,padding:5},
 modeChoice:{alignItems:'center',borderRadius:13,flex:1,gap:3,justifyContent:'center',minHeight:54,padding:4,position:'relative'},
 modeChoiceText:{color:colors.muted,fontFamily:fonts.sansMedium,fontSize:9,textAlign:'center'},
 modeChoiceTextActive:{color:colors.cream},
 modeUnderline:{backgroundColor:colors.gold,borderRadius:2,bottom:2,height:2,left:'28%',position:'absolute',right:'28%'},
 notify:{alignItems:'center',backgroundColor:'rgba(5,7,8,.7)',borderColor:colors.line,borderRadius:21,borderWidth:1,height:42,justifyContent:'center',position:'relative',width:42},
 notifyDot:{borderRadius:3,height:5,position:'absolute',right:6,top:6,width:5},
 sanctuary:{borderColor:colors.line,borderRadius:24,borderWidth:1,minHeight:650,overflow:'hidden',shadowColor:'#000',shadowOffset:{width:0,height:20},shadowOpacity:.28,shadowRadius:28,elevation:8},
 sanctuaryImage:{borderRadius:24},
 sanctuaryShade:{flex:1,minHeight:650,padding:spacing.lg},
 soundRow:{alignItems:'center',flexDirection:'row',justifyContent:'space-between'},
 eyebrow:{fontFamily:fonts.sansBold,fontSize:9,letterSpacing:1.8},
 sound:{alignItems:'center',backgroundColor:'rgba(7,16,13,.74)',borderColor:colors.line,borderRadius:18,borderWidth:1,height:36,justifyContent:'center',width:36},
 sanctuaryBody:{flex:1,justifyContent:'flex-end',paddingBottom:18},
 titleRow:{alignItems:'baseline',flexDirection:'row',gap:11},
 shenTitle:{color:colors.cream,fontFamily:fonts.displayRegular,fontSize:43,letterSpacing:-1.1,lineHeight:46},
 han:{borderColor:'rgba(198,165,106,.45)',borderRadius:8,borderWidth:1,color:colors.gold,fontFamily:fonts.display,fontSize:16,lineHeight:30,textAlign:'center',width:30},
 essence:{color:colors.cream,fontFamily:fonts.sansMedium,fontSize:16,letterSpacing:-.2,marginBottom:9},
 prompt:{color:colors.muted,fontFamily:fonts.sans,fontSize:13,lineHeight:20,maxWidth:330},
 tradition:{color:colors.muted,fontFamily:fonts.sans,fontSize:9,lineHeight:14,marginTop:8},
 balanceCard:{backgroundColor:'rgba(7,16,13,.90)',borderColor:colors.line,borderRadius:18,borderWidth:1,gap:8,marginBottom:12,padding:14},
 balanceTitle:{color:colors.cream,fontFamily:fonts.sansStrong,fontSize:11},
 balanceMetric:{alignItems:'center',flexDirection:'row',gap:10},
 balanceLabel:{width:54},
 balanceTrack:{backgroundColor:'rgba(241,238,229,.09)',borderRadius:3,flex:1,height:4,overflow:'hidden'},
 balanceFill:{borderRadius:3,height:'100%'},
 energyLabel:{color:colors.cream,fontFamily:fonts.sansMedium,fontSize:9},
 energyTerm:{color:colors.muted,fontFamily:fonts.sans,fontSize:7},
 energyValue:{color:colors.cream,fontFamily:fonts.sansMedium,fontSize:10,textAlign:'right',width:31},
 percent:{fontFamily:fonts.sansMedium,fontSize:8},
 ritual:{alignItems:'center',backgroundColor:'rgba(7,16,13,.94)',borderColor:colors.line,borderRadius:18,borderWidth:1,flexDirection:'row',gap:11,padding:12},
 ritualIcon:{alignItems:'center',borderRadius:14,borderWidth:1,height:48,justifyContent:'center',width:48},
 ritualSymbol:{fontFamily:fonts.display,fontSize:22},
 ritualCopy:{flex:1,gap:2},
 ritualKicker:{color:colors.muted,fontFamily:fonts.sansStrong,fontSize:7,letterSpacing:1.1},
 ritualTitle:{color:colors.cream,fontFamily:fonts.sansStrong,fontSize:14},
 ritualMeta:{color:colors.muted,fontFamily:fonts.sans,fontSize:9},
 start:{alignItems:'center',borderColor:colors.gold,borderRadius:999,borderWidth:1,flexDirection:'row',gap:6,justifyContent:'center',minHeight:44,paddingHorizontal:13},
 startText:{color:colors.cream,fontFamily:fonts.sansStrong,fontSize:9},
 sectionHead:{alignItems:'flex-end',flexDirection:'row',justifyContent:'space-between',marginTop:4},
 sectionTitle:{color:colors.cream,fontFamily:fonts.display,fontSize:30,lineHeight:32},
 mode:{fontFamily:fonts.displayStrong,fontSize:14},
 path:{gap:9},
 pathItem:{alignItems:'center',backgroundColor:colors.surface,borderRadius:19,borderWidth:1,flexDirection:'row',gap:12,minHeight:78,padding:12},
 pathIcon:{alignItems:'center',borderRadius:22,height:44,justifyContent:'center',width:44},
 pathCopy:{flex:1,gap:3},
 pathTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:17},
 pathDetail:{color:colors.muted,fontFamily:fonts.sans,fontSize:10},
 needCard:{backgroundColor:colors.surface,borderRadius:22,borderWidth:1,gap:13,padding:spacing.lg},
 needTitle:{color:colors.cream,fontFamily:fonts.display,fontSize:25,lineHeight:28},
 needOptions:{flexDirection:'row',gap:7},
 needOption:{alignItems:'center',backgroundColor:'rgba(255,255,255,.025)',borderColor:colors.line,borderRadius:16,borderWidth:1,flex:1,gap:6,minHeight:72,justifyContent:'center',padding:6},
 needLabel:{color:colors.cream,fontFamily:fonts.sansMedium,fontSize:9,textAlign:'center'},
 quote:{fontFamily:fonts.display,fontSize:18,fontStyle:'italic',lineHeight:25,paddingHorizontal:20,textAlign:'center'},
 todayMeta:{color:colors.muted,fontFamily:fonts.sans,fontSize:9,letterSpacing:.8,textAlign:'center'},
});
