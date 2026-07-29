import {Ionicons} from '@expo/vector-icons';
import {router,useLocalSearchParams} from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import {ImageBackground,StyleSheet,Text,View} from 'react-native';
import {Card,Eyebrow,PrimaryButton,Screen,Section,Title} from '../../components/ui';
import {colors,radii,spacing} from '../../constants/theme';
import {practices} from '../../data/content';
import {getShen} from '../../data/fiveShen';
import {shenBackgrounds} from '../../data/shenAssets';
import {useApp} from '../../store/AppStore';
import {ShenId} from '../../types';

export default function ShenDetail(){
 const{id}=useLocalSearchParams<{id:string}>();const{profile,saveProfile}=useApp();const shen=getShen(id as ShenId);const active=profile.selectedShenId===shen.id;const practice=practices.find(x=>x.id===shen.practiceId)??practices[0];
 return <Screen>
  <ImageBackground source={shenBackgrounds[shen.id]} style={s.hero} imageStyle={s.heroImage}><LinearGradient colors={['rgba(5,18,15,.12)','rgba(5,18,15,.94)']} style={s.heroOverlay}><Text style={[s.symbol,{color:shen.color}]}>{shen.symbol}</Text><Eyebrow>GÜNLÜK MOD · {shen.dailyName}</Eyebrow><Title>{shen.label}</Title><Text style={s.heroText}>{shen.hero}</Text><Text style={[s.tradition,{color:shen.color}]}>Shibashi geleneğinde bu yaklaşım {shen.name} Shen olarak anılır · {shen.element}</Text><View style={[s.valueBadge,{borderColor:shen.color}]}><Text style={[s.value,{color:shen.color}]}>{shen.value}</Text><Text style={s.valueLabel}>BUGÜNKÜ DENGE</Text></View></LinearGradient></ImageBackground>
  {!active&&<PrimaryButton label={`${shen.dailyName}'na geç`} icon="sparkles" onPress={()=>saveProfile({selectedShenId:shen.id})}/>}
  {active&&<View style={s.active}><Ionicons name="checkmark-circle" color={shen.color} size={20}/><Text style={[s.activeText,{color:shen.color}]}>Bugünkü aktif modun</Text></View>}
  <Section title="Bugün sana nasıl yardımcı olur?"><Card style={{gap:10}}><Text style={s.body}>{shen.dailyPrompt}</Text><View style={s.line}/><Text style={[s.taskLabel,{color:shen.color}]}>KÜÇÜK BİR ADIM</Text><Text style={s.task}>{shen.task}</Text></Card></Section>
  <Section title="Bedende nerede hissedilir?"><Card style={s.map}><View style={[s.mapIcon,{backgroundColor:`${shen.color}18`}]}><Ionicons name="body-outline" color={shen.color} size={28}/></View><View style={{flex:1,gap:4}}><Text style={s.mapTitle}>{shen.bodyMap}</Text><Text style={s.muted}>Geleneksel beden karşılığı: {shen.organ}</Text></View></Card></Section>
  <Section title="Geleneksel hikâyesi"><Card style={{gap:9}}><Text style={[s.mapTitle,{color:shen.color}]}>{shen.mapTitle}</Text><Text style={s.body}>{shen.world}</Text><Text style={s.muted}>{shen.essence} · {shen.baguaText}</Text></Card></Section>
  <Section title="Sana uygun pratik"><Card style={s.practice}><View style={{flex:1,gap:4}}><Text style={s.mapTitle}>{practice.title}</Text><Text style={s.muted}>{practice.duration} dakika · {practice.movementIds.length} hareket · {shen.name} yaklaşımı</Text></View><Ionicons name="play-circle" color={shen.color} size={34}/></Card></Section>
  <PrimaryButton label="Önerilen pratiği başlat" icon="play" onPress={()=>router.push(`/practice-session?practiceId=${practice.id}`)}/>
 </Screen>
}
const s=StyleSheet.create({hero:{borderRadius:radii.lg,minHeight:330,overflow:'hidden'},heroImage:{borderRadius:radii.lg},heroOverlay:{flex:1,padding:spacing.lg,gap:11,minHeight:330,justifyContent:'flex-end'},symbol:{position:'absolute',right:20,top:18,fontSize:92,opacity:.8},heroText:{color:colors.cream,fontSize:16,lineHeight:24,opacity:.9},tradition:{fontSize:11,lineHeight:17,fontWeight:'700'},valueBadge:{alignSelf:'flex-start',borderWidth:1,borderRadius:radii.pill,paddingHorizontal:13,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:8},value:{fontSize:20,fontWeight:'900'},valueLabel:{color:colors.muted,fontSize:9,fontWeight:'800',letterSpacing:1},active:{height:46,borderRadius:23,backgroundColor:colors.surface,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},activeText:{fontWeight:'800'},body:{color:colors.cream,fontSize:15,lineHeight:23},line:{height:1,backgroundColor:colors.line},taskLabel:{fontSize:9,fontWeight:'900',letterSpacing:1.3},task:{color:colors.cream,fontSize:17,lineHeight:24,fontWeight:'600'},map:{flexDirection:'row',alignItems:'center',gap:13},mapIcon:{width:54,height:54,borderRadius:27,alignItems:'center',justifyContent:'center'},mapTitle:{color:colors.cream,fontSize:16,fontWeight:'700'},muted:{color:colors.muted,fontSize:13,lineHeight:19},practice:{flexDirection:'row',alignItems:'center'}});
