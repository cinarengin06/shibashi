import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createFirstJourneyPlan,
  emptyOnboardingProfile,
  onboardingShenResults,
  onboardingStages,
  type OnboardingProfile,
} from "../../../packages/onboarding";
import { dailyShenDate } from "../../../packages/daily-shen-checkin";
import { colors, fonts } from "../constants/theme";
import { shenThemes } from "../../../packages/design-tokens";
import { BodyStep, Header, IntentionStep, MoodCheckin, NameStep, PracticeSetup, Preferences, QuestionCopy, Result, Welcome } from "../components/onboarding/OnboardingSteps";
import { m } from "../components/onboarding/onboarding.styles";
import { useApp } from "../store/AppStore";
import { useShenExperience } from "../store/ShenExperience";

export default function Onboarding() {
  const { profile, saveProfile } = useApp();
  const { background, playing, startSound, toggleSound, shen } = useShenExperience();
  const surface = shenThemes[profile.selectedShenId].surface;
  const [step, setStep] = useState(() => {
    if (!profile.onboardingStage || profile.onboardingStage === "completed") return 0;
    return Math.max(0, onboardingStages.findIndex((stage) => stage.id === profile.onboardingStage));
  });
  const [data, setData] = useState<OnboardingProfile>({
    ...emptyOnboardingProfile,
    ...profile.onboardingProfile,
    name:
      profile.name === "Gezgin"
        ? ""
        : profile.name || profile.onboardingProfile?.name || "",
  });
  const plan = useMemo(() => createFirstJourneyPlan(data), [data]);
  const result = onboardingShenResults[plan.recommendedShen];
  const patch = <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
    haptic = true,
  ) => {
    setData((current) => ({ ...current, [key]: value }));
    if (haptic) void Haptics.selectionAsync();
  };
  const goTo = (nextStep: number) => {
    const safe = Math.max(0, Math.min(7, nextStep));
    saveProfile({
      onboardingStage: onboardingStages[safe].id,
      onboardingProfile: data,
    });
    setStep(safe);
  };
  const next = () => {
    if (step === 6) {
      saveProfile({
        name: data.name.trim() || "Gezgin",
        selectedShenId: plan.recommendedShen,
        soundEnabled: true,
        onboardingStage: "first-plan",
        onboardingProfile: data,
        firstJourneyPlan: plan,
      });
      setStep(7);
      startSound();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    goTo(step + 1);
  };
  const finish = async () => {
    const finalData = {
      ...data,
      name: data.name.trim(),
      firstJourneyPlan: plan,
    };
    saveProfile({
      name: finalData.name || "Gezgin",
      experience:
        data.experienceLevel === "regular"
          ? "Düzenli pratik"
          : data.experienceLevel === "some"
            ? "Biraz deneyimli"
            : "Yeni",
      dailyGoal: plan.dailyMinutes,
      selectedShenId: plan.recommendedShen,
      soundEnabled: true,
      onboardingDone: true,
      onboardingVersion: 9,
      onboardingCheckin: {
        body: data.bodyState,
        breath: data.breathState,
        energy: data.energyState,
        createdAt: new Date().toISOString(),
      },
      onboardingStage: "completed",
      onboardingProfile: finalData,
      firstJourneyPlan: plan,
    });
    await AsyncStorage.setItem("shibashi-daily-shen-date", dailyShenDate());
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };
  const skipCompletedGuide = async () => {
    saveProfile({
      onboardingDone: true,
      onboardingVersion: 9,
      onboardingStage: "completed",
    });
    await AsyncStorage.setItem("shibashi-daily-shen-date", dailyShenDate());
    router.replace("/(tabs)");
  };
  const canContinue = step !== 1 || data.name.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={m.root}
    >
      <LinearGradient
        colors={[surface, shenThemes[profile.selectedShenId].surfaceRaised, surface]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={step === 0 ? [] : ["top", "bottom"]} style={m.safe}>
        {step > 0 ? <Header back={() => goTo(step - 1)} step={step} /> : null}
        <ScrollView
          contentContainerStyle={[
            m.content,
            step === 0 && m.welcomeContent,
            step === 7 && m.resultContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={m.scroll}
        >
          {step === 0 ? <Welcome onSkip={() => { void skipCompletedGuide(); }} onStart={next} /> : null}
          {step === 1 ? (
            <QuestionCopy
              kicker="1 / 6"
              title="Sana nasıl hitap edelim?"
              body="Adını yalnızca deneyimini kişiselleştirmek için kullanacağız."
            />
          ) : null}
          {step === 1 ? (
            <NameStep
              name={data.name}
              onChange={(value) => patch("name", value)}
            />
          ) : null}
          {step === 2 ? (
            <QuestionCopy
              kicker="2 / 6"
              title="Bugün nasıl hissediyorsun?"
              body="Üç çizgiyi sana en yakın noktaya getir; burada doğru ya da yanlış yok."
            />
          ) : null}
          {step === 2 ? <MoodCheckin data={data} patch={patch} /> : null}
          {step === 3 ? (
            <QuestionCopy
              kicker="3 / 6"
              title="Bugün neye ihtiyacın var?"
              body="Şu anda sana en yakın gelen seçeneği işaretle."
            />
          ) : null}
          {step === 3 ? (
            <IntentionStep
              value={data.practiceIntention}
              onChange={(value) => patch("practiceIntention", value)}
            />
          ) : null}
          {step === 4 ? (
            <QuestionCopy
              kicker="4 / 6"
              title="Bedeninde en çok nereyle ilgilenmek istersin?"
              body="Bu bir teşhis değil; ilk pratiğin odağını nazikçe belirler."
            />
          ) : null}
          {step === 4 ? (
            <BodyStep
              value={data.bodyFocus}
              onChange={(value) => patch("bodyFocus", value)}
            />
          ) : null}
          {step === 5 ? (
            <QuestionCopy
              kicker="5 / 6"
              title="Sana uygun başlangıç hangisi?"
              body="Deneyimine ve ayırabileceğin zamana uygun bir plan hazırlayacağız."
            />
          ) : null}
          {step === 5 ? <Preferences data={data} patch={patch} /> : null}
          {step === 6 ? (
            <>
              <QuestionCopy
                kicker="6 / 6"
                title="İlk pratiğin için yer açalım."
                body="Kamera zorunlu değil. Önce rahat ve güvenli bir başlangıç yapacağız."
              />
              <PracticeSetup data={data} patch={patch} />
            </>
          ) : null}
          {step === 7 ? (
            <Result
              background={background}
              playing={playing}
              plan={plan}
              result={result}
              shenColor={shen.color}
              toggleSound={toggleSound}
            />
          ) : null}
        </ScrollView>
        {step > 0 && step < 7 ? (
          <View style={m.footer}>
            <Pressable
              disabled={!canContinue}
              onPress={next}
              style={({ pressed }) => [
                m.primary,
                pressed && m.pressed,
                !canContinue && m.disabled,
              ]}
            >
              <Text style={m.primaryText}>
                {step === 6
                  ? "RİTMİMİ GÖSTER"
                  : step === 3
                    ? "DEVAM ET"
                    : "DEVAM ET"}
              </Text>
              <Ionicons color={colors.ink} name="arrow-forward" size={18} />
            </Pressable>
          </View>
        ) : null}
        {step === 7 ? (
          <View style={m.resultFooter}>
            <Pressable
              onPress={finish}
              style={({ pressed }) => [m.primary, pressed && m.pressed]}
            >
              <Text style={m.primaryText}>Hadi Başlayalım</Text>
              <Ionicons color={colors.ink} name="arrow-forward" size={18} />
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
