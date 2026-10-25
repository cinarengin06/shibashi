import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getShenVisualTheme, shenThemes } from "../../../../packages/design-tokens";
import { MobileDrawer, MobileMenuHeader } from "../../components/navigation/MobileDrawer";
import { fonts, mobileThemeFont } from "../../constants/theme";
import { shenShape } from "../../constants/shenDesign";
import { useApp } from "../../store/AppStore";
import { useShenExperience } from "../../store/ShenExperience";
import type { ShenId } from "../../types";

const bottomTabs = [
  { route: "index", label: "Odam" },
  { route: "moves", label: "18 Form" },
  { route: "posture", label: "Postür" },
  { route: "journey", label: "8 Kapı" },
  { route: "main-map", label: "Gelişim Haritam" },
] as const;
type BottomTabRoute = (typeof bottomTabs)[number]["route"];

const shenTabIcons: Record<ShenId, Record<BottomTabRoute, keyof typeof Ionicons.glyphMap>> = {
  hun: { index: "leaf-outline", moves: "walk-outline", posture: "body-outline", journey: "trail-sign-outline", "main-map": "compass-outline" },
  shen: { index: "flame-outline", moves: "sparkles-outline", posture: "accessibility-outline", journey: "sunny-outline", "main-map": "map-outline" },
  yi: { index: "ellipse-outline", moves: "fitness-outline", posture: "body-outline", journey: "layers-outline", "main-map": "analytics-outline" },
  po: { index: "moon-outline", moves: "hand-left-outline", posture: "body-outline", journey: "aperture-outline", "main-map": "navigate-outline" },
  zhi: { index: "water-outline", moves: "pulse-outline", posture: "accessibility-outline", journey: "boat-outline", "main-map": "map-outline" },
};

export default function TabLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = useApp();
  const { shen } = useShenExperience();
  const theme = shenThemes[shen.id];
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: visual.background }}>
    <MobileMenuHeader onOpen={() => setMenuOpen(true)} />
    <Tabs
      tabBar={({ state, navigation }) => <View style={[styles.bottomBar, { backgroundColor: visual.navigation, borderTopColor: visual.border, paddingBottom: Math.max(insets.bottom, 7) }]} accessibilityRole="tablist">
        {bottomTabs.map((item) => {
          const routeIndex = state.routes.findIndex((route) => route.name === item.route);
          const route = state.routes[routeIndex];
          const selected = routeIndex === state.index;
          return <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={item.route}
            onPress={() => {
              if (!route || selected) return;
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!event.defaultPrevented) navigation.navigate(item.route);
            }}
            style={styles.bottomItem}
          >
            <View style={[styles.bottomIcon, shenShape(shen.id, "button"), selected && { backgroundColor: `${theme.button}25`, borderColor: `${theme.button}88` }]}>
              <Ionicons name={shenTabIcons[shen.id][item.route]} size={22} color={selected ? theme.button : visual.textSecondary} />
            </View>
            <Text numberOfLines={2} style={[styles.bottomLabel, { color: selected ? visual.glow : visual.textSecondary, fontFamily: mobileThemeFont(visual.id) }, selected && styles.bottomLabelSelected]}>{item.label}</Text>
            {selected ? <View style={[styles.activeDot, { backgroundColor: theme.button }]} /> : null}
          </Pressable>;
        })}
      </View>}
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen name="index" options={{ title: "Odam" }} />
      <Tabs.Screen name="main-map" options={{ title: "Gelişim Haritam" }} />
      <Tabs.Screen name="lessons" options={{ title: "Isınma Dersleri" }} />
      <Tabs.Screen name="moves" options={{ title: "18 Form" }} />
      <Tabs.Screen name="posture" options={{ title: "Postür" }} />
      <Tabs.Screen name="practice" options={{ href: null, title: "Pratikler" }} />
      <Tabs.Screen name="journey" options={{ title: "8 Kapı" }} />
      <Tabs.Screen name="journal" options={{ title: "Kayıtlarım" }} />
      <Tabs.Screen name="profile" options={{ title: "Ayarlar" }} />
    </Tabs>
    <MobileDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 7, paddingHorizontal: 4, minHeight: 68 },
  bottomItem: { flex: 1, alignItems: "center", justifyContent: "flex-start", gap: 3, minWidth: 0 },
  bottomIcon: { width: 34, height: 31, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  bottomLabel: { fontFamily: fonts.sansMedium, fontSize: 10, textAlign: "center", lineHeight: 12, minHeight: 24 },
  bottomLabelSelected: { fontFamily: fonts.sansStrong },
  activeDot: { width: 3, height: 3, borderRadius: 2, marginTop: -2 },
});
