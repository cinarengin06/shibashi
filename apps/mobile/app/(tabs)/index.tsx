import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { getJourneyDay } from "../../../../packages/experience-design";
import { Screen, ShenBackdrop } from "../../components/ui";
import { DashboardMetric, FeaturePortal, HomePostureCard, formatToday } from "../../components/home/HomeWidgets";
import { s } from "../../components/home/home.styles";
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
import { PracticeSession, ShenId } from "../../types";
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
