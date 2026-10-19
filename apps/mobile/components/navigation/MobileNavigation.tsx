import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "../../constants/theme";

type Props = {
  accent: string;
  background: string;
  border: string;
  inactive: string;
  navigation: {
    emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
};

const primaryTabs = ["index", "practice", "journey", "journal"];

const mainItems: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: Href;
  tab?: string;
}> = [
  { label: "Özel Odam", icon: "sunny-outline", route: "/(tabs)", tab: "index" },
  { label: "Pratikler", icon: "play-circle-outline", route: "/(tabs)/practice", tab: "practice" },
  { label: "18 Hareketle Öğren", icon: "sparkles-outline", route: "/body-lines" },
  { label: "Postür Analizi", icon: "body-outline", route: "/posture" },
  { label: "Haritam", icon: "compass-outline", route: "/(tabs)/journey", tab: "journey" },
  { label: "Günlük", icon: "book-outline", route: "/(tabs)/journal", tab: "journal" },
  { label: "Ayarlar", icon: "settings-outline", route: "/(tabs)/profile", tab: "profile" },
];

const extraItems: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; route: Href }> = [
  { label: "Koçlar", icon: "people-outline", route: "/coaches" },
  { label: "Usta Defteri", icon: "bookmark-outline", route: "/master-notebook" },
  { label: "Bildirimler", icon: "notifications-outline", route: "/notifications" },
];

export function MobileNavigation({
  accent,
  background,
  border,
  inactive,
  navigation,
  state,
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const visibleRoutes = primaryTabs
    .map((name) => ({ name, index: state.routes.findIndex((route) => route.name === name) }))
    .filter((item) => item.index >= 0);

  const openRoute = (route: Href, tab?: string) => {
    setMenuVisible(false);
    if (tab) {
      navigation.navigate(tab);
      return;
    }
    router.push(route);
  };

  return (
    <>
      <View style={[styles.bar, { backgroundColor: background, borderColor: border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        {visibleRoutes.map(({ name, index }) => {
          const route = state.routes[index];
          const focused = state.index === index;
          const item = mainItems.find((candidate) => candidate.tab === name);
          if (!item) return null;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              key={name}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              style={styles.barItem}
            >
              <Ionicons color={focused ? accent : inactive} name={item.icon} size={21} />
              <Text numberOfLines={1} style={[styles.barLabel, { color: focused ? accent : inactive }]}>{item.label}</Text>
            </Pressable>
          );
        })}
        <Pressable accessibilityLabel="Menüyü aç" accessibilityRole="button" onPress={() => setMenuVisible(true)} style={styles.barItem}>
          <Ionicons color={inactive} name="menu-outline" size={23} />
          <Text style={[styles.barLabel, { color: inactive }]}>Menü</Text>
        </Pressable>
      </View>

      <Modal animationType="fade" onRequestClose={() => setMenuVisible(false)} transparent visible={menuVisible}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Menüyü kapat" onPress={() => setMenuVisible(false)} style={styles.scrim} />
          <View style={[styles.panel, { backgroundColor: background, borderColor: border, paddingTop: Math.max(insets.top, 18) }]}>
            <View style={styles.panelHeader}>
              <View><Text style={styles.brand}>SHIBASHI</Text><Text style={[styles.panelTitle, { color: accent }]}>Gezinme</Text></View>
              <Pressable accessibilityLabel="Menüyü kapat" onPress={() => setMenuVisible(false)} style={styles.closeButton}>
                <Ionicons color={inactive} name="close" size={23} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={[styles.menuList, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {mainItems.map((item, index) => (
                <Pressable key={item.label} onPress={() => openRoute(item.route, item.tab)} style={styles.menuItem}>
                  <Text style={[styles.menuIndex, { color: accent }]}>{String(index + 1).padStart(2, "0")}</Text>
                  <Ionicons color={inactive} name={item.icon} size={20} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons color={inactive} name="chevron-forward" size={17} />
                </Pressable>
              ))}
              <Text style={[styles.sectionLabel, { borderColor: border }]}>DİĞER</Text>
              {extraItems.map((item) => (
                <Pressable key={item.label} onPress={() => openRoute(item.route)} style={styles.menuItem}>
                  <View style={styles.indexSpacer} />
                  <Ionicons color={inactive} name={item.icon} size={20} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Ionicons color={inactive} name="chevron-forward" size={17} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 4, paddingTop: 8 },
  barItem: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 54, paddingHorizontal: 2 },
  barLabel: { fontFamily: fonts.sansStrong, fontSize: 10, maxWidth: "100%" },
  modalRoot: { flex: 1, flexDirection: "row", justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,.62)" },
  panel: { borderLeftWidth: StyleSheet.hairlineWidth, height: "100%", maxWidth: 420, paddingHorizontal: 20, width: "88%" },
  panelHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 18 },
  brand: { color: "#F2EEE7", fontFamily: fonts.sansStrong, fontSize: 12, letterSpacing: 2.2 },
  panelTitle: { fontFamily: fonts.display, fontSize: 27, marginTop: 5 },
  closeButton: { alignItems: "center", borderColor: "rgba(242,238,231,.18)", borderRadius: 24, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  menuList: { gap: 2, paddingBottom: 24 },
  menuItem: { alignItems: "center", borderBottomColor: "rgba(242,238,231,.08)", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 12, minHeight: 54, paddingVertical: 9 },
  menuIndex: { fontFamily: fonts.sansStrong, fontSize: 11, width: 22 },
  indexSpacer: { width: 22 },
  menuLabel: { color: "#F2EEE7", flex: 1, fontFamily: fonts.sansStrong, fontSize: 15 },
  sectionLabel: { borderTopWidth: StyleSheet.hairlineWidth, color: "rgba(242,238,231,.55)", fontFamily: fonts.sansStrong, fontSize: 10, letterSpacing: 1.5, marginTop: 18, paddingTop: 18 },
});
