import { Tabs } from "expo-router";
import { MobileNavigation } from "../../components/navigation/MobileNavigation";
import { useApp } from "../../store/AppStore";
import { useShenExperience } from "../../store/ShenExperience";
import { visualThemes } from "../../../../packages/design-tokens";

export default function TabLayout() {
  const { shen } = useShenExperience();
  const { profile } = useApp();
  const visual = visualThemes[profile.visualThemeId ?? "ink-night"];

  return (
    <Tabs
      tabBar={(props) => (
        <MobileNavigation
          {...props}
          accent={shen.color}
          background={visual.navigation}
          border={visual.border}
          inactive={visual.textSecondary}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Özel Odam" }} />
      <Tabs.Screen name="practice" options={{ href: null, title: "Pratikler" }} />
      <Tabs.Screen name="journey" options={{ title: "Haritam" }} />
      <Tabs.Screen name="journal" options={{ href: null, title: "Günlük" }} />
      <Tabs.Screen name="profile" options={{ href: null, title: "Ayarlar" }} />
    </Tabs>
  );
}
