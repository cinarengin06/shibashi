import {Ionicons} from '@expo/vector-icons';
import {router,useLocalSearchParams} from 'expo-router';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Animated,Image,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {breathingPatterns,calculateShenProgress,getMasterSentence,getPracticeForShen,getProgressLabel,getQuestionForShen,getShenRecommendation,masterSentences,shenProfiles,toDomainShenId,toLegacyShenId} from '../../../../packages/shen-domain';
import {Card,Eyebrow,PrimaryButton,ProgressBar,Screen,Title} from '../../components/ui';
import {colors,radii} from '../../constants/theme';
import {getShen} from '../../data/fiveShen';
import {baguaDirections,humanMapStages} from '../../data/journey';
import type {BaguaDirection} from '../../data/journey';
import {shibashiCoaches} from '../../data/coaches';
import {useApp} from '../../store/AppStore';

export default function Journey(){
 const params=useLocalSearchParams<{view?:string}>();
 const{profile,saveProfile,shenActivities,reflections,savedMasterSentences}=useApp();
 const[selected,setSelected]=useState(toDomainShenId(profile.selectedShenId));
 const progresses=useMemo(()=>shenProfiles.map(item=>calculateShenProgress(shenActivities,item.id)),[shenActivities]);
 const selectedProfile=shenProfiles.find(item=>item.id===selected)??shenProfiles[0];
 const progress=progresses.find(item=>item.shenId===selected)??progresses[0];
 const practice=getPracticeForShen(selected)[0];
 const question=getQuestionForShen(selected,reflections.length);
 const sentence=getMasterSentence(selected,progress.completedPractices);
 const breath=breathingPatterns.find(item=>item.id===practice.breathingPatternId);
 const recommendation=getShenRecommendation([...progresses]);
 const lastReflection=reflections[0];
 const lastSaved=savedMasterSentences[0]&&masterSentences.find(item=>item.id===savedMasterSentences[0].masterSentenceId);
 const[baguaIndex,setBaguaIndex]=useState(0);
 const[journeyView,setJourneyView]=useState<'bagua'|'map'|'guides'>(params.view==='map'?'map':'bagua');
 useEffect(()=>{if(params.view==='map'||params.view==='guides'||params.view==='bagua')setJourneyView(params.view)},[params.view]);
 const activeDirection=baguaDirections[baguaIndex]??baguaDirections[0];
 const openDirection=()=>{if(activeDirection.target==='practice')router.push('/(tabs)/practice');else if(activeDirection.target==='posture')router.push('/posture');else if(activeDirection.target==='journal')router.push('/(tabs)/journal');else if(activeDirection.target==='learning')router.push('/living-learning');else router.push('/(tabs)')};
 const choose=(id:typeof selected)=>{setSelected(id);saveProfile({selectedShenId:toLegacyShenId(id)})};
 return <Screen>
  <Eyebrow>BEŞ SHEN · İÇSEL YOLCULUK</Eyebrow>
  <Title>Bugün gelişimin hangi alanda destek istiyor?</Title>
  <Text style={s.lead}>{recommendation}</Text>
  <View style={s.journeyTabs}>{[['bagua','Bagua','compass-outline'],['map','İnsan','body-outline'],['guides','Rehberler','people-outline']].map(([id,label,icon])=><Pressable accessibilityRole="tab" key={id} onPress={()=>setJourneyView(id as typeof journeyView)} style={[s.journeyTab,journeyView===id&&{borderColor:selectedProfile.primaryColor,backgroundColor:`${selectedProfile.primaryColor}18`}]}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} color={journeyView===id?selectedProfile.primaryColor:colors.muted} size={18}/><Text numberOfLines={1} style={[s.journeyTabText,journeyView===id&&{color:selectedProfile.primaryColor}]}>{label}</Text></Pressable>)}</View>
  {journeyView==='map'?<HumanMapMobile accent={selectedProfile.primaryColor}/>:journeyView==='guides'?<GuidesMobile/>:<>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.shenRail}>
   {shenProfiles.map(item=>{const itemProgress=progresses.find(value=>value.shenId===item.id)!;const active=item.id===selected;return <Pressable key={item.id} onPress={()=>choose(item.id)} style={[s.shenCard,active&&{borderColor:item.primaryColor,backgroundColor:item.darkColor}]}>
    <Text style={[s.shenName,{color:active?item.lightColor:colors.cream}]}>{item.name}</Text>
    <Text style={s.shenMeaning}>{item.shortMeaning}</Text>
    <Text style={[s.shenStatus,{color:active?item.lightColor:colors.muted}]}>{getProgressLabel(itemProgress)}</Text>
   </Pressable>})}
  </ScrollView>
  <Card style={[s.baguaCard,{borderColor:`${activeDirection.color}66`}]}>
   <View style={s.baguaHeading}><View style={s.flex}><Text style={[s.kicker,{color:activeDirection.color}]}>YAŞAYAN PUSULA</Text><Text style={s.baguaTitle}>Bugün hangi yöne dönüyorsun?</Text><Text style={s.muted}>Sekiz yön, tek merkez. Çarkı seçerek günlük alanını aç.</Text></View><View style={[s.baguaBadge,{borderColor:`${activeDirection.color}66`}]}><Text style={[s.baguaBadgeText,{color:activeDirection.color}]}>8 YÖN</Text></View></View>
   <BaguaWheel active={baguaIndex} accent={activeDirection.color} onSelect={setBaguaIndex}/>
   <View style={s.baguaSelected}><View style={s.flex}><Text style={[s.baguaSelectedLabel,{color:activeDirection.color}]}>{activeDirection.trigram} · {activeDirection.name} · {activeDirection.element}</Text><Text style={s.baguaSelectedTitle}>{activeDirection.module}</Text><Text style={s.muted}>{activeDirection.cue}</Text></View><Pressable onPress={openDirection} style={[s.baguaArrow,{backgroundColor:activeDirection.color}]}><Ionicons name="arrow-forward" color={colors.ink} size={19}/></Pressable></View>
  </Card>
  <Card style={[s.detail,{borderColor:`${selectedProfile.primaryColor}66`}]}>
   <View style={s.row}><View style={s.flex}><Text style={[s.kicker,{color:selectedProfile.primaryColor}]}>BUGÜNÜN ALANI</Text><Text style={s.detailTitle}>{selectedProfile.name} · {selectedProfile.shortMeaning}</Text></View><Pressable onPress={()=>router.push(`/shen/${toLegacyShenId(selected)}`)}><Ionicons name="arrow-forward-circle-outline" color={selectedProfile.primaryColor} size={30}/></Pressable></View>
   <Text style={s.body}>{selectedProfile.description}</Text>
   <View style={s.progressRow}><Text style={s.muted}>{getProgressLabel(progress)}</Text><Text style={[s.level,{color:selectedProfile.primaryColor}]}>Seviye {progress.level}</Text></View>
   <ProgressBar value={Object.values(progress.dimensions).reduce((a,b)=>a+b,0)/6} color={selectedProfile.primaryColor}/>
   <View style={s.miniGrid}><Mini label="Pratik" value={`${progress.completedPractices}`}/><Mini label="Dakika" value={`${progress.practiceMinutes}`}/><Mini label="Yansıma" value={`${progress.reflectionCount}`}/></View>
  </Card>
  <Card style={s.practice}>
   <View style={s.practiceIcon}><Ionicons name="play" color={selectedProfile.primaryColor} size={22}/></View>
   <View style={s.flex}><Text style={s.cardLabel}>BUGÜNKÜ PRATİK</Text><Text style={s.cardTitle}>{practice.title}</Text><Text style={s.muted}>{practice.durationMinutes} dk · {practice.movementQualityIds.join(' · ')}</Text></View>
  </Card>
  <PrimaryButton label="Bugünkü pratiği başlat" icon="play" onPress={()=>router.push({pathname:'/practice-session',params:{practiceId:practice.id,shenId:toLegacyShenId(selected)}})}/>
  <Card style={s.breath}><Ionicons name="water-outline" color={selectedProfile.primaryColor} size={22}/><View style={s.flex}><Text style={s.cardLabel}>NEFES RİTMİ</Text><Text style={s.cardTitle}>{breath?.name}</Text><Text style={s.muted}>{breath?.instruction}</Text></View></Card>
  <Card style={s.quote}><Text style={[s.cardLabel,{color:selectedProfile.primaryColor}]}>USTADAN BİR CÜMLE</Text><Text style={s.quoteText}>“{sentence.text}”</Text><Pressable onPress={()=>router.push('/master-notebook')}><Text style={[s.link,{color:selectedProfile.primaryColor}]}>Ustanın Defteri →</Text></Pressable></Card>
  <Card style={s.question}><Text style={s.cardLabel}>BUGÜNÜN SORUSU</Text><Text style={s.questionText}>{question.text}</Text><PrimaryButton label="Kısa yanıt ekle" icon="create-outline" onPress={()=>router.push({pathname:'/reflection',params:{shenId:selected,questionId:question.id,practiceId:practice.id,masterSentenceId:sentence.id}})}/></Card>
  <View style={s.latest}><Text style={s.latestTitle}>Son izler</Text><Text style={s.muted}>{lastReflection?.responseText||lastReflection?.selectedFeeling||'Henüz kısa bir yansıma yok.'}</Text><Text style={s.muted}>{lastSaved?`Son kaydedilen cümle: “${lastSaved.text}”`:'Ustanın Defteri henüz boş.'}</Text></View>
  </>}
 </Screen>;
}
function HumanMapMobile({accent}:{accent:string}){
 const[activeIndex,setActiveIndex]=useState(0);
 const stage=humanMapStages[activeIndex]??humanMapStages[0];
 const progress=Math.round(((activeIndex+1)/humanMapStages.length)*100);
 return <View style={s.subPage}>
  <Eyebrow>İÇ HARİTA · {progress}% AÇIK</Eyebrow><Title>Kapılar yolu</Title><Text style={s.lead}>Bedenindeki sekiz alanı tek tek keşfet. Bir kapıya dokun, o bölgenin günlük hayattaki karşılığını gör.</Text>
  <Card style={[s.mapCard,{borderColor:`${accent}66`}]}><View style={s.mapStage}><Image source={require('../../assets/journey/neijing-map.jpg')} resizeMode="cover" style={s.mapImage}/><View style={s.mapShade}/>{humanMapStages.map((item,index)=><Pressable accessibilityRole="button" key={item.id} onPress={()=>setActiveIndex(index)} style={[s.mapHotspot,{left:`${item.x}%`,top:`${item.y}%`},index===activeIndex&&{borderColor:accent,backgroundColor:`${accent}dd`,shadowColor:accent}]}><Text style={[s.mapHotspotText,index===activeIndex&&{color:colors.ink}]}>{index+1}</Text></Pressable>)}</View><View style={s.mapProgress}><Text style={s.muted}>Kapı {activeIndex+1} / {humanMapStages.length}</Text><Text style={[s.mapProgressValue,{color:accent}]}>{progress}% keşfedildi</Text></View><ProgressBar value={progress} color={accent}/></Card>
  <Card style={[s.mapInfo,{borderColor:`${accent}55`}]}><View style={s.mapInfoTop}><View style={s.flex}><Text style={[s.kicker,{color:accent}]}>AKTİF KAPI</Text><Text style={s.mapTitle}>{stage.title}</Text></View><Text style={[s.mapReward,{color:accent}]}>{stage.reward}</Text></View><Text style={s.body}>{stage.text}</Text><View style={s.benefitGrid}>{stage.benefits.map(item=><View key={item} style={s.benefit}><Ionicons name="checkmark" color={accent} size={14}/><Text style={s.benefitText}>{item}</Text></View>)}</View><View style={s.dailyNote}><Text style={[s.kicker,{color:accent}]}>GÜNLÜK HAYATTA</Text><Text style={s.body}>{stage.dailyUse}</Text></View><View style={s.dailyNote}><Text style={[s.kicker,{color:accent}]}>MİNİ PRATİK</Text><Text style={s.body}>{stage.microPractice}</Text></View><View style={s.mapActions}><Pressable disabled={activeIndex===0} onPress={()=>setActiveIndex(value=>Math.max(0,value-1))} style={[s.mapAction,activeIndex===0&&s.disabled]}><Text style={s.mapActionText}>Önceki</Text></Pressable><Pressable onPress={()=>setActiveIndex(value=>(value+1)%humanMapStages.length)} style={[s.mapActionPrimary,{backgroundColor:accent}]}><Text style={s.mapActionPrimaryText}>Sonraki kapı</Text><Ionicons name="arrow-forward" color={colors.ink} size={16}/></Pressable></View></Card>
 </View>;
}

function GuidesMobile(){
 const[activeId,setActiveId]=useState(shibashiCoaches[0].id);
 const coach=shibashiCoaches.find(item=>item.id===activeId)??shibashiCoaches[0];
 return <View style={s.subPage}><Eyebrow>YOLCULUK REHBERİNİ SEÇ</Eyebrow><Title>8 Ölümsüz Rehber</Title><Text style={s.lead}>Bugün ihtiyacın olan tona göre bir rehber seç. İstersen onunla konuş, istersen pratiğe geç.</Text><View style={s.coachGrid}>{shibashiCoaches.map(item=>{const active=item.id===activeId;const color=getShen(item.shenId).color;return <Pressable accessibilityRole="button" key={item.id} onPress={()=>setActiveId(item.id)} style={[s.coachChoice,active&&{borderColor:color,backgroundColor:`${color}18`}]}><Text style={[s.coachIcon,{color}]}>{item.icon}</Text><Text numberOfLines={1} style={s.coachName}>{item.name.split(' ')[0]}</Text><Text numberOfLines={1} style={s.coachRole}>{item.role.split(' ve ')[0]}</Text></Pressable>})}</View><Card style={s.coachCard}><View style={s.coachHero}><View style={[s.coachAvatar,{borderColor:getShen(coach.shenId).color}]}><Text style={[s.coachAvatarText,{color:getShen(coach.shenId).color}]}>{coach.icon}</Text></View><View style={s.flex}><Text style={s.coachNameLarge}>{coach.name}</Text><Text style={s.coachRoleLarge}>{coach.role}</Text></View></View><Text style={s.coachIntro}>“{coach.intro}”</Text><View style={s.coachTags}>{coach.voice.map(item=><Text key={item} style={s.coachTag}>{item}</Text>)}</View><PrimaryButton label="Rehberle konuş" icon="chatbubble-ellipses-outline" onPress={()=>router.push({pathname:'/coaches',params:{coach:coach.id}})}/></Card><Text style={s.legacyNote}>Gelenekte bu sekiz karakter “Sekiz Ölümsüz” hikâyeleriyle anlatılır; uygulamada onları günlük hayatına eşlik eden rehberler olarak kullanabilirsin.</Text></View>;
}
function BaguaWheel({active,accent,onSelect}:{active:number;accent:string;onSelect:(index:number)=>void}){
 const spin=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const loop=Animated.loop(Animated.timing(spin,{toValue:1,duration:36000,useNativeDriver:true}));loop.start();return()=>loop.stop()},[spin]);
 const rotate=spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']});
 const reverse=spin.interpolate({inputRange:[0,1],outputRange:['0deg','-360deg']});
 const selected=baguaDirections[active]??baguaDirections[0];
 return <View style={[s.baguaWheel,{borderColor:`${accent}55`}]}>
  <Animated.View pointerEvents="none" style={[s.baguaOrbit,s.baguaOrbitOuter,{transform:[{rotate}]}]}/>
  <Animated.View pointerEvents="none" style={[s.baguaOrbit,s.baguaOrbitInner,{transform:[{rotate:reverse}]}]}/>
  <View
   style={[s.baguaDisc,{borderColor:`${accent}66`}]}
  >
   {baguaDirections.map((direction,index)=>(
    <BaguaDirectionNode
     active={index===active}
     direction={direction}
     index={index}
     key={direction.id}
     onSelect={onSelect}
    />
   ))}
   <View style={[s.baguaCenter,{borderColor:accent,shadowColor:accent}]}><Text style={s.baguaTaiji}>☯</Text><Text style={[s.baguaCenterName,{color:accent}]}>{selected.name}</Text><Text style={s.baguaCenterModule}>{selected.module}</Text><Text style={s.baguaCenterHint}>SEÇİLİ YÖN</Text></View>
  </View>
  <View pointerEvents="none" style={[s.baguaPointer,{borderTopColor:accent}]}/>
 </View>;
}
function BaguaDirectionNode({active,direction,index,onSelect}:{active:boolean;direction:BaguaDirection;index:number;onSelect:(index:number)=>void}){
 const angle=index*45-90;
 const radians=angle*Math.PI/180;
 const position={left:`${50+Math.cos(radians)*38}%` as `${number}%`,top:`${50+Math.sin(radians)*38}%` as `${number}%`};
 return <Pressable
  accessibilityLabel={`${direction.name} ${direction.element}`}
  accessibilityRole="button"
  onPress={()=>onSelect(index)}
  style={[s.baguaNode,position,active&&{borderColor:direction.color,backgroundColor:`${direction.color}22`}]}
 >
  <Text style={[s.baguaNodeTrigram,{color:active?direction.color:colors.cream}]}>{direction.trigram}</Text>
  <Text numberOfLines={1} style={s.baguaNodeName}>{direction.name}</Text>
  <Text numberOfLines={1} style={s.baguaNodeElement}>{direction.element}</Text>
 </Pressable>;
}
function Mini({label,value}:{label:string;value:string}){return <View style={s.mini}><Text style={s.miniValue}>{value}</Text><Text style={s.miniLabel}>{label}</Text></View>}
const s=StyleSheet.create({lead:{color:colors.muted,fontSize:17,lineHeight:28,marginTop:-10},journeyTabs:{flexDirection:'row',gap:7},journeyTab:{flex:1,minHeight:52,borderRadius:14,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',gap:3,paddingHorizontal:4},journeyTabText:{color:colors.muted,fontSize:13,fontWeight:'900',textAlign:'center'},subPage:{gap:14},shenRail:{gap:8,paddingRight:20},shenCard:{width:150,minHeight:112,borderRadius:radii.lg,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,padding:14,justifyContent:'space-between'},shenName:{fontSize:22,fontFamily:'Newsreader_600SemiBold'},shenMeaning:{color:colors.cream,fontSize:17},shenStatus:{fontSize:14,lineHeight:25},baguaCard:{gap:14,padding:14},baguaHeading:{flexDirection:'row',alignItems:'flex-start',gap:10},baguaTitle:{color:colors.cream,fontSize:21,fontFamily:'Newsreader_600SemiBold',marginTop:4},baguaBadge:{borderWidth:1,borderRadius:16,paddingHorizontal:9,paddingVertical:7},baguaBadgeText:{fontSize:13,fontWeight:'900',letterSpacing:1},baguaWheel:{width:'100%',aspectRatio:1,alignSelf:'center',maxWidth:370,position:'relative',alignItems:'center',justifyContent:'center'},baguaOrbit:{position:'absolute',borderRadius:999},baguaOrbitOuter:{top:2,left:2,right:2,bottom:2,borderWidth:1,borderColor:'rgba(243,207,139,.5)',borderStyle:'dashed'},baguaOrbitInner:{top:'11%',left:'11%',right:'11%',bottom:'11%',borderWidth:1,borderColor:'rgba(243,207,139,.3)'},baguaDisc:{position:'absolute',top:'13%',left:'13%',right:'13%',bottom:'13%',borderRadius:999,borderWidth:1,backgroundColor:'#0D1712',alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.5,shadowRadius:20,shadowOffset:{width:0,height:8},elevation:4},baguaNode:{position:'absolute',width:68,height:68,marginLeft:-34,marginTop:-34,borderRadius:34,borderWidth:1,borderColor:'rgba(242,238,231,.18)',backgroundColor:'rgba(12,20,15,.95)',alignItems:'center',justifyContent:'center',paddingHorizontal:3,gap:1},baguaNodeTrigram:{fontSize:19,fontFamily:'Newsreader_600SemiBold',lineHeight:26},baguaNodeName:{color:colors.cream,fontSize:12,fontWeight:'900',letterSpacing:.4,textTransform:'uppercase'},baguaNodeElement:{color:colors.muted,fontSize:12},baguaCenter:{position:'absolute',width:'36%',height:'36%',borderRadius:999,borderWidth:1,backgroundColor:'#0B120E',alignItems:'center',justifyContent:'center',shadowOpacity:.35,shadowRadius:18},baguaTaiji:{color:'#F6DCA7',fontSize:42,lineHeight:43,textShadowColor:'#C6A56A',textShadowRadius:14},baguaCenterName:{fontSize:13,fontWeight:'900',letterSpacing:1,textTransform:'uppercase'},baguaCenterModule:{color:colors.cream,fontSize:14,fontWeight:'800',marginTop:2},baguaCenterHint:{color:colors.muted,fontSize:12,letterSpacing:1.4,marginTop:3},baguaPointer:{position:'absolute',top:-2,left:'50%',marginLeft:-4,width:0,height:0,borderLeftWidth:4,borderRightWidth:4,borderTopWidth:8,borderLeftColor:'transparent',borderRightColor:'transparent',borderStyle:'solid'},baguaSelected:{flexDirection:'row',alignItems:'center',gap:10,borderTopWidth:1,borderTopColor:colors.line,paddingTop:13},baguaSelectedLabel:{fontSize:13,fontWeight:'900',letterSpacing:1.1},baguaSelectedTitle:{color:colors.cream,fontSize:17,fontWeight:'800',marginTop:3},baguaArrow:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center'},mapCard:{gap:12,padding:12},mapStage:{height:390,borderRadius:18,overflow:'hidden',position:'relative',backgroundColor:colors.deep},mapImage:{width:'100%',height:'100%'},mapShade:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'rgba(4,10,8,.28)'},mapHotspot:{position:'absolute',width:36,height:36,marginLeft:-18,marginTop:-18,borderRadius:18,borderWidth:1,borderColor:'rgba(242,238,231,.55)',backgroundColor:'rgba(10,18,13,.9)',alignItems:'center',justifyContent:'center',shadowOpacity:.25,shadowRadius:8},mapHotspotText:{color:colors.cream,fontSize:14,fontWeight:'900'},mapProgress:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},mapProgressValue:{fontSize:14,fontWeight:'900'},mapInfo:{gap:13},mapInfoTop:{flexDirection:'row',alignItems:'flex-start',gap:10},mapTitle:{color:colors.cream,fontSize:24,fontFamily:'Newsreader_600SemiBold',marginTop:4},mapReward:{fontSize:14,fontWeight:'900',textAlign:'right',maxWidth:110},benefitGrid:{gap:7},benefit:{flexDirection:'row',alignItems:'center',gap:7},benefitText:{color:colors.cream,fontSize:17},dailyNote:{gap:4,borderTopWidth:1,borderTopColor:colors.line,paddingTop:10},mapActions:{flexDirection:'row',gap:8},mapAction:{flex:1,minHeight:48,borderRadius:13,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},mapActionPrimary:{flex:1,minHeight:48,borderRadius:13,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'},mapActionText:{color:colors.muted,fontSize:17,fontWeight:'800'},mapActionPrimaryText:{color:colors.ink,fontSize:17,fontWeight:'900'},disabled:{opacity:.35},coachGrid:{flexDirection:'row',flexWrap:'wrap',gap:7},coachChoice:{width:'23%',minHeight:76,borderRadius:15,borderWidth:1,borderColor:colors.line,backgroundColor:colors.surface,alignItems:'center',justifyContent:'center',gap:3,paddingHorizontal:3},coachIcon:{fontSize:24},coachName:{color:colors.cream,fontSize:13,fontWeight:'800'},coachRole:{color:colors.muted,fontSize:12,textAlign:'center'},coachCard:{gap:13},coachHero:{flexDirection:'row',alignItems:'center',gap:11},coachAvatar:{width:58,height:58,borderRadius:29,borderWidth:1,backgroundColor:colors.deep,alignItems:'center',justifyContent:'center'},coachAvatarText:{fontSize:29},coachNameLarge:{color:colors.cream,fontSize:21,fontFamily:'Newsreader_600SemiBold'},coachRoleLarge:{color:colors.muted,fontSize:16,marginTop:2},coachIntro:{color:colors.cream,fontSize:16,lineHeight:24,fontStyle:'italic'},coachTags:{flexDirection:'row',flexWrap:'wrap',gap:5},coachTag:{color:colors.muted,fontSize:13,borderWidth:1,borderColor:colors.line,borderRadius:99,paddingHorizontal:8,paddingVertical:5},legacyNote:{color:colors.muted,fontSize:17,lineHeight:28,paddingHorizontal:3},detail:{gap:13},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},flex:{flex:1},kicker:{fontSize:13,fontWeight:'900',letterSpacing:1.3},detailTitle:{color:colors.cream,fontSize:21,fontFamily:'Newsreader_600SemiBold',marginTop:4},body:{color:colors.muted,fontSize:16,lineHeight:26},progressRow:{flexDirection:'row',justifyContent:'space-between'},muted:{color:colors.muted,fontSize:17,lineHeight:28},level:{fontSize:14,fontWeight:'800'},miniGrid:{flexDirection:'row',gap:8},mini:{flex:1,backgroundColor:colors.deep,borderRadius:12,padding:10},miniValue:{color:colors.cream,fontSize:18,fontWeight:'800'},miniLabel:{color:colors.muted,fontSize:13,marginTop:2},practice:{flexDirection:'row',alignItems:'center',gap:12},practiceIcon:{width:48,height:48,borderRadius:24,backgroundColor:colors.deep,alignItems:'center',justifyContent:'center'},cardLabel:{color:colors.gold,fontSize:13,fontWeight:'900',letterSpacing:1.2},cardTitle:{color:colors.cream,fontSize:16,fontWeight:'700',marginTop:3},breath:{flexDirection:'row',gap:12,alignItems:'center'},quote:{gap:10},quoteText:{color:colors.cream,fontSize:19,lineHeight:28,fontFamily:'Newsreader_600SemiBold'},link:{fontSize:17,fontWeight:'800'},question:{gap:12},questionText:{color:colors.cream,fontSize:17,lineHeight:25},latest:{gap:7,paddingHorizontal:4,paddingBottom:12},latestTitle:{color:colors.cream,fontSize:17,fontWeight:'700'}});
