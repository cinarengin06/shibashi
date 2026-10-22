import { Ionicons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

const navigationItems = [
  { label: "Özel Odam", icon: "sunny-outline", tab: "index", route: "/(tabs)" },
  { label: "Postür Analizi", icon: "body-outline", route: "/posture" },
  { label: "18 Hareketle Öğren", icon: "sparkles-outline", route: "/body-lines" },
  { label: "Haritam", icon: "compass-outline", tab: "journey", route: "/(tabs)/journey" },
] as const satisfies ReadonlyArray<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  tab?: string;
}>;

export function MobileNavigation({ accent, background, border, inactive, navigation, state }: Props) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <View style={[styles.bar, { backgroundColor: background, borderColor: border, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {navigationItems.map((item) => {
        const routeIndex = "tab" in item ? state.routes.findIndex((route) => route.name === item.tab) : -1;
        const route = routeIndex >= 0 ? state.routes[routeIndex] : undefined;
        const focused = route ? state.index === routeIndex : pathname.startsWith(item.route);
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            key={item.label}
            onPress={() => {
              if (route) {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
                return;
              }
              router.push(item.route as Href);
            }}
            style={styles.barItem}
          >
            <Ionicons color={focused ? accent : inactive} name={item.icon} size={21} />
            <Text numberOfLines={2} style={[styles.barLabel, { color: focused ? accent : inactive }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 4, paddingTop: 8 },
  barItem: { alignItems: "center", flex: 1, gap: 4, justifyContent: "center", minHeight: 54, paddingHorizontal: 3 },
  barLabel: { fontFamily: fonts.sansStrong, fontSize: 10, maxWidth: "100%", textAlign: "center" },
});
