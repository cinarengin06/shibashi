import {Ionicons} from '@expo/vector-icons';
import {router,useLocalSearchParams} from 'expo-router';
import {useEffect,useRef} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {Card,Eyebrow,Metric,PrimaryButton,Screen,Section,Title} from '../components/ui';
import {colors} from '../constants/theme';
import {getShen} from '../data/fiveShen';
import {useApp} from '../store/AppStore';
import {getMasterSentence,masterSentences,toDomainShenId} from '../../../packages/shen-domain';

export default function Result(){
 const p=useLocalSearchParams<{practiceId:string;duration:string;posture:string;balance:string;flow:string;samples?:string;shenId?:string;masterSentenceId?:string;feedback?:string}>();const{profile,addSession,addShenActivity,saveMasterSentence,savedMasterSentences}=useApp();const domainShenId=toDomainShenId(p.shenId||profile.selectedShenId);const shen=getShen(domainShenId==='xin'?'shen':domainShenId);const saved=useRef(false);
 const duration=Math.max(1,Number(p.duration)||1),posture=Number(p.posture),balance=Number(p.balance),flow=Number(p.flow),samples=Math.max(0,Number(p.samples)||0);
 const hasMeasurement=[posture,balance,flow].every(Number.isFinite)&&samples>=3;
 const fallbackSentence=getMasterSentence(domainShenId,0);const sentenceId=p.masterSentenceId||fallbackSentence.id;const sentence=masterSentences.find(item=>item.id===sentenceId)??fallbackSentence;const sentenceSaved=savedMasterSentences.some(item=>item.masterSentenceId===sentenceId);
 useEffect(()=>{if(saved.current||!hasMeasurement)return;saved.current=true;const now=new Date().toISOString();addSession({id:Date.now().toString(),practiceId:p.practiceId||'free',date:now,duration,postureScore:posture,balanceScore:balance,flowScore:flow,corrections:[p.feedback||'Geçişleri sakin tut']});addShenActivity({id:`activity-${Date.now()}`,shenId:domainShenId,type:'practice',createdAt:now,minutes:duration,completed:true,movementQuality:flow,practiceId:p.practiceId||'free'})},[addSession,addShenActivity,balance,domainShenId,duration,flow,hasMeasurement,p.feedback,p.practiceId,posture]);
 return <Screen>
  <View style={r.medal}><View style={[r.medalInner,{backgroundColor:`${shen.color}18`,borderColor:shen.color}]}><Text style={{color:shen.color,fontSize:39}}>{shen.symbol}</Text></View></View>
  <Eyebrow>{shen.name.toUpperCase()} · {shen.dailyName.toUpperCase()}</Eyebrow><Title>{shen.label} bugün biraz daha derinleşti.</Title>
  <Text style={r.body}>{hasMeasurement?`${samples} geçerli kamera karesinin ortalaması kullanıldı. ${shen.recommendation}`:'Geçerli kamera ölçümü bulunamadı; bu oturum puanlanmadı.'}</Text>
  {hasMeasurement?<View style={r.metrics}><Metric label="Duruş" value={posture} color={shen.color}/><Metric label="Akış" value={flow} color={shen.color}/><Metric label="Denge" value={balance} color={shen.color}/></View>:null}
  <Section title={`${shen.name} koç yorumu`}><Card style={{gap:10}}><Text style={r.coach}>“{p.feedback||'Tam beden görünürlüğünü koruyarak hareketi yeniden deneyebilirsin.'}”</Text><View style={r.line}/><Text style={[r.good,{color:shen.color}]}>ÖLÇÜM KAYNAĞI · MediaPipe 33 nokta</Text><Text style={r.improve}>Nefes puanlanmadı; kamera nefes kalitesini güvenilir biçimde ölçmez.</Text></Card></Section>
  <Card style={[r.task,{borderColor:`${shen.color}55`}]}><Ionicons name="sparkles" color={shen.color} size={22}/><View style={{flex:1}}><Text style={[r.taskLabel,{color:shen.color}]}>PRATİK SONRASI MİKRO GÖREV</Text><Text style={r.taskText}>{shen.task}</Text></View></Card>
  <Card style={r.master}><Text style={[r.taskLabel,{color:shen.color}]}>USTADAN BİR CÜMLE</Text><Text style={r.masterText}>“{sentence.text}”</Text><PrimaryButton label={sentenceSaved?'Defterine eklendi':'Defterime ekle'} icon={sentenceSaved?'checkmark':'bookmark-outline'} disabled={sentenceSaved} onPress={()=>saveMasterSentence({id:`saved-${Date.now()}`,masterSentenceId:sentenceId,savedAt:new Date().toISOString(),practiceId:p.practiceId})}/><PrimaryButton label="Bugün bende ne ifade etti?" icon="create-outline" onPress={()=>router.push({pathname:'/reflection',params:{shenId:domainShenId,practiceId:p.practiceId,masterSentenceId:sentenceId}})}/></Card>
  <Text style={r.summary}>{duration} dakika · {samples} geçerli ölçüm karesi · Nefes puanlanmadı</Text>
  <PrimaryButton label="Ana ekrana dön" icon="home" onPress={()=>router.replace('/(tabs)')}/><PrimaryButton label={`${shen.name} günlüğüne not ekle`} icon="book-outline" onPress={()=>router.replace('/(tabs)/journal')}/>
 </Screen>
}
const r=StyleSheet.create({medal:{alignItems:'center',paddingTop:18},medalInner:{width:100,height:100,borderRadius:50,borderWidth:1,alignItems:'center',justifyContent:'center'},body:{color:colors.muted,fontSize:16,lineHeight:24},metrics:{flexDirection:'row',gap:8},reward:{flexDirection:'row',justifyContent:'space-around'},rewardValue:{fontSize:19,fontWeight:'800'},muted:{color:colors.muted,fontSize:12,marginTop:3},coach:{color:colors.cream,fontSize:15,lineHeight:23,fontStyle:'italic'},line:{height:1,backgroundColor:colors.line},good:{fontSize:11,fontWeight:'800'},improve:{color:colors.amber,fontSize:11,fontWeight:'800'},task:{flexDirection:'row',alignItems:'center',gap:12},taskLabel:{fontSize:9,fontWeight:'900',letterSpacing:1},taskText:{color:colors.cream,fontSize:14,lineHeight:20,marginTop:3},master:{gap:12},masterText:{color:colors.cream,fontSize:20,lineHeight:29,fontFamily:'DMSerifDisplay_400Regular'},summary:{color:colors.muted,textAlign:'center',fontSize:13}});
