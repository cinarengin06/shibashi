import {Ionicons} from '@expo/vector-icons';
import {router,useLocalSearchParams} from 'expo-router';
import {useState} from 'react';
import {Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {getQuestionForShen,reflectionQuestions,toDomainShenId} from '../../../packages/shen-domain';
import {Card,Eyebrow,PrimaryButton,Screen,Title} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {getShen} from '../data/fiveShen';
import {useApp} from '../store/AppStore';

const feelings=['Daha açık','Daha sakin','Daha merkezde','Daha hafif','Hâlâ gergin','Enerjik','Sessiz'];
export default function Reflection(){
 const params=useLocalSearchParams<{shenId?:string;questionId?:string;practiceId?:string;masterSentenceId?:string}>();
 const{profile,addReflection}=useApp();const shenId=toDomainShenId(params.shenId||profile.selectedShenId);const shen=getShen(shenId==='xin'?'shen':shenId);
 const question=reflectionQuestions.find(item=>item.id===params.questionId)??getQuestionForShen(shenId,0);const[text,setText]=useState('');const[feeling,setFeeling]=useState('');
 const save=()=>{addReflection({id:`reflection-${Date.now()}`,userId:'local-user',shenId,practiceId:params.practiceId,questionId:params.questionId||question.id,responseText:text.trim()||undefined,selectedFeeling:feeling||undefined,masterSentenceId:params.masterSentenceId,createdAt:new Date().toISOString()});router.replace('/(tabs)/journey')};
 return <Screen><Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" color={colors.cream} size={20}/><Text style={s.backText}>Geri</Text></Pressable><Eyebrow>TEK BİR YANSIMA</Eyebrow><Title>{question.text}</Title><Text style={s.lead}>Uzun yazmak zorunda değilsin. Bir his seçmek de yeterli.</Text><View style={s.feelings}>{feelings.map(item=><Pressable key={item} onPress={()=>setFeeling(item)} style={[s.feeling,feeling===item&&{borderColor:shen.color,backgroundColor:`${shen.color}18`}]}><Text style={[s.feelingText,feeling===item&&{color:shen.color}]}>{item}</Text></Pressable>)}</View><Card><TextInput multiline placeholder="Bugün bende kalan…" placeholderTextColor={colors.muted} value={text} onChangeText={setText} style={s.input}/></Card><PrimaryButton label="Yansımayı kaydet" icon="checkmark" onPress={save}/><Pressable onPress={()=>router.replace('/(tabs)/journey')}><Text style={s.later}>Daha sonra yaz</Text></Pressable></Screen>
}
const s=StyleSheet.create({back:{flexDirection:'row',alignItems:'center',gap:8},backText:{color:colors.cream,fontSize:13},lead:{color:colors.muted,fontSize:15,lineHeight:22},feelings:{flexDirection:'row',flexWrap:'wrap',gap:8},feeling:{borderWidth:1,borderColor:colors.line,borderRadius:radii.pill,paddingHorizontal:12,paddingVertical:9,backgroundColor:colors.surface},feelingText:{color:colors.muted,fontSize:12},input:{minHeight:150,color:colors.cream,fontSize:16,lineHeight:24,textAlignVertical:'top'},later:{color:colors.muted,textAlign:'center',padding:12,fontWeight:'600'}});
