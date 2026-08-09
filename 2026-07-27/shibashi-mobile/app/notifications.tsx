import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/ui";
import { colors, fonts } from "../constants/theme";
import { getShen } from "../data/fiveShen";
import {
  ensureSystemNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
  type AppNotification,
  type NotificationKind,
} from "../services/notifications/NotificationInbox";
import { useApp } from "../store/AppStore";

const iconByKind: Record<NotificationKind, keyof typeof Ionicons.glyphMap> = {
  journey: "sparkles-outline",
  posture: "body-outline",
  practice: "play-circle-outline",
  system: "notifications-outline",
};

export default function NotificationsScreen() {
  const { postureReports, profile, sessions } = useApp();
  const shen = getShen(profile.selectedShenId);
  const [items, setItems] = useState<AppNotification[]>([]);
  const todayKey = new Date().toDateString();

  const refresh = useCallback(async () => {
    const next = await ensureSystemNotifications({
      hasPostureReport: postureReports.length > 0,
      hasSessionToday: sessions.some((item) => new Date(item.date).toDateString() === todayKey),
      remindersEnabled: profile.reminders,
    });
    setItems(next);
  }, [postureReports.length, profile.reminders, sessions, todayKey]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const open = async (item: AppNotification) => {
    void Haptics.selectionAsync();
    setItems(await markNotificationRead(item.id));
    if (item.route) router.push(item.route as never);
  };

  const markAll = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    setItems(await markAllNotificationsRead());
  };

  const unread = unreadNotificationCount(items);

  return (
    <Screen style={s.page}>
      <View style={s.topbar}>
        <Pressable accessibilityLabel="Geri dön" onPress={() => router.back()} style={s.back}>
          <Ionicons color={colors.cream} name="arrow-back" size={22} />
        </Pressable>
        <View style={s.topCopy}>
          <Text style={s.eyebrow}>SANA GELENLER</Text>
          <Text style={s.title}>Bildirimler</Text>
        </View>
        <View style={[s.count, { borderColor: `${shen.color}70` }]}>
          <Text style={[s.countText, { color: shen.color }]}>{unread}</Text>
        </View>
      </View>

      <View style={s.summary}>
        <View>
          <Text style={s.summaryTitle}>{unread ? `${unread} yeni hatırlatma` : "Her şey okundu"}</Text>
          <Text style={s.summaryBody}>Pratik, beden ve yolculuk hatırlatmaların burada birikir.</Text>
        </View>
        {unread ? <Pressable onPress={markAll}><Text style={[s.markAll, { color: shen.color }]}>Tümünü oku</Text></Pressable> : null}
      </View>

      <View style={s.list}>
        {items.map((item) => (
          <Pressable
            accessibilityLabel={`${item.title}. ${item.body}`}
            key={item.id}
            onPress={() => void open(item)}
            style={[s.card, !item.read && { borderColor: `${shen.color}62`, backgroundColor: `${shen.color}0D` }]}
          >
            <View style={[s.icon, { borderColor: `${shen.color}45`, backgroundColor: `${shen.color}12` }]}>
              <Ionicons color={shen.color} name={iconByKind[item.kind]} size={22} />
            </View>
            <View style={s.cardCopy}>
              <View style={s.cardHead}>
                <Text style={s.cardTitle}>{item.title}</Text>
                {!item.read ? <View style={[s.unreadDot, { backgroundColor: shen.color }]} /> : null}
              </View>
              <Text style={s.cardBody}>{item.body}</Text>
              <Text style={s.cardTime}>{formatNotificationTime(item.createdAt)}</Text>
            </View>
            <Ionicons color={colors.muted} name="chevron-forward" size={17} />
          </Pressable>
        ))}
        {!items.length ? <View style={s.empty}><Ionicons color={shen.color} name="notifications-off-outline" size={34} /><Text style={s.emptyTitle}>Şimdilik sessiz</Text><Text style={s.emptyBody}>Yeni bir hatırlatma geldiğinde burada göreceksin.</Text></View> : null}
      </View>
    </Screen>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value), today = new Date();
  const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (date.toDateString() === today.toDateString()) return `Bugün · ${time}`;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(date);
}

const s = StyleSheet.create({
  page: { gap: 18, paddingBottom: 44 },
  topbar: { alignItems: "center", flexDirection: "row", gap: 13, paddingTop: 4 },
  back: { alignItems: "center", backgroundColor: "rgba(5,12,9,.72)", borderColor: colors.line, borderRadius: 21, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  topCopy: { flex: 1 },
  eyebrow: { color: colors.gold, fontFamily: fonts.sansBold, fontSize: 14, letterSpacing: 1.5 },
  title: { color: colors.cream, fontFamily: fonts.displayStrong, fontSize: 31, lineHeight: 36 },
  count: { alignItems: "center", backgroundColor: colors.surface2, borderRadius: 19, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  countText: { fontFamily: fonts.metricStrong, fontSize: 15 },
  summary: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", gap: 16, justifyContent: "space-between", paddingBottom: 16 },
  summaryTitle: { color: colors.cream, fontFamily: fonts.sansStrong, fontSize: 16 },
  summaryBody: { color: colors.muted, fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, marginTop: 4, maxWidth: 260 },
  markAll: { fontFamily: fonts.sansBold, fontSize: 14 },
  list: { gap: 11 },
  card: { alignItems: "center", backgroundColor: "rgba(17,23,19,.78)", borderColor: colors.line, borderRadius: 20, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 116, padding: 14 },
  icon: { alignItems: "center", borderRadius: 23, borderWidth: 1, height: 46, justifyContent: "center", width: 46 },
  cardCopy: { flex: 1, gap: 5 },
  cardHead: { alignItems: "center", flexDirection: "row", gap: 8 },
  cardTitle: { color: colors.cream, flex: 1, fontFamily: fonts.sansStrong, fontSize: 17 },
  unreadDot: { borderRadius: 4, height: 8, width: 8 },
  cardBody: { color: colors.muted, fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  cardTime: { color: colors.gold, fontFamily: fonts.sansMedium, fontSize: 13, marginTop: 2 },
  empty: { alignItems: "center", borderColor: colors.line, borderRadius: 22, borderStyle: "dashed", borderWidth: 1, gap: 7, padding: 36 },
  emptyTitle: { color: colors.cream, fontFamily: fonts.displayStrong, fontSize: 22 },
  emptyBody: { color: colors.muted, fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, textAlign: "center" },
});
