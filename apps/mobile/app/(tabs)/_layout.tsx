import { Tabs } from "expo-router";
import { MobileNavigation } from "../../components/navigation/MobileNavigation";

export default function TabLayout() {
  return (
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
  );
}
