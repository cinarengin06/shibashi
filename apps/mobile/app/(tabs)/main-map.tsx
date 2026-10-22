import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { shenThemes } from '../../../../packages/design-tokens';
import { gateProgress, gates, type GateId } from '../../../../packages/eight-gates';
import { meridianMovements } from '../../../../packages/meridian-knowledge';
import { shibashiPosters } from '../../data/shibashiMedia';
import { loadCompletedMovements } from '../../services/movementCompletion';
import { useApp } from '../../store/AppStore';

const order: GateId[] = ['peng','lu','kao','ji','zhou','an','lie','cai'];
const positions = [
  { left: '41%', top: '1%' }, { left: '73%', top: '17%' },
  { left: '8%', top: '17%' }, { left: '78%', top: '42%' },
  { left: '2%', top: '42%' }, { left: '73%', top: '70%' },
  { left: '8%', top: '70%' }, { left: '41%', top: '80%' },
] as const;

export default function MainMap() {
  const { profile, sessions, shenActivities } = useApp();
  const theme = shenThemes[profile.selectedShenId];
  const accent = theme.primary;
  const [completed, setCompleted] = useState<number[]>([]);
  const [selectedId, setSelectedId] = useState<GateId>('peng');
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadCompletedMovements(profile.authUserId).then((items) => { if (active) setCompleted(items); });
    return () => { active = false; };
  }, [profile.authUserId]));
  const completedOrders = useMemo(() => [...new Set([...completed, ...sessions.filter((session) => session.postureScore >= 70).map((session) => Number(session.practiceId.match(/^movement-(\d+)$/)?.[1])), ...shenActivities.filter((activity) => activity.type === 'practice' && activity.completed !== false).map((activity) => Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1]))].filter((order) => Number.isInteger(order) && order >= 1 && order <= 18))], [completed, sessions, shenActivities]);
  const progress = useMemo(() => gateProgress(completedOrders), [completedOrders]);
  const selected = progress.find((gate) => gate.id === selectedId) ?? progress[0];
  const cards = meridianMovements.filter((movement) => completedOrders.includes(movement.order)).slice(-3).reverse();
  const pct = Math.round((completedOrders.length / 18) * 100);

  return <SafeAreaView edges={['top']} style={s.safe}><ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
    <View style={s.header}><Text style={[s.brand,{color:accent}]}>◯</Text><View><Text style={s.brandName}>SHIBASHI</Text><Text style={s.brandSub}>ANA HARİTAM</Text></View><Pressable accessibilityLabel="18 harekete git" onPress={() => router.push('/body-lines')} style={[s.headerAction,{backgroundColor:accent}]}><Ionicons name="arrow-forward" color="#fff" size={20}/></Pressable></View>
    <View style={s.welcome}><Text style={s.welcomeTitle}>Merhaba {profile.name || 'Gezgin'}</Text><Text style={s.muted}>Bugün de dengeye bir adım daha.</Text></View>

    <View style={s.hero}><View style={s.heroCopy}><Text style={[s.kicker,{color:accent}]}>18 HAREKETLİK SERİ</Text><Text style={s.heroTitle}>Shibashi Pratiğin</Text><Text style={s.heroText}>Bedeni sakinleştir, nefesi dengele, kendi ritminde ilerle.</Text></View><View style={[s.ring,{borderColor:'#d5e5dc'}]}><View style={[s.ringArc,{borderTopColor:accent,borderRightColor:pct>=50?accent:'#d5e5dc',transform:[{rotate:`${Math.min(180,pct*1.8)}deg`}]}]}/><Text style={[s.ringValue,{color:accent}]}>{completedOrders.length}<Text style={s.ringTotal}> / 18</Text></Text><Text style={s.ringLabel}>tamamlandı</Text></View></View>

    <View style={s.card}><View style={s.row}><Text style={s.cardTitle}>18 Hareketlik İlerleme</Text><Text style={[s.counter,{color:accent}]}>{completedOrders.length} / 18</Text></View><View style={s.dots}>{meridianMovements.map((movement)=><View key={movement.order} accessibilityLabel={`${movement.order}. hareket ${completedOrders.includes(movement.order)?'tamamlandı':'bekliyor'}`} style={[s.dot,{backgroundColor:completedOrders.includes(movement.order)?accent:'#dce6df'}]}/>)}</View><Text style={s.muted}>{18-completedOrders.length ? `${18-completedOrders.length} hareket kaldı` : 'Seri tamamlandı'}</Text></View>

    <View style={s.sectionHead}><Text style={s.sectionTitle}>Tamamlanan Hareketler</Text><Pressable onPress={() => router.push('/body-lines')}><Text style={[s.link,{color:accent}]}>Tümü →</Text></Pressable></View>
    {cards.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cards}>{cards.map((movement)=><Pressable key={movement.order} onPress={()=>router.push(`/body-lines?movementOrder=${movement.order}`)} style={s.moveCard}><Image source={shibashiPosters[movement.order]} style={s.poster}/><Text style={s.moveNumber}>{String(movement.order).padStart(2,'0')}</Text><Text numberOfLines={2} style={s.moveTitle}>{movement.sourceTitle}</Text><Text style={[s.done,{color:accent}]}>✓ Tamamlandı</Text></Pressable>)}</ScrollView> : <View style={s.empty}><Text style={s.muted}>İlk hareketi tamamladığında burada görünecek.</Text><Pressable onPress={()=>router.push('/body-lines')}><Text style={[s.link,{color:accent}]}>İlk harekete başla →</Text></Pressable></View>}

    <View style={s.sectionHead}><Text style={s.sectionTitle}>8 Kapı Beden Haritan</Text></View><Text style={s.muted}>Kapılar, tamamladığın hareketlerin sembolik katkısını gösterir.</Text>
    <View style={s.map}><View style={s.mapHalo}/><Svg width={118} height={235} viewBox="0 0 130 260" style={s.body}><Circle cx="65" cy="28" r="16" fill="#b5cfc2"/><Path d="M48 50c-8 4-16 11-19 23L17 131c-2 8 8 11 12 5l19-47-2 46 6 43-12 63c-2 9 10 11 13 3l14-57 14 57c3 8 15 6 13-3l-12-63 6-43-2-46 19 47c4 6 14 3 12-5L101 73c-3-12-11-19-19-23-11 7-23 7-34 0Z" fill="#b5cfc2"/></Svg>{order.map((id,index)=>{const gate=progress.find((item)=>item.id===id)!;return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${gate.name} Kapısı, yüzde ${gate.percent}`} accessibilityState={{selected:selectedId===id}} onPress={()=>setSelectedId(id)} style={[s.gate,positions[index]]}><View style={[s.gateCircle,{borderColor:gate.percent?accent:'#dbe5de',borderWidth:selectedId===id?3:2}]}><Text style={[s.gateSymbol,{color:accent}]}>{gates[id].symbol}</Text></View><Text style={s.gateName}>{gate.name}</Text><Text style={[s.gatePercent,{color:accent}]}>%{gate.percent}</Text></Pressable>})}</View>
    <View style={s.detail}><Text style={[s.kicker,{color:accent}]}>SEÇİLİ KAPI</Text><Text style={s.detailTitle}>{selected.name} · %{selected.percent}</Text><Text style={s.muted}>{selected.cue}</Text><View style={s.track}><View style={[s.trackFill,{width:`${selected.percent}%`,backgroundColor:accent}]}/></View><Text style={s.muted}>{selected.mappedCount?`${selected.completedCount} / ${selected.mappedCount} ilişkili hareket tamamlandı`:'Henüz hareket eşleştirilmedi'}</Text></View>
    <Text style={s.disclaimer}>Bu yüzdeler yalnızca Shibashi hareket tamamlama katkısını gösterir; bedensel durum veya Taijiquan ustalığı ölçümü değildir.</Text>
    <Pressable onPress={()=>router.push('/(tabs)/journey' as Href)} style={s.detailLink}><Text style={[s.link,{color:accent}]}>Mevcut beden haritasını aç →</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#f5f7f2'},page:{padding:17,paddingBottom:45,gap:14},header:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:10},brand:{fontSize:35,lineHeight:38},brandName:{color:'#0d514d',fontSize:15,fontWeight:'900',letterSpacing:2},brandSub:{color:'#71918b',fontSize:10,fontWeight:'700',letterSpacing:1.6},headerAction:{marginLeft:'auto',width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'},welcome:{marginBottom:4},welcomeTitle:{color:'#0e514e',fontSize:22,fontWeight:'800'},muted:{color:'#5f8079',fontSize:13,lineHeight:19},hero:{backgroundColor:'#e8f0e9',borderRadius:20,borderWidth:1,borderColor:'#d9e6dc',padding:18,flexDirection:'row',alignItems:'center',gap:8,minHeight:160},heroCopy:{flex:1},kicker:{fontSize:10,fontWeight:'900',letterSpacing:1.3},heroTitle:{color:'#0e514e',fontSize:22,fontWeight:'900',marginTop:8},heroText:{color:'#426e67',fontSize:13,lineHeight:19,marginTop:6},ring:{width:100,height:100,borderRadius:50,borderWidth:7,alignItems:'center',justifyContent:'center',backgroundColor:'#f5f8f4'},ringArc:{position:'absolute',width:100,height:100,borderRadius:50,borderWidth:7,borderBottomColor:'transparent',borderLeftColor:'transparent'},ringValue:{fontSize:28,fontWeight:'900'},ringTotal:{fontSize:11},ringLabel:{color:'#52736d',fontSize:10},card:{backgroundColor:'#fff',borderRadius:17,borderWidth:1,borderColor:'#deebe2',padding:18,gap:13},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cardTitle:{color:'#0e514e',fontSize:16,fontWeight:'800'},counter:{fontSize:14,fontWeight:'900'},dots:{flexDirection:'row',flexWrap:'wrap',gap:8},dot:{width:14,height:14,borderRadius:7},sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:9},sectionTitle:{color:'#0e514e',fontSize:18,fontWeight:'900'},link:{fontSize:13,fontWeight:'800'},cards:{gap:10},moveCard:{width:150,backgroundColor:'#fff',borderWidth:1,borderColor:'#dce8e1',borderRadius:13,overflow:'hidden',paddingBottom:12},poster:{width:'100%',height:110},moveNumber:{position:'absolute',top:8,left:8,color:'#fff',backgroundColor:'rgba(13,81,77,.75)',fontWeight:'800',fontSize:12,paddingHorizontal:8,paddingVertical:3,borderRadius:10},moveTitle:{color:'#0e514e',fontSize:13,fontWeight:'800',paddingHorizontal:10,marginTop:9,minHeight:36},done:{fontSize:11,fontWeight:'700',paddingHorizontal:10,marginTop:4},empty:{backgroundColor:'#fff',borderRadius:13,padding:17,gap:8},map:{height:370,position:'relative',backgroundColor:'#fff',borderRadius:18,borderWidth:1,borderColor:'#deebe2',overflow:'hidden'},mapHalo:{position:'absolute',width:220,height:220,borderRadius:110,backgroundColor:'#edf3ec',alignSelf:'center',top:74},body:{position:'absolute',alignSelf:'center',top:68,opacity:.85},gate:{position:'absolute',width:64,alignItems:'center',gap:1},gateCircle:{width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:'#f6faf5'},gateSymbol:{fontSize:22},gateName:{color:'#0e514e',fontSize:11,fontWeight:'800'},gatePercent:{fontSize:10,fontWeight:'700'},detail:{backgroundColor:'#eaf3ec',borderWidth:1,borderColor:'#d9e7dc',borderRadius:15,padding:17,gap:8},detailTitle:{color:'#0e514e',fontSize:17,fontWeight:'900'},track:{height:6,backgroundColor:'#d4e2da',borderRadius:3,overflow:'hidden'},trackFill:{height:6,borderRadius:3},disclaimer:{color:'#69827a',fontSize:11,lineHeight:17},detailLink:{alignSelf:'flex-start',paddingVertical:7}});
