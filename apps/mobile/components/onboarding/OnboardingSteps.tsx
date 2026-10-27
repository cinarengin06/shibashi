import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef } from "react";
import {
  Image,
  ImageBackground,
  PanResponder,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createFirstJourneyPlan,
  onboardingShenResults,
  profileQuestions,
  type BodyFocus,
  type ExperienceLevel,
  type MovementSupport,
  type OnboardingProfile,
  type PracticeIntention,
  type StandingCapacity,
} from "../../../../packages/onboarding";
import { colors } from "../../constants/theme";
import { m } from "./onboarding.styles";

type PatchOnboarding = <K extends keyof OnboardingProfile>(
  key: K,
  value: OnboardingProfile[K],
  haptic?: boolean,
) => void;

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
  "center-balance": [{ height: 22, width: 22, x: 50, y: 43 }, { x: 39, y: 94 }, { x: 61, y: 94 }],
  "back-knees-feet": [{ height: 30, width: 34, x: 50, y: 36 }],
  "whole-body": [{ height: 88, width: 54, x: 50, y: 49 }],
};

export function Welcome({ onSkip, onStart }: { onSkip: () => void; onStart: () => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 380;
  return (
    <ImageBackground
      imageStyle={m.welcomeImage}
      source={require("../../assets/living-learning/curtains-opening.png")}
      style={m.welcome}
    >
      <LinearGradient
        colors={["rgba(4,8,5,.12)", "rgba(4,8,5,.3)", "rgba(4,8,5,.98)"]}
        locations={[0, 0.45, 1]}
        style={[m.welcomeShade, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={m.welcomeBrand}>
          <View style={m.brandRing} />
          <View>
            <Text style={m.brandName}>SHIBASHI</Text>
            <Text style={m.brandSub}>EFE</Text>
          </View>
        </View>
        <View style={m.welcomeSpace} />
        <Text style={m.welcomeEyebrow}>YOLCULUĞUN BURADA BAŞLIYOR</Text>
        <Text style={[m.welcomeTitle, compact && m.welcomeTitleCompact]}>
          Sana iyi gelecek yolu birlikte bulalım.
        </Text>
        <Text style={[m.welcomeBody, compact && m.welcomeBodyCompact]}>
          Deneyim ve ekipman gerektirmez. Altı kısa adımda ilk 5 dakikalık pratiğini hazırlayacağız.
        </Text>
        <View style={[m.welcomeActions, compact && m.welcomeActionsCompact]}>
          <Pressable
            accessibilityRole="button"
            onPress={onStart}
            style={({ pressed }) => [m.primary, m.welcomePrimary, compact && m.welcomeActionCompact, pressed && m.pressed]}
          >
            <Text style={m.primaryText}>BAŞLA</Text>
            <Ionicons color={colors.ink} name="arrow-forward" size={18} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onSkip}
            style={({ pressed }) => [m.welcomeSkip, compact && m.welcomeActionCompact, pressed && m.pressed]}
          >
            <Text style={m.welcomeSkipText}>Zaten bilgilerimi girdim</Text>
          </Pressable>
        </View>
        <View style={m.minute}>
          <Ionicons color={colors.gold} name="time-outline" size={15} />
          <Text style={m.minuteText}>Yaklaşık 2 dakika · Kamera isteğe bağlı</Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

export function Header({ back, step }: { back: () => void; step: number }) {
  const question = Math.min(6, step);
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
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View
            key={item}
            style={[m.progressLine, item <= question && m.progressActive]}
          />
        ))}
      </View>
      <Text style={m.stepText}>{step < 7 ? `${question} / 6` : "SONUCUN"}</Text>
    </View>
  );
}
export function QuestionCopy({
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
export function NameStep({
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

export function MoodCheckin({
  data,
  patch,
}: {
  data: OnboardingProfile;
  patch: PatchOnboarding;
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
  const track = useRef<React.ComponentRef<typeof View>>(null);
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

export function IntentionStep({
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

export function BodyStep({
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
        <View style={m.bodyCanvas}>
          <Image
            resizeMode="contain"
            source={require("../../assets/posture/posture-back-translucent.png")}
            style={m.bodyImage}
          />
          {bodyFocusMarkers[value].map((marker, index) => {
            const height = marker.height ?? 9;
            const width = marker.width ?? 9;
            return (
              <View
                key={`${value}-${index}`}
                style={[
                  m.bodyGlow,
                  {
                    height: `${height}%` as `${number}%`,
                    left: `${marker.x - width / 2}%` as `${number}%`,
                    top: `${marker.y - height / 2}%` as `${number}%`,
                    width: `${width}%` as `${number}%`,
                  },
                ]}
              >
                <View style={m.bodyGlowCore} />
              </View>
            );
          })}
        </View>
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

export function Preferences({
  data,
  patch,
}: {
  data: OnboardingProfile;
  patch: PatchOnboarding;
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
      <Text style={[m.groupLabel, m.timeLabel]}>HAREKET EDERKEN</Text>
      <View style={m.segmentRow}>
        {([
          { value: "free-standing", label: "Rahatça ayakta" },
          { value: "gentle-range", label: "Küçük hareketlerle" },
          { value: "supported", label: "Destek yakınımda" },
        ] as const).map((item) => {
          const active = data.movementSupport === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => patch("movementSupport", item.value as MovementSupport)}
              style={[m.segment, active && m.segmentActive]}
            >
              <Text style={[m.segmentText, active && m.segmentTextActive]}>{item.label}</Text>
              {active ? <Ionicons color={colors.gold} name="checkmark-circle" size={17} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PracticeSetup({
  data,
  patch,
}: {
  data: OnboardingProfile;
  patch: PatchOnboarding;
}) {
  return (
    <View style={m.setupCard}>
      <ImageBackground
        imageStyle={m.setupImage}
        source={require("../../assets/living-learning/curtains-opening.png")}
        style={m.setupPreview}
      >
        <LinearGradient colors={["transparent", "rgba(4,9,6,.96)"]} style={m.setupShade}>
          <View style={m.setupSpace} />
          <Text style={m.setupKicker}>İLK KÜÇÜK BAŞARI</Text>
          <Text style={m.setupCue}>Ayaklarını rahatça yerleştir, dizlerini kilitleme ve üç doğal nefes al.</Text>
        </LinearGradient>
      </ImageBackground>
      {[
        ["01", "İki adımlık boş alan", "Özel ekipman gerekmiyor."],
        ["02", "Rahat kıyafet", "Ayakkabı zorunlu değil."],
        ["03", "Kamera isteğe bağlı", "İlk pratiğe kamerayı açmadan başlayabilirsin."],
      ].map(([number, title, note]) => (
        <View key={number} style={m.setupRow}>
          <Text style={m.setupNumber}>{number}</Text>
          <View style={m.setupText}>
            <Text style={m.setupTitle}>{title}</Text>
            <Text style={m.setupNote}>{note}</Text>
          </View>
        </View>
      ))}
      <Pressable
        onPress={() => patch("movementSupport", data.movementSupport === "supported" ? "gentle-range" : "supported")}
        style={[m.supportToggle, data.movementSupport === "supported" && m.supportToggleActive]}
      >
        <Text style={m.supportText}>Yakınımda sandalye veya duvar olsun</Text>
        <Ionicons color={colors.gold} name={data.movementSupport === "supported" ? "toggle" : "toggle-outline"} size={28} />
      </Pressable>
      <Text style={m.safetyNote}>Ağrı veya baş dönmesi hissedersen dur. Bu deneyim tıbbi değerlendirme yerine geçmez.</Text>
    </View>
  );
}

export function Result({
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
          {plan.reasonSummary}
        </Text>
        <View style={m.firstWeek}>
          <Text style={[m.firstWeekTitle, { color: shenColor }]}>İLK 7 GÜNÜN</Text>
          {[
            ["Bugün", "Temel duruş + 3 doğal nefes", "5 dk"],
            ["3. gün", "İki hareketi birbirine bağla", `${Math.min(plan.dailyMinutes, 10)} dk`],
            ["7. gün", "Kısa akış + beden kontrolü", `${plan.dailyMinutes} dk`],
          ].map(([day, title, time]) => (
            <View key={day} style={m.firstWeekRow}>
              <Text style={m.firstWeekDay}>{day}</Text>
              <Text style={m.firstWeekText}>{title}</Text>
              <Text style={[m.firstWeekTime, { color: shenColor }]}>{time}</Text>
            </View>
          ))}
        </View>
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

