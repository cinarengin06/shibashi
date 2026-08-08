import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {useMemo,useState} from 'react';
import {ImageBackground,Pressable,StyleSheet,Text,View} from 'react-native';
import {Card,Eyebrow,ProgressBar,Screen,Title} from '../../components/ui';
import {colors,radii} from '../../constants/theme';
import {movements,practices} from '../../data/content';
import {getShen} from '../../data/fiveShen';
import {movementImages} from '../../data/movementAssets';
import {useApp} from '../../store/AppStore';
import {getGhostSequence} from '../../../../packages/shen-domain/ghost';

const filters=['Tümü','Rahatlama','Enerji','Denge','Nefes'] as const;
export default function Practice(){
 const{profile,sessions,postureReports,completedStories}=useApp();const shen=getShen(profile.selectedShenId);const[filter,setFilter]=useState<(typeof filters)[number]>('Tümü');
 const suggested=practices.find(x=>x.id===shen.practiceId&&x.movementIds.every(id=>Boolean(getGhostSequence(id))))??practices.find(x=>x.movementIds.every(id=>Boolean(getGhostSequence(id))))??practices[0];
 const visiblePractices=useMemo(()=>practices.filter(item=>filter==='Tümü'||item.focus===filter||(filter==='Nefes'&&item.movementIds.some(id=>movements.find(m=>m.id===id)?.focus==='Nefes'))),[filter]);
 return <Screen>
  <Eyebrow>PRATİK · ÖĞREN · HİZALAN</Eyebrow><Title>Bugün bedenin neye ihtiyaç duyuyor?</Title>
  <Pressable onPress={()=>router.push(`/practice-session?practiceId=${suggested.id}`)}><ImageBackground source={movementImages[movements.find(x=>x.id===suggested.movementIds[0])?.order??1]} style={p.suggestion} imageStyle={p.suggestionImage}><View style={p.shade}/><View style={p.suggestionTop}><View style={[p.shenSymbol,{backgroundColor:`${shen.color}22`,borderColor:shen.color}]}><Text style={{color:shen.color,fontSize:25}}>{shen.symbol}</Text></View><Text style={[p.shenLabel,{color:shen.color}]}>BUGÜN SANA İYİ GELECEK</Text></View><View><Text style={p.suggestionTitle}>{suggested.title}</Text><Text style={p.suggestionMeta}>{suggested.duration} dk · {suggested.movementIds.length} hareket · {suggested.focus}</Text><Text style={p.tradition}>Geleneksel karşılığı: {shen.name} Shen · {shen.label}</Text><View style={[p.play,{backgroundColor:shen.color}]}><Text style={p.playText}>Pratiğe başla</Text><Ionicons name="play" color={colors.ink} size={17}/></View></View></ImageBackground></Pressable>
  <View style={p.featureGrid}>
   <Pressable onPress={()=>router.push('/living-learning')} style={[p.feature,{borderColor:`${shen.color}55`}]}><View style={[p.featureIcon,{backgroundColor:`${shen.color}18`}]}><Ionicons name="sparkles-outline" color={shen.color} size={25}/></View><Text style={[p.featureLabel,{color:shen.color}]}>YAŞAYARAK ÖĞREN</Text><Text style={p.featureTitle}>Hikâyeyi yaşa</Text><Text style={p.featureMeta}>{Math.min(5,completedStories.length)}/5 sahne tamamlandı</Text><ProgressBar value={Math.min(100,completedStories.length/5*100)} color={shen.color}/></Pressable>
   <Pressable onPress={()=>router.push('/posture')} style={[p.feature,{borderColor:`${shen.color}55`}]}><View style={[p.featureIcon,{backgroundColor:`${shen.color}18`}]}><Ionicons name="scan-outline" color={shen.color} size={25}/></View><Text style={[p.featureLabel,{color:shen.color}]}>POSTÜR AYNASI</Text><Text style={p.featureTitle}>Beden çizgini gör</Text><Text style={p.featureMeta}>{postureReports.length?`Son gerçek ölçüm ${postureReports[0].score}`:'Henüz ölçülmedi · ilk taramanı başlat'}</Text>{postureReports[0]?<ProgressBar value={postureReports[0].score} color={shen.color}/>:null}</Pressable>
  </View>
  <View style={p.filters}>{filters.map(x=><Pressable key={x} onPress={()=>setFilter(x)} style={[p.chip,filter===x&&{backgroundColor:shen.color}]}><Text style={[p.chipText,filter===x&&{color:colors.ink}]}>{x}</Text></Pressable>)}</View>
  <Text style={p.section}>RUTİNLER</Text>
  {visiblePractices.length?visiblePractices.map(x=>{const done=sessions.some(s=>s.practiceId===x.id);const locked=Boolean(x.locked)||x.movementIds.some(id=>!getGhostSequence(id));return <Pressable key={x.id} disabled={locked} onPress={()=>router.push({pathname:'/practice-session',params:{practiceId:x.id}})}><Card style={[p.routine,locked&&{opacity:.45}]}><ImageBackground source={movementImages[movements.find(m=>m.id===x.movementIds[0])?.order??1]} style={p.cover} imageStyle={p.coverImage}><View style={p.coverShade}/><Ionicons name={locked?'lock-closed':done?'checkmark':'play'} color={colors.cream} size={22}/></ImageBackground><View style={{flex:1,gap:4}}><Text style={p.title}>{x.title}</Text><Text style={p.meta}>{x.duration} dk · {x.focus} · {x.movementIds.length} hareket</Text>{locked?<Text style={[p.doneText,{color:colors.gold}]}>KİLİTLİ · İLK 3 HAREKET HAZIR</Text>:done&&<Text style={[p.doneText,{color:shen.color}]}>TAMAMLANDI</Text>}</View><Ionicons name={locked?'lock-closed':'chevron-forward'} color={colors.muted} size={20}/></Card></Pressable>}) : <Card><Text style={p.meta}>Bu odakta henüz bir rutin yok. 18 temel hareketten seçim yapabilirsin.</Text></Card>}
  <View style={p.sectionRow}><Text style={p.section}>18 TEMEL HAREKET</Text><Text style={[p.completed,{color:shen.color}]}>{new Set(sessions.map(s=>s.practiceId)).size} tamamlandı</Text></View>
  {movements.map(x=>{const locked=!getGhostSequence(x.id);return <Pressable key={x.id} disabled={locked} onPress={()=>router.push({pathname:'/movement/[id]',params:{id:x.id}})}><View style={[p.movement,locked&&{opacity:.48}]}><ImageBackground source={movementImages[x.order]} style={p.movementImage} imageStyle={p.movementImageRadius}><View style={p.coverShade}/><Text style={p.order}>{String(x.order).padStart(2,'0')}</Text></ImageBackground><View style={{flex:1}}><Text style={p.title}>{x.name}</Text><Text style={p.meta}>{x.focus} · {x.duration} dk · Aşama {x.gate}</Text>{locked&&<Text style={[p.doneText,{color:colors.gold}]}>KİLİTLİ</Text>}</View><Ionicons name={locked?'lock-closed':'play-circle-outline'} color={locked?colors.muted:shen.color} size={25}/></View></Pressable>})}
 </Screen>;
}
const p=StyleSheet.create({
 suggestion:{height:278,borderRadius:radii.lg,overflow:'hidden',padding:17,justifyContent:'space-between',borderWidth:1,borderColor:'rgba(243,235,221,.14)',shadowColor:'#000',shadowOpacity:.25,shadowRadius:18,shadowOffset:{width:0,height:10},elevation:5},
 suggestionImage:{borderRadius:radii.lg},
 shade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,13,11,.38)'},
 suggestionTop:{flexDirection:'row',alignItems:'center',gap:9},
 shenSymbol:{width:50,height:50,borderRadius:25,borderWidth:1,alignItems:'center',justifyContent:'center'},
 shenLabel:{fontSize:16,fontWeight:'900',letterSpacing:1.2},
 suggestionTitle:{color:colors.cream,fontSize:27,fontWeight:'800',letterSpacing:-.5},
 suggestionMeta:{color:colors.muted,fontSize:17,marginTop:5},
 tradition:{color:'rgba(245,240,232,.62)',fontSize:16,lineHeight:25,marginTop:6},
 play:{height:46,borderRadius:radii.pill,alignSelf:'flex-start',paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:8,marginTop:13,shadowColor:'#000',shadowOpacity:.2,shadowRadius:10,shadowOffset:{width:0,height:6},elevation:3},
 playText:{color:colors.ink,fontSize:16,fontWeight:'900'},
 featureGrid:{flexDirection:'row',gap:9},
 feature:{flex:1,minHeight:196,borderRadius:radii.md,backgroundColor:colors.surface,padding:13,borderWidth:1,gap:7,shadowColor:'#000',shadowOpacity:.14,shadowRadius:12,shadowOffset:{width:0,height:7},elevation:3},
 featureIcon:{width:47,height:47,borderRadius:24,alignItems:'center',justifyContent:'center'},
 featureLabel:{fontSize:17,fontWeight:'900',letterSpacing:1},
 featureTitle:{color:colors.cream,fontSize:17,fontWeight:'800',lineHeight:25},
 featureMeta:{color:colors.muted,fontSize:16,lineHeight:25,flex:1},
 filters:{flexDirection:'row',gap:8,flexWrap:'wrap'},
 chip:{paddingHorizontal:15,height:42,justifyContent:'center',borderRadius:radii.pill,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line},
 chipText:{color:colors.cream,fontSize:16,fontWeight:'700'},
 section:{color:colors.gold,fontSize:16,fontWeight:'900',letterSpacing:1.5,marginTop:8},
 sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 completed:{fontSize:16,fontWeight:'800'},
 routine:{flexDirection:'row',alignItems:'center',gap:13},
 cover:{width:64,height:64,borderRadius:16,overflow:'hidden',alignItems:'center',justifyContent:'center'},
 coverImage:{borderRadius:16},
 coverShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,13,11,.35)'},
 title:{color:colors.cream,fontWeight:'800',fontSize:17},
 meta:{color:colors.muted,fontSize:17,lineHeight:27},
 doneText:{fontSize:17,fontWeight:'900',letterSpacing:1},
 movement:{minHeight:78,flexDirection:'row',alignItems:'center',gap:13,borderBottomWidth:1,borderColor:colors.line},
 movementImage:{width:54,height:54,borderRadius:14,overflow:'hidden',alignItems:'center',justifyContent:'center'},
 movementImageRadius:{borderRadius:14},
 order:{color:colors.cream,fontSize:17,fontWeight:'900'},
});
