import {Ionicons} from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import {router,useLocalSearchParams} from 'expo-router';
import {useMemo,useState} from 'react';
import {Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {Card,Eyebrow,Screen,Title} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {coachIntents,CoachIntent,inferCoachIntent,shibashiCoaches} from '../data/coaches';
import {getShen} from '../data/fiveShen';

type Message={id:string;from:'coach'|'user';text:string};

export default function Coaches(){
 const params=useLocalSearchParams<{coach?:string}>();
 const initial=shibashiCoaches.find(item=>item.id===params.coach)??shibashiCoaches[0];
 const[coachId,setCoachId]=useState(initial.id);
 const[input,setInput]=useState('');
 const[messages,setMessages]=useState<Message[]>([{id:'intro',from:'coach',text:initial.intro}]);
 const coach=useMemo(()=>shibashiCoaches.find(item=>item.id===coachId)??initial,[coachId,initial]);
 const shen=getShen(coach.shenId);
 const select=(id:typeof coachId)=>{const next=shibashiCoaches.find(item=>item.id===id)??coach;setCoachId(id);setMessages([{id:`intro-${id}`,from:'coach',text:next.intro}])};
 const send=(text:string,intent?:CoachIntent)=>{const clean=text.trim();if(!clean)return;const reply=coach.lines[intent??inferCoachIntent(clean)];setMessages(current=>[...current,{id:`u-${Date.now()}`,from:'user',text:clean},{id:`c-${Date.now()}`,from:'coach',text:reply}]);setInput('')};
 const speak=()=>{const last=[...messages].reverse().find(item=>item.from==='coach')?.text??coach.intro;Speech.stop();void Speech.speak(last,{language:'tr-TR',pitch:coach.pitch,rate:coach.rate})};
 return <Screen>
  <Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" color={colors.cream} size={20}/><Text style={s.backText}>Geri</Text></Pressable>
  <Eyebrow>SEKİZ YAŞAM REHBERİ</Eyebrow><Title>Bugün kimin sesi sana iyi gelir?</Title>
  <Text style={s.lead}>Önce ihtiyacını seç. Gelenekte bu sekiz karakter “Sekiz Ölümsüz” hikâyeleriyle anlatılır.</Text>
  <View style={s.coachGrid}>{shibashiCoaches.map(item=>{const active=item.id===coach.id;const color=getShen(item.shenId).color;return <Pressable key={item.id} onPress={()=>select(item.id)} style={[s.coachChoice,active&&{borderColor:color,backgroundColor:`${color}18`}]}><Text style={[s.coachIcon,{color}]}>{item.icon}</Text><Text numberOfLines={1} style={s.coachName}>{item.name.split(' ')[0]}</Text></Pressable>})}</View>
  <Card style={[s.console,{borderColor:`${shen.color}55`}]}>
   <View style={s.coachHead}><View style={[s.avatar,{borderColor:shen.color}]}><Text style={[s.avatarText,{color:shen.color}]}>{coach.icon}</Text></View><View style={{flex:1}}><Text style={s.name}>{coach.name}</Text><Text style={s.role}>{coach.role}</Text><View style={s.tags}>{coach.voice.map(item=><Text key={item} style={[s.tag,{color:shen.color}]}>{item}</Text>)}</View></View><Pressable onPress={speak} style={[s.speak,{borderColor:shen.color}]}><Ionicons name="volume-high-outline" color={shen.color} size={19}/></Pressable></View>
   <View style={s.chat}>{messages.slice(-6).map(item=><View key={item.id} style={[s.bubble,item.from==='user'?s.user:s.guide]}><Text style={s.bubbleText}>{item.text}</Text></View>)}</View>
   <View style={s.intents}>{coachIntents.map(item=><Pressable key={item.id} onPress={()=>send(item.label,item.id)} style={s.intent}><Text style={s.intentText}>{item.label}</Text></Pressable>)}</View>
   <View style={s.inputRow}><TextInput value={input} onChangeText={setInput} onSubmitEditing={()=>send(input)} placeholder="Bugün nasıl hissettiğini yaz…" placeholderTextColor={colors.muted} style={s.input}/><Pressable onPress={()=>send(input)} style={[s.send,{backgroundColor:shen.color}]}><Ionicons name="arrow-up" color={colors.ink} size={20}/></Pressable></View>
  </Card>
 </Screen>;
}

const s=StyleSheet.create({back:{height:40,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:7},backText:{color:colors.muted,fontSize:13,fontWeight:'700'},lead:{color:colors.muted,fontSize:14,lineHeight:21,marginTop:-12},coachGrid:{flexDirection:'row',flexWrap:'wrap',gap:7},coachChoice:{width:'23%',minHeight:66,borderRadius:16,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',gap:3},coachIcon:{fontSize:23},coachName:{color:colors.cream,fontSize:9,fontWeight:'700'},console:{gap:14},coachHead:{flexDirection:'row',alignItems:'center',gap:11},avatar:{width:56,height:56,borderRadius:28,borderWidth:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.deep},avatarText:{fontSize:28},name:{color:colors.cream,fontSize:19,fontWeight:'800'},role:{color:colors.muted,fontSize:11,marginTop:2},tags:{flexDirection:'row',flexWrap:'wrap',gap:4,marginTop:5},tag:{fontSize:8,borderWidth:1,borderColor:colors.line,borderRadius:99,paddingHorizontal:6,paddingVertical:3},speak:{width:42,height:42,borderRadius:21,borderWidth:1,alignItems:'center',justifyContent:'center'},chat:{gap:8,minHeight:190,justifyContent:'flex-end'},bubble:{maxWidth:'88%',padding:11,borderRadius:15},guide:{alignSelf:'flex-start',backgroundColor:colors.surface2},user:{alignSelf:'flex-end',backgroundColor:'rgba(216,182,106,.18)'},bubbleText:{color:colors.cream,fontSize:13,lineHeight:19},intents:{flexDirection:'row',flexWrap:'wrap',gap:6},intent:{borderWidth:1,borderColor:colors.line,borderRadius:radii.pill,paddingHorizontal:10,paddingVertical:8},intentText:{color:colors.muted,fontSize:10,fontWeight:'700'},inputRow:{flexDirection:'row',gap:8},input:{flex:1,minHeight:48,borderRadius:radii.pill,backgroundColor:colors.deep,color:colors.cream,paddingHorizontal:15},send:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center'}});
