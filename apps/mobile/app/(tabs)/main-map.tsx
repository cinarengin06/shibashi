import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getShenVisualTheme, shenThemes } from '../../../../packages/design-tokens';
import { BODY_GATE_ORDER, gateGuidance, gateProgress, movementGateWeights, type GateId } from '../../../../packages/eight-gates';
import { meridianMovements } from '../../../../packages/meridian-knowledge';
import { FormSceneThumb } from '../../components/FormSceneThumb';
import { FormMetaTags } from '../../components/FormMetaTags';
import { GateBodyMap } from '../../components/GateBodyMap';
import { Screen } from '../../components/ui';
import { loadCompletedMovements } from '../../services/movementCompletion';
import { unlockMilestones } from '../../services/milestones';
import { useApp } from '../../store/AppStore';

export default function MainMap() {
  const { profile, sessions, shenActivities } = useApp();
  const theme = shenThemes[profile.selectedShenId];
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const [completed, setCompleted] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<GateId | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    setSelectedId(null);
    void loadCompletedMovements(profile.authUserId).then((items) => { if (active) setCompleted(items); });
    return () => { active = false; };
  }, [profile.authUserId]));
  const completedOrders = useMemo(() => [...new Set([...completed, ...sessions.filter((session) => session.postureScore >= 70).map((session) => Number(session.practiceId.match(/^movement-(\d+)$/)?.[1])), ...shenActivities.filter((activity) => activity.type === 'practice' && activity.completed !== false).map((activity) => Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1]))].filter((order) => Number.isInteger(order) && order >= 1 && order <= 18))], [completed, sessions, shenActivities]);
  const progress = useMemo(() => gateProgress(completedOrders), [completedOrders]);
  const defaultGate = progress.reduce((best, gate) => gate.percent > best.percent || (gate.percent === best.percent && gate.completedCount > best.completedCount) ? gate : best, progress[0]);
  const selected = progress.find((gate) => gate.id === selectedId) ?? defaultGate;
  const related = meridianMovements.filter((movement) => Boolean(movementGateWeights[movement.order]?.[selected.id]));
  const activeGateNumber = BODY_GATE_ORDER.indexOf(defaultGate.id) + 1;

  return <Screen style={s.page}>
    <Text style={[s.sectionTitle,{color:visual.text}]}>8 Kapı Beden Haritan</Text>
    <View style={[bannerStyles.container,{backgroundColor:visual.surfaceRaised,borderColor:theme.button}]} accessibilityLiveRegion="polite"><Text style={[s.kicker,{color:theme.button}]}>ŞU ANKİ KAPIN</Text><Text style={[bannerStyles.title,{color:visual.text}]}>{activeGateNumber}. kapıdasın · {defaultGate.name}</Text><Text style={[s.muted,{color:visual.textSecondary}]}>{selected.id === defaultGate.id ? 'Diğer kapıları incelemek için haritaya dokun.' : `${BODY_GATE_ORDER.indexOf(selected.id) + 1}. kapıyı inceliyorsun; geri geldiğinde kendi kapın açılır.`}</Text></View>
    <GateBodyMap progress={progress} selectedGate={selected.id} onSelect={(id)=>{setSelectedId(id);void unlockMilestones(['gate-explorer'],profile.authUserId)}} accent={theme.button} ink="#F4F2EA"/>
    <View style={[s.detail,{backgroundColor:visual.surface,borderColor:visual.border}]}><Text style={[s.kicker,{color:theme.button}]}>{selected.id === defaultGate.id ? 'ŞU ANKİ KAPI' : 'İNCELEDİĞİN KAPI'} · {gateGuidance[selected.id].focus.toLocaleUpperCase('tr-TR')}</Text><Text style={[s.detailTitle,{color:visual.text}]}>{selected.name} · %{selected.percent}</Text><Text style={[s.muted,{color:visual.textSecondary}]}>{selected.cue}</Text><Text style={[s.muted,{color:visual.textSecondary}]}>{gateGuidance[selected.id].outcome}</Text><View style={s.track}><View style={[s.trackFill,{width:`${selected.percent}%`,backgroundColor:theme.button}]}/></View><Text style={[s.muted,{color:visual.textSecondary}]}>{selected.completedCount} / {selected.mappedCount} ilgili hareket tamamlandı</Text></View>
    <View style={s.sectionHead}><Text style={[s.sectionTitle,{color:visual.text}]}>{selected.name} · İlgili Hareketler</Text><Text style={[s.link,{color:theme.button}]}>{related.length} form</Text></View>
    {related.map(movement=><Pressable key={movement.order} accessibilityRole="button" onPress={()=>router.push(`/body-lines?movementOrder=${movement.order}`)} style={[s.related,{backgroundColor:visual.surface,borderColor:visual.border}]}><FormSceneThumb order={movement.order} width={64} height={68} accent={theme.button}/><View style={{flex:1}}><Text style={[s.kicker,{color:theme.button}]}>FORM {String(movement.order).padStart(2,'0')}</Text><Text style={[s.relatedTitle,{color:visual.text}]}>{movement.sourceTitle}</Text><FormMetaTags order={movement.order} compact/><Text style={[s.muted,{color:completedOrders.includes(movement.order)?'#A8DCB3':'#AAB9B4'}]}>{completedOrders.includes(movement.order)?'✓ Tamamlandı':'18 Form’da izle'}</Text></View></Pressable>)}
    <Text style={[s.disclaimer,{color:visual.textSecondary}]}>Bu yüzdeler yalnızca Shibashi hareket tamamlama katkısını gösterir; bedensel durum veya Taijiquan ustalığı ölçümü değildir.</Text>
  </Screen>;
}

const bannerStyles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 7 },
  title: { fontSize: 23, fontWeight: '900', lineHeight: 29 },
});

const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#172019'},page:{padding:17,paddingBottom:45,gap:14},header:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:10},brand:{fontSize:35,lineHeight:38},brandName:{color:'#F2EEE7',fontSize:15,fontWeight:'900',letterSpacing:2},brandSub:{color:'#A7ADA6',fontSize:10,fontWeight:'700',letterSpacing:1.6},headerAction:{marginLeft:'auto',width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'},welcome:{marginBottom:4},welcomeTitle:{color:'#F2EEE7',fontSize:22,fontWeight:'800'},muted:{color:'#A7ADA6',fontSize:13,lineHeight:19},hero:{backgroundColor:'#233025',borderRadius:20,borderWidth:1,borderColor:'#46543D',padding:18,flexDirection:'row',alignItems:'center',gap:8,minHeight:160},heroCopy:{flex:1},kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.3},heroTitle:{color:'#F2EEE7',fontSize:22,fontWeight:'900',marginTop:8},heroText:{color:'#D1DAAD',fontSize:13,lineHeight:19,marginTop:6},ring:{width:100,height:100,borderRadius:50,borderWidth:7,alignItems:'center',justifyContent:'center',backgroundColor:'#172019'},ringArc:{position:'absolute',width:100,height:100,borderRadius:50,borderWidth:7,borderBottomColor:'transparent',borderLeftColor:'transparent'},ringValue:{fontSize:28,fontWeight:'900'},ringTotal:{fontSize:11},ringLabel:{color:'#A7ADA6',fontSize:10},card:{backgroundColor:'#233025',borderRadius:17,borderWidth:1,borderColor:'#46543D',padding:18,gap:13},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cardTitle:{color:'#F2EEE7',fontSize:16,fontWeight:'800'},counter:{fontSize:14,fontWeight:'900'},dots:{flexDirection:'row',flexWrap:'wrap',gap:8},dot:{width:14,height:14,borderRadius:7},sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:9},sectionTitle:{color:'#F2EEE7',fontSize:18,fontWeight:'900'},link:{fontSize:13,fontWeight:'800'},cards:{gap:10},moveCard:{width:150,backgroundColor:'#233025',borderWidth:1,borderColor:'#46543D',borderRadius:13,overflow:'hidden',paddingBottom:12},poster:{width:'100%',height:110},moveNumber:{position:'absolute',top:8,left:8,color:'#fff',backgroundColor:'rgba(13,81,77,.75)',fontWeight:'800',fontSize:12,paddingHorizontal:8,paddingVertical:3,borderRadius:10},moveTitle:{color:'#F2EEE7',fontSize:13,fontWeight:'800',paddingHorizontal:10,marginTop:9,minHeight:36},done:{fontSize:11,fontWeight:'700',paddingHorizontal:10,marginTop:4},empty:{backgroundColor:'#233025',borderRadius:13,padding:17,gap:8},map:{height:520,position:'relative',backgroundColor:'#020605',borderRadius:18,borderWidth:1,borderColor:'#46543D',overflow:'hidden'},mapImage:{width:'100%',height:'100%'},mapShade:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,10,8,.25)'},related:{backgroundColor:'#233025',borderRadius:13,borderWidth:1,borderColor:'#46543D',padding:8,flexDirection:'row',alignItems:'center',gap:11,minHeight:84},relatedImage:{width:64,height:68,borderRadius:7},relatedTitle:{color:'#F2EEE7',fontSize:14,fontWeight:'800',marginVertical:3},mapHalo:{position:'absolute',width:220,height:220,borderRadius:110,backgroundColor:'#233025',alignSelf:'center',top:74},body:{position:'absolute',alignSelf:'center',top:68,opacity:.85},gate:{position:'absolute',width:64,alignItems:'center',gap:1},gateCircle:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:'#172019'},gateSymbol:{fontSize:22},gateName:{color:'#F2EEE7',fontSize:11,fontWeight:'800'},gatePercent:{fontSize:10,fontWeight:'700'},detail:{backgroundColor:'#233025',borderWidth:1,borderColor:'#46543D',borderRadius:15,padding:17,gap:8},detailTitle:{color:'#F2EEE7',fontSize:17,fontWeight:'900'},track:{height:6,backgroundColor:'#3A473B',borderRadius:3,overflow:'hidden'},trackFill:{height:6,borderRadius:3},disclaimer:{color:'#A7ADA6',fontSize:11,lineHeight:17},detailLink:{alignSelf:'flex-start',paddingVertical:7}});
