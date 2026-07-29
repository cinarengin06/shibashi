import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {Card,Eyebrow,PrimaryButton,ProgressBar,Screen,Section,Title} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {getShen} from '../data/fiveShen';
import {useApp} from '../store/AppStore';

const bodyImage=require('../assets/journey/inner-body-walk-3d.png');
export default function Posture(){
 const{profile,postureReports}=useApp();const shen=getShen(profile.selectedShenId);const latest=postureReports[0];
 return <Screen>
  <Pressable onPress={()=>router.back()} style={p.back}><Ionicons name="arrow-back" color={colors.cream} size={20}/><Text style={p.backText}>Geri</Text></Pressable>
  <Eyebrow>POSTÜR AYNASI · {shen.name}</Eyebrow><Title>Beden çizgini üç açıdan gör.</Title>
  <Text style={p.lead}>Ön, yan ve arka görünümden kısa bir tarama al. Omuz, omurga, kalça ve denge çizgilerin tek raporda birleşsin.</Text>
  <Card style={[p.hero,{borderColor:`${shen.color}55`}]}>
   <View style={p.heroCopy}><Text style={[p.label,{color:shen.color}]}>3 AŞAMALI TARAMA</Text><Text style={p.heroTitle}>60 saniyelik beden aynası</Text><Text style={p.small}>Görüntüler cihazında kalır. İlk sürümde skor motoru simüle edilir; servis gerçek pose modeline hazırdır.</Text></View>
   <View style={[p.bodyFrame,{borderColor:shen.color}]}><Image source={bodyImage} resizeMode="cover" style={StyleSheet.absoluteFillObject}/></View>
  </Card>
  <View style={p.stages}>{[['body-outline','Ön','Omuz ve kalça'],['accessibility-outline','Yan','Baş ve omurga'],['scan-outline','Arka','Sağ-sol denge']].map(([icon,title,copy],index)=><View key={title} style={p.stage}><View style={[p.stageIcon,{borderColor:`${shen.color}66`}]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} color={shen.color} size={20}/></View><Text style={p.stageNo}>0{index+1}</Text><Text style={p.stageTitle}>{title}</Text><Text style={p.stageCopy}>{copy}</Text></View>)}</View>
  <PrimaryButton label="Yeni postür analizi" icon="scan" onPress={()=>router.push('/posture-session')}/>
  {latest&&<Section title="Son analiz"><Card style={p.report}><View style={[p.scoreRing,{borderColor:shen.color}]}><Text style={[p.score,{color:shen.color}]}>{latest.score}</Text><Text style={p.scoreLabel}>GENEL</Text></View><View style={{flex:1,gap:8}}><Text style={p.reportTitle}>{latest.summary}</Text><Text style={p.small}>{new Date(latest.date).toLocaleDateString('tr-TR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</Text><ProgressBar value={latest.score} color={shen.color}/><Text style={[p.signal,{color:shen.color}]}>{latest.asymmetrySignal}</Text></View></Card></Section>}
  <Section title="Geçmiş analizler">{postureReports.length===0?<Card><Text style={p.small}>İlk üç açılı taraman tamamlandığında raporların burada birikecek.</Text></Card>:postureReports.slice(0,6).map(report=><Card key={report.id} style={p.history}><View><Text style={[p.historyScore,{color:shen.color}]}>{report.score}</Text><Text style={p.scoreLabel}>PUAN</Text></View><View style={{flex:1}}><Text style={p.reportTitle}>{report.summary}</Text><Text style={p.small}>{new Date(report.date).toLocaleDateString('tr-TR')}</Text></View><Ionicons name="checkmark-circle" color={shen.color} size={22}/></Card>)}</Section>
 </Screen>;
}
const p=StyleSheet.create({back:{height:42,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:7},backText:{color:colors.muted,fontSize:13,fontWeight:'700'},lead:{color:colors.muted,fontSize:15,lineHeight:23,marginTop:-12},hero:{height:235,maxHeight:235,minHeight:235,flexDirection:'row',alignItems:'stretch',gap:12,overflow:'hidden'},heroCopy:{flex:1,justifyContent:'center',gap:10,minWidth:0},label:{fontSize:9,fontWeight:'900',letterSpacing:1.3},heroTitle:{color:colors.cream,fontSize:21,fontWeight:'800',lineHeight:27},small:{color:colors.muted,fontSize:12,lineHeight:18},bodyFrame:{alignSelf:'center',width:112,height:203,borderRadius:56,borderWidth:1,overflow:'hidden',backgroundColor:colors.deep,position:'relative'},bodyImage:{width:'100%',height:'100%',opacity:.86},stages:{flexDirection:'row',gap:7},stage:{flex:1,minHeight:132,borderRadius:radii.md,backgroundColor:colors.surface,padding:10,borderWidth:1,borderColor:colors.line},stageIcon:{width:35,height:35,borderRadius:18,borderWidth:1,alignItems:'center',justifyContent:'center'},stageNo:{color:colors.gold,fontSize:9,fontWeight:'900',marginTop:10},stageTitle:{color:colors.cream,fontSize:14,fontWeight:'800',marginTop:2},stageCopy:{color:colors.muted,fontSize:9,lineHeight:13,marginTop:3},report:{flexDirection:'row',alignItems:'center',gap:14},scoreRing:{width:78,height:78,borderRadius:39,borderWidth:3,alignItems:'center',justifyContent:'center'},score:{fontSize:25,fontWeight:'900'},scoreLabel:{color:colors.muted,fontSize:8,fontWeight:'900',letterSpacing:1},reportTitle:{color:colors.cream,fontSize:14,fontWeight:'800'},signal:{fontSize:11,fontWeight:'800'},history:{flexDirection:'row',alignItems:'center',gap:13},historyScore:{fontSize:25,fontWeight:'900'}});
