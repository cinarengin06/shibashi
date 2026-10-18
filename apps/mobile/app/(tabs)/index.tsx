import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { getJourneyDay } from "../../../../packages/experience-design";
import { Screen, ShenBackdrop } from "../../components/ui";
import { colors, fonts } from "../../constants/theme";
import { practices } from "../../data/content";
import { getShen } from "../../data/fiveShen";
import { useApp } from "../../store/AppStore";
import { useShenExperience } from "../../store/ShenExperience";
import { fiveShen } from "../../data/fiveShen";
import { shenIcons } from "../../data/shenIcons";
import { shenThemes } from "../../../../packages/design-tokens";
import {
  fiveShenContent,
  fiveShenTraditionNote,
} from "../../../../packages/five-shen-content";
import { PostureReport, PracticeSession, ShenId } from "../../types";
import {
  ensureSystemNotifications,
  unreadNotificationCount,
} from "../../services/notifications/NotificationInbox";

const shenTodayCopy: Record<
  ShenId,
  {
    action: string;
    body: string;
    identity: string;
    motto: string;
    shortLabel: string;
    title: string;
  }
> = {
  hun: {
    action: "Yönünü bul",
    body: fiveShenContent.hun.dailyPrompt,
    identity: fiveShenContent.hun.identity,
    motto: "Rüzgâr yönü gösterir; adımı sen seçersin.",
    shortLabel: fiveShenContent.hun.familiarName,
    title: "Ufku genişlet.",
  },
  shen: {
    action: "Berraklığı aç",
    body: fiveShenContent.shen.dailyPrompt,
    identity: fiveShenContent.shen.identity,
    motto: "Kalp yumuşadığında parçalar birbirini duyar.",
    shortLabel: fiveShenContent.shen.familiarName,
    title: "Berrak ve ilgili kal.",
  },
  yi: {
    action: "Odağını kur",
    body: fiveShenContent.yi.dailyPrompt,
    identity: fiveShenContent.yi.identity,
    motto: "Bir anda tek şey; bir nefeste tek yön.",
    shortLabel: fiveShenContent.yi.familiarName,
    title: "Niyetini eyleme taşı.",
  },
  po: {
    action: "Bedene dön",
    body: fiveShenContent.po.dailyPrompt,
    identity: fiveShenContent.po.identity,
    motto: "Beden bıraktığında nefes yerini bulur.",
    shortLabel: fiveShenContent.po.familiarName,
    title: "Nefesi ve bedeni duy.",
  },
  zhi: {
    action: "İradeni koru",
    body: fiveShenContent.zhi.dailyPrompt,
    identity: fiveShenContent.zhi.identity,
    motto: "Derin su acele etmez; yine de yolunu bulur.",
    shortLabel: fiveShenContent.zhi.familiarName,
    title: "Sessizce devam et.",
  },
};

const homePortalImages = {
  posture: require("../../assets/posture/posture-back-translucent.png"),
  practice2: require("../../assets/practice2/static/03-raise-and-open.png"),
  living: require("../../assets/living-learning/curtains-opening.png"),
  humanMap: require("../../assets/journey/neijing-map.jpg"),
} satisfies Record<string, ImageSourcePropType>;

export default function Today() {
  const { profile, saveProfile, sessions, postureReports } = useApp();
  const { soundEnabled, toggleSound } = useShenExperience();
  const shen = getShen(profile.selectedShenId);
  const todayCopy = shenTodayCopy[shen.id];
  const personality = shenThemes[shen.id];
  const heroGradient =
    shen.id === "hun"
      ? ([
          "rgba(18,40,22,.08)",
          "rgba(18,36,22,.68)",
          "rgba(9,20,12,.98)",
        ] as const)
      : shen.id === "shen"
        ? ([
            "rgba(67,39,18,.06)",
            "rgba(57,34,18,.66)",
            "rgba(25,16,9,.98)",
          ] as const)
        : shen.id === "yi"
          ? ([
              "rgba(55,52,44,.06)",
              "rgba(43,42,37,.7)",
              "rgba(18,19,17,.98)",
            ] as const)
          : shen.id === "po"
            ? ([
                "rgba(55,35,24,.08)",
                "rgba(48,31,22,.7)",
                "rgba(24,16,12,.98)",
              ] as const)
            : ([
                "rgba(16,38,54,.08)",
                "rgba(15,34,48,.7)",
                "rgba(7,17,25,.98)",
              ] as const);
  const practice =
    practices.find((item) => item.id === shen.practiceId) ?? practices[0];
  const journeyDay = getJourneyDay(profile.onboardingCheckin?.createdAt);
  const todayKey = new Date().toDateString();
  const todaySessions = sessions.filter(
    (item) => new Date(item.date).toDateString() === todayKey,
  );
  const completedMinutes = todaySessions.reduce(
    (total, item) => total + item.duration,
    0,
  );
  const hasPracticedToday = todaySessions.length > 0;
  const earnedXp = sessions.reduce((total, item) => total + (item.xp ?? 0), 0);
  const recentMovementPhotos = sessions
    .filter((item): item is PracticeSession & { imageData: string } => typeof item.imageData === "string" && /^(?:data:image\/|file:|https?:\/\/)/i.test(item.imageData))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 5);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void ensureSystemNotifications({
        hasPostureReport: postureReports.length > 0,
        hasSessionToday: todaySessions.length > 0,
        remindersEnabled: profile.reminders,
      }).then((items) => {
        if (active) setUnreadNotifications(unreadNotificationCount(items));
      });
      return () => { active = false; };
    }, [postureReports.length, profile.reminders, todaySessions.length]),
  );

  const startPractice = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    router.push(`/practice-session?practiceId=${practice.id}`);
  };

  return (
    <Screen style={[s.page, { backgroundColor: `${personality.surface}72` }]}>
      <View style={s.header}>
        <View style={s.brand}>
          <View style={[s.brandRing, { borderColor: personality.primary }]} />
          <View>
            <Text style={[s.brandName, { color: personality.light }]}>
              SHIBASHI
            </Text>
            <Text style={s.brandSub}>EFE</Text>
          </View>
        </View>
        <View style={s.headerActions}>
          <View style={s.streak}>
            <Ionicons color="#F28A39" name="flame" size={17} />
            <Text style={s.streakText}>{journeyDay}</Text>
          </View>
          <Pressable
            accessibilityLabel={unreadNotifications ? `${unreadNotifications} okunmamış bildirim` : "Bildirimleri aç"}
            accessibilityRole="button"
            onPress={() => router.push("/notifications")}
            style={s.roundAction}
          >
            <Ionicons color={personality.light} name="notifications-outline" size={19} />
            {unreadNotifications ? (
              <View style={[s.notificationBadge, { backgroundColor: personality.primary }]}>
                <Text style={[s.notificationBadgeText, { color: personality.buttonInk }]}>{Math.min(9, unreadNotifications)}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityLabel={soundEnabled ? "Müziği kapat" : "Müziği aç"}
            accessibilityRole="button"
            onPress={toggleSound}
            style={s.roundAction}
          >
            <Ionicons
              color={personality.light}
              name={soundEnabled ? "volume-medium" : "volume-mute"}
              size={19}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Profili aç"
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/profile")}
            style={[s.avatar, { borderColor: `${personality.primary}88` }]}
          >
            <Text style={s.avatarText}>
              {(profile.name || "S").slice(0, 1).toLocaleUpperCase("tr-TR")}
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          s.hero,
          {
            borderColor: `${shen.color}A8`,
            borderRadius:
              personality.controlRadius === 999
                ? 34
                : Math.max(14, personality.controlRadius),
            shadowColor: personality.primary,
          },
        ]}
      >
        <ShenBackdrop
          borderRadius={
            personality.controlRadius === 999
              ? 34
              : Math.max(14, personality.controlRadius)
          }
        />
        <LinearGradient
          colors={heroGradient}
          locations={[0, 0.44, 1]}
          style={s.heroShade}
        >
          <View style={s.welcomeBlock}>
            <Text style={s.greeting}>Hoş geldin, {profile.name} 👋</Text>
            <Text style={s.welcomeCopy}>
              Bedenini uyandır, nefesinle dengeyi bul.
            </Text>
            <Text style={s.date}>{formatToday()}</Text>
          </View>
          <View style={s.heroSpace} />
          <View
            style={[
              s.todayShen,
              {
                borderColor: `${shen.color}66`,
                backgroundColor: `${personality.dark}D8`,
              },
            ]}
          >
            <View style={[s.todayShenIcon, { borderColor: shen.color }]}>
              <Text style={[s.todayShenSymbol, { color: shen.color }]}>
                {shen.symbol}
              </Text>
            </View>
            <View style={s.todayShenCopy}>
              <Text style={s.todayShenLabel}>BUGÜNKÜ SHEN'İN</Text>
              <Text style={[s.todayShenName, { color: personality.light }]}>
                {shen.name} · {todayCopy.shortLabel}
              </Text>
            </View>
            <Ionicons
              color={personality.light}
              name="chevron-forward"
              size={18}
            />
          </View>
          <Text
            style={[
              s.title,
              {
                color: personality.light,
                fontFamily:
                  personality.headingWeight === "600"
                    ? fonts.displayStrong
                    : personality.headingWeight === "500"
                      ? fonts.displayMedium
                      : fonts.displayRegular,
              },
            ]}
          >
            {todayCopy.title}
          </Text>
          <Text style={s.body}>{todayCopy.body}</Text>
          <View style={[s.quoteCard, { borderColor: `${shen.color}50` }]}>
            <Text style={[s.quoteMark, { color: shen.color }]}>“</Text>
            <Text style={s.motto}>{todayCopy.motto}</Text>
          </View>
          <Pressable
            onPress={startPractice}
            style={[
              s.primary,
              {
                borderColor: personality.light,
                borderRadius: personality.controlRadius,
              },
            ]}
          >
            <LinearGradient
              colors={[personality.light, personality.button]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                s.primaryInner,
                { borderRadius: personality.controlRadius },
              ]}
            >
              <Ionicons name="play" color={personality.buttonInk} size={18} />
              <Text style={[s.primaryText, { color: personality.buttonInk }]}>
                {hasPracticedToday
                  ? "GÜNLÜK PRATİĞE YENİDEN DÖN"
                  : "GÜNLÜK PRATİĞE BAŞLA"}
              </Text>
            </LinearGradient>
          </Pressable>
          <Text style={s.practiceMeta}>
            {practice.duration} dakika · {shen.dailyName}
          </Text>
        </LinearGradient>
      </View>

      <View
        style={[s.shenChooser, { borderColor: `${personality.primary}38` }]}
      >
        <Text style={[s.shenChooserLabel, { color: personality.light }]}>
          BEŞ SHEN · BUGÜN HANGİ YÖN SANA EŞLİK ETSİN?
        </Text>
        <Text style={s.shenChooserIntro}>{fiveShenTraditionNote}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.worldPicker}
        >
          {fiveShen.map((item) => {
            const itemPersonality = shenThemes[item.id];
            const active = item.id === shen.id;
            const copy = shenTodayCopy[item.id];
            return (
              <Pressable
                accessibilityLabel={`${item.name}, ${copy.shortLabel}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={item.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  saveProfile({ selectedShenId: item.id });
                }}
                style={[
                  s.worldChoice,
                  {
                    borderRadius: Math.min(18, itemPersonality.controlRadius),
                    opacity: active ? 1 : 0.62,
                  },
                  active && {
                    backgroundColor: itemPersonality.surfaceRaised,
                    borderColor: itemPersonality.primary,
                    shadowColor: itemPersonality.primary,
                    shadowOpacity: 0.42,
                    shadowRadius: 16,
                    transform: [{ translateY: -3 }],
                  },
                ]}
              >
                <View style={s.worldChoiceTop}>
                  <Image source={shenIcons[item.id]} style={s.worldIcon} />
                  <Text
                    style={[
                      s.worldName,
                      active && {
                        color: itemPersonality.light,
                        fontFamily:
                          itemPersonality.headingWeight === "600"
                            ? fonts.displayStrong
                            : itemPersonality.headingWeight === "500"
                              ? fonts.displayMedium
                              : fonts.displayRegular,
                      },
                    ]}
                  >
                    {copy.shortLabel}
                  </Text>
                </View>
                <Text
                  style={[
                    s.worldMeaning,
                    active && { color: itemPersonality.light },
                  ]}
                >
                  {item.name} · {item.element}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View
          style={[
            s.shenIdentity,
            {
              borderColor: `${shen.color}70`,
              backgroundColor: `${personality.surfaceRaised}EE`,
              borderRadius: Math.min(24, personality.controlRadius + 8),
            },
          ]}
        >
          <View
            style={[
              s.shenIdentitySymbol,
              { borderColor: shen.color, backgroundColor: `${shen.color}16` },
            ]}
          >
            <Image source={shenIcons[shen.id]} style={s.shenIdentityImage} />
          </View>
          <View style={s.shenIdentityCopy}>
            <Text style={s.shenIdentityTitle}>
              <Text style={{ color: shen.color }}>{shen.name}</Text> ·{" "}
              {todayCopy.identity}
            </Text>
            <Text style={s.shenIdentityMeta}>{shen.element}</Text>
          </View>
        </View>
      </View>

      <View style={s.realProgress}>
        <DashboardMetric
          accent="#F28A39"
          icon="flame"
          label="Seri"
          value={`${journeyDay} gün`}
        />
        <DashboardMetric
          accent={personality.primary}
          icon="medal-outline"
          label="Seviye"
          value={`${Math.max(1, Math.floor(earnedXp / 100) + 1)}`}
        />
        <DashboardMetric
          accent={personality.light}
          icon="calendar-outline"
          label="Bu hafta"
          value={`${sessions.length} pratik`}
        />
        <DashboardMetric
          accent={shen.color}
          icon="pulse-outline"
          label="Bugün"
          value={`${completedMinutes || 0} dk`}
        />
      </View>

      <View style={s.recentPhotosHead}>
        <View>
          <Text style={[s.kicker, { color: personality.light }]}>HAREKET ARŞİVİN</Text>
          <Text style={s.sectionTitle}>Son hareketlerin</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/journal")}>
          <Text style={[s.recentPhotosLink, { color: personality.primary }]}>Galeriyi aç →</Text>
        </Pressable>
      </View>
      {recentMovementPhotos.length ? (
        <ScrollView contentContainerStyle={s.recentPhotos} horizontal showsHorizontalScrollIndicator={false}>
          {recentMovementPhotos.map((item) => (
            <Pressable accessibilityLabel={`${item.movementName ?? "Hareket"} fotoğrafını aç`} accessibilityRole="button" key={item.id} onPress={() => router.push("/(tabs)/journal")} style={[s.recentPhotoCard, { borderColor: `${personality.primary}58` }]}>
              <Image source={{ uri: item.imageData }} style={s.recentPhotoImage} />
              <LinearGradient colors={["transparent", "rgba(4,9,7,.96)"]} style={s.recentPhotoShade}>
                <Text numberOfLines={2} style={s.recentPhotoTitle}>{item.movementName ?? "Hareket"}</Text>
                <Text style={[s.recentPhotoScore, { color: personality.primary }]}>%{Math.round(item.postureScore ?? item.flowScore ?? 0)}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={[s.recentPhotosEmpty, { borderColor: `${personality.primary}42` }]}>
          <Ionicons color={personality.primary} name="camera-outline" size={25} />
          <View style={{ flex: 1 }}><Text style={s.recentPhotosEmptyTitle}>Henüz hareket fotoğrafın yok</Text><Text style={s.recentPhotosEmptyText}>Kamerayla tamamladığın hareketler burada birikir.</Text></View>
        </View>
      )}

      <View style={s.portalsHead}>
        <Text style={[s.kicker, { color: personality.light }]}>
          KEŞİF ALANLARI
        </Text>
        <Text style={s.sectionTitle}>Bugün nereye bakmak istersin?</Text>
      </View>
      <View style={s.portalGrid}>
        <HomePostureCard
          accent={personality.primary}
          image={homePortalImages.posture}
          reports={postureReports}
        />
        <FeaturePortal
          accent={personality.primary}
          image={homePortalImages.practice2}
          label="HASSAS ÇALIŞMA"
          note="Hedef pozu kamerada eşleştir"
          onPress={() => router.push("/(tabs)/pratik2")}
          title="Pratik 2"
          contain
        />
        <FeaturePortal
          accent={personality.primary}
          image={homePortalImages.living}
          label="HİKÂYELİ HAREKET"
          note="Hareketi gündelik sahnede yaşa"
          onPress={() => router.push("/living-learning")}
          title="Yaşayarak Öğren"
        />
        <FeaturePortal
          accent={personality.primary}
          image={homePortalImages.humanMap}
          label="İÇ HARİTA"
          note="Bedenindeki sekiz kapıyı keşfet"
          onPress={() =>
            router.push({
              pathname: "/(tabs)/journey",
              params: { view: "map" },
            })
          }
          title="İnsan Haritası"
        />
      </View>

      <Text style={s.closing}>“Yol, tek bir sakin adımla görünür olur.”</Text>
    </Screen>
  );
}

function HomePostureCard({ accent, image, reports }: { accent: string; image: ImageSourcePropType; reports: PostureReport[] }) {
  const recentReports = reports.slice(0, 3);
  const openReport = (reportId: string) => router.push({ pathname: "/posture", params: { reportId } });
  return (
    <View style={[s.postureCard, { borderColor: `${accent}48` }]}>
      <Image resizeMode="contain" source={image} style={s.postureModel} />
      <LinearGradient colors={["rgba(8,14,11,.98)", "rgba(8,14,11,.88)", "rgba(8,14,11,.18)"]} locations={[0, .62, 1]} style={StyleSheet.absoluteFill} />
      <View style={s.postureCardContent}>
        <Text style={[s.portalLabel, { color: accent }]}>BEDEN AYNASI</Text>
        <Text style={s.postureCardTitle}>Postür Analizi</Text>
        {recentReports.length ? <View style={s.postureHistory}>
          {recentReports.map((report) => <Pressable accessibilityLabel={`${report.score} puanlı postür analizini aç`} key={report.id} onPress={() => openReport(report.id)} style={s.postureHistoryRow}>
            <View style={[s.postureHistoryScore, { borderColor: `${accent}88` }]}><Text style={[s.postureHistoryScoreText, { color: accent }]}>{report.score}</Text></View>
            <View style={s.postureHistoryCopy}><Text style={s.postureHistoryDate}>{new Date(report.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</Text><Text numberOfLines={1} style={s.postureHistorySummary}>{report.summary}</Text><Text style={[s.postureHistoryLink, { color: accent }]}>İlgili analize git →</Text></View>
          </Pressable>)}
        </View> : <Text style={s.postureEmpty}>Henüz kayıt yok. İlk beden çizgini ölç.</Text>}
        <Pressable onPress={() => router.push("/posture-session")} style={[s.newPostureButton, { borderColor: `${accent}88` }]}><Text style={[s.newPostureButtonText, { color: accent }]}>Yeni analiz</Text><Ionicons color={accent} name="scan-outline" size={18} /></Pressable>
      </View>
    </View>
  );
}

function FeaturePortal({
  accent,
  contain = false,
  image,
  label,
  note,
  onPress,
  title,
}: {
  accent: string;
  contain?: boolean;
  image: ImageSourcePropType;
  label: string;
  note: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`${title}. ${note}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[s.portal, { borderColor: `${accent}48` }]}
    >
      <ImageBackground
        imageStyle={[s.portalImage, contain && s.portalImageContain]}
        resizeMode={contain ? "contain" : "cover"}
        source={image}
        style={s.portalBackground}
      >
        <LinearGradient
          colors={["rgba(4,9,7,.04)", "rgba(4,9,7,.28)", "rgba(4,9,7,.96)"]}
          locations={[0, 0.46, 1]}
          style={s.portalShade}
        >
          <View style={s.portalArrow}>
            <Ionicons color={colors.cream} name="arrow-up-outline" size={15} />
          </View>
          <View style={s.portalSpace} />
          <Text style={[s.portalLabel, { color: accent }]}>{label}</Text>
          <Text numberOfLines={2} style={s.portalTitle}>
            {title}
          </Text>
          <Text numberOfLines={2} style={s.portalNote}>
            {note}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}

function DashboardMetric({
  accent,
  icon,
  label,
  value,
}: {
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={[s.metricCard, { borderColor: `${accent}42` }]}>
      <View style={s.metricHead}>
        <Ionicons color={accent} name={icon} size={17} />
        <Text style={s.metricLabel}>{label}</Text>
      </View>
      <Text style={[s.metricValue, { color: accent }]}>{value}</Text>
      <View style={s.metricTrack}>
        <View
          style={[s.metricFill, { backgroundColor: accent, width: "68%" }]}
        />
      </View>
    </View>
  );
}

function formatToday() {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

const s = StyleSheet.create({
  page: { gap: 20, paddingBottom: 42 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  brand: { alignItems: "center", flexDirection: "row", gap: 10 },
  brandRing: {
    borderLeftColor: "transparent",
    borderRadius: 22,
    borderWidth: 2,
    height: 42,
    transform: [{ rotate: "-25deg" }],
    width: 42,
  },
  brandName: { fontFamily: fonts.sansBold, fontSize: 16, letterSpacing: 4 },
  brandSub: {
    color: colors.gold,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 3.2,
    textAlign: "center",
  },
  headerActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  streak: {
    alignItems: "center",
    backgroundColor: "rgba(5,12,9,.72)",
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    height: 38,
    paddingHorizontal: 10,
  },
  streakText: {
    color: colors.cream,
    fontFamily: fonts.metricStrong,
    fontSize: 14,
  },
  roundAction: {
    alignItems: "center",
    backgroundColor: "rgba(5,12,9,.72)",
    borderColor: colors.line,
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  notificationBadge: {
    alignItems: "center",
    borderColor: colors.deep,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    minWidth: 22,
    paddingHorizontal: 3,
    position: "absolute",
    right: -4,
    top: -5,
  },
  notificationBadgeText: { fontFamily: fonts.sansBold, fontSize: 13, lineHeight: 15 },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: 19,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  avatarText: { color: colors.cream, fontFamily: fonts.sansBold, fontSize: 15 },
  greeting: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 29,
    lineHeight: 34,
  },
  welcomeCopy: {
    color: colors.cream,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 5,
    maxWidth: 270,
  },
  date: {
    color: colors.muted,
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 5,
    textTransform: "capitalize",
  },
  shenChooser: {
    borderBottomColor: colors.line,
    borderTopColor: colors.line,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    gap: 12,
    paddingVertical: 14,
  },
  shenChooserLabel: {
    color: colors.gold,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 1.05,
  },
  shenChooserIntro: {
    color: colors.muted,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
  },
  worldPicker: { gap: 8, paddingRight: 18, paddingTop: 4 },
  worldChoice: {
    alignItems: "flex-start",
    borderColor: colors.line,
    borderWidth: 1,
    gap: 5,
    justifyContent: "center",
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: 158,
  },
  worldChoiceTop: { alignItems: "center", flexDirection: "row", gap: 7 },
  worldIcon: { borderRadius: 15, height: 30, width: 30 },
  worldName: {
    color: colors.cream,
    fontFamily: fonts.displayMedium,
    fontSize: 18,
  },
  worldMeaning: {
    color: colors.muted,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  shenIdentity: {
    alignItems: "center",
    backgroundColor: "rgba(17,23,19,.74)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 76,
    padding: 12,
  },
  shenIdentitySymbol: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48,
  },
  shenIdentityImage: { height: "100%", width: "100%" },
  shenIdentityCopy: { flex: 1, gap: 4 },
  shenIdentityTitle: {
    color: colors.cream,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 21,
  },
  shenIdentityMeta: {
    color: colors.muted,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  hero: {
    borderRadius: 30,
    borderWidth: 1,
    minHeight: 650,
    overflow: "hidden",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  heroShade: { flex: 1, minHeight: 650, padding: 20 },
  welcomeBlock: { paddingTop: 2 },
  heroSpace: { flex: 1, minHeight: 170 },
  todayShen: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    marginBottom: 17,
    padding: 12,
  },
  todayShenIcon: {
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  todayShenSymbol: { fontFamily: fonts.displayStrong, fontSize: 20 },
  todayShenCopy: { flex: 1, gap: 2 },
  todayShenLabel: {
    color: colors.muted,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 1,
  },
  todayShenName: { fontFamily: fonts.displayMedium, fontSize: 17 },
  title: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 38,
    lineHeight: 42,
    maxWidth: 320,
  },
  body: {
    color: colors.cream,
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 10,
    maxWidth: 315,
  },
  quoteCard: {
    alignItems: "flex-start",
    backgroundColor: "rgba(4,10,7,.66)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    marginTop: 16,
    padding: 13,
  },
  quoteMark: { fontFamily: fonts.displayStrong, fontSize: 34, lineHeight: 31 },
  motto: {
    color: colors.ivory,
    flex: 1,
    fontFamily: fonts.displayMedium,
    fontSize: 17,
    fontStyle: "italic",
    lineHeight: 23,
  },
  primary: {
    alignSelf: "stretch",
    borderWidth: 1,
    marginTop: 18,
    minHeight: 56,
    overflow: "hidden",
  },
  primaryInner: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  primaryText: {
    color: colors.ink,
    fontFamily: fonts.sansStrong,
    fontSize: 15,
  },
  practiceMeta: {
    color: colors.muted,
    fontFamily: fonts.sans,
    fontSize: 14,
    letterSpacing: 0.3,
    marginTop: 10,
    textAlign: "center",
  },
  realProgress: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  recentPhotosHead:{alignItems:"flex-end",flexDirection:"row",justifyContent:"space-between",marginTop:4},
  recentPhotosLink:{fontFamily:fonts.sansBold,fontSize:12,letterSpacing:.4,marginBottom:12,textTransform:"uppercase"},
  recentPhotos:{gap:10,paddingRight:18},
  recentPhotoCard:{backgroundColor:colors.surface,borderRadius:19,borderWidth:1,height:210,overflow:"hidden",width:148},
  recentPhotoImage:{height:"100%",width:"100%"},
  recentPhotoShade:{bottom:0,left:0,padding:12,paddingTop:42,position:"absolute",right:0},
  recentPhotoTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:18,lineHeight:20},
  recentPhotoScore:{fontFamily:fonts.sansBold,fontSize:12,marginTop:5},
  recentPhotosEmpty:{alignItems:"center",backgroundColor:"rgba(4,11,8,.68)",borderRadius:18,borderWidth:1,flexDirection:"row",gap:12,minHeight:82,padding:14},
  recentPhotosEmptyTitle:{color:colors.cream,fontFamily:fonts.sansBold,fontSize:14},
  recentPhotosEmptyText:{color:colors.muted,fontFamily:fonts.sans,fontSize:12,lineHeight:17,marginTop:3},
  metricCard: {
    backgroundColor: "rgba(4,11,8,.76)",
    borderRadius: 17,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: 10,
    minHeight: 112,
    padding: 14,
  },
  metricHead: { alignItems: "center", flexDirection: "row", gap: 7 },
  metricLabel: {
    color: colors.muted,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  metricValue: { fontFamily: fonts.metricStrong, fontSize: 24 },
  metricTrack: {
    backgroundColor: "rgba(255,255,255,.08)",
    borderRadius: 3,
    height: 4,
    overflow: "hidden",
  },
  metricFill: { borderRadius: 3, height: "100%" },
  portalsHead: { gap: 3, marginTop: 2 },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 28,
    marginBottom: 8,
  },
  portalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  postureCard:{backgroundColor:colors.surface,borderRadius:22,borderWidth:1,minHeight:336,overflow:'hidden',position:'relative',width:'100%'},
  postureModel:{bottom:-8,height:'92%',opacity:.78,position:'absolute',right:-15,width:'47%'},
  postureCardContent:{flex:1,padding:16,width:'72%'},
  postureCardTitle:{color:colors.cream,fontFamily:fonts.displayStrong,fontSize:27,lineHeight:31,marginBottom:10,marginTop:3},
  postureHistory:{gap:6},
  postureHistoryRow:{alignItems:'center',backgroundColor:'rgba(4,10,7,.66)',borderColor:colors.line,borderRadius:12,borderWidth:1,flexDirection:'row',gap:9,minHeight:61,padding:7},
  postureHistoryScore:{alignItems:'center',borderRadius:19,borderWidth:1,height:38,justifyContent:'center',width:38},
  postureHistoryScoreText:{fontFamily:fonts.sansBold,fontSize:14},
  postureHistoryCopy:{flex:1,minWidth:0},
  postureHistoryDate:{color:colors.cream,fontFamily:fonts.sansBold,fontSize:12},
  postureHistorySummary:{color:colors.muted,fontFamily:fonts.sansMedium,fontSize:11,marginTop:1},
  postureHistoryLink:{fontFamily:fonts.sansBold,fontSize:10,marginTop:2},
  postureEmpty:{color:colors.muted,fontFamily:fonts.sansMedium,fontSize:14,lineHeight:21,marginVertical:12},
  newPostureButton:{alignItems:'center',alignSelf:'flex-start',borderRadius:15,borderWidth:1,flexDirection:'row',gap:7,marginTop:'auto',minHeight:43,paddingHorizontal:14},
  newPostureButtonText:{fontFamily:fonts.sansBold,fontSize:13,letterSpacing:.4,textTransform:'uppercase'},
  portal: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    height: 224,
    overflow: "hidden",
  },
  portalBackground: { flex: 1 },
  portalImage: { borderRadius: 21 },
  portalImageContain: { backgroundColor: "#111713" },
  portalShade: { flex: 1, padding: 14 },
  portalArrow: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "rgba(8,13,10,.7)",
    borderColor: "rgba(242,238,231,.22)",
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    width: 34,
  },
  portalSpace: { flex: 1 },
  portalLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 0.85,
  },
  portalTitle: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 22,
    lineHeight: 24,
    marginTop: 4,
  },
  portalNote: {
    color: colors.muted,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  closing: {
    color: "rgba(232,222,205,.52)",
    fontFamily: fonts.display,
    fontSize: 17,
    fontStyle: "italic",
    lineHeight: 24,
    paddingVertical: 16,
    textAlign: "center",
  },
});
