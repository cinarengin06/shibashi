import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "@expo-google-fonts/inter/useFonts";
import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { fonts, type } from "../constants/theme";
import { AppProvider } from "../store/AppStore";
import { ShenExperienceProvider } from "../store/ShenExperience";
import { useApp } from "../store/AppStore";
import { getShenVisualTheme } from "../../../packages/design-tokens";
import { MilestoneCelebration } from "../components/MilestoneCelebration";

void SplashScreen.preventAutoHideAsync();

type WithDefaultProps = {
  defaultProps?: { style?: unknown };
};

// Keep every route on the same readable Inter baseline as the home screen.
// Explicit component styles can still promote text to the shared heading tokens.
const textDefaults = Text as typeof Text & WithDefaultProps;
textDefaults.defaultProps = {
  ...textDefaults.defaultProps,
  style: [
    textDefaults.defaultProps?.style,
    { fontFamily: fonts.sans, fontSize: type.bodyCompact },
  ],
};

const inputDefaults = TextInput as typeof TextInput & WithDefaultProps;
inputDefaults.defaultProps = {
  ...inputDefaults.defaultProps,
  style: [
    inputDefaults.defaultProps?.style,
    { fontFamily: fonts.sans, fontSize: type.bodyCompact },
  ],
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>
        <BootContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

function BootContent() {
  const { ready, profile } = useApp();
  const visualTheme = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const segments = useSegments();
  useEffect(() => {
    if (ready && segments[0] && segments[0] !== 'welcome') void SplashScreen.hideAsync();
  }, [ready, segments]);
  if (!ready) return null;
  return (
    <ShenExperienceProvider>
      <StatusBar style={visualTheme.id === 'morning-light'||visualTheme.id === 'terra-day' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: visualTheme.background },
          animation: "fade",
        }}
      />
      <MilestoneCelebration />
    </ShenExperienceProvider>
  );
}
