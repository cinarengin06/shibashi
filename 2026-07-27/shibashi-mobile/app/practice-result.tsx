import {Ionicons} from '@expo/vector-icons';
import {router,useLocalSearchParams} from 'expo-router';
import {useEffect,useRef} from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {Card,Eyebrow,Metric,PrimaryButton,Screen,Section,Title} from '../components/ui';
import {colors} from '../constants/theme';
import {getShen} from '../data/fiveShen';
import {useApp} from '../store/AppStore';

export default function Result(){
 const p=useLocalSearchParams<{practiceId:string;duration:string;posture:string;balance:string;flow:string}>();const{profile,addSession}=useApp();const shen=getShen(profile.selectedShenId);const saved=useRef(false);
 const duration=Number(p.duration||1),posture=Number(p.posture||82),balance=Number(p.balance||80),flow=Number(p.flow||84);
 useEffect(()=>{if(saved.current)return;saved.current=true;addSession({id:Date.now().toString(),practiceId:p.practiceId||'free',date:new Date().toISOString(),duration,postureScore:posture,balanceScore:balance,flowScore:flow,breathScore:86,jing:24,xp:120,corrections:['Omuzları serbest bırak']})},[addSession,balance,duration,flow,p.practiceId,posture]);
 return <Screen>
  <View style={r.medal}><View style={[r.medalInner,{backgroundColor:`${shen.color}18`,borderColor:shen.color}]}><Text style={{color:shen.color,fontSize:39}}>{shen.symbol}</Text></View></View>
  <Eyebrow>{shen.name.toUpperCase()} · {shen.dailyName.toUpperCase()}</Eyebrow><Title>{shen.label} bugün biraz daha derinleşti.</Title>
  <Text style={r.body}>Nefesin hareket boyunca sakindi. {shen.recommendation}</Text>
  <View style={r.metrics}><Metric label="Duruş" value={posture} color={shen.color}/><Metric label="Akış" value={flow} color={shen.color}/><Metric label="Denge" value={balance} color={shen.color}/></View>
  <Card style={r.reward}><View><Text style={[r.rewardValue,{color:shen.color}]}>+24 beden gücü · Jing</Text><Text style={r.muted}>Günlük canlılık kazanımı</Text></View><View><Text style={[r.rewardValue,{color:shen.color}]}>+120 XP</Text><Text style={r.muted}>7 günlük seri sürüyor</Text></View></Card>
  <Section title={`${shen.name} koç yorumu`}><Card style={{gap:10}}><Text style={r.coach}>“{shen.hero} Bugünkü akışta {shen.bodyMap.toLocaleLowerCase('tr-TR')} hattını yumuşak tutmayı başardın.”</Text><View style={r.line}/><Text style={[r.good,{color:shen.color}]}>EN İYİ HAREKET · Göğsü Açmak</Text><Text style={r.improve}>GELİŞİM ALANI · Omuzları biraz daha bırak</Text></Card></Section>
  <Card style={[r.task,{borderColor:`${shen.color}55`}]}><Ionicons name="sparkles" color={shen.color} size={22}/><View style={{flex:1}}><Text style={[r.taskLabel,{color:shen.color}]}>PRATİK SONRASI MİKRO GÖREV</Text><Text style={r.taskText}>{shen.task}</Text></View></Card>
  <Text style={r.summary}>{duration} dakika · 4 hareket · Nefes uyumu %86</Text>
  <PrimaryButton label="Ana ekrana dön" icon="home" onPress={()=>router.replace('/(tabs)')}/><PrimaryButton label={`${shen.name} günlüğüne not ekle`} icon="book-outline" onPress={()=>router.replace('/(tabs)/journal')}/>
 </Screen>
}
const r=StyleSheet.create({medal:{alignItems:'center',paddingTop:18},medalInner:{width:100,height:100,borderRadius:50,borderWidth:1,alignItems:'center',justifyContent:'center'},body:{color:colors.muted,fontSize:16,lineHeight:24},metrics:{flexDirection:'row',gap:8},reward:{flexDirection:'row',justifyContent:'space-around'},rewardValue:{fontSize:19,fontWeight:'800'},muted:{color:colors.muted,fontSize:12,marginTop:3},coach:{color:colors.cream,fontSize:15,lineHeight:23,fontStyle:'italic'},line:{height:1,backgroundColor:colors.line},good:{fontSize:11,fontWeight:'800'},improve:{color:colors.amber,fontSize:11,fontWeight:'800'},task:{flexDirection:'row',alignItems:'center',gap:12},taskLabel:{fontSize:9,fontWeight:'900',letterSpacing:1},taskText:{color:colors.cream,fontSize:14,lineHeight:20,marginTop:3},summary:{color:colors.muted,textAlign:'center',fontSize:13}});
