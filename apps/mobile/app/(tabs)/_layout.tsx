import { Tabs } from "expo-router";
import { MobileNavigation } from "../../components/navigation/MobileNavigation";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <MobileNavigation {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Özel Odam" }} />
      <Tabs.Screen name="moves" options={{ title: "18 Hareket" }} />
      <Tabs.Screen name="posture" options={{ title: "Postür Analizi" }} />
      <Tabs.Screen name="practice" options={{ href: null, title: "Pratikler" }} />
      <Tabs.Screen name="journey" options={{ title: "Haritam" }} />
      <Tabs.Screen name="journal" options={{ title: "Günlük" }} />
      <Tabs.Screen name="profile" options={{ href: null, title: "Ayarlar" }} />
    </Tabs>
  );
}
