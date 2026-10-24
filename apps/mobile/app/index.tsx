import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../constants/theme";
import { useApp } from "../store/AppStore";

export default function Index() {
  const { profile, ready } = useApp();
  if (!ready)
    return (
      <View style={s.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  if (profile.onboardingDone) return <Redirect href="/(tabs)" />;
  return <Redirect href={profile.onboardingStage ? "/onboarding" : "/welcome"} />;
}

const s = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
});
