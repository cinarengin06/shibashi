import AsyncStorage from "@react-native-async-storage/async-storage";
import { dailyShenDate, dailyShenQuestions, recommendDailyShen, type DailyShenId } from "../../../../packages/daily-shen-checkin";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { getShenVisualTheme, shenThemes } from "../../../../packages/design-tokens";
import { BODY_GATE_ORDER, gateProgress } from "../../../../packages/eight-gates";
import { journeyRewards, shenDailyCues, yinYangSummary, type FormSteps, type JourneyRecord } from "../../../../packages/gamification";
import { Screen } from "../../components/ui";
import { FormMetaTags } from "../../components/FormMetaTags";
import { HomeBodyJourneyMap } from "../../components/HomeBodyJourneyMap";
import { fonts, mobileThemeFont } from "../../constants/theme";
import { shenMotifs, shenShape } from "../../constants/shenDesign";
import { fiveShen } from "../../data/fiveShen";
import { shenBackgrounds } from "../../data/shenAssets";
import { shibashiPosters } from "../../data/shibashiMedia";
import { shenIcons } from "../../data/shenIcons";
import { loadCompletedMovements, loadMovementCompletionRecords } from "../../services/movementCompletion";
import { loadFormSteps } from "../../services/formSteps";
import { loadMovementPracticeRecords, markMovementPracticed } from "../../services/movementPractice";
import { ensureSystemNotifications } from "../../services/notifications/NotificationInbox";
import { loadShibashiPhotos, type ShibashiPhoto } from "../../services/shibashiPhotos";
import { useApp } from "../../store/AppStore";
import { useShenExperience } from "../../store/ShenExperience";
import type { PracticeSession, ShenId } from "../../types";

const copy: Record<ShenId, { title: string; cue: string; label: string }> = {
  hun: { title: "Yönünü hisset.", cue: "Bugünün adımına alan aç.", label: "Yön ve Hayal" },
  shen: { title: "Berrak ve ilgili kal.", cue: "Bakışını yumuşat, anda kal.", label: "Berrak Farkındalık" },
  yi: { title: "Bir şeye odaklan.", cue: "Bugün küçük ve net bir niyet seç.", label: "Odaklı Niyet" },
  po: { title: "Nefesine dön.", cue: "Bedenindeki duyumu sakince fark et.", label: "Nefes ve Duyum" },
  zhi: { title: "Sessizce devam et.", cue: "Gücünü tüketmeden, küçük bir adımla ilerle.", label: "Sessiz İrade" },
};

function practiceStreak(sessions: PracticeSession[]) {
  const days = new Set(sessions.map((item) => new Date(item.date).toDateString()));
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(cursor.toDateString())) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export default function Today() {
  const { profile, saveProfile, sessions, entries, shenActivities, postureReports } = useApp();
  const { shen } = useShenExperience();
  const theme = shenThemes[shen.id];
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const daily = copy[shen.id];
  const [shenQuestion, setShenQuestion] = useState(-1);
  const [shenAnswers, setShenAnswers] = useState<DailyShenId[]>([]);
  useFocusEffect(useCallback(() => {
    if (!profile.onboardingDone) {
      setShenQuestion(-1);
      return;
    }
    let active = true;
    void AsyncStorage.getItem("shibashi-daily-shen-date").then(date => {
      if (active) setShenQuestion(date === dailyShenDate() ? -1 : 0);
    });
    return () => { active = false; };
  }, [profile.onboardingDone]));
  const [photos, setPhotos] = useState<ShibashiPhoto[]>([]);
  const [completedMovementOrders, setCompletedMovementOrders] = useState<number[]>([]);
  const [completionRecords, setCompletionRecords] = useState<JourneyRecord[]>([]);
  const [practiceRecords,setPracticeRecords] = useState<JourneyRecord[]>([]);
  const [formSteps, setFormSteps] = useState<FormSteps>({});
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = sessions.filter((item) => new Date(item.date).getTime() >= sevenDaysAgo);
  const weekMinutes = weekSessions.reduce((sum, item) => sum + item.duration, 0);
  const energyRecord = entries.reduce<{ date: string; value: number } | null>((latest, entry) => !latest || entry.date > latest.date ? { date: entry.date, value: entry.energy } : latest, profile.onboardingCheckin ? { date: profile.onboardingCheckin.createdAt, value: profile.onboardingCheckin.energy } : null);
  const energy = energyRecord?.value;
  const streak = practiceStreak(sessions);
  const lastReport = postureReports[0];
  const formRecords = [
    ...completionRecords,
    ...practiceRecords,
    ...sessions.map(session => ({ order: Number(session.practiceId.match(/^movement-(\d+)$/)?.[1]), date: session.date })),
    ...shenActivities.filter(activity => activity.type === "practice" && activity.completed !== false).map(activity => ({ order: Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1]), date: activity.createdAt })),
  ].filter(record => Number.isInteger(record.order) && record.order >= 1 && record.order <= 18);
  const completedFormOrders = new Set([
    ...completedMovementOrders,
    ...sessions.filter(session => session.postureScore >= 70).map(session => Number(session.practiceId.match(/^movement-(\d+)$/)?.[1])),
    ...shenActivities.filter(activity => activity.type === "practice" && activity.completed !== false).map(activity => Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1])),
  ].filter(order => Number.isInteger(order) && order >= 1 && order <= 18));
  const completedForms = completedFormOrders.size;
  const bodyGateProgress = gateProgress(completedFormOrders);
  const activeBodyGate = bodyGateProgress.reduce((best, gate) => gate.percent > best.percent || (gate.percent === best.percent && gate.completedCount > best.completedCount) ? gate : best, bodyGateProgress[0]);
  const activeBodyGateNumber = BODY_GATE_ORDER.indexOf(activeBodyGate.id) + 1;
  const balance = yinYangSummary(completedFormOrders, formRecords);
  const yinPercent = balance.total ? Math.round(balance.yin / balance.total * 100) : 0;
  const yangPercent = balance.total ? 100 - yinPercent : 0;
  const rewards = journeyRewards(completedFormOrders, formRecords, formSteps, practiceRecords);
  const nextFormOrder = Array.from({length:18},(_,index)=>index+1).find(order=>!completedFormOrders.has(order)) ?? 1;
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadShibashiPhotos().then(async(items) => { if (active) setPhotos(items); for(const photo of items) { try { await markMovementPracticed(photo.order,profile.authUserId,photo.savedAt); } catch {} } if(active)setPracticeRecords(await loadMovementPracticeRecords(profile.authUserId)); });
    void loadCompletedMovements(profile.authUserId).then((orders) => { if (active) setCompletedMovementOrders(orders); });
    void loadMovementCompletionRecords(profile.authUserId).then((records) => { if (active) setCompletionRecords(records); });
    void loadFormSteps(profile.authUserId).then((steps) => { if (active) setFormSteps(steps); });
    void ensureSystemNotifications({
      hasPostureReport: postureReports.length > 0,
      hasSessionToday: sessions.some((item) => new Date(item.date).toDateString() === new Date().toDateString()),
      remindersEnabled: profile.reminders,
    });
    return () => { active = false; };
  }, [postureReports.length, profile.authUserId, profile.reminders, sessions]));

  const answerDailyShen = async (answer: DailyShenId) => {
    const next = [...shenAnswers, answer];
    if (shenQuestion < dailyShenQuestions.length - 1) {
      setShenAnswers(next);
      setShenQuestion(shenQuestion + 1);
      return;
    }
    await AsyncStorage.multiSet([
      ["shibashi-daily-shen-date", dailyShenDate()],
      ["shibashi-daily-shen-answers", JSON.stringify(next)],
    ]);
    saveProfile({ selectedShenId: recommendDailyShen(next) });
    setShenQuestion(-1);
    setShenAnswers([]);
  };

  return <><Modal visible={shenQuestion >= 0} transparent animationType="fade"><View style={{ flex:1, backgroundColor:"rgba(2,12,10,.9)", justifyContent:"center", padding:24 }}><View style={{ backgroundColor:visual.surface, borderColor:theme.button, borderWidth:1, borderRadius:22, padding:24, gap:12 }}><Text style={{ color:theme.button, fontSize:13 }}>BEŞ SHEN GÜNLÜĞÜ · {shenQuestion + 1} / 3</Text><Text style={{ color:visual.text, fontSize:24, fontWeight:"700", marginBottom:8 }}>{dailyShenQuestions[Math.max(0,shenQuestion)]?.title}</Text>{dailyShenQuestions[Math.max(0,shenQuestion)]?.answers.map(answer => <Pressable key={answer.shen} accessibilityRole="button" onPress={() => { void answerDailyShen(answer.shen); }} style={{ backgroundColor:visual.surface, borderRadius:12, padding:15 }}><Text style={{ color:visual.text, fontSize:16 }}>{answer.label}</Text></Pressable>)}</View></View></Modal><Screen style={s.page}>
    <View style={s.intro}><Text style={[s.eyebrow, { color: visual.glow }]}>BUGÜNKÜ YOLCULUĞUN</Text><Text style={[s.greeting,{color:visual.text,fontFamily:mobileThemeFont(visual.id)}]}>İyi ki buradasın, {profile.name || "Gezgin"}.</Text><Text style={[s.lead,{color:visual.textSecondary}]}>Bir nefes al. Bugün bedenin hangi ritimde?</Text></View>

    <ImageBackground source={shenBackgrounds[shen.id]} resizeMode="cover" style={[s.hero, shenShape(shen.id)]}>
      <LinearGradient colors={["rgba(5,10,12,.04)", "rgba(5,10,12,.38)", "rgba(5,10,12,.94)"]} style={s.heroShade}>
        <Text style={[s.heroEyebrow, { color: theme.button }]}>{daily.label.toLocaleUpperCase("tr-TR")} · {shen.name.toLocaleUpperCase("tr-TR")}</Text>
        <Text style={[s.heroTitle,{fontFamily:mobileThemeFont(visual.id)}]}>{daily.title}</Text><Text style={s.heroCue}>{daily.cue}</Text>
      </LinearGradient>
    </ImageBackground>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.shenPicker} style={s.shenPickerOuter}>
      {fiveShen.map((item) => { const selected = item.id === shen.id; return <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${copy[item.id].label}, ${item.name}`} onPress={() => { void Haptics.selectionAsync(); saveProfile({ selectedShenId: item.id }); }} style={[s.shenChoice, { backgroundColor: selected ? theme.button : visual.surface, borderColor: selected ? theme.button : visual.border }, shenShape(shen.id, "button")]}><Image source={shenIcons[item.id]} style={s.shenIcon} /><Text style={[s.shenChoiceText, { color: selected ? theme.buttonInk : visual.text }]}>{item.name}</Text></Pressable>; })}
    </ScrollView>

    <View style={{ gap:12, marginBottom:20 }}>
      <View style={[s.gameCard,{backgroundColor:visual.surface,borderColor:`${theme.primary}55`},shenShape(shen.id)]}><Pressable accessibilityRole="button" accessibilityLabel={`${nextFormOrder}. formu aç`} onPress={() => router.push({pathname:'/body-lines',params:{movementOrder:nextFormOrder}})} style={s.featuredFormImage}><Image source={shibashiPosters[nextFormOrder]} resizeMode="cover" style={s.featuredFormPhoto} /><View style={s.featuredFormShade} /><View style={[s.featuredFormPlay,{backgroundColor:theme.button}]}><Ionicons name="play" color={theme.buttonInk} size={22} /></View></Pressable><Text style={[s.gameEyebrow,{color:theme.button}]}>BUGÜNÜN SHEN GÖREVİ · FORM {nextFormOrder}</Text><Text style={[s.gameTitle,{color:visual.text}]}>Sıradaki Adım</Text><Text style={[s.gameBody,{color:visual.textSecondary}]}>{shenDailyCues[shen.id]}</Text><FormMetaTags order={nextFormOrder} compact/><Pressable accessibilityRole="button" onPress={() => router.push({pathname:'/body-lines',params:{movementOrder:nextFormOrder}})}><Text style={[s.gameLink,{color:theme.button}]}>Pratik Yap →</Text></Pressable></View>
      <View style={[s.gameCard,{backgroundColor:visual.surface,borderColor:`${theme.primary}55`},shenShape(shen.id)]}><Text style={[s.gameEyebrow,{color:theme.button}]}>18 FORM YOLU</Text><Text style={[s.gameTitle,{color:visual.text}]}>{completedForms} / 18 form</Text><View style={s.formProgress}>{Array.from({length:18},(_,index)=><View key={index} style={[s.formProgressDot,{backgroundColor:completedFormOrders.has(index+1)?theme.button:`${theme.primary}35`}]}/>)}</View><Text style={[s.gameBody,{color:visual.textSecondary}]}>Hocayı izle, kamerayla dene, kaydını oluştur.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/body-lines')}><Text style={[s.gameLink,{color:theme.button}]}>Yolculuğa devam et →</Text></Pressable></View>

    </View>

    <View style={[s.balanceCard,{backgroundColor:visual.surface,borderColor:visual.border},shenShape(shen.id)]}>
      <Text style={[s.gameEyebrow,{color:theme.button}]}>YİN · YANG DENGESİ</Text>
      <View style={s.balanceOverview}>
        <View style={s.balanceCounts}><View style={s.balanceCountRow}><View style={[s.balanceDot,{backgroundColor:'#8CCFE3'}]}/><Text style={[s.balanceNumber,{color:visual.text}]}>{balance.yin}</Text><Text style={[s.balanceName,{color:visual.textSecondary}]}>Yin</Text></View><View style={s.balanceCountRow}><View style={[s.balanceDot,{backgroundColor:'#EAB776'}]}/><Text style={[s.balanceNumber,{color:visual.text}]}>{balance.yang}</Text><Text style={[s.balanceName,{color:visual.textSecondary}]}>Yang</Text></View>{balance.todayTotal>0?<Text style={[s.balanceToday,{color:visual.textSecondary}]}>Bugün: {balance.todayYin} Yin · {balance.todayYang} Yang</Text>:null}</View>
        <View accessible accessibilityLabel={`${balance.yin} Yin, yüzde ${yinPercent}; ${balance.yang} Yang, yüzde ${yangPercent}`} style={s.balanceDonut}><Svg width={138} height={138} viewBox="0 0 138 138"><Circle cx={69} cy={69} r={52} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={14}/><Circle cx={69} cy={69} r={52} fill="none" stroke="#8CCFE3" strokeWidth={14} strokeDasharray={`${326.73*yinPercent/100} ${326.73*(100-yinPercent)/100}`} transform="rotate(-90 69 69)"/><Circle cx={69} cy={69} r={52} fill="none" stroke="#EAB776" strokeWidth={14} strokeDasharray={`${326.73*yangPercent/100} ${326.73*(100-yangPercent)/100}`} strokeDashoffset={-326.73*yinPercent/100} transform="rotate(-90 69 69)"/></Svg><View style={s.balanceDonutCenter}>{balance.total?<><Text style={s.balanceYinPercent}>Yin %{yinPercent}</Text><Text style={s.balanceYangPercent}>Yang %{yangPercent}</Text></>:<Text style={[s.balanceZero,{color:visual.textSecondary}]}>0 form</Text>}</View></View>
      </View>
      <View style={s.balanceLinks}><Pressable accessibilityRole="link" onPress={()=>router.push({pathname:'/body-lines',params:{status:'completed',energy:'Yin'}})} style={[s.balanceLink,{borderColor:'#8CCFE3'}]}><Text style={{color:'#9EDCF0',fontSize:12,fontWeight:'800'}}>Yin formlarım →</Text></Pressable><Pressable accessibilityRole="link" onPress={()=>router.push({pathname:'/body-lines',params:{status:'completed',energy:'Yang'}})} style={[s.balanceLink,{borderColor:'#EAB776'}]}><Text style={{color:'#F2C785',fontSize:12,fontWeight:'800'}}>Yang formlarım →</Text></Pressable></View>
    </View>

    <View style={s.stats}>
      <ImageBackground source={shenBackgrounds[shen.id]} style={[s.stat, s.energyStat, { backgroundColor: visual.surface }, shenShape(shen.id)]}><View style={s.energyShade} /><Text style={s.statLabel}>Enerjin</Text><Text style={[s.statValue, { color: theme.button }]}>{energy ?? "—"}</Text><Text style={s.statDetail}>{energy === undefined ? "Kayıt bekliyor" : `${shen.name} Shen`}</Text><Text style={s.energyMotif}>{shenMotifs[shen.id]}</Text></ImageBackground>
      <StatTile label="Son 7 gün" value={String(weekSessions.length)} unit="pratik" detail={`${weekMinutes} dakika`} shenId={shen.id} visual={visual} />
      <StatTile label="♨ Seri" value={String(streak)} unit="gün" detail="Pratik günlerin" shenId={shen.id} visual={visual} />
    </View>

    <View style={[s.balanceCard,{backgroundColor:visual.surface,borderColor:visual.border},shenShape(shen.id)]}>
      <Text style={[s.gameEyebrow,{color:theme.button}]}>KENDİ BAHÇEN</Text>
      <Text style={[s.balanceCopy,{color:visual.textSecondary}]}>Pratik yaptıkça bahçene yeni ayrıntılar eklenir.</Text>
      <ImageBackground source={shenBackgrounds[shen.id]} imageStyle={{borderRadius:14}} style={s.gardenScene}><View style={s.gardenShade}/>{rewards.garden.filter(item=>item.unlocked).length ? rewards.garden.filter(item=>item.unlocked).map(item=><View key={item.id} style={s.gardenItem}><Text style={s.gardenIcon}>{item.icon}</Text><Text style={[s.gardenLabel,{color:'#F5F2E7'}]}>{item.title}</Text></View>) : <Text style={[s.balanceCopy,{color:'#F5F2E7'}]}>İlk formunu tamamlayınca ilk filiz belirecek.</Text>}</ImageBackground>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel={`Beden Yolculuğun. Şu an ${activeBodyGateNumber}. kapıdasın: ${activeBodyGate.name}. Gelişim Haritamı aç.`} onPress={() => router.push('/(tabs)/main-map')} style={[s.bodyJourneyCard, { backgroundColor: visual.surface, borderColor: visual.border }, shenShape(shen.id)]}>
      <View style={s.bodyJourneyHeading}><View><Text style={[s.sectionTitle,{color:visual.text}]}>Beden Yolculuğun · {activeBodyGateNumber}. Kapıdasın</Text><Text style={[s.bodyJourneyGate,{color:theme.button}]}>{activeBodyGate.name} · %{activeBodyGate.percent}</Text></View><Ionicons name="arrow-forward-circle" color={theme.button} size={28}/></View>
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants"><HomeBodyJourneyMap progress={bodyGateProgress} activeGate={activeBodyGate.id} accent={theme.button}/></View>
      <Text style={[s.bodyJourneyAction,{color:theme.button}]}>Gelişim Haritama git →</Text>
    </Pressable>

    <View style={s.sectionHeader}><Text style={[s.sectionTitle,{color:visual.text}]}>Beden Görüntülerin</Text><Pressable onPress={() => router.push("/(tabs)/journal")}><Text style={[s.sectionHint, { color: theme.button }]}>Fotoğraflarım →</Text></Pressable></View>
    {photos.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.photos}>{photos.slice(0,5).map((item) => <Pressable key={item.id} onPress={() => router.push("/(tabs)/journal")} style={[s.photoCard, shenShape(shen.id)]}><Image source={{ uri: item.uri }} style={s.photo} /><LinearGradient colors={["transparent", "rgba(5,9,10,.9)"]} style={s.photoShade}><Text numberOfLines={1} style={s.photoTitle}>{item.name}</Text><Text style={[s.photoScore, { color: theme.button }]}>%{item.score}</Text></LinearGradient></Pressable>)}</ScrollView> : <View style={[s.emptyCard, { backgroundColor: visual.surface }, shenShape(shen.id)]}><Ionicons name="images-outline" color={theme.button} size={24} /><Text style={[s.emptyText,{color:visual.textSecondary}]}>İlk hareket fotoğrafın burada görünecek.</Text></View>}

    <Pressable onPress={() => router.push("/(tabs)/posture" as Href)} style={[s.postureSummary, { backgroundColor: visual.surface }, shenShape(shen.id)]}><View><Text style={s.statLabel}>POSTÜR ANALİZİ</Text><Text style={[s.postureTitle,{color:visual.text}]}>{lastReport ? "Son analizine dön" : "Beden çizgini keşfet"}</Text><Text style={[s.quickSubtitle,{color:visual.textSecondary}]}>{lastReport ? `Son ölçüm: ${lastReport.score} puan` : "Ön, yan ve arka görünüm"}</Text></View><Ionicons name="arrow-forward" color={theme.button} size={22} /></Pressable>
  </Screen></>;
}

function StatTile({ label, value, unit, detail, progress, shenId, visual }: { label: string; value: string; unit: string; detail: string; progress?: number; shenId: ShenId; visual: ReturnType<typeof getShenVisualTheme> }) {
  return <View style={[s.stat, { backgroundColor: visual.surface, borderWidth:1, borderColor:visual.border }, shenShape(shenId)]}><Text style={[s.statLabel,{color:visual.textSecondary}]}>{label}</Text><Text style={[s.statValue, { color: visual.glow,fontFamily:mobileThemeFont(visual.id) }]}>{value}<Text style={[s.statUnit,{color:visual.text}]}> {unit}</Text></Text>{progress === undefined ? <Text style={[s.statDetail,{color:visual.textSecondary}]}>{detail}</Text> : <><View style={s.track}><View style={[s.fill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: visual.glow }]} /></View><Text style={[s.statDetail,{color:visual.textSecondary}]}>{detail}</Text></>}</View>;
}

const s = StyleSheet.create({
  page: { gap: 0, paddingHorizontal: 18, paddingBottom: 34 },
  bodyJourneyCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', padding: 12, marginTop: 22, marginBottom: 7 },
  bodyJourneyHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 6, paddingTop: 5, paddingBottom: 12 },
  bodyJourneyGate: { fontFamily: fonts.sansStrong, fontSize: 13, marginTop: 5 },
  bodyJourneyAction: { fontFamily: fonts.sansStrong, fontSize: 13, textAlign: 'right', paddingHorizontal: 8, paddingTop: 12, paddingBottom: 5 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 5, marginBottom: 25 },
  brand: { flexDirection: "row", alignItems: "center", gap: 7 },
  brandRing: { fontSize: 29, lineHeight: 30 },
  brandText: { color: "#F6F3EC", fontFamily: fonts.sansStrong, fontSize: 12, letterSpacing: 2.4 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerButton: { width: 35, height: 35, alignItems: "center", justifyContent: "center" },
  avatar: { width: 35, height: 35, borderWidth: 1, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#F6F3EC", fontFamily: fonts.sansStrong, fontSize: 14 },
  badge: { width: 7, height: 7, borderRadius: 4, position: "absolute", top: 4, right: 4 },
  intro: { marginBottom: 15 },
  eyebrow: { fontFamily: fonts.sansStrong, fontSize: 11, letterSpacing: 1.8, marginBottom: 8 },
  greeting: { color: "#F6F3EC", fontFamily: fonts.displayMedium, fontSize: 30, lineHeight: 34, marginBottom: 6 },
  lead: { color: "#AEBCC3", fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  hero: { height: 250, overflow: "hidden", justifyContent: "flex-end", marginBottom: 13 },
  heroShade: { flex: 1, justifyContent: "flex-end", padding: 17 },
  heroEyebrow: { fontFamily: fonts.sansStrong, fontSize: 11, letterSpacing: 1.5, marginBottom: 5 },
  heroTitle: { color: "#F6F3EC", fontFamily: fonts.displayMedium, fontSize: 26, lineHeight: 30, marginBottom: 5 },
  heroCue: { color: "#E7E6E2", fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  heroAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 36, paddingHorizontal: 13, marginTop: 12 },
  heroActionText: { fontFamily: fonts.sansStrong, fontSize: 11, letterSpacing: .4 },
  shenPickerOuter: { flexGrow: 0, marginBottom: 16 },
  shenPicker: { flexDirection: "row", gap: 7, paddingRight: 5 },
  shenChoice: { flexDirection: "row", alignItems: "center", gap: 5, minWidth: 62, height: 43, paddingHorizontal: 9, borderWidth: 1 },
  shenIcon: { width: 23, height: 23, borderRadius: 12 },
  shenChoiceText: { fontFamily: fonts.sansStrong, fontSize: 11 },
  stats: { flexDirection: "row", gap: 7, marginBottom: 7 },
  stat: { flex:1, minWidth:0, minHeight: 93, padding: 8, overflow: "hidden" },
  statLabel: { color: "#BFC9CB", fontFamily: fonts.sansMedium, fontSize: 11, marginBottom: 7 },
  statValue: { fontFamily: fonts.displayMedium, fontSize: 25, lineHeight: 27 },
  statUnit: { color: "#F6F3EC", fontFamily: fonts.sans, fontSize: 11 },
  statDetail: { color: "#ADB8BA", fontFamily: fonts.sans, fontSize: 10, marginTop: 5 },
  track: { height: 4, borderRadius: 3, backgroundColor: "rgba(255,255,255,.14)", overflow: "hidden", marginTop: 7 },
  fill: { height: "100%" },
  energyStat: { position: "relative" },
  energyShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(6,12,15,.76)" },
  energyMotif: { position: "absolute", right: 10, top: 6, fontSize: 25 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: "#F6F3EC", fontFamily: fonts.displayMedium, fontSize: 20 },
  sectionHint: { fontFamily: fonts.sansMedium, fontSize: 11 },
  quickSubtitle: { color: "#BFC9CB", fontFamily: fonts.sans, fontSize: 11 },
  photos: { gap: 9, paddingRight: 5 },
  photoCard: { width: 133, height: 172, overflow: "hidden" },
  photo: { width: "100%", height: "100%" },
  photoShade: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 10, paddingTop: 30 },
  photoTitle: { color: "#F6F3EC", fontFamily: fonts.sansMedium, fontSize: 11 },
  photoScore: { fontFamily: fonts.sansStrong, fontSize: 12, marginTop: 3 },
  emptyCard: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, padding: 15 },
  emptyText: { color: "#BFC9CB", fontFamily: fonts.sans, fontSize: 12 },
  postureSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, marginTop: 21 },
  postureTitle: { color: "#F6F3EC", fontFamily: fonts.sansMedium, fontSize: 17, marginBottom: 4 },
  gameCard: { borderWidth:1, padding:17, gap:8 },
  featuredFormImage: { height:155, borderRadius:12, overflow:'hidden', alignItems:'center', justifyContent:'center' },
  featuredFormPhoto: { width:'100%', height:'100%', position:'absolute' },
  featuredFormShade: { ...StyleSheet.absoluteFill, backgroundColor:'rgba(4,10,7,.28)' },
  featuredFormPlay: { width:54, height:54, borderRadius:27, alignItems:'center', justifyContent:'center', paddingLeft:3, borderWidth:2, borderColor:'rgba(255,255,255,.65)' },
  gameEyebrow: { fontFamily:fonts.sansStrong, fontSize:10, letterSpacing:1.5 },
  gameTitle: { color:'#F6F3EC', fontFamily:fonts.displayMedium, fontSize:23, lineHeight:28 },
  gameBody: { color:'#BFC9CB', fontFamily:fonts.sans, fontSize:13, lineHeight:19 },
  gameStatus: { fontFamily:fonts.sansMedium, fontSize:12 },
  gameLink: { fontFamily:fonts.sansStrong, fontSize:13, marginTop:4 },
  formProgress: { flexDirection:'row', gap:3, marginVertical:5 },
  formProgressDot: { flex:1, height:8, borderRadius:5 },
  balanceCard: { borderWidth:1, padding:17, marginTop:12, gap:9 },
  balanceOverview: { flexDirection:'row',alignItems:'center',justifyContent:'space-between' },
  balanceCounts: { gap:13,flex:1 },
  balanceCountRow: { flexDirection:'row',alignItems:'baseline',gap:7 },
  balanceDot: { width:8,height:8,borderRadius:4,alignSelf:'center' },
  balanceNumber: { fontFamily:fonts.displayMedium,fontSize:31,lineHeight:35 },
  balanceName: { fontFamily:fonts.sans,fontSize:14 },
  balanceToday: { fontFamily:fonts.sansMedium,fontSize:10 },
  balanceDonut: { width:138,height:138,alignItems:'center',justifyContent:'center' },
  balanceDonutCenter: { position:'absolute',alignItems:'center',justifyContent:'center',gap:3 },
  balanceYinPercent: { color:'#9EDCF0',fontFamily:fonts.sansStrong,fontSize:11 },
  balanceYangPercent: { color:'#F2C785',fontFamily:fonts.sansStrong,fontSize:11 },
  balanceZero: { fontFamily:fonts.sansStrong,fontSize:11 },
  balanceCopy: { fontFamily:fonts.sans, fontSize:12, lineHeight:18 },
  balanceLinks: { flexDirection:'row',gap:8,flexWrap:'wrap' },
  balanceLink: { borderWidth:1,borderRadius:12,paddingHorizontal:11,paddingVertical:9 },
  gardenScene: { minHeight:110, flexDirection:'row', flexWrap:'wrap', alignItems:'center', gap:9, padding:12, borderRadius:14, overflow:'hidden' },
  gardenShade: { ...StyleSheet.absoluteFill, backgroundColor:'rgba(3,18,14,.7)' },
  gardenItem: { minWidth:64, alignItems:'center', gap:3 },
  gardenIcon: { fontSize:28 },
  gardenLabel: { fontFamily:fonts.sansMedium, fontSize:10 },
});
