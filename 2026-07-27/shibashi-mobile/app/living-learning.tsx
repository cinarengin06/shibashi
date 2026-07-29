import {Ionicons} from '@expo/vector-icons';
import {router} from 'expo-router';
import {ImageBackground,Pressable,StyleSheet,Text,View} from 'react-native';
import {Card,Eyebrow,ProgressBar,Screen,Title} from '../components/ui';
import {colors,radii} from '../constants/theme';
import {livingStories,livingStoryImages} from '../data/livingLearning';
import {movementImages} from '../data/movementAssets';
import {getShen} from '../data/fiveShen';
import {useApp} from '../store/AppStore';

export default function LivingLearning(){
 const{profile,completedStories}=useApp();const shen=getShen(profile.selectedShenId);const available=Math.min(18,Math.max(2,completedStories.length+1));
 return <Screen>
  <Pressable onPress={()=>router.back()} style={l.back}><Ionicons name="arrow-back" color={colors.cream} size={20}/><Text style={l.backText}>Pratiklere dön</Text></Pressable>
  <Eyebrow>YAŞAYARAK ÖĞREN · 18 HAREKET</Eyebrow>
  <Title>Hareketi ezberleme. Hikâyeyi yaşa.</Title>
  <Text style={l.lead}>Önce gündelik sahneyi hisset, sonra aynı hareketi bedeninle tamamla. Her hikâye bir Shibashi formunu hatırlanabilir bir ana bağlar.</Text>
  <Card style={[l.progress,{borderColor:`${shen.color}55`}]}>
   <View style={l.row}><View><Text style={[l.label,{color:shen.color}]}>YOLCULUĞUN</Text><Text style={l.progressTitle}>{completedStories.length} / 18 hikâye</Text></View><Text style={[l.percent,{color:shen.color}]}>{Math.round(completedStories.length/18*100)}%</Text></View>
   <ProgressBar value={completedStories.length/18*100} color={shen.color}/>
  </Card>
  <View style={l.list}>{livingStories.map(story=>{
   const complete=completedStories.includes(story.id),locked=story.order>available;
   const image=livingStoryImages[story.id]??movementImages[story.order];
   return <Pressable key={story.id} disabled={locked} onPress={()=>router.push({pathname:'/living-story/[id]',params:{id:story.id}})} style={({pressed})=>[pressed&&{opacity:.86}]}>
    <ImageBackground source={image} style={[l.story,locked&&{opacity:.48}]} imageStyle={l.storyImage}>
     <View style={l.shade}/>
     <View style={l.storyTop}><Text style={[l.order,{color:shen.color}]}>{String(story.order).padStart(2,'0')} / 18</Text>{complete?<View style={[l.done,{backgroundColor:shen.color}]}><Ionicons name="checkmark" size={13} color={colors.ink}/><Text style={l.doneText}>TAMAM</Text></View>:locked?<Ionicons name="lock-closed" size={17} color={colors.muted}/>:<Text style={l.duration}>{story.duration} DK</Text>}</View>
     <View><Text style={l.subtitle}>{story.subtitle}</Text><Text style={l.storyTitle}>{story.title}</Text><Text numberOfLines={2} style={l.quote}>“{story.quote}”</Text></View>
     <View style={l.storyBottom}><Text style={l.movement}>Hareket {story.order} · {story.movementId==='movement-1'?'Açılış Formu':'Shibashi'}</Text><Ionicons name={locked?'lock-closed':'arrow-forward-circle'} size={26} color={locked?colors.muted:shen.color}/></View>
    </ImageBackground>
   </Pressable>;
  })}</View>
 </Screen>;
}
const l=StyleSheet.create({
 back:{height:42,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:7},
 backText:{color:colors.muted,fontSize:13,fontWeight:'700'},
 lead:{color:colors.muted,fontSize:15,lineHeight:23,marginTop:-12},
 progress:{gap:11},
 row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 label:{fontSize:9,fontWeight:'900',letterSpacing:1.4},
 progressTitle:{color:colors.cream,fontSize:17,fontWeight:'800',marginTop:4},
 percent:{fontSize:19,fontWeight:'900'},
 list:{gap:14},
 story:{height:255,borderRadius:radii.lg,padding:17,justifyContent:'space-between',overflow:'hidden',borderWidth:1,borderColor:'rgba(243,235,221,.14)',shadowColor:'#000',shadowOpacity:.24,shadowRadius:18,shadowOffset:{width:0,height:10},elevation:5},
 storyImage:{borderRadius:radii.lg},
 shade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(3,13,11,.38)'},
 storyTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 order:{fontSize:10,fontWeight:'900',letterSpacing:1.2},
 duration:{color:colors.cream,fontSize:10,fontWeight:'900'},
 done:{flexDirection:'row',alignItems:'center',gap:4,borderRadius:radii.pill,paddingHorizontal:8,paddingVertical:5},
 doneText:{color:colors.ink,fontSize:8,fontWeight:'900'},
 subtitle:{color:colors.gold,fontSize:11,fontWeight:'800',letterSpacing:1},
 storyTitle:{color:colors.cream,fontSize:28,fontWeight:'800',marginTop:4,letterSpacing:-.5},
 quote:{color:colors.cream,fontSize:14,lineHeight:20,marginTop:7,maxWidth:'88%'},
 storyBottom:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 movement:{color:colors.muted,fontSize:11,fontWeight:'700'},
});
