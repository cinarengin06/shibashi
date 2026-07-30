import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {useState} from 'react';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {Card,Eyebrow,PrimaryButton,ProgressBar,Screen,Section,Title} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {getShen} from '../data/fiveShen';
import {useApp} from '../store/AppStore';
import {PostureCapture,PostureReport,PostureView} from '../types';

const bodyImage=require('../assets/posture/posture-back-translucent.png');
const viewLabels:Record<PostureView,string>={front:'Ön',side:'Yan',back:'Arka'};

export default function Posture(){
 const{profile,postureReports}=useApp();
 const shen=getShen(profile.selectedShenId);
 const[openedReport,setOpenedReport]=useState<PostureReport|null>(null);

 if(openedReport)return <ReportDetail report={openedReport} shen={shen} onBack={()=>setOpenedReport(null)}/>;

 const latest=postureReports[0];
 return <Screen>
  <Pressable onPress={()=>router.back()} style={p.back}><Ionicons name="arrow-back" color={colors.cream} size={20}/><Text style={p.backText}>Geri</Text></Pressable>
  <Eyebrow>POSTÜR AYNASI · {shen.name}</Eyebrow><Title>Beden çizgini üç açıdan gör.</Title>
  <Text style={p.lead}>Ön, yan ve arka görünümden kısa bir tarama al. Omuz, omurga, kalça ve denge çizgilerin tek raporda birleşsin.</Text>
  <Card style={[p.hero,{borderColor:`${shen.color}55`}]}>
   <View style={p.heroCopy}><Text style={[p.label,{color:shen.color}]}>3 AŞAMALI TARAMA</Text><Text style={p.heroTitle}>15 saniyelik beden aynası</Text><Text style={p.small}>Önden, yandan ve arkadan beşer saniyelik kısa ölçüm. Görüntüler cihazında kalır.</Text></View>
   <BodyPreview color={shen.color}/>
  </Card>
  <View style={p.stages}>{[['body-outline','Ön','Omuz ve kalça'],['accessibility-outline','Yan','Baş ve omurga'],['scan-outline','Arka','Sağ-sol denge']].map(([icon,title,copy],index)=><View key={title} style={p.stage}><View style={[p.stageIcon,{borderColor:`${shen.color}66`}]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} color={shen.color} size={20}/></View><Text style={p.stageNo}>0{index+1}</Text><Text style={p.stageTitle}>{title}</Text><Text style={p.stageCopy}>{copy}</Text></View>)}</View>
  <PrimaryButton label="Yeni postür analizi" icon="scan" onPress={()=>router.push('/posture-session')}/>
  {latest&&<Section title="Son analiz"><Pressable accessibilityRole="button" onPress={()=>setOpenedReport(latest)}><Card style={p.report}><View style={[p.scoreRing,{borderColor:shen.color}]}><Text style={[p.score,{color:shen.color}]}>{latest.score}</Text><Text style={p.scoreLabel}>GENEL</Text></View><View style={{flex:1,gap:8}}><Text style={p.reportTitle}>{latest.summary}</Text><Text style={p.small}>{new Date(latest.date).toLocaleDateString('tr-TR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</Text><ProgressBar value={latest.score} color={shen.color}/><Text style={[p.signal,{color:shen.color}]}>{latest.asymmetrySignal}</Text></View><Ionicons name="chevron-forward" color={shen.color} size={20}/></Card></Pressable></Section>}
  <Section title="Geçmiş analizler">{postureReports.length===0?<Card><Text style={p.small}>İlk üç açılı taraman tamamlandığında raporların burada birikecek.</Text></Card>:postureReports.slice(0,6).map(report=><Pressable accessibilityRole="button" key={report.id} onPress={()=>setOpenedReport(report)}><Card style={p.history}><View><Text style={[p.historyScore,{color:shen.color}]}>{report.score}</Text><Text style={p.scoreLabel}>PUAN</Text></View><View style={{flex:1}}><Text style={p.reportTitle}>{report.summary}</Text><Text style={p.small}>{new Date(report.date).toLocaleDateString('tr-TR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</Text><Text style={[p.openHint,{color:shen.color}]}>Sonuçları gör</Text></View><Ionicons name="chevron-forward-circle" color={shen.color} size={23}/></Card></Pressable>)}</Section>
 </Screen>;
}

function BodyPreview({color}:{color:string}){
 return <View style={[p.bodyFrame,{borderColor:color}]}><Image source={bodyImage} resizeMode="contain" style={p.bodyImage}/><View style={p.previewAxis}/>{[[50,10,'good'],[37,26,'warn'],[63,26,'warn'],[42,47,'good'],[58,47,'good'],[44,68,'good'],[56,68,'good'],[44,90,'good'],[56,90,'good']].map(([left,top,tone],i)=><View key={i} style={[p.previewJoint,{left:`${Number(left)}%` as `${number}%`,top:`${Number(top)}%` as `${number}%`},tone==='warn'?p.previewJointWarn:p.previewJointGood]}/>)}</View>;
}

function ReportDetail({report,shen,onBack}:{report:PostureReport;shen:ReturnType<typeof getShen>;onBack:()=>void}){
 const[activeView,setActiveView]=useState<PostureView>('front');
 const capture=report.captures.find(item=>item.view===activeView)??report.captures[0];
 if(!capture)return null;
 const metrics=getCaptureMetrics(capture);
 return <Screen>
  <Pressable onPress={onBack} style={p.back}><Ionicons name="arrow-back" color={colors.cream} size={20}/><Text style={p.backText}>Geçmişe dön</Text></Pressable>
  <View style={p.detailHeading}><View><Eyebrow>KAYITLI SONUÇ · {new Date(report.date).toLocaleDateString('tr-TR')}</Eyebrow><Title>Postür Analizi</Title><Text style={p.detailSubtitle}>Üç açıdan ölçümün ve beden çizgilerin.</Text></View><View style={[p.liveBadge,{borderColor:`${shen.color}70`}]}><View style={[p.liveBadgeDot,{backgroundColor:shen.color}]}/><Text style={[p.liveBadgeText,{color:shen.color}]}>GERÇEK ÖLÇÜM</Text></View></View>
  <View style={p.detailTabs}>{(['front','side','back'] as PostureView[]).map(item=><Pressable accessibilityRole="button" key={item} onPress={()=>setActiveView(item)} style={[p.detailTab,activeView===item&&{borderColor:shen.color,backgroundColor:`${shen.color}18`}]}><Text style={[p.detailTabText,activeView===item&&{color:shen.color}]}>{viewLabels[item]}</Text><Text style={p.detailTabMeta}>{report.captures.find(value=>value.view===item)?.score??'—'}</Text></Pressable>)}</View>
  <Card style={[p.detailVisualCard,{borderColor:`${shen.color}55`}]}> <View style={p.detailVisual}><Image source={bodyImage} resizeMode="contain" style={p.detailBodyImage}/><View style={[p.detailAxis,{backgroundColor:shen.color}]}/>{[[50,15],[38,29],[62,29],[50,46],[43,67],[57,67],[43,89],[57,89]].map(([left,top],index)=><View key={index} style={[p.detailJoint,{left:`${left}%` as `${number}%`,top:`${top}%` as `${number}%`,backgroundColor:index===1||index===2?colors.gold:shen.color}]}/>)}</View><View style={p.detailVisualCopy}><Text style={[p.detailViewEyebrow,{color:shen.color}]}>{viewLabels[activeView]} GÖRÜNÜM</Text><Text style={p.detailVisualTitle}>{capture.feedback}</Text><Text style={p.small}>33 nokta · {capture.sampleCount??1} geçerli kare · güven %{Math.round((capture.confidence??0)*100)}</Text></View></Card>
  <Card style={p.overallCard}><View style={p.overallScore}><Text style={[p.overallValue,{color:shen.color}]}>{report.score}</Text><Text style={p.overallSlash}>/100</Text><Text style={[p.overallState,{color:shen.color}]}>{report.score>=82?'İyi':report.score>=68?'Orta':'Geliştir'}</Text></View><View style={p.overallCopy}><Text style={p.detailSectionTitle}>GENEL SKOR</Text><Text style={p.reportTitle}>{report.summary}</Text><Text style={p.small}>{report.asymmetrySignal}.</Text></View></Card>
  <Section title="Detaylı analiz">{metrics.map(metric=><MetricRow key={metric.label} metric={metric} color={shen.color}/>)}</Section>
  <Card style={p.noteCard}><Ionicons name="sparkles-outline" color={shen.color} size={21}/><View style={{flex:1,gap:5}}><Text style={[p.detailSectionTitle,{color:shen.color}]}>KİŞİSEL NOT</Text><Text style={p.noteText}>Bir sonraki pratiğinde omuzlarını yumuşat, dizlerini kilitleme ve nefesini bedeninin ortasına bırak.</Text></View></Card>
 </Screen>;
}

type CaptureMetric={label:string;value:number;detail:string};
function getCaptureMetrics(capture:PostureCapture):CaptureMetric[]{
 const measurement=capture.measurements??{};
 return [
  {label:'Omurga ekseni',value:capture.axisScore,detail:typeof measurement.axisTiltDegrees==='number'?`${measurement.axisTiltDegrees.toFixed(1)}° sapma`:'Merkez hattı'},
  {label:'Omuz hizası',value:capture.shoulderScore,detail:typeof measurement.shoulderTiltDegrees==='number'?`${measurement.shoulderTiltDegrees.toFixed(1)}° eğim`:'Sağ-sol çizgi'},
  {label:'Kalça hizası',value:capture.hipScore,detail:typeof measurement.hipTiltDegrees==='number'?`${measurement.hipTiltDegrees.toFixed(1)}° eğim`:'Pelvis dengesi'},
  {label:'Denge dağılımı',value:Math.round((capture.axisScore+capture.hipScore)/2),detail:'Beden ağırlığı'},
 ];
}

function MetricRow({metric,color}:{metric:CaptureMetric;color:string}){
 const tone=metric.value>=82?colors.jade:metric.value>=68?colors.gold:colors.danger;
 return <View style={p.metricRow}><View style={[p.metricIcon,{borderColor:`${color}45`}]}><Ionicons name="analytics-outline" color={tone} size={17}/></View><View style={{flex:1,gap:5}}><View style={p.metricTop}><Text style={p.metricName}>{metric.label}</Text><Text style={[p.metricValue,{color:tone}]}>{metric.value>=82?'İyi':metric.value>=68?'Orta':'Dikkat'}</Text></View><ProgressBar value={metric.value} color={tone}/><Text style={p.metricDetail}>{metric.detail} · %{metric.value}</Text></View></View>;
}

const p=StyleSheet.create({
 back:{height:42,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:7},backText:{color:colors.muted,fontSize:13,fontWeight:'700'},lead:{color:colors.muted,fontSize:15,lineHeight:23,marginTop:-12},hero:{height:235,maxHeight:235,minHeight:235,flexDirection:'row',alignItems:'stretch',gap:12,overflow:'hidden'},heroCopy:{flex:1,justifyContent:'center',gap:10,minWidth:0},label:{fontSize:9,fontWeight:'900',letterSpacing:1.3},heroTitle:{color:colors.cream,fontSize:21,fontWeight:'800',lineHeight:27},small:{color:colors.muted,fontSize:12,lineHeight:18},bodyFrame:{alignSelf:'center',width:112,height:203,borderRadius:22,borderWidth:1,overflow:'hidden',backgroundColor:colors.deep,position:'relative'},bodyImage:{width:'100%',height:'100%',opacity:.82},previewAxis:{backgroundColor:'rgba(168,217,115,.52)',borderRadius:1,borderStyle:'dashed',borderWidth:.5,height:'82%',left:'50%',position:'absolute',top:'8%',width:1},previewJoint:{borderColor:'#102119',borderRadius:6,borderWidth:1,height:8,marginLeft:-4,marginTop:-4,position:'absolute',width:8},previewJointGood:{backgroundColor:'#A8D973'},previewJointWarn:{backgroundColor:'#D7A85B'},stages:{flexDirection:'row',gap:7},stage:{flex:1,minHeight:132,borderRadius:radii.md,backgroundColor:colors.surface,padding:10,borderWidth:1,borderColor:colors.line},stageIcon:{width:35,height:35,borderRadius:18,borderWidth:1,alignItems:'center',justifyContent:'center'},stageNo:{color:colors.gold,fontSize:9,fontWeight:'900',marginTop:10},stageTitle:{color:colors.cream,fontSize:14,fontWeight:'800',marginTop:2},stageCopy:{color:colors.muted,fontSize:9,lineHeight:13,marginTop:3},report:{flexDirection:'row',alignItems:'center',gap:12},scoreRing:{width:78,height:78,borderRadius:39,borderWidth:3,alignItems:'center',justifyContent:'center'},score:{fontSize:25,fontWeight:'900'},scoreLabel:{color:colors.muted,fontSize:8,fontWeight:'900',letterSpacing:1},reportTitle:{color:colors.cream,fontSize:14,fontWeight:'800'},signal:{fontSize:11,fontWeight:'800'},history:{flexDirection:'row',alignItems:'center',gap:13},historyScore:{fontSize:25,fontWeight:'900'},openHint:{fontSize:11,fontWeight:'800',marginTop:2},detailHeading:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:12},detailSubtitle:{color:colors.muted,fontSize:14,lineHeight:20,marginTop:-7},liveBadge:{borderWidth:1,borderRadius:20,paddingHorizontal:10,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:6},liveBadgeDot:{width:7,height:7,borderRadius:4},liveBadgeText:{fontSize:9,fontWeight:'900',letterSpacing:1},detailTabs:{flexDirection:'row',gap:8},detailTab:{flex:1,borderRadius:14,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,paddingVertical:10,alignItems:'center',gap:2},detailTabText:{color:colors.muted,fontSize:13,fontWeight:'800'},detailTabMeta:{color:colors.muted,fontSize:11},detailVisualCard:{padding:12,gap:12},detailVisual:{height:310,borderRadius:18,overflow:'hidden',backgroundColor:'#08110D',position:'relative',alignItems:'center'},detailBodyImage:{height:'100%',width:'70%',opacity:.9},detailAxis:{position:'absolute',top:'8%',bottom:'7%',width:1,opacity:.7},detailJoint:{position:'absolute',width:12,height:12,borderRadius:7,borderWidth:1.5,borderColor:'#07110D',marginLeft:-6,marginTop:-6},detailVisualCopy:{gap:6},detailViewEyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.4},detailVisualTitle:{color:colors.cream,fontSize:15,fontWeight:'800',lineHeight:21},overallCard:{flexDirection:'row',alignItems:'center',gap:18},overallScore:{width:100,alignItems:'center',justifyContent:'center'},overallValue:{fontSize:46,fontWeight:'900',lineHeight:48},overallSlash:{color:colors.muted,fontSize:13,marginTop:-4},overallState:{fontSize:14,fontWeight:'900',marginTop:5},overallCopy:{flex:1,gap:7},detailSectionTitle:{color:colors.muted,fontSize:10,fontWeight:'900',letterSpacing:1.5},metricRow:{flexDirection:'row',gap:11,alignItems:'center',marginBottom:15},metricIcon:{width:38,height:38,borderRadius:12,borderWidth:1,alignItems:'center',justifyContent:'center'},metricTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},metricName:{color:colors.cream,fontSize:14,fontWeight:'700'},metricValue:{fontSize:12,fontWeight:'900'},metricDetail:{color:colors.muted,fontSize:10},noteCard:{flexDirection:'row',gap:11,alignItems:'flex-start'},noteText:{color:colors.cream,fontSize:13,lineHeight:20},
});
