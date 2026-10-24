import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shenThemes } from "../../../../packages/design-tokens";
import { fonts } from "../../constants/theme";
import { shenShape } from "../../constants/shenDesign";
import { shenIcons } from "../../data/shenIcons";
import { useShenExperience } from "../../store/ShenExperience";
import type { ShenId } from "../../types";

type Props = {
  navigation: {
    emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => { defaultPrevented?: boolean };
    navigate: (name: string, params?: object) => void;
  };
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
};

const items = [
  { label: "Odam", tab: "index" },
  { label: "Gelişim Haritam", tab: "main-map" },
  { label: "18 Form", tab: "moves" },
  { label: "Postür", tab: "posture" },
  { label: "Kayıtlarım", tab: "journal" },
] as const;

const icons: Record<ShenId, Record<(typeof items)[number]["tab"], keyof typeof Ionicons.glyphMap>> = {
  hun: { index: "leaf-outline", moves: "walk-outline", posture: "body-outline", "main-map": "navigate-outline", journal: "book-outline" },
  shen: { index: "flame-outline", moves: "sparkles-outline", posture: "scan-outline", "main-map": "compass-outline", journal: "book-outline" },
  yi: { index: "square-outline", moves: "fitness-outline", posture: "scan-outline", "main-map": "grid-outline", journal: "reader-outline" },
  po: { index: "cloud-outline", moves: "body-outline", posture: "scan-outline", "main-map": "navigate-outline", journal: "book-outline" },
  zhi: { index: "water-outline", moves: "walk-outline", posture: "scan-outline", "main-map": "map-outline", journal: "journal-outline" },
};

export function MobileNavigation({ navigation, state }: Props) {
  const { shen } = useShenExperience();
  const theme = shenThemes[shen.id];
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: `${theme.primary}35`, paddingBottom: Math.max(insets.bottom, 9) }]}>
    {items.map((item) => {
      const routeIndex = state.routes.findIndex((route) => route.name === item.tab);
      const route = state.routes[routeIndex];
      const selected = routeIndex === state.index;
      return <Pressable key={item.tab} accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={item.label} onPress={() => {
        if (!route) return;
        const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
        if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
      }} style={[styles.item, selected && { backgroundColor: theme.surfaceRaised }, selected && shenShape(shen.id, "button")]}>
        {item.tab === "index" ? <Image source={shenIcons[shen.id]} style={styles.shenIcon} /> : <Ionicons name={icons[shen.id][item.tab]} color={selected ? theme.button : theme.light} size={21} />}
        <Text style={[styles.label, { color: selected ? theme.button : theme.light }]}>{item.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 2, paddingHorizontal: 7, paddingTop: 7 },
  item: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 58, paddingHorizontal: 2 },
  label: { fontFamily: fonts.sansMedium, fontSize: 10, lineHeight: 12, textAlign: "center" },
  shenIcon: { width: 22, height: 22, borderRadius: 11 },
});
