import {useState} from 'react';
import {Pressable,StyleSheet,Text,TextInput,View} from 'react-native';
import {Card,Eyebrow,PrimaryButton,Screen,Section,Title} from '../../components/ui';
import {colors,radii} from '../../constants/theme';
import {getShen} from '../../data/fiveShen';
import {useApp} from '../../store/AppStore';

export default function Journal(){
 const{profile,entries,sessions,addEntry}=useApp();const[mood,setMood]=useState(3),[note,setNote]=useState('');const shen=getShen(profile.selectedShenId);
 const save=()=>{if(!note.trim())return;addEntry({id:Date.now().toString(),date:new Date().toISOString(),mood,energy:mood*20,note:note.trim(),shenId:shen.id});setNote('')};
 return <Screen>
  <Eyebrow>GÜNÜN NOTU</Eyebrow><Title>Bugün içinde nasıl bir hava var?</Title>
  <Card style={[g.shenCue,{borderColor:`${shen.color}55`}]}><Text style={[g.symbol,{color:shen.color}]}>{shen.symbol}</Text><View style={{flex:1,gap:3}}><Text style={[g.shenName,{color:shen.color}]}>{shen.dailyName}</Text><Text style={g.muted}>{shen.task}</Text><Text style={g.term}>Geleneksel karşılığı: {shen.name} Shen</Text></View></Card>
  <Card style={{gap:15}}><Text style={g.label}>Şu anki ruh halin</Text><View style={g.moods}>{['●','◐','◉','◑','✦'].map((x,i)=><Pressable key={i} onPress={()=>setMood(i+1)} style={[g.mood,mood===i+1&&{backgroundColor:shen.color}]}><Text style={{color:mood===i+1?colors.ink:colors.muted,fontSize:20}}>{x}</Text></Pressable>)}</View><TextInput value={note} onChangeText={setNote} placeholder="Bedeninde veya zihninde bugün ne fark ettin?" placeholderTextColor={colors.muted} multiline style={g.input}/><PrimaryButton label="Günlüğe ekle" icon="add" onPress={save} disabled={!note.trim()}/></Card>
  <Section title="Bu hafta"><View style={g.stats}><Card style={g.stat}><Text style={g.value}>{sessions.length}</Text><Text style={g.muted}>Pratik</Text></Card><Card style={g.stat}><Text style={g.value}>{sessions.reduce((a,s)=>a+s.duration,0)}</Text><Text style={g.muted}>Dakika</Text></Card><Card style={g.stat}><Text style={g.value}>{entries.length}</Text><Text style={g.muted}>Not</Text></Card></View></Section>
  <Section title="Geçmiş notlar">{entries.length===0?<Card><Text style={g.muted}>İlk pratiğinden sonra hislerini burada göreceksin.</Text></Card>:entries.map(e=>{const entryShen=getShen(e.shenId);return <Card key={e.id} style={{gap:8}}><Text style={[g.date,{color:entryShen.color}]}>{new Date(e.date).toLocaleDateString('tr-TR',{day:'numeric',month:'long'})} · {entryShen.dailyName} · Canlılık {e.energy}%</Text><Text style={g.note}>{e.note}</Text></Card>})}</Section>
 </Screen>
}
const g=StyleSheet.create({shenCue:{flexDirection:'row',alignItems:'center',gap:13},symbol:{fontSize:31},shenName:{fontSize:14,fontWeight:'800'},term:{color:colors.gold,fontSize:10,marginTop:2},label:{color:colors.cream,fontWeight:'700'},moods:{flexDirection:'row',justifyContent:'space-between'},mood:{width:48,height:48,borderRadius:24,backgroundColor:colors.surface2,alignItems:'center',justifyContent:'center'},input:{minHeight:110,textAlignVertical:'top',borderRadius:radii.md,backgroundColor:colors.deep,color:colors.cream,padding:14,fontSize:15,lineHeight:22},stats:{flexDirection:'row',gap:8},stat:{flex:1,alignItems:'center',gap:3},value:{color:colors.gold,fontSize:25,fontWeight:'800'},muted:{color:colors.muted,fontSize:13,lineHeight:19},date:{fontSize:11,fontWeight:'800'},note:{color:colors.cream,fontSize:15,lineHeight:22}});
