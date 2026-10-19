import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  deepMeridianVisuals,
  meridianClinicalBoundary,
  meridianMovements,
  meridianTeachingMethod,
  movementPointMarkers,
  meridianLivingSteps,
} from "../../../packages/meridian-knowledge";
import { colors } from "../constants/theme";
import {
  bodyLineMovementImages,
  bodyLineMovementStartImages,
} from "../data/bodyLineAssets";
import { Screen } from "./ui";
import {
  Detail,
  MovementPointOverlay,
  layers,
  type BodyLayer,
} from "./body-lines/BodyLineDetails";
import { s } from "./body-lines/styles";

export function BodyLinesScreen() {
  const params = useLocalSearchParams<{ movementOrder?: string }>();
  const [order, setOrder] = useState(() => {
    const requested = Number(params.movementOrder);
    return Number.isInteger(requested) && requested >= 1 && requested <= 18 ? requested : 1;
  });
  const [layer, setLayer] = useState<BodyLayer>("lines");
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activePointIndex, setActivePointIndex] = useState(0);
  const motionPhase = useRef(new Animated.Value(0)).current;
  const movement =
    meridianMovements.find((item) => item.order === order) ??
    meridianMovements[0];
  const pointCount = movementPointMarkers[movement.order]?.length ?? 0;
  const steps = meridianLivingSteps[order - 1];
  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      setRemaining(60);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, running]);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    motionPhase.stopAnimation();
    if (!motionEnabled || reduceMotion) {
      motionPhase.setValue(1);
      return;
    }
    motionPhase.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motionPhase, {
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(motionPhase, {
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [motionEnabled, motionPhase, order, reduceMotion]);
  useEffect(() => {
    if (layer !== "lines" || !motionEnabled || reduceMotion || pointCount < 2)
      return;
    const timer = setInterval(
      () => setActivePointIndex((index) => (index + 1) % pointCount),
      4200,
    );
    return () => clearInterval(timer);
  }, [layer, motionEnabled, order, pointCount, reduceMotion]);
  const choose = (next: number) => {
    setOrder(next);
    setActivePointIndex(0);
    setRemaining(60);
    setRunning(false);
    void Haptics.selectionAsync();
  };
  const startOpacity = motionPhase.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const startScale = motionPhase.interpolate({
    inputRange: [0, 1],
    outputRange: [1.01, 1.025],
  });
  const endScale = motionPhase.interpolate({
    inputRange: [0, 1],
    outputRange: [1.025, 1.01],
  });
  const energyTranslate = motionPhase.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 520],
  });
  const deepOpacity = motionPhase.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });
  const activeDeepVisuals = movement.extraordinaryMeridians.flatMap((name) =>
    deepMeridianVisuals[name] ? [{ name, ...deepMeridianVisuals[name] }] : [],
  );
  return (
    <Screen>
      <View style={s.header}>
        <Pressable
          accessibilityLabel="Geri dön"
          onPress={() => router.back()}
          style={s.iconButton}
        >
          <Ionicons color={colors.cream} name="arrow-back" size={22} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.eyebrow}>YAŞAYARAK ÖĞREN · BEDEN HATLARI</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={s.rail}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {meridianMovements.map((item) => (
          <Pressable
            accessibilityState={{ selected: item.order === order }}
            key={item.movementId}
            onPress={() => choose(item.order)}
            style={[
              s.movementChip,
              item.order === order && s.movementChipActive,
            ]}
          >
            <Text style={[s.order, item.order === order && s.orderActive]}>
              {String(item.order).padStart(2, "0")}
            </Text>
            <Text numberOfLines={1} style={s.movementName}>
              {item.sourceTitle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.stage}>
        <View style={s.stageHeader}>
          <Pressable
            accessibilityLabel="Önceki hareket"
            onPress={() => choose(((order - 2 + 18) % 18) + 1)}
            style={s.roundButton}
          >
            <Ionicons color={colors.cream} name="arrow-back" size={18} />
          </Pressable>
          <View style={s.flex}>
            <Text style={s.stageOrder}>
              HAREKET {String(order).padStart(2, "0")}
            </Text>
            <Text numberOfLines={1} style={s.stageTitle}>
              {movement.sourceTitle}
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Sonraki hareket"
            onPress={() => choose((order % 18) + 1)}
            style={s.roundButton}
          >
            <Ionicons color={colors.cream} name="arrow-forward" size={18} />
          </Pressable>
        </View>
        <View style={s.hero}>
          <Animated.Image
            accessible={false}
            resizeMode="cover"
            source={bodyLineMovementStartImages[order]}
            style={[
              s.heroFrame,
              { opacity: startOpacity, transform: [{ scale: startScale }] },
            ]}
          />
          <Animated.Image
            accessibilityLabel={`${movement.appAliases[0]} hareketinin iki fazlı canlı öğretmen gösterimi`}
            resizeMode="cover"
            source={bodyLineMovementImages[order]}
            style={[
              s.heroFrame,
              { opacity: motionPhase, transform: [{ scale: endScale }] },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              s.energySweep,
              {
                opacity: motionPhase,
                transform: [
                  { translateY: energyTranslate },
                  { rotate: "-4deg" },
                ],
              },
            ]}
          />
          <View pointerEvents="none" style={s.heroShade} />
          {layer === "lines" ? (
            <MovementPointOverlay
              activeIndex={activePointIndex}
              onSelect={(index) => {
                setActivePointIndex(index);
                void Haptics.selectionAsync();
              }}
              order={order}
            />
          ) : null}
          {layer === "deep" ? (
            <Animated.View
              accessibilityLabel={`${movement.extraordinaryMeridians.join(" ve ")} derin bağlantı hatları`}
              accessibilityRole="image"
              pointerEvents="none"
              style={[s.deepOverlay, { opacity: deepOpacity }]}
            >
              <Svg height="100%" viewBox="0 0 100 100" width="100%">
                {activeDeepVisuals.map((visual) => (
                  <Path
                    d={visual.path}
                    fill="none"
                    key={`${visual.name}-glow`}
                    opacity={0.2}
                    stroke={visual.color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.3}
                  />
                ))}
                {activeDeepVisuals.map((visual) => (
                  <Path
                    d={visual.path}
                    fill="none"
                    key={visual.name}
                    stroke={visual.color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={0.75}
                  />
                ))}
              </Svg>
              {activeDeepVisuals.map((visual) => (
                <Text
                  key={visual.name}
                  style={[
                    s.meridianLabel,
                    {
                      color: visual.color,
                      left: `${visual.labelLeft}%` as `${number}%`,
                      top: `${visual.labelTop}%` as `${number}%`,
                    },
                  ]}
                >
                  {visual.name.toLocaleUpperCase("tr-TR")}
                </Text>
              ))}
            </Animated.View>
          ) : null}
          <Pressable
            accessibilityLabel={
              reduceMotion
                ? "Hareketi azalt ayarı açık"
                : motionEnabled
                  ? "Hareketi durdur"
                  : "Hareketi oynat"
            }
            accessibilityRole="button"
            accessibilityState={{
              disabled: reduceMotion,
              selected: !motionEnabled,
            }}
            disabled={reduceMotion}
            onPress={() => {
              setMotionEnabled((value) => !value);
              void Haptics.selectionAsync();
            }}
            style={s.motionButton}
          >
            <View
              style={[
                s.liveDot,
                (!motionEnabled || reduceMotion) && s.liveDotPaused,
              ]}
            />
            <Text style={s.motionButtonText}>
              {motionEnabled && !reduceMotion ? "CANLI" : "DURDU"}
            </Text>
          </Pressable>
          <View style={s.caption}>
            <Text numberOfLines={1} style={s.captionText}>
              {movement.sourceTitle}
            </Text>
            <Text style={s.captionLayer}>
              {layers.find((item) => item.id === layer)?.label}
            </Text>
          </View>
        </View>
        <View accessibilityRole="tablist" style={s.layers}>
          {layers.map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: layer === item.id }}
              key={item.id}
              onPress={() => {
                setLayer(item.id);
                void Haptics.selectionAsync();
              }}
              style={[s.layer, layer === item.id && s.layerActive]}
            >
              <View style={[s.dot, layer === item.id && s.dotActive]} />
              <Text
                numberOfLines={1}
                style={[s.layerText, layer === item.id && s.layerTextActive]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => setRunning((value) => !value)}
          style={[s.ritual, running && s.ritualActive]}
        >
          <View style={s.timer}>
            <Text style={s.timerText}>{running ? remaining : 60}</Text>
          </View>
          <View style={s.flex}>
            <Text style={s.ritualTitle}>
              {running ? "Sessizce harekette kal" : "60 saniye hisset"}
            </Text>
            <Text style={s.ritualCopy}>
              {running
                ? "Nefesi düzeltme; yalnızca izle."
                : "Bedendeki yolu takip etmek için başlat."}
            </Text>
          </View>
          <Text style={s.ritualAction}>{running ? "DUR" : "BAŞLA"}</Text>
        </Pressable>
      </View>
      <View style={s.livingSteps}>
        <Text style={s.livingStepsTitle}>ÜÇ ADIMDA DENE</Text>
        {steps.map((step, index) => (
          <View key={step} style={s.livingStep}>
            <Text style={s.livingStepNumber}>{index + 1}</Text>
            <Text style={s.livingStepText}>{step}</Text>
          </View>
        ))}
        <View style={s.livingActions}>
          <Pressable onPress={() => { motionPhase.stopAnimation(); motionPhase.setValue(0); setMotionEnabled(true); void Haptics.selectionAsync(); }} style={s.livingActionSecondary}>
            <Text style={s.livingActionSecondaryText}>Hoca yapsın</Text>
            <Ionicons color={colors.jade} name="refresh" size={18} />
          </Pressable>
          <Pressable onPress={() => router.push(`/practice-session?movementId=${movement.movementId}`)} style={s.livingActionPrimary}>
            <Text style={s.livingActionPrimaryText}>Sen yap</Text>
            <Ionicons color={colors.ink} name="arrow-forward" size={18} />
          </Pressable>
        </View>
      </View>
      <Detail layer={layer} movement={movement} />
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/movement/[id]",
            params: { id: movement.movementId },
          })
        }
        style={s.practiceButton}
      >
        <Text style={s.practiceButtonText}>Hareket ayrıntılarını gör</Text>
        <Ionicons color={colors.ink} name="arrow-forward" size={19} />
      </Pressable>
      <View style={s.boundary}>
        <Text style={s.boundaryText}>{meridianTeachingMethod}</Text>
        <Text style={s.boundarySmall}>{meridianClinicalBoundary}</Text>
      </View>
    </Screen>
  );
}
