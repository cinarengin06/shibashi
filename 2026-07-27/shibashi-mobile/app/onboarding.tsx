import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {useState} from 'react';
import {KeyboardAvoidingView,Platform,Pressable,StyleSheet,Switch,Text,TextInput,View} from 'react-native';
import {Card,Eyebrow,PrimaryButton,Screen,Title} from '../components/ui';
import {colors,radii,spacing} from '../constants/theme';
import {fiveShen,getShen} from '../data/fiveShen';
import {useApp} from '../store/AppStore';
import {Experience,ShenId} from '../types';

const total=6;
export default function Onboarding(){
 const{profile,saveProfile}=useApp();const[step,setStep]=useState(0),[name,setName]=useState(profile.name==='Gezgin'?'':profile.name),[experience,setExperience]=useState<Experience>(profile.experience),[goal,setGoal]=useState(profile.dailyGoal),[reminders,setReminders]=useState(profile.reminders),[nameError,setNameError]=useState(''),[dailyState,setDailyState]=useState({body:54,breath:62,energy:48});
 const shen=getShen(profile.selectedShenId);
 const next=()=>{if(step===0&&!name.trim()){setNameError('Yolculuğa başlamak için adını yaz.');return}if(step===total-1){saveProfile({name:name.trim(),experience,dailyGoal:goal,reminders,onboardingDone:true,onboardingVersion:2,onboardingCheckin:{...dailyState,createdAt:new Date().toISOString()}});router.replace('/(tabs)');return}setStep(v=>v+1)};
 const chooseShen=(selectedShenId:ShenId)=>saveProfile({selectedShenId});
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><Screen style={o.page}>
  <View style={o.progressHead}><Text style={[o.progressText,{color:shen.color}]}>{step+1} / {total}</Text><View style={o.progress}>{Array.from({length:total}).map((_,i)=><View key={i} style={[o.dot,i<=step&&{backgroundColor:shen.color}]}/>)}</View></View>
  {step===0&&<View style={o.stage}><View style={[o.iconCircle,{borderColor:`${shen.color}66`}]}><Ionicons name="person-outline" color={shen.color} size={35}/></View><Eyebrow>BAŞLANGIÇ</Eyebrow><Title>Bu yolculuk kimin için?</Title><Text style={o.body}>Sana her gün biraz daha kişisel bir ritim kurabilmemiz için önce adını bilelim.</Text><View style={{gap:8}}><Text style={o.label}>Bu yolculukta sana nasıl hitap edelim?</Text><TextInput autoFocus value={name} onChangeText={v=>{setName(v);setNameError('')}} placeholder="Adını yaz" placeholderTextColor={colors.muted} maxLength={32} style={[o.input,nameError&&{borderColor:colors.danger}]}/><Text style={[o.help,nameError&&{color:colors.danger}]}>{nameError||'Bu isim yolculuğun boyunca sana eşlik edecek.'}</Text></View></View>}
  {step===1&&<View style={o.stage}><View style={[o.iconCircle,{borderColor:`${shen.color}66`}]}><Ionicons name="leaf-outline" color={shen.color} size={35}/></View><Eyebrow>SENİ DİNLİYORUM</Eyebrow><Title>Bugün seni buraya getiren ne?</Title><Text style={o.body}>Doğru ya da yanlış cevap yok. Sadece bugünkü niyetini seç.</Text><View style={o.needGrid}>{[
   {id:'po' as ShenId,icon:'leaf-outline' as const,title:'Biraz daha hafif hissetmek istiyorum.',body:'Günün yükünü ve bedendeki gerginliği bırakmak.'},
   {id:'yi' as ShenId,icon:'water-outline' as const,title:'Zihnimi sakinleştirmek istiyorum.',body:'Düşüncelerin hızını yavaşlatıp nefese dönmek.'},
   {id:'shen' as ShenId,icon:'sunny-outline' as const,title:'Enerjimi yeniden uyandırmak istiyorum.',body:'Güne daha canlı ve istekli devam etmek.'},
   {id:'zhi' as ShenId,icon:'body-outline' as const,title:'Dengemi yeniden bulmak istiyorum.',body:'Bedenimi merkeze çağırıp daha sağlam hissetmek.'},
   {id:'hun' as ShenId,icon:'sparkles-outline' as const,title:'Kendimle yeniden bağlantı kurmak istiyorum.',body:'İçimdeki yönü ve ihtiyacı daha net duymak.'},
  ].map(item=><Pressable key={item.id} onPress={()=>chooseShen(item.id)} style={[o.needOption,profile.selectedShenId===item.id&&{borderColor:shen.color,backgroundColor:`${shen.color}16`}]}><Ionicons name={item.icon} color={profile.selectedShenId===item.id?shen.color:colors.muted} size={22}/><View style={{flex:1}}><Text style={o.featureTitle}>{item.title}</Text><Text style={o.help}>{item.body}</Text></View>{profile.selectedShenId===item.id&&<Ionicons name="checkmark-circle" color={shen.color} size={20}/>}</Pressable>)}</View></View>}
  {step===2&&<View style={o.stage}><View style={[o.iconCircle,{borderColor:`${shen.color}66`}]}><Ionicons name="options-outline" color={shen.color} size={35}/></View><Eyebrow>BUGÜNKÜ DURUMUN</Eyebrow><Title>Bugün nasılsın?</Title><Text style={o.body}>Dürüst olman, sana en doğru pratiği sunmamıza yardım eder. Noktaları sürükleyebilirsin.</Text><View style={o.stateCard}><WellbeingSlider color={shen.color} icon="body-outline" high="Rahat" label="Bedenin" low="Gergin" value={dailyState.body} onChange={body=>setDailyState(current=>({...current,body}))}/><WellbeingSlider color={shen.color} icon="water-outline" high="Derin" label="Nefesin" low="Yüzeysel" value={dailyState.breath} onChange={breath=>setDailyState(current=>({...current,breath}))}/><WellbeingSlider color={shen.color} icon="flash-outline" high="Yüksek" label="Enerjin" low="Düşük" value={dailyState.energy} onChange={energy=>setDailyState(current=>({...current,energy}))}/></View></View>}
  {step===3&&<View style={o.stage}><View style={[o.iconCircle,{borderColor:`${shen.color}66`}]}><Ionicons name="scan-outline" color={shen.color} size={36}/></View><Eyebrow>HAREKET REHBERİN</Eyebrow><Title>Önce izle, sonra kendi hızında dene.</Title><Text style={o.body}>İstersen kamera, hareketlerini ekranda görmene ve duruşunu daha rahat ayarlamana yardımcı olur. Kullanmak zorunda değilsin.</Text><View style={o.phone}><View style={[o.silhouette,{borderColor:`${shen.color}88`}]}><Ionicons name="body-outline" color={shen.color} size={74}/></View><View style={o.cameraStats}>{['Duruş','Ritim','Denge'].map(x=><View key={x} style={o.cameraStat}><Text style={{color:shen.color,fontWeight:'900'}}>—</Text><Text style={o.statName}>{x}</Text></View>)}</View></View><View style={o.privacy}><Ionicons name="shield-checkmark-outline" color={shen.color} size={20}/><Text style={o.help}>Kamera yalnızca sen izin verdiğinde açılır. Görüntün telefonundan dışarı çıkmaz.</Text></View></View>}
  {step===4&&<View style={o.stage}><View style={[o.iconCircle,{borderColor:`${shen.color}66`}]}><Ionicons name="book-outline" color={shen.color} size={35}/></View><Eyebrow>SANA AİT BİR ALAN</Eyebrow><Title>Küçük ilerlemelerini fark et.</Title><Text style={o.body}>Tamamladığın rutinleri, bedenindeki değişimi ve gün sonunda nasıl hissettiğini tek yerde görebilirsin.</Text><View style={{gap:10}}>{[['01','Bugünkü hareketler','Tamamladığın kısa rutinler'],['02','Bedenindeki değişim','Duruş ve denge gelişimin'],['03','Günün notu','Nasıl hissettiğini birkaç kelimeyle yaz']].map(([n,title,body])=><Card key={n} style={o.feature}><Text style={[o.featureNo,{color:shen.color}]}>{n}</Text><View style={{flex:1}}><Text style={o.featureTitle}>{title}</Text><Text style={o.help}>{body}</Text></View></Card>)}</View></View>}
  {step===5&&<View style={o.stage}><View style={[o.iconCircle,{borderColor:`${shen.color}66`}]}><Ionicons name="sunny-outline" color={shen.color} size={35}/></View><Eyebrow>SON BİRKAÇ AYAR</Eyebrow><Title>Hazırsın, {name.trim()||'yol arkadaşım'}.</Title><Text style={o.body}>Sana uygun süreyi seç. Her gün uzun bir çalışma yapman gerekmiyor; birkaç dakika bile yeterli.</Text><View style={o.road}>{[['1','Bugün','Kısa bir hazırlık ve yumuşak hareketler'],['2','Hazır olduğunda','Duruşunu kamerada kontrol et'],['3','Zamanla','İlerlemeni ve iyi hissettiren rutinleri keşfet']].map(([n,title,body],i)=><View key={n} style={o.roadStep}><View style={[o.roadNo,i===0&&{backgroundColor:shen.color}]}><Text style={{color:i===0?colors.ink:colors.muted,fontWeight:'900'}}>{n}</Text></View><View style={{flex:1}}><Text style={o.featureTitle}>{title}</Text><Text style={o.help}>{body}</Text></View></View>)}</View><Text style={o.label}>Hareket deneyimin</Text><View style={o.options}>{(['Yeni','Biraz deneyimli','Düzenli pratik'] as Experience[]).map(v=><Pressable key={v} onPress={()=>setExperience(v)} style={[o.chip,experience===v&&{backgroundColor:shen.color}]}><Text style={[o.chipText,experience===v&&{color:colors.ink}]}>{v}</Text></Pressable>)}</View><Text style={o.label}>Kendine ayırmak istediğin süre</Text><View style={o.options}>{[8,10,15].map(v=><Pressable key={v} onPress={()=>setGoal(v)} style={[o.chip,goal===v&&{backgroundColor:shen.color}]}><Text style={[o.chipText,goal===v&&{color:colors.ink}]}>{v} dk</Text></Pressable>)}</View><View style={o.reminder}><Text style={o.featureTitle}>Nazik bir günlük hatırlatma</Text><Switch value={reminders} onValueChange={setReminders} trackColor={{false:colors.surface2,true:shen.color}}/></View></View>}
  <View style={o.actions}>{step>0&&<Pressable onPress={()=>setStep(v=>v-1)} style={o.back}><Ionicons name="arrow-back" color={colors.cream} size={20}/></Pressable>}<View style={{flex:1}}><PrimaryButton label={step===total-1?'Başlayalım':step===0?'Devam et':'Devam et'} icon={step===total-1?'sparkles':'arrow-forward'} onPress={next}/></View></View>
 </Screen></KeyboardAvoidingView>
}

function WellbeingSlider({color,high,icon,label,low,onChange,value}:{color:string;high:string;icon:keyof typeof Ionicons.glyphMap;label:string;low:string;onChange:(value:number)=>void;value:number}){
 const[trackWidth,setTrackWidth]=useState(1);
 const update=(locationX:number)=>onChange(Math.max(0,Math.min(100,Math.round(locationX/trackWidth*100))));
 return <View style={o.stateSlider}>
  <View style={o.stateHead}><View style={[o.stateIcon,{borderColor:`${color}48`}]}><Ionicons name={icon} color={color} size={18}/></View><Text style={o.stateLabel}>{label}</Text><Text style={[o.stateValue,{color}]}>{value}</Text></View>
  <View
   accessible
   accessibilityActions={[{name:'increment',label:'Artır'},{name:'decrement',label:'Azalt'}]}
   accessibilityLabel={`${label}: ${value}`}
   accessibilityRole="adjustable"
   onAccessibilityAction={event=>onChange(Math.max(0,Math.min(100,value+(event.nativeEvent.actionName==='increment'?5:-5))))}
   onLayout={event=>setTrackWidth(Math.max(1,event.nativeEvent.layout.width))}
   onMoveShouldSetResponder={()=>true}
   onResponderGrant={event=>update(event.nativeEvent.locationX)}
   onResponderMove={event=>update(event.nativeEvent.locationX)}
   onStartShouldSetResponder={()=>true}
   style={o.sliderTouch}
  >
   <View style={o.sliderTrack}><View style={[o.sliderFill,{backgroundColor:color,width:`${value}%`}]} /></View>
   <View style={[o.sliderThumb,{backgroundColor:color,left:`${value}%`}]} />
  </View>
  <View style={o.stateEnds}><Text style={o.stateEnd}>{low}</Text><Text style={o.stateEnd}>{high}</Text></View>
 </View>;
}

const o=StyleSheet.create({
 page:{flexGrow:1,justifyContent:'space-between',paddingBottom:28},
 progressHead:{gap:9,paddingTop:4},
 progressText:{fontSize:11,fontWeight:'900',letterSpacing:1.4},
 progress:{flexDirection:'row',gap:6},
 dot:{height:4,flex:1,borderRadius:2,backgroundColor:colors.surface2},
 stage:{flex:1,justifyContent:'center',gap:16,paddingVertical:20},
 iconCircle:{width:82,height:82,borderRadius:41,borderWidth:1,backgroundColor:'rgba(8,28,23,.82)',alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.2,shadowRadius:14,shadowOffset:{width:0,height:8},elevation:4},
 body:{color:colors.muted,fontSize:16,lineHeight:24},
 label:{color:colors.cream,fontSize:13,fontWeight:'700'},
 input:{height:58,borderRadius:radii.md,borderWidth:1,borderColor:colors.line,backgroundColor:'rgba(16,40,33,.92)',color:colors.cream,paddingHorizontal:17,fontSize:16},
 help:{color:colors.muted,fontSize:12,lineHeight:18},
 shenCard:{gap:8},
 shenTitle:{fontSize:15,fontWeight:'900'},
 cardBody:{color:colors.cream,fontSize:14,lineHeight:21},
 micro:{fontSize:12,lineHeight:18,fontWeight:'700'},
 phone:{height:260,borderRadius:30,borderWidth:1,borderColor:colors.line,backgroundColor:'rgba(8,28,23,.76)',padding:17,justifyContent:'space-between',shadowColor:'#000',shadowOpacity:.18,shadowRadius:16,shadowOffset:{width:0,height:9},elevation:4},
 silhouette:{flex:1,borderWidth:1,borderRadius:70,alignItems:'center',justifyContent:'center'},
 cameraStats:{flexDirection:'row',gap:7,marginTop:12},
 cameraStat:{flex:1,backgroundColor:colors.surface,padding:9,borderRadius:12,alignItems:'center'},
 statName:{color:colors.muted,fontSize:9},
 privacy:{flexDirection:'row',gap:9,alignItems:'center'},
 needGrid:{gap:8},
 needOption:{alignItems:'center',backgroundColor:colors.surface,borderColor:colors.line,borderRadius:radii.md,borderWidth:1,flexDirection:'row',gap:11,minHeight:62,padding:11},
 stateCard:{backgroundColor:'rgba(8,28,23,.82)',borderColor:colors.line,borderRadius:radii.lg,borderWidth:1,gap:24,padding:18,shadowColor:'#000',shadowOffset:{width:0,height:12},shadowOpacity:.2,shadowRadius:20,elevation:4},
 stateSlider:{gap:8},
 stateHead:{alignItems:'center',flexDirection:'row',gap:10},
 stateIcon:{alignItems:'center',backgroundColor:'rgba(5,16,13,.64)',borderRadius:18,borderWidth:1,height:36,justifyContent:'center',width:36},
 stateLabel:{color:colors.cream,flex:1,fontSize:15,fontWeight:'800'},
 stateValue:{fontSize:11,fontWeight:'900'},
 sliderTouch:{height:28,justifyContent:'center',position:'relative'},
 sliderTrack:{backgroundColor:'rgba(243,235,221,.14)',borderRadius:2,height:2,overflow:'hidden'},
 sliderFill:{borderRadius:2,height:2},
 sliderThumb:{borderColor:'rgba(5,16,13,.9)',borderRadius:10,borderWidth:2,height:20,marginLeft:-10,position:'absolute',shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:.28,shadowRadius:6,top:4,width:20},
 stateEnds:{flexDirection:'row',justifyContent:'space-between'},
 stateEnd:{color:colors.muted,fontSize:10},
 feature:{flexDirection:'row',gap:13,alignItems:'center'},
 featureNo:{fontSize:18,fontWeight:'900'},
 featureTitle:{color:colors.cream,fontSize:14,fontWeight:'800'},
 road:{gap:4},
 roadStep:{minHeight:62,flexDirection:'row',alignItems:'center',gap:12},
 roadNo:{width:36,height:36,borderRadius:18,backgroundColor:colors.surface2,alignItems:'center',justifyContent:'center'},
 options:{flexDirection:'row',flexWrap:'wrap',gap:8},
 chip:{minHeight:43,justifyContent:'center',paddingHorizontal:14,borderRadius:radii.pill,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.line},
 chipText:{color:colors.cream,fontSize:12,fontWeight:'700'},
 reminder:{minHeight:52,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 actions:{flexDirection:'row',gap:10,alignItems:'center'},
 back:{width:54,height:54,borderRadius:27,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.line},
});
