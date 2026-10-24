import { Tabs } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { visualThemes } from "../../../../packages/design-tokens";
import { MobileNavigation } from "../../components/navigation/MobileNavigation";
import { MobileDrawer, MobileMenuHeader } from "../../components/navigation/MobileDrawer";
import { useShenExperience } from "../../store/ShenExperience";
import { useApp } from "../../store/AppStore";

export default function TabLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { shen } = useShenExperience();
  const { profile } = useApp();
  const visual = visualThemes[profile.visualThemeId] ?? visualThemes['ink-night'];
  return (
    <View style={{ flex: 1, backgroundColor: visual.background }}>
    <MobileMenuHeader onOpen={() => setMenuOpen(true)} />
    <Tabs
      tabBar={(props) => <MobileNavigation {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Odam" }} />
      <Tabs.Screen name="main-map" options={{ title: "Gelişim Haritam" }} />
      <Tabs.Screen name="lessons" options={{ title: "Isınma Dersleri" }} />
      <Tabs.Screen name="moves" options={{ title: "18 Form" }} />
      <Tabs.Screen name="posture" options={{ title: "Postür" }} />
      <Tabs.Screen name="practice" options={{ href: null, title: "Pratikler" }} />
      <Tabs.Screen name="journey" options={{ title: "Beden Haritam" }} />
      <Tabs.Screen name="journal" options={{ title: "Kayıtlarım" }} />
      <Tabs.Screen name="profile" options={{ title: "Ayarlar" }} />
    </Tabs>
    <MobileDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
