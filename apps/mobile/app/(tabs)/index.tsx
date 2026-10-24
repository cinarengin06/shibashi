import AsyncStorage from "@react-native-async-storage/async-storage";
import { dailyShenDate, dailyShenQuestions, recommendDailyShen, type DailyShenId } from "../../../../packages/daily-shen-checkin";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { shenThemes } from "../../../../packages/design-tokens";
import { localDateKey, shenDailyCues } from "../../../../packages/gamification";
import { Screen } from "../../components/ui";
import { fonts } from "../../constants/theme";
import { shenMotifs, shenShape } from "../../constants/shenDesign";
import { practices } from "../../data/content";
import { fiveShen } from "../../data/fiveShen";
import { shenBackgrounds } from "../../data/shenAssets";
import { shenIcons } from "../../data/shenIcons";
import { loadCompletedMovements } from "../../services/movementCompletion";
import { ensureSystemNotifications, unreadNotificationCount } from "../../services/notifications/NotificationInbox";
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
  const { shen, soundEnabled, toggleSound } = useShenExperience();
  const theme = shenThemes[shen.id];
  const daily = copy[shen.id];
  const [unread, setUnread] = useState(0);
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
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weekSessions = sessions.filter((item) => new Date(item.date).getTime() >= sevenDaysAgo);
  const weekMinutes = weekSessions.reduce((sum, item) => sum + item.duration, 0);
  const xp = sessions.reduce((sum, item) => sum + (item.xp ?? 0), 0);
  const level = Math.floor(xp / 240) + 1;
  const levelProgress = xp % 240;
  const energyRecord = entries.reduce<{ date: string; value: number } | null>((latest, entry) => !latest || entry.date > latest.date ? { date: entry.date, value: entry.energy } : latest, profile.onboardingCheckin ? { date: profile.onboardingCheckin.createdAt, value: profile.onboardingCheckin.energy } : null);
  const energy = energyRecord?.value;
  const streak = practiceStreak(sessions);
  const lastReport = postureReports[0];
  const formRecords = photos.map(photo => ({ order:photo.order, date:photo.savedAt }));
  const completedFormOrders = new Set([
    ...completedMovementOrders,
    ...photos.filter(photo => photo.score >= 70).map(photo => photo.order),
    ...sessions.filter(session => session.postureScore >= 70).map(session => Number(session.practiceId.match(/^movement-(\d+)$/)?.[1])),
    ...shenActivities.filter(activity => activity.type === "practice" && activity.completed !== false).map(activity => Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1])),
  ].filter(order => Number.isInteger(order) && order >= 1 && order <= 18));
  const completedForms = completedFormOrders.size;
  const dailyFormDone = formRecords.some(record => localDateKey(record.date) === localDateKey(new Date()));
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadShibashiPhotos().then((items) => { if (active) setPhotos(items); });
    void loadCompletedMovements(profile.authUserId).then((orders) => { if (active) setCompletedMovementOrders(orders); });
    void ensureSystemNotifications({
      hasPostureReport: postureReports.length > 0,
      hasSessionToday: sessions.some((item) => new Date(item.date).toDateString() === new Date().toDateString()),
      remindersEnabled: profile.reminders,
    }).then((items) => { if (active) setUnread(unreadNotificationCount(items)); });
    return () => { active = false; };
  }, [postureReports.length, profile.authUserId, profile.reminders, sessions]));

  const startDailyPractice = () => {
    const practice = practices.find((item) => item.id === shen.practiceId) ?? practices[0];
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    router.push(`/practice-session?practiceId=${practice.id}`);
  };

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

  return <><Modal visible={shenQuestion >= 0} transparent animationType="fade"><View style={{ flex:1, backgroundColor:"rgba(2,12,10,.9)", justifyContent:"center", padding:24 }}><View style={{ backgroundColor:theme.surface, borderColor:theme.button, borderWidth:1, borderRadius:22, padding:24, gap:12 }}><Text style={{ color:theme.button, fontSize:13 }}>BEŞ SHEN GÜNLÜĞÜ · {shenQuestion + 1} / 3</Text><Text style={{ color:theme.light, fontSize:24, fontWeight:"700", marginBottom:8 }}>{dailyShenQuestions[Math.max(0,shenQuestion)]?.title}</Text>{dailyShenQuestions[Math.max(0,shenQuestion)]?.answers.map(answer => <Pressable key={answer.shen} accessibilityRole="button" onPress={() => { void answerDailyShen(answer.shen); }} style={{ backgroundColor:theme.surfaceRaised, borderRadius:12, padding:15 }}><Text style={{ color:theme.light, fontSize:16 }}>{answer.label}</Text></Pressable>)}</View></View></Modal><Screen style={s.page}>
    <View style={s.header}>
      <View style={s.brand}><Text style={[s.brandRing, { color: theme.button }]}>◯</Text><Text style={s.brandText}>SHIBASHI EFE</Text></View>
      <View style={s.headerActions}>
        <Pressable accessibilityLabel={soundEnabled ? "Shen müziğini kapat" : "Shen müziğini aç"} accessibilityRole="button" onPress={toggleSound} style={[s.headerButton, { backgroundColor: theme.surfaceRaised }, shenShape(shen.id, "button")]}><Ionicons color={theme.button} name={soundEnabled ? "musical-notes" : "musical-notes-outline"} size={19} /></Pressable>
        <Pressable accessibilityLabel={unread ? `${unread} okunmamış bildirim` : "Bildirimleri aç"} accessibilityRole="button" onPress={() => router.push("/notifications")} style={[s.headerButton, { backgroundColor: theme.surfaceRaised }, shenShape(shen.id, "button")]}><Ionicons color={theme.light} name="notifications-outline" size={19} />{unread > 0 && <View style={[s.badge, { backgroundColor: theme.button }]} />}</Pressable>
        <Pressable accessibilityLabel="Profilimi aç" accessibilityRole="button" onPress={() => router.push("/(tabs)/profile")} style={[s.avatar, { borderColor: theme.primary }]}><Text style={s.avatarText}>{(profile.name || "S").slice(0, 1).toLocaleUpperCase("tr-TR")}</Text></Pressable>
      </View>
    </View>

    <View style={s.intro}><Text style={[s.eyebrow, { color: theme.button }]}>BUGÜNKÜ YOLCULUĞUN</Text><Text style={s.greeting}>İyi ki buradasın, {profile.name || "Gezgin"}.</Text><Text style={s.lead}>Bir nefes al. Bugün bedenin hangi ritimde?</Text></View>

    <ImageBackground source={shenBackgrounds[shen.id]} resizeMode="cover" style={[s.hero, shenShape(shen.id)]}>
      <LinearGradient colors={["rgba(5,10,12,.04)", "rgba(5,10,12,.38)", "rgba(5,10,12,.94)"]} style={s.heroShade}>
        <Text style={[s.heroEyebrow, { color: theme.button }]}>{daily.label.toLocaleUpperCase("tr-TR")} · {shen.name.toLocaleUpperCase("tr-TR")}</Text>
        <Text style={s.heroTitle}>{daily.title}</Text><Text style={s.heroCue}>{daily.cue}</Text>
        <Pressable accessibilityRole="button" onPress={startDailyPractice} style={[s.heroAction, { backgroundColor: theme.button }, shenShape(shen.id, "button")]}><Ionicons name="play" color={theme.buttonInk} size={15} /><Text style={[s.heroActionText, { color: theme.buttonInk }]}>BUGÜNKÜ PRATİĞE BAŞLA</Text></Pressable>
      </LinearGradient>
    </ImageBackground>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.shenPicker} style={s.shenPickerOuter}>
      {fiveShen.map((item) => { const selected = item.id === shen.id; const itemTheme = shenThemes[item.id]; return <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${copy[item.id].label}, ${item.name}`} onPress={() => { void Haptics.selectionAsync(); saveProfile({ selectedShenId: item.id }); }} style={[s.shenChoice, { backgroundColor: selected ? theme.button : theme.surfaceRaised, borderColor: selected ? theme.button : `${theme.primary}30` }, shenShape(shen.id, "button")]}><Image source={shenIcons[item.id]} style={s.shenIcon} /><Text style={[s.shenChoiceText, { color: selected ? theme.buttonInk : itemTheme.light }]}>{item.name}</Text></Pressable>; })}
    </ScrollView>

    <View style={s.stats}>
      <StatTile label="♨  Seri" value={String(streak)} unit="gün" detail="Pratik günlerin" shenId={shen.id} />
      <StatTile label="Seviye" value={String(level)} unit="Yolcu" detail={`${levelProgress} / 240 XP`} progress={levelProgress / 240} shenId={shen.id} />
      <StatTile label="Son 7 gün" value={String(weekSessions.length)} unit="pratik" detail={`Toplam ${weekMinutes} dakika`} shenId={shen.id} />
      <ImageBackground source={shenBackgrounds[shen.id]} style={[s.stat, s.energyStat, { backgroundColor: theme.surfaceRaised }, shenShape(shen.id)]}><View style={s.energyShade} /><Text style={s.statLabel}>Enerjin ({shen.name})</Text><Text style={[s.statValue, { color: theme.button }]}>{energy ?? "—"}{energy !== undefined && <Text style={s.statUnit}> / 100</Text>}</Text><Text style={s.statDetail}>{energy === undefined ? "Günlük kaydını bekliyor" : energy >= 70 ? "Canlı bir başlangıç" : "Bugün kendini dinle"}</Text><Text style={s.energyMotif}>{shenMotifs[shen.id]}</Text></ImageBackground>
    </View>

    <View style={{ gap:12, marginBottom:20 }}>
      <View style={[s.gameCard,{backgroundColor:theme.surfaceRaised,borderColor:`${theme.primary}55`},shenShape(shen.id)]}><Text style={[s.gameEyebrow,{color:theme.button}]}>BUGÜNÜN SHEN GÖREVİ</Text><Text style={s.gameTitle}>{dailyFormDone?'Bugünkü adımın tamamlandı ✨':'Bir formu bedeninde dene'}</Text><Text style={s.gameBody}>{shenDailyCues[shen.id]}</Text><Text style={[s.gameStatus,{color:dailyFormDone?'#A8DCB3':theme.light}]}>{dailyFormDone?'✓ Bugün form kaydın var':'Fotoğrafın kaydedilince tamamlanır'}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/body-lines')}><Text style={[s.gameLink,{color:theme.button}]}>18 Form'a git →</Text></Pressable></View>
      <View style={[s.gameCard,{backgroundColor:theme.surfaceRaised,borderColor:`${theme.primary}55`},shenShape(shen.id)]}><Text style={[s.gameEyebrow,{color:theme.button}]}>18 FORM YOLU</Text><Text style={s.gameTitle}>{completedForms} / 18 form</Text><View style={s.formProgress}>{Array.from({length:18},(_,index)=><View key={index} style={[s.formProgressDot,{backgroundColor:completedFormOrders.has(index+1)?theme.button:`${theme.primary}35`}]}/>)}</View><Text style={s.gameBody}>Hocayı izle, kamerayla dene, kaydını oluştur.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/body-lines')}><Text style={[s.gameLink,{color:theme.button}]}>Yolculuğa devam et →</Text></Pressable></View>

    </View>

    <View style={s.sectionHeader}><Text style={s.sectionTitle}>Bugün senin için</Text><Text style={[s.sectionHint, { color: theme.button }]}>Devam et →</Text></View>
    <View style={s.quickActions}>
      <Pressable accessibilityRole="button" onPress={() => router.push("/body-lines")} style={[s.quick, { backgroundColor: theme.button }, shenShape(shen.id)]}><Ionicons name="arrow-forward" color={theme.buttonInk} size={25} /><View><Text style={[s.quickTitle, { color: theme.buttonInk }]}>18 Form</Text><Text style={[s.quickSubtitle, { color: theme.buttonInk }]}>Hoca videosuyla öğren</Text></View></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/posture" as Href)} style={[s.quick, { backgroundColor: theme.surfaceRaised }, shenShape(shen.id)]}><Ionicons name="body-outline" color={theme.button} size={27} /><View><Text style={s.quickTitle}>Postür</Text><Text style={s.quickSubtitle}>Bedenini tanı</Text></View></Pressable>
    </View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/warmup-lessons' as Href)} style={[s.postureSummary, { backgroundColor: theme.surfaceRaised, marginTop: 10 }, shenShape(shen.id)]}><View><Text style={[s.statLabel, { color: theme.button }]}>FORMDAN ÖNCE</Text><Text style={s.postureTitle}>Isınma Dersleri</Text><Text style={s.quickSubtitle}>Wuji · Eklemler · Merkez</Text></View><Ionicons name="play-circle-outline" color={theme.button} size={25} /></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/journey' as Href)} style={[s.postureSummary, { backgroundColor: theme.surfaceRaised, marginTop: 10 }, shenShape(shen.id)]}><View><Text style={[s.statLabel, { color: theme.button }]}>SEKİZ KAPI</Text><Text style={s.postureTitle}>Beden Haritam</Text><Text style={s.quickSubtitle}>Kapıları ve ilgili formları keşfet</Text></View><Ionicons name="compass-outline" color={theme.button} size={25} /></Pressable>

    <View style={s.sectionHeader}><Text style={s.sectionTitle}>Son hareketlerin</Text><Pressable onPress={() => router.push("/(tabs)/journal")}><Text style={[s.sectionHint, { color: theme.button }]}>Fotoğraflarım →</Text></Pressable></View>
    {photos.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.photos}>{photos.slice(0,5).map((item) => <Pressable key={item.id} onPress={() => router.push("/(tabs)/journal")} style={[s.photoCard, shenShape(shen.id)]}><Image source={{ uri: item.uri }} style={s.photo} /><LinearGradient colors={["transparent", "rgba(5,9,10,.9)"]} style={s.photoShade}><Text numberOfLines={1} style={s.photoTitle}>{item.name}</Text><Text style={[s.photoScore, { color: theme.button }]}>%{item.score}</Text></LinearGradient></Pressable>)}</ScrollView> : <View style={[s.emptyCard, { backgroundColor: theme.surfaceRaised }, shenShape(shen.id)]}><Ionicons name="images-outline" color={theme.button} size={24} /><Text style={s.emptyText}>İlk hareket fotoğrafın burada görünecek.</Text></View>}

    <Pressable onPress={() => router.push("/(tabs)/posture" as Href)} style={[s.postureSummary, { backgroundColor: theme.surfaceRaised }, shenShape(shen.id)]}><View><Text style={s.statLabel}>POSTÜR ANALİZİ</Text><Text style={s.postureTitle}>{lastReport ? "Son analizine dön" : "Beden çizgini keşfet"}</Text><Text style={s.quickSubtitle}>{lastReport ? `Son ölçüm: ${lastReport.score} puan` : "Ön, yan ve arka görünüm"}</Text></View><Ionicons name="arrow-forward" color={theme.button} size={22} /></Pressable>
  </Screen></>;
}

function StatTile({ label, value, unit, detail, progress, shenId }: { label: string; value: string; unit: string; detail: string; progress?: number; shenId: ShenId }) {
  const theme = shenThemes[shenId];
  return <View style={[s.stat, { backgroundColor: theme.surfaceRaised }, shenShape(shenId)]}><Text style={s.statLabel}>{label}</Text><Text style={[s.statValue, { color: theme.button }]}>{value}<Text style={s.statUnit}> {unit}</Text></Text>{progress === undefined ? <Text style={s.statDetail}>{detail}</Text> : <><View style={s.track}><View style={[s.fill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: theme.button }]} /></View><Text style={s.statDetail}>{detail}</Text></>}</View>;
}

const s = StyleSheet.create({
  page: { gap: 0, paddingHorizontal: 18, paddingBottom: 34 },
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
  heroAction: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, minHeight: 34, paddingHorizontal: 13, marginTop: 11 },
  heroActionText: { fontFamily: fonts.sansStrong, fontSize: 11, letterSpacing: .4 },
  shenPickerOuter: { flexGrow: 0, marginBottom: 16 },
  shenPicker: { flexDirection: "row", gap: 7, paddingRight: 5 },
  shenChoice: { flexDirection: "row", alignItems: "center", gap: 5, minWidth: 62, height: 43, paddingHorizontal: 9, borderWidth: 1 },
  shenIcon: { width: 23, height: 23, borderRadius: 12 },
  shenChoiceText: { fontFamily: fonts.sansStrong, fontSize: 11 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 7 },
  stat: { width: "48%", minHeight: 93, padding: 13, overflow: "hidden" },
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
  quickActions: { flexDirection: "row", gap: 9 },
  quick: { flex: 1, minHeight: 115, padding: 15, justifyContent: "space-between" },
  quickTitle: { color: "#F6F3EC", fontFamily: fonts.sansStrong, fontSize: 15, marginBottom: 3 },
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
  gameEyebrow: { fontFamily:fonts.sansStrong, fontSize:10, letterSpacing:1.5 },
  gameTitle: { color:'#F6F3EC', fontFamily:fonts.displayMedium, fontSize:23, lineHeight:28 },
  gameBody: { color:'#BFC9CB', fontFamily:fonts.sans, fontSize:13, lineHeight:19 },
  gameStatus: { fontFamily:fonts.sansMedium, fontSize:12 },
  gameLink: { fontFamily:fonts.sansStrong, fontSize:13, marginTop:4 },
  formProgress: { flexDirection:'row', gap:3, marginVertical:5 },
  formProgressDot: { flex:1, height:8, borderRadius:5 },
});
