import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';
import {router} from 'expo-router';
import {ImageBackground,Pressable,ScrollView,StyleSheet,Text,View,type ImageSourcePropType} from 'react-native';
import {getJourneyDay} from '../../../../packages/experience-design';
import {Screen,ShenBackdrop} from '../../components/ui';
import {colors,fonts} from '../../constants/theme';
import {practices} from '../../data/content';
import {getShen} from '../../data/fiveShen';
import {useApp} from '../../store/AppStore';
import {fiveShen} from '../../data/fiveShen';
import {shenThemes} from '../../../../packages/design-tokens';
import {ShenId} from '../../types';

const shenTodayCopy:Record<ShenId,{
 action:string;
 body:string;
 identity:string;
 motto:string;
 shortLabel:string;
 title:string;
}>={
 hun:{action:'Yönünü bul',body:'Yönünü zorlamadan fark et. Bugün yeni bir ihtimale sakin bir adım aç.',identity:'Yönünü ve büyüme isteğini taşır',motto:'Rüzgâr yönü gösterir; adımı sen seçersin.',shortLabel:'Yön · Umut',title:'Ufku genişlet.'},
 shen:{action:'Birliğe dön',body:'Beden, nefes ve dikkat bugün aynı yerde buluşabilir.',identity:'Kalp açıklığını ve birlik duygusunu taşır',motto:'Kalp yumuşadığında parçalar birbirini duyar.',shortLabel:'Huzur · Birlik',title:'Bütünü bir araya getir.'},
 yi:{action:'Odağını kur',body:'Dağınık olanı sadeleştir. Şimdi yalnızca bir sonraki adımla kal.',identity:'Niyetini ve sakin dikkatini taşır',motto:'Bir anda tek şey; bir nefeste tek yön.',shortLabel:'Dikkat · Denge',title:'Dikkatini sadeleştir.'},
 po:{action:'Bedene dön',body:'Ayaklarını hisset, omuzlarını çöz. Nefesin güvene dönüşsün.',identity:'Bedensel duyumu ve bırakmayı taşır',motto:'Beden bıraktığında nefes yerini bulur.',shortLabel:'Güven · Beden',title:'Ağırlığını bırak.'},
 zhi:{action:'Kökünü hisset',body:'Acele etmeden devam et. Gücünü koruyarak en küçük adımı seç.',identity:'Sessiz iradeyi ve devam gücünü taşır',motto:'Derin su acele etmez; yine de yolunu bulur.',shortLabel:'Sessizlik · İrade',title:'Sessizce devam et.'},
};

const homePortalImages={
 posture:require('../../assets/posture/posture-back-translucent.png'),
 practice2:require('../../assets/practice2/static/03-raise-and-open.png'),
 living:require('../../assets/living-learning/curtains-opening.png'),
 humanMap:require('../../assets/journey/neijing-map.jpg'),
}satisfies Record<string,ImageSourcePropType>;

export default function Today(){
 const{profile,saveProfile,sessions,postureReports}=useApp();
 const shen=getShen(profile.selectedShenId);
 const todayCopy=shenTodayCopy[shen.id];
 const personality=shenThemes[shen.id];
 const heroGradient=shen.id==='hun'?['rgba(18,40,22,.08)','rgba(18,36,22,.68)','rgba(9,20,12,.98)']as const:shen.id==='shen'?['rgba(67,39,18,.06)','rgba(57,34,18,.66)','rgba(25,16,9,.98)']as const:shen.id==='yi'?['rgba(55,52,44,.06)','rgba(43,42,37,.7)','rgba(18,19,17,.98)']as const:shen.id==='po'?['rgba(55,35,24,.08)','rgba(48,31,22,.7)','rgba(24,16,12,.98)']as const:['rgba(16,38,54,.08)','rgba(15,34,48,.7)','rgba(7,17,25,.98)']as const;
 const practice=practices.find(item=>item.id===shen.practiceId)??practices[0];
 const journeyDay=getJourneyDay(profile.onboardingCheckin?.createdAt);
 const todayKey=new Date().toDateString();
 const todaySessions=sessions.filter(item=>new Date(item.date).toDateString()===todayKey);
 const completedMinutes=todaySessions.reduce((total,item)=>total+item.duration,0);
 const hasPracticedToday=todaySessions.length>0;
 const earnedXp=sessions.reduce((total,item)=>total+(item.xp??0),0);

 const startPractice=()=>{void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);router.push(`/practice-session?practiceId=${practice.id}`)};

 return <Screen style={[s.page,{backgroundColor:`${personality.surface}72`}]}><View style={s.header}><View><Text style={s.greeting}>Merhaba, {profile.name}</Text><Text style={s.date}>{formatToday()}</Text></View><View style={s.dayMark}><Text style={s.dayNumber}>{journeyDay}</Text><Text style={s.dayLabel}>GÜN</Text></View></View>

  <View style={[s.shenChooser,{borderColor:`${personality.primary}38`}]}>
   <Text style={[s.shenChooserLabel,{color:personality.light}]}>BUGÜN HANGİ ALAN SANA EŞLİK ETSİN?</Text>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.worldPicker}>
    {fiveShen.map(item=>{const itemPersonality=shenThemes[item.id];const active=item.id===shen.id;const copy=shenTodayCopy[item.id];return <Pressable accessibilityLabel={`${item.name}, ${copy.shortLabel}`} accessibilityRole="button" accessibilityState={{selected:active}} key={item.id} onPress={()=>{void Haptics.selectionAsync();saveProfile({selectedShenId:item.id})}} style={[s.worldChoice,{borderRadius:Math.min(18,itemPersonality.controlRadius),opacity:active?1:.62},active&&{backgroundColor:itemPersonality.surfaceRaised,borderColor:itemPersonality.primary,shadowColor:itemPersonality.primary,shadowOpacity:.42,shadowRadius:16,transform:[{translateY:-3}]}]}><View style={s.worldChoiceTop}><View style={[s.worldDot,{backgroundColor:itemPersonality.primary}]}/><Text style={[s.worldName,active&&{color:itemPersonality.light,fontFamily:itemPersonality.headingWeight==='600'?fonts.displayStrong:itemPersonality.headingWeight==='500'?fonts.displayMedium:fonts.displayRegular}]}>{item.name}</Text></View><Text style={[s.worldMeaning,active&&{color:itemPersonality.light}]}>({copy.shortLabel})</Text></Pressable>})}
   </ScrollView>
   <View style={[s.shenIdentity,{borderColor:`${shen.color}70`,backgroundColor:`${personality.surfaceRaised}EE`,borderRadius:Math.min(24,personality.controlRadius+8)}]}>
    <View style={[s.shenIdentitySymbol,{borderColor:shen.color,backgroundColor:`${shen.color}16`}]}><Text style={[s.shenIdentitySymbolText,{color:shen.color}]}>{shen.symbol}</Text></View>
    <View style={s.shenIdentityCopy}><Text style={s.shenIdentityTitle}><Text style={{color:shen.color}}>{shen.name}</Text> · {todayCopy.identity}</Text><Text style={s.shenIdentityMeta}>{shen.element}</Text></View>
   </View>
  </View>

  <View style={[s.hero,{borderColor:`${shen.color}A8`,borderRadius:personality.controlRadius===999?34:Math.max(14,personality.controlRadius),shadowColor:personality.primary}]}>
   <ShenBackdrop borderRadius={personality.controlRadius===999?34:Math.max(14,personality.controlRadius)}/>
   <LinearGradient colors={heroGradient} locations={[0,.44,1]} style={s.heroShade}>
    <View style={s.heroTop}><Text style={[s.kicker,{color:personality.light}]}>BUGÜN {shen.name.toLocaleUpperCase('tr-TR')} SENİNLE</Text><Text style={[s.layerName,{color:personality.light,backgroundColor:`${personality.dark}B8`}]}>{shen.dailyName}</Text></View>
    <View style={s.heroSpace}/>
    <View style={s.ritualMark}><View style={[s.ritualRing,{borderColor:shen.color}]}/><View style={[s.ritualPoint,{backgroundColor:shen.color}]}/></View>
    <Text style={[s.title,{color:personality.light,fontFamily:personality.headingWeight==='600'?fonts.displayStrong:personality.headingWeight==='500'?fonts.displayMedium:fonts.displayRegular,letterSpacing:shen.id==='zhi'?.5:shen.id==='yi'?-.4:shen.id==='shen'?.7:0}]}>{todayCopy.title}</Text>
    <Text style={s.body}>{todayCopy.body}</Text>
    <Text style={[s.motto,{borderLeftColor:shen.color}]}>“{todayCopy.motto}”</Text>
    <Pressable onPress={startPractice} style={[s.primary,{borderColor:personality.light,borderRadius:personality.controlRadius}]}><LinearGradient colors={[personality.light,personality.button]} start={{x:0,y:0}} end={{x:1,y:1}} style={[s.primaryInner,{borderRadius:personality.controlRadius}]}><Text style={[s.primaryText,{color:personality.buttonInk}]}>{hasPracticedToday?'Akışa yeniden dön':todayCopy.action}</Text><Ionicons name={personality.icon} color={personality.buttonInk} size={19}/></LinearGradient></Pressable>
    <Text style={s.practiceMeta}>{practice.duration} dakika · {shen.dailyName}</Text>
   </LinearGradient>
  </View>

  <View style={s.realProgress}>
   <View><Text style={s.progressValue}>{completedMinutes||'—'}</Text><Text style={s.progressLabel}>bugün dakika</Text></View>
   <View style={s.divider}/>
   <View><Text style={s.progressValue}>{sessions.length||'—'}</Text><Text style={s.progressLabel}>tamamlanan akış</Text></View>
   <View style={s.divider}/>
   <View><Text style={s.progressValue}>{postureReports.length||'—'}</Text><Text style={s.progressLabel}>beden izi</Text></View>
   <View style={s.divider}/>
   <View><Text style={[s.progressValue,{color:personality.primary}]}>{earnedXp}</Text><Text style={s.progressLabel}>gerçek XP</Text></View>
  </View>

  <View style={s.portalsHead}><Text style={[s.kicker,{color:personality.light}]}>KEŞİF ALANLARI</Text><Text style={s.sectionTitle}>Bugün nereye bakmak istersin?</Text></View>
  <View style={s.portalGrid}>
   <FeaturePortal accent={personality.primary} image={homePortalImages.posture} label="BEDEN AYNASI" note={postureReports.length?`Son ölçüm ${postureReports[0].score}`:'Duruş çizgini ölç'} onPress={()=>router.push('/posture')} title="Postür Analizi"/>
   <FeaturePortal accent={personality.primary} image={homePortalImages.practice2} label="HASSAS ÇALIŞMA" note="Hedef pozu kamerada eşleştir" onPress={()=>router.push('/(tabs)/pratik2')} title="Pratik 2" contain/>
   <FeaturePortal accent={personality.primary} image={homePortalImages.living} label="HİKÂYELİ HAREKET" note="Hareketi gündelik sahnede yaşa" onPress={()=>router.push('/living-learning')} title="Yaşayarak Öğren"/>
   <FeaturePortal accent={personality.primary} image={homePortalImages.humanMap} label="İÇ HARİTA" note="Bedenindeki sekiz kapıyı keşfet" onPress={()=>router.push({pathname:'/(tabs)/journey',params:{view:'map'}})} title="İnsan Haritası"/>
  </View>

  <Text style={s.closing}>“Yol, tek bir sakin adımla görünür olur.”</Text>
 </Screen>;
}

function FeaturePortal({accent,contain=false,image,label,note,onPress,title}:{accent:string;contain?:boolean;image:ImageSourcePropType;label:string;note:string;onPress:()=>void;title:string}){
 return <Pressable accessibilityLabel={`${title}. ${note}`} accessibilityRole="button" onPress={onPress} style={[s.portal,{borderColor:`${accent}48`}]}><ImageBackground imageStyle={[s.portalImage,contain&&s.portalImageContain]} resizeMode={contain?'contain':'cover'} source={image} style={s.portalBackground}><LinearGradient colors={['rgba(4,9,7,.04)','rgba(4,9,7,.28)','rgba(4,9,7,.96)']} locations={[0,.46,1]} style={s.portalShade}><View style={s.portalArrow}><Ionicons color={colors.cream} name="arrow-up-outline" size={15}/></View><View style={s.portalSpace}/><Text style={[s.portalLabel,{color:accent}]}>{label}</Text><Text numberOfLines={2} style={s.portalTitle}>{title}</Text><Text numberOfLines={2} style={s.portalNote}>{note}</Text></LinearGradient></ImageBackground></Pressable>;
}

function formatToday(){return new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}

const s=StyleSheet.create({
 page:{gap:22,paddingBottom:42},header:{alignItems:'center',flexDirection:'row',justifyContent:'space-between',paddingTop:6},greeting:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:25},date:{color:colors.muted,fontFamily:fonts.sans,fontSize:16,marginTop:3,textTransform:'capitalize'},dayMark:{alignItems:'center',borderColor:colors.line,borderRadius:24,borderWidth:1,height:48,justifyContent:'center',width:48},dayNumber:{color:colors.gold,fontFamily:fonts.metricStrong,fontSize:17},dayLabel:{color:colors.muted,fontFamily:fonts.sansBold,fontSize:12,letterSpacing:1.1},shenChooser:{borderBottomColor:colors.line,borderTopColor:colors.line,borderBottomWidth:1,borderTopWidth:1,gap:12,paddingVertical:14},shenChooserLabel:{color:colors.gold,fontFamily:fonts.sansBold,fontSize:13,letterSpacing:1.05},worldPicker:{gap:8,paddingRight:18,paddingTop:4},worldChoice:{alignItems:'flex-start',borderColor:colors.line,borderWidth:1,gap:5,justifyContent:'center',minHeight:70,paddingHorizontal:12,paddingVertical:10,width:122},worldChoiceTop:{alignItems:'center',flexDirection:'row',gap:7},worldDot:{borderRadius:5,height:10,width:10},worldName:{color:colors.cream,fontFamily:fonts.displayMedium,fontSize:18},worldMeaning:{color:colors.muted,fontFamily:fonts.sansMedium,fontSize:13},shenIdentity:{alignItems:'center',backgroundColor:'rgba(17,23,19,.74)',borderRadius:18,borderWidth:1,flexDirection:'row',gap:12,minHeight:76,padding:12},shenIdentitySymbol:{alignItems:'center',borderRadius:24,borderWidth:1,height:48,justifyContent:'center',width:48},shenIdentitySymbolText:{fontFamily:fonts.displayStrong,fontSize:22},shenIdentityCopy:{flex:1,gap:4},shenIdentityTitle:{color:colors.cream,fontFamily:fonts.sansMedium,fontSize:15,lineHeight:21},shenIdentityMeta:{color:colors.muted,fontFamily:fonts.sans,fontSize:13},hero:{borderRadius:30,borderWidth:1,minHeight:590,overflow:'hidden',shadowOpacity:.3,shadowRadius:24,shadowOffset:{width:0,height:12},elevation:5},heroShade:{flex:1,minHeight:590,padding:22},heroTop:{alignItems:'center',flexDirection:'row',justifyContent:'space-between'},kicker:{color:colors.gold,fontFamily:fonts.sansBold,fontSize:13,letterSpacing:1.2},layerName:{color:colors.ivory,fontFamily:fonts.sansMedium,fontSize:14,borderRadius:16,overflow:'hidden',paddingHorizontal:10,paddingVertical:6},heroSpace:{flex:1,minHeight:150},ritualMark:{alignItems:'center',alignSelf:'flex-start',height:48,justifyContent:'center',marginBottom:12,width:48},ritualRing:{borderLeftColor:'transparent',borderRadius:24,borderWidth:1.2,height:48,transform:[{rotate:'18deg'}],width:48},ritualPoint:{borderRadius:3,height:6,position:'absolute',width:6},title:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:39,lineHeight:42,maxWidth:320},body:{color:colors.cream,fontFamily:fonts.sans,fontSize:17,lineHeight:26,marginTop:12,maxWidth:315},motto:{borderLeftWidth:2,color:colors.ivory,fontFamily:fonts.displayMedium,fontSize:19,fontStyle:'italic',lineHeight:25,marginTop:18,paddingLeft:12},primary:{alignSelf:'stretch',borderWidth:1,marginTop:22,minHeight:56,overflow:'hidden'},primaryInner:{alignItems:'center',flex:1,flexDirection:'row',gap:10,justifyContent:'center',minHeight:56,paddingHorizontal:18},primaryText:{color:colors.ink,fontFamily:fonts.sansStrong,fontSize:17},practiceMeta:{color:colors.muted,fontFamily:fonts.sans,fontSize:14,letterSpacing:.3,marginTop:11,textAlign:'center'},realProgress:{alignItems:'center',borderBottomColor:colors.line,borderTopColor:colors.line,borderBottomWidth:1,borderTopWidth:1,flexDirection:'row',justifyContent:'space-around',paddingVertical:17},realProgressItem:{alignItems:'center'},progressValue:{color:colors.cream,fontFamily:fonts.metricStrong,fontSize:17,textAlign:'center'},progressLabel:{color:colors.muted,fontFamily:fonts.sans,fontSize:13,marginTop:3,textAlign:'center'},divider:{backgroundColor:colors.line,height:28,width:1},portalsHead:{gap:3,marginTop:2},sectionTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:28,marginBottom:8},portalGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},portal:{backgroundColor:colors.surface,borderRadius:22,borderWidth:1,flexBasis:'47%',flexGrow:1,height:224,overflow:'hidden'},portalBackground:{flex:1},portalImage:{borderRadius:21},portalImageContain:{backgroundColor:'#111713'},portalShade:{flex:1,padding:14},portalArrow:{alignItems:'center',alignSelf:'flex-end',backgroundColor:'rgba(8,13,10,.7)',borderColor:'rgba(242,238,231,.22)',borderRadius:17,borderWidth:1,height:34,justifyContent:'center',transform:[{rotate:'45deg'}],width:34},portalSpace:{flex:1},portalLabel:{fontFamily:fonts.sansBold,fontSize:11,letterSpacing:.85},portalTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:22,lineHeight:24,marginTop:4},portalNote:{color:colors.muted,fontFamily:fonts.sansMedium,fontSize:13,lineHeight:18,marginTop:5},closing:{color:'rgba(232,222,205,.52)',fontFamily:fonts.display,fontSize:17,fontStyle:'italic',lineHeight:24,paddingVertical:16,textAlign:'center'},
});
