import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createFirstJourneyPlan,
  emptyOnboardingProfile,
  onboardingShenResults,
  onboardingStages,
  profileQuestions,
  type BodyFocus,
  type ExperienceLevel,
  type OnboardingProfile,
  type PracticeIntention,
  type StandingCapacity,
} from "../../../packages/onboarding";
import { colors, fonts } from "../constants/theme";
import { getShen } from "../data/fiveShen";
import { useApp } from "../store/AppStore";
import { useShenExperience } from "../store/ShenExperience";

const experienceOptions = [
  { value: "none", label: "İlk kez" },
  { value: "some", label: "Biraz deneyimim var" },
  { value: "regular", label: "Düzenli çalışıyorum" },
] as const;
const timeOptions = [
  { value: "1-5", label: "5 dk" },
  { value: "5-15", label: "10 dk" },
  { value: "15-plus", label: "15 dk" },
] as const;

const bodyFocusMarkers: Record<BodyFocus, Array<{ height?: number; width?: number; x: number; y: number }>> = {
  "breath-shoulders": [{ x: 35, y: 19 }, { x: 65, y: 19 }, { height: 12, width: 42, x: 50, y: 26 }],
  "hips-sides": [{ x: 38, y: 48 }, { x: 62, y: 48 }],
  "center-balance": [{ height: 24, width: 22, x: 50, y: 42 }, { height: 7, width: 44, x: 50, y: 88 }],
  "back-knees-feet": [{ height: 20, width: 30, x: 50, y: 42 }, { x: 39, y: 69 }, { x: 61, y: 69 }, { x: 39, y: 90 }, { x: 61, y: 90 }],
  "whole-body": [{ height: 88, width: 54, x: 50, y: 49 }],
};

export default function Onboarding() {
  const { profile, saveProfile } = useApp();
  const { background, playing, startSound, toggleSound, shen } = useShenExperience();
  const savedIndex = onboardingStages.findIndex(
    (item) => item.id === (profile.onboardingStage ?? "welcome"),
  );
  const [step, setStep] = useState(Math.max(0, Math.min(6, savedIndex)));
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
  const recommendedShen = getShen(plan.recommendedShen);
  const patch = <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
    haptic = true,
  ) => {
    setData((current) => ({ ...current, [key]: value }));
    if (haptic) void Haptics.selectionAsync();
  };
  const goTo = (nextStep: number) => {
    const safe = Math.max(0, Math.min(6, nextStep));
    saveProfile({
      onboardingStage: onboardingStages[safe].id,
      onboardingProfile: data,
    });
    setStep(safe);
  };
  const next = () => {
    if (step === 5) {
      saveProfile({
        name: data.name.trim() || "Gezgin",
        selectedShenId: plan.recommendedShen,
        soundEnabled: true,
        onboardingStage: "first-plan",
        onboardingProfile: data,
        firstJourneyPlan: plan,
      });
      setStep(6);
      startSound();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    goTo(step + 1);
  };
  const finish = (destination: "home" | "practice") => {
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
      onboardingVersion: 8,
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(
      destination === "practice"
        ? `/practice-session?practiceId=${recommendedShen.practiceId}`
        : "/(tabs)",
    );
  };
  const canContinue = step !== 1 || data.name.trim().length >= 2;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={m.root}
    >
      <LinearGradient
        colors={["#060B08", "#09110D", "#040805"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={["top", "bottom"]} style={m.safe}>
        {step > 0 ? <Header back={() => goTo(step - 1)} step={step} /> : null}
        <ScrollView
          contentContainerStyle={[
            m.content,
            step === 0 && m.welcomeContent,
            step === 6 && m.resultContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={m.scroll}
        >
          {step === 0 ? <Welcome onStart={next} /> : null}
          {step === 1 ? (
            <QuestionCopy
              kicker="1 / 5"
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
              kicker="2 / 5"
              title="Bugün nasıl hissediyorsun?"
              body="Üç çizgiyi sana en yakın noktaya getir; burada doğru ya da yanlış yok."
            />
          ) : null}
          {step === 2 ? <MoodCheckin data={data} patch={patch} /> : null}
          {step === 3 ? (
            <QuestionCopy
              kicker="3 / 5"
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
              kicker="4 / 5"
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
              kicker="5 / 5"
              title="Sana uygun başlangıç hangisi?"
              body="Deneyimine ve ayırabileceğin zamana uygun bir plan hazırlayacağız."
            />
          ) : null}
          {step === 5 ? <Preferences data={data} patch={patch} /> : null}
          {step === 6 ? (
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
        {step > 0 && step < 6 ? (
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
                {step === 5
                  ? "YOLUMU HAZIRLA"
                  : step === 3
                    ? "DEVAM ET"
                    : "DEVAM ET"}
              </Text>
              <Ionicons color={colors.ink} name="arrow-forward" size={18} />
            </Pressable>
          </View>
        ) : null}
        {step === 6 ? (
          <View style={m.resultFooter}>
            <Pressable
              onPress={() => finish("practice")}
              style={({ pressed }) => [m.primary, pressed && m.pressed]}
            >
              <Ionicons color={colors.ink} name="play" size={17} />
              <Text style={m.primaryText}>İLK PRATİĞİME BAŞLA</Text>
            </Pressable>
            <Pressable onPress={() => finish("home")}>
              <Text style={[m.secondary, { color: shen.color }]}>
                Önce ana sayfayı gör
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <ImageBackground
      imageStyle={m.welcomeImage}
      source={require("../assets/living-learning/curtains-opening.png")}
      style={m.welcome}
    >
      <LinearGradient
        colors={["rgba(4,8,5,.12)", "rgba(4,8,5,.3)", "rgba(4,8,5,.98)"]}
        locations={[0, 0.45, 1]}
        style={m.welcomeShade}
      >
        <View style={m.welcomeBrand}>
          <View style={m.brandRing} />
          <View>
            <Text style={m.brandName}>SHIBASHI</Text>
            <Text style={m.brandSub}>EFE</Text>
          </View>
        </View>
        <View style={m.welcomeSpace} />
        <Text style={m.welcomeTitle}>
          Sana iyi gelecek yolu birlikte bulalım.
        </Text>
        <Text style={m.welcomeBody}>
          Birkaç kısa soruyla sana uygun başlangıcı hazırlayacağız.
        </Text>
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [m.primary, pressed && m.pressed]}
        >
          <Text style={m.primaryText}>BAŞLAYALIM</Text>
          <Ionicons color={colors.ink} name="arrow-forward" size={18} />
        </Pressable>
        <View style={m.minute}>
          <Ionicons color={colors.gold} name="time-outline" size={15} />
          <Text style={m.minuteText}>Yaklaşık 1 dakika</Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

function Header({ back, step }: { back: () => void; step: number }) {
  const question = Math.min(5, step);
  return (
    <View style={m.header}>
      <Pressable
        accessibilityLabel="Önceki ekran"
        onPress={back}
        style={m.back}
      >
        <Ionicons color={colors.cream} name="arrow-back" size={20} />
      </Pressable>
      <View style={m.progress}>
        {[1, 2, 3, 4, 5].map((item) => (
          <View
            key={item}
            style={[m.progressLine, item <= question && m.progressActive]}
          />
        ))}
      </View>
      <Text style={m.stepText}>{step < 6 ? `${question} / 5` : "SONUCUN"}</Text>
    </View>
  );
}
function QuestionCopy({
  body,
  kicker,
  title,
}: {
  body: string;
  kicker: string;
  title: string;
}) {
  return (
    <View style={m.copy}>
      <Text style={m.kicker}>{kicker}</Text>
      <Text style={m.title}>{title}</Text>
      <Text style={m.body}>{body}</Text>
    </View>
  );
}
function NameStep({
  name,
  onChange,
}: {
  name: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={m.inputWrap}>
      <Text style={m.inputLabel}>ADIN</Text>
      <TextInput
        autoCapitalize="words"
        autoComplete="name"
        autoFocus
        maxLength={40}
        onChangeText={onChange}
        placeholder="Adın"
        placeholderTextColor="#737B74"
        style={m.input}
        value={name}
      />
    </View>
  );
}

function MoodCheckin({
  data,
  patch,
}: {
  data: OnboardingProfile;
  patch: <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
    haptic?: boolean,
  ) => void;
}) {
  return (
    <View style={m.moodCard}>
      <MoodSlider
        color="#C9A96A"
        label="BEDEN"
        left="Gergin"
        onChange={(value) => patch("bodyState", value, false)}
        right="Rahat"
        value={data.bodyState}
      />
      <MoodSlider
        color="#8EB6AE"
        label="NEFES"
        left="Sıkışık"
        onChange={(value) => patch("breathState", value, false)}
        right="Açık"
        value={data.breathState}
      />
      <MoodSlider
        color="#D48B55"
        label="ENERJİ"
        left="Düşük"
        onChange={(value) => patch("energyState", value, false)}
        right="Canlı"
        value={data.energyState}
      />
    </View>
  );
}

function MoodSlider({
  color,
  label,
  left,
  onChange,
  right,
  value,
}: {
  color: string;
  label: string;
  left: string;
  onChange: (value: number) => void;
  right: string;
  value: number;
}) {
  const track = useRef<View>(null);
  const update = (pageX: number) => {
    track.current?.measureInWindow((x, _y, width) => {
      const next = Math.round(
        Math.max(0, Math.min(1, (pageX - x) / width)) * 100,
      );
      onChange(next);
    });
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => update(event.nativeEvent.pageX),
        onPanResponderMove: (event) => update(event.nativeEvent.pageX),
      }),
    [onChange],
  );
  const adjust = (direction: number) =>
    onChange(Math.max(0, Math.min(100, value + direction * 10)));
  return (
    <View style={m.moodRow}>
      <View style={m.moodHead}>
        <Text style={[m.moodLabel, { color }]}>{label}</Text>
        <Text style={m.moodValue}>{value}</Text>
      </View>
      <View
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        accessibilityLabel={`${label}: ${value}`}
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max: 100, now: value }}
        onAccessibilityAction={(event) =>
          adjust(event.nativeEvent.actionName === "increment" ? 1 : -1)
        }
        ref={track}
        style={m.sliderTrack}
        {...responder.panHandlers}
      >
        <View
          style={[m.sliderFill, { backgroundColor: color, width: `${value}%` }]}
        />
        <View
          style={[m.sliderThumb, { backgroundColor: color, left: `${value}%` }]}
        />
      </View>
      <View style={m.moodEnds}>
        <Text style={m.moodEnd}>{left}</Text>
        <Text style={m.moodEnd}>{right}</Text>
      </View>
    </View>
  );
}

function IntentionStep({
  value,
  onChange,
}: {
  value: PracticeIntention;
  onChange: (value: PracticeIntention) => void;
}) {
  const labels: Record<
    PracticeIntention,
    { icon: keyof typeof Ionicons.glyphMap; label: string }
  > = {
    calm: { icon: "leaf-outline", label: "Sakinleşmek" },
    energy: { icon: "flash-outline", label: "Enerji kazanmak" },
    focus: { icon: "radio-button-on-outline", label: "Odaklanmak" },
    resilience: { icon: "shield-outline", label: "Daha sağlam hissetmek" },
    connection: { icon: "heart-outline", label: "Kendimle bağ kurmak" },
  };
  return (
    <View accessibilityRole="radiogroup" style={m.options}>
      {profileQuestions.intention.map((option) => {
        const active = value === option.value;
        const item = labels[option.value];
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[m.option, active && m.optionActive]}
          >
            <Ionicons
              color={active ? colors.gold : colors.muted}
              name={item.icon}
              size={21}
            />
            <Text style={m.optionTitle}>{item.label}</Text>
            {active ? (
              <Ionicons color={colors.gold} name="checkmark-circle" size={21} />
            ) : (
              <View style={m.emptyCircle} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function BodyStep({
  value,
  onChange,
}: {
  value: BodyFocus;
  onChange: (value: BodyFocus) => void;
}) {
  const options = [
    { value: "breath-shoulders", label: "Boyun ve omuz" },
    { value: "back-knees-feet", label: "Bel ve sırt" },
    { value: "center-balance", label: "Denge" },
    { value: "whole-body", label: "Tüm beden" },
  ] as const;
  return (
    <View style={m.bodyStage}>
      <View style={m.bodyFigure}>
        <Image
          resizeMode="contain"
          source={require("../assets/posture/posture-back-translucent.png")}
          style={m.bodyImage}
        />
        {bodyFocusMarkers[value].map((marker, index) => (
          <View
            key={`${value}-${index}`}
            style={[
              m.bodyGlow,
              {
                height: `${marker.height ?? 9}%` as `${number}%`,
                left: `${marker.x}%` as `${number}%`,
                top: `${marker.y}%` as `${number}%`,
                width: `${marker.width ?? 9}%` as `${number}%`,
              },
            ]}
          >
            <View style={m.bodyGlowCore} />
          </View>
        ))}
      </View>
      <View accessibilityRole="radiogroup" style={m.bodyOptions}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[m.bodyOption, active && m.optionActive]}
            >
              <Text style={m.bodyOptionText}>{option.label}</Text>
              {active ? (
                <Ionicons
                  color={colors.gold}
                  name="checkmark-circle"
                  size={20}
                />
              ) : (
                <View style={m.emptyCircle} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Preferences({
  data,
  patch,
}: {
  data: OnboardingProfile;
  patch: <K extends keyof OnboardingProfile>(
    key: K,
    value: OnboardingProfile[K],
  ) => void;
}) {
  return (
    <View style={m.preferences}>
      <Text style={m.groupLabel}>DENEYİMİN</Text>
      <View style={m.segmentRow}>
        {experienceOptions.map((item) => {
          const active = data.experienceLevel === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() =>
                patch("experienceLevel", item.value as ExperienceLevel)
              }
              style={[m.segment, active && m.segmentActive]}
            >
              <Text style={[m.segmentText, active && m.segmentTextActive]}>
                {item.label}
              </Text>
              {active ? (
                <Ionicons
                  color={colors.gold}
                  name="checkmark-circle"
                  size={17}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={[m.groupLabel, m.timeLabel]}>
        GÜNLÜK AYIRABİLECEĞİN SÜRE
      </Text>
      <View style={m.segmentRow}>
        {timeOptions.map((item) => {
          const active = data.standingCapacity === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() =>
                patch("standingCapacity", item.value as StandingCapacity)
              }
              style={[m.segment, active && m.segmentActive]}
            >
              <Text style={[m.segmentText, active && m.segmentTextActive]}>
                {item.label}
              </Text>
              {active ? (
                <Ionicons
                  color={colors.gold}
                  name="checkmark-circle"
                  size={17}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Result({
  background,
  playing,
  plan,
  result,
  shenColor,
  toggleSound,
}: {
  background: ImageSourcePropType;
  playing: boolean;
  plan: ReturnType<typeof createFirstJourneyPlan>;
  result: (typeof onboardingShenResults)[keyof typeof onboardingShenResults];
  shenColor: string;
  toggleSound: () => void;
}) {
  return (
    <ImageBackground
      imageStyle={m.resultImage}
      source={background}
      style={[m.result, { borderColor: `${shenColor}88` }]}
    >
      <LinearGradient
        colors={["rgba(5,10,7,.12)", "rgba(5,10,7,.46)", "rgba(5,10,7,.98)"]}
        style={m.resultShade}
      >
        <View style={m.resultSpace} />
        <Text style={m.resultTitle}>
          Bugün sana {result.name} eşlik edecek.
        </Text>
        <Text style={[m.resultMode, { color: shenColor }]}>
          {result.mode} · {plan.focuses[0]}
        </Text>
        <Text style={m.resultBody}>
          İlk pratiğini dikkatini sadeleştirecek yumuşak bir akışla hazırladık.
        </Text>
        <Pressable
          accessibilityLabel={`Müziği ${playing ? "kapat" : "aç"}`}
          accessibilityRole="button"
          accessibilityState={{ selected: playing }}
          onPress={toggleSound}
          style={[m.music, { borderColor: `${shenColor}66` }]}
        >
          <Ionicons
            color={shenColor}
            name={playing ? "volume-medium" : "musical-notes"}
            size={22}
          />
          <Text style={m.musicTitle}>
            {result.name} müziği {playing ? "çalıyor" : "duraklatıldı"}
          </Text>
          <Ionicons
            color={shenColor}
            name={playing ? "pause" : "play"}
            size={18}
          />
        </Pressable>
      </LinearGradient>
    </ImageBackground>
  );
}

const m = StyleSheet.create({
  root: { backgroundColor: colors.ink, flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: 24, padding: 22, paddingBottom: 30 },
  welcomeContent: { flexGrow: 1, padding: 0 },
  resultContent: { flexGrow: 1, padding: 14 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    minHeight: 68,
    paddingHorizontal: 18,
  },
  back: {
    alignItems: "center",
    backgroundColor: "rgba(17,23,19,.9)",
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  progress: { flex: 1, flexDirection: "row", gap: 6 },
  progressLine: {
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: 3,
    flex: 1,
    height: 3,
  },
  progressActive: { backgroundColor: colors.gold },
  stepText: {
    color: colors.cream,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    minWidth: 48,
    textAlign: "right",
  },
  copy: { gap: 11, paddingTop: 10 },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  title: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 37,
    lineHeight: 42,
  },
  body: {
    color: colors.muted,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 23,
  },
  welcome: { flex: 1, minHeight: 720 },
  welcomeImage: { height: "100%", width: "100%" },
  welcomeShade: { flex: 1, padding: 24 },
  welcomeBrand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    marginTop: 6,
  },
  brandRing: {
    borderColor: colors.gold,
    borderLeftColor: "transparent",
    borderRadius: 22,
    borderWidth: 2,
    height: 43,
    transform: [{ rotate: "-25deg" }],
    width: 43,
  },
  brandName: {
    color: colors.cream,
    fontFamily: fonts.sansBold,
    fontSize: 16,
    letterSpacing: 4,
  },
  brandSub: {
    color: colors.gold,
    fontFamily: fonts.sansBold,
    fontSize: 9,
    letterSpacing: 5,
    textAlign: "center",
  },
  welcomeSpace: { flex: 1 },
  welcomeTitle: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 39,
    lineHeight: 43,
  },
  welcomeBody: {
    color: colors.cream,
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 23,
    marginTop: 12,
    maxWidth: 320,
  },
  minute: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 13,
  },
  minuteText: {
    color: colors.gold,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
  },
  inputWrap: {
    backgroundColor: colors.surface,
    borderColor: "rgba(198,165,106,.45)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 7,
    marginTop: 18,
    padding: 16,
  },
  inputLabel: {
    color: colors.gold,
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  input: {
    color: colors.cream,
    fontFamily: fonts.sansMedium,
    fontSize: 21,
    padding: 0,
  },
  moodCard: {
    backgroundColor: "rgba(12,20,15,.82)",
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    gap: 30,
    marginTop: 6,
    padding: 20,
  },
  moodRow: { gap: 12 },
  moodHead: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 1.4,
  },
  moodValue: {
    color: colors.cream,
    fontFamily: fonts.metricStrong,
    fontSize: 15,
  },
  sliderTrack: {
    backgroundColor: "rgba(255,255,255,.1)",
    borderRadius: 7,
    height: 14,
    justifyContent: "center",
    position: "relative",
  },
  sliderFill: { borderRadius: 7, height: 4 },
  sliderThumb: {
    borderColor: colors.cream,
    borderRadius: 13,
    borderWidth: 3,
    height: 26,
    marginLeft: -13,
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    width: 26,
  },
  moodEnds: { flexDirection: "row", justifyContent: "space-between" },
  moodEnd: { color: colors.muted, fontFamily: fonts.sans, fontSize: 12 },
  options: { gap: 10 },
  option: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    minHeight: 67,
    padding: 14,
  },
  optionActive: {
    backgroundColor: "rgba(198,165,106,.12)",
    borderColor: "rgba(198,165,106,.72)",
  },
  optionTitle: {
    color: colors.cream,
    flex: 1,
    fontFamily: fonts.sansStrong,
    fontSize: 16,
  },
  emptyCircle: {
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    width: 20,
  },
  bodyStage: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 12,
    minHeight: 380,
  },
  bodyFigure: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    position: "relative",
  },
  bodyImage: { height: 360, width: "100%" },
  bodyGlow: {
    alignItems: "center",
    backgroundColor: "rgba(216,169,88,.24)",
    borderColor: "rgba(241,207,139,.84)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    position: "absolute",
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 18,
  },
  bodyGlowCore: {
    backgroundColor: colors.gold,
    borderRadius: 4,
    height: 7,
    shadowColor: colors.gold,
    shadowOpacity: 1,
    shadowRadius: 8,
    width: 7,
  },
  bodyOptions: { flex: 1.15, gap: 9, justifyContent: "center" },
  bodyOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minHeight: 58,
    padding: 11,
  },
  bodyOptionText: {
    color: colors.cream,
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  preferences: { gap: 12 },
  groupLabel: {
    color: colors.cream,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    letterSpacing: 0.7,
  },
  timeLabel: { marginTop: 16 },
  segmentRow: { gap: 9 },
  segment: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 57,
    paddingHorizontal: 12,
  },
  segmentActive: {
    backgroundColor: "rgba(198,165,106,.12)",
    borderColor: colors.gold,
  },
  segmentText: {
    color: colors.muted,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    textAlign: "center",
  },
  segmentTextActive: { color: colors.cream, fontFamily: fonts.sansStrong },
  footer: {
    backgroundColor: "rgba(6,11,8,.97)",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    padding: 14,
    paddingBottom: 18,
  },
  primary: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 18,
  },
  primaryText: {
    color: colors.ink,
    fontFamily: fonts.sansStrong,
    fontSize: 16,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.3 },
  result: {
    borderRadius: 28,
    borderWidth: 1,
    flex: 1,
    minHeight: 690,
    overflow: "hidden",
  },
  resultImage: { borderRadius: 27 },
  resultShade: { flex: 1, padding: 22 },
  resultSpace: { flex: 1 },
  resultTitle: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 38,
    lineHeight: 42,
  },
  resultMode: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 9,
    textTransform: "capitalize",
  },
  resultBody: {
    color: colors.ivory,
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  music: {
    alignItems: "center",
    backgroundColor: "rgba(4,9,6,.74)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    marginTop: 18,
    minHeight: 58,
    paddingHorizontal: 15,
  },
  musicTitle: {
    color: colors.cream,
    flex: 1,
    fontFamily: fonts.sansStrong,
    fontSize: 14,
  },
  resultFooter: {
    backgroundColor: "rgba(6,11,8,.98)",
    gap: 13,
    padding: 14,
    paddingBottom: 18,
  },
  secondary: {
    fontFamily: fonts.sansStrong,
    fontSize: 14,
    textAlign: "center",
  },
});
