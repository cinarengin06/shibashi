import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  deepMeridianVisuals,
  getMovementOrganVisuals,
  getPoint,
  meridianClinicalBoundary,
  meridianMovements,
  meridianTeachingMethod,
  movementPointMarkers,
  pointGuidance,
  type MeridianMovementKnowledge,
} from "../../../packages/meridian-knowledge";
import { colors, fonts, radii, spacing } from "../constants/theme";
import {
  bodyLineMovementImages,
  bodyLineMovementStartImages,
} from "../data/bodyLineAssets";
import { Screen } from "./ui";

type BodyLayer = "body" | "lines" | "deep";
const innerWorldImage = require("../assets/body-lines/inner-world-organs-v1.jpg");
const layers: {
  id: BodyLayer;
  label: string;
  eyebrow: string;
  title: string;
}[] = [
  {
    id: "body",
    label: "Beden",
    eyebrow: "HAREKETİN İSKELETİ",
    title: "Önce bedendeki yönü hisset.",
  },
  {
    id: "lines",
    label: "Beden Hatları",
    eyebrow: "KLASİK KANAL OKUMASI",
    title: "Hareketin geçtiği yüzeyleri izle.",
  },
  {
    id: "deep",
    label: "Derin Bağlantı",
    eyebrow: "OLAĞANÜSTÜ MERİDYENLER",
    title: "Daha derin teması yavaşça aç.",
  },
];

function Pills({
  items,
  tone = "neutral",
}: {
  items: string[];
  tone?: "neutral" | "jade" | "gold";
}) {
  return (
    <View style={s.pills}>
      {items.map((item) => (
        <Text
          key={item}
          style={[
            s.pill,
            tone === "jade" && s.pillJade,
            tone === "gold" && s.pillGold,
          ]}
        >
          {item}
        </Text>
      ))}
    </View>
  );
}

function Detail({
  movement,
  layer,
}: {
  movement: MeridianMovementKnowledge;
  layer: BodyLayer;
}) {
  const active = layers.find((item) => item.id === layer) ?? layers[1];
  return (
    <View style={s.detail}>
      <Text style={s.eyebrow}>{active.eyebrow}</Text>
      <Text style={s.detailTitle}>{active.title}</Text>
      <InnerWorld movement={movement} />
      {layer === "body" ? (
        <>
          <Text style={s.body}>{movement.anatomy}</Text>
          <View style={s.cue}>
            <Text style={s.detailLabel}>ŞİMDİ BEDENİNDE</Text>
            <Text style={s.cueText}>{movement.bodyCue}</Text>
          </View>
          <Text style={s.detailLabel}>ÖĞRETİM BAĞLANTISI</Text>
          <Text style={s.body}>{movement.teachingConnection}</Text>
        </>
      ) : null}
      {layer === "lines" ? (
        <>
          <Text style={s.detailLabel}>ANA BEDEN HATLARI</Text>
          <Pills items={movement.primaryMeridians} tone="jade" />
          <Text style={s.detailLabel}>EŞLİK EDEN HATLAR</Text>
          <Pills items={movement.secondaryMeridians} />
        </>
      ) : null}
      {layer === "deep" ? (
        <>
          <Text style={s.detailLabel}>DERİN BAĞLANTILAR</Text>
          <Pills items={movement.extraordinaryMeridians} tone="gold" />
          <Text style={s.body}>{movement.teachingConnection}</Text>
        </>
      ) : null}
    </View>
  );
}

function InnerWorld({ movement }: { movement: MeridianMovementKnowledge }) {
  const organs = getMovementOrganVisuals(
    movement.primaryMeridians,
    movement.secondaryMeridians,
  );
  return (
    <View style={s.innerWorld}>
      <View
        accessible
        accessibilityLabel={`${organs.map((organ) => organ.label).join(", ")} bu harekette öne çıkan iç beden bölgeleri`}
        accessibilityRole="image"
        style={s.organMap}
      >
        <Image resizeMode="cover" source={innerWorldImage} style={s.organImage} />
        <View pointerEvents="none" style={s.organShade} />
        <Text style={s.innerWorldLabel}>İÇ DÜNYA</Text>
        {organs.map((organ) => (
          <View
            key={organ.id}
            pointerEvents="none"
            style={[
              s.organMarker,
              organ.role === "primary" ? s.organPrimary : s.organSecondary,
              {
                left: `${organ.left}%` as `${number}%`,
                top: `${organ.top}%` as `${number}%`,
              },
            ]}
          >
            <View style={s.organDot} />
            <Text style={s.organMarkerLabel}>{organ.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.organLegend}>
        {organs.map((organ) => (
          <View key={organ.id} style={s.organLegendItem}>
            <View
              style={[
                s.organLegendDot,
                organ.role === "primary" && s.organLegendDotPrimary,
              ]}
            />
            <View style={s.flex}>
              <Text style={s.organLegendName}>{organ.label}</Text>
              <Text style={s.organLegendCue}>{organ.cue}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const movementPointFallback =
  "Bu bölgeyi sıkmadan hareketin içinde yumuşak tut.";

function MovementPointOverlay({
  activeIndex,
  onSelect,
  order,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
  order: number;
}) {
  const markers = movementPointMarkers[order] ?? [];
  const activeMarker = markers[activeIndex] ?? markers[0];
  const guidance = activeMarker ? pointGuidance[activeMarker.code] : undefined;
  const point = activeMarker ? getPoint(activeMarker.code) : undefined;
  return (
    <View
      pointerEvents="box-none"
      style={s.pointOverlay}
    >
      {activeMarker ? (
        <View pointerEvents="none" style={s.pointCoach}>
          <Text style={s.pointCoachEyebrow}>
            ŞİMDİ HİSSET · {activeIndex + 1}/{markers.length}
          </Text>
          <Text style={s.pointCoachText}>
            {guidance?.instruction ?? movementPointFallback}
          </Text>
          <Text style={s.pointCoachTechnical}>
            {activeMarker.code} · {point?.pinyin ?? guidance?.title ?? "Beden noktası"}
          </Text>
        </View>
      ) : null}
      {markers.map((marker, index) => (
        <Pressable
          accessibilityLabel={`${marker.code}: ${pointGuidance[marker.code]?.instruction ?? movementPointFallback}`}
          accessibilityRole="button"
          accessibilityState={{ selected: index === activeIndex }}
          hitSlop={12}
          key={marker.code}
          onPress={() => onSelect(index)}
          style={[
            s.pointMarker,
            index !== activeIndex && s.pointMarkerInactive,
            {
              left: `${marker.left}%` as `${number}%`,
              top: `${marker.top}%` as `${number}%`,
            },
          ]}
        >
          <View style={[s.pointDot,index === activeIndex && s.pointDotActive]} />
          {index === activeIndex ? (
            <Text
              style={[
                s.pointMarkerLabel,
                marker.side === "left"
                  ? s.pointMarkerLabelLeft
                  : s.pointMarkerLabelRight,
              ]}
            >
              {marker.code}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

export function BodyLinesScreen() {
  const [order, setOrder] = useState(1);
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
          <Text style={s.eyebrow}>18 HAREKET · TEK BEDEN HARİTASI</Text>
          <Text style={s.title}>Beden Hatları</Text>
        </View>
      </View>
      <Text style={s.intro}>
        Hareketi ezberlemek yerine, bedeninde nereden geçtiğini hisset. Her
        katmanı yavaşça aç.
      </Text>
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
              {item.appAliases[0]}
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
              {movement.appAliases[0]}
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
        <Text style={s.practiceButtonText}>Hareketi pratiğe taşı</Text>
        <Ionicons color={colors.ink} name="arrow-forward" size={19} />
      </Pressable>
      <View style={s.boundary}>
        <Text style={s.boundaryText}>{meridianTeachingMethod}</Text>
        <Text style={s.boundarySmall}>{meridianClinicalBoundary}</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", gap: 13, marginTop: 4 },
  headerText: { flex: 1, gap: 3 },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.04)",
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  eyebrow: {
    color: colors.gold,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    letterSpacing: 1.7,
  },
  title: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 38,
    letterSpacing: -1.2,
  },
  intro: { color: colors.muted, fontSize: 17, lineHeight: 27, marginTop: -7 },
  rail: { gap: 8, paddingRight: 20 },
  movementChip: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 15,
    borderWidth: 1,
    gap: 3,
    minHeight: 61,
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: 152,
  },
  movementChipActive: {
    backgroundColor: "rgba(141,213,176,.11)",
    borderColor: "rgba(141,213,176,.55)",
  },
  order: { color: colors.muted, fontSize: 12, fontWeight: "900" },
  orderActive: { color: colors.jade },
  movementName: { color: colors.cream, fontSize: 15, fontWeight: "800" },
  stage: {
    backgroundColor: "rgba(15,24,19,.94)",
    borderColor: "rgba(215,168,88,.25)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 10,
    padding: 11,
  },
  stageHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 2,
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.04)",
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  stageOrder: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  stageTitle: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 22,
    textAlign: "center",
  },
  hero: {
    borderRadius: 18,
    height: 520,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },
  heroFrame: {
    ...StyleSheet.absoluteFill,
    borderRadius: 18,
    height: 520,
    width: "100%",
  },
  energySweep: {
    backgroundColor: "rgba(189,238,198,.16)",
    height: 110,
    left: -25,
    position: "absolute",
    top: 0,
    width: "115%",
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5,12,8,.08)",
    borderRadius: 18,
  },
  motionButton: {
    alignItems: "center",
    backgroundColor: "rgba(6,12,9,.72)",
    borderColor: "rgba(141,213,176,.42)",
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    position: "absolute",
    right: 14,
    top: 14,
  },
  liveDot: {
    backgroundColor: colors.jade,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  liveDotPaused: { backgroundColor: colors.muted },
  motionButtonText: {
    color: colors.cream,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  pointOverlay: { ...StyleSheet.absoluteFill, zIndex: 3 },
  pointCoach: {
    backgroundColor: "rgba(5,12,8,.84)",
    borderColor: "rgba(141,213,176,.42)",
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    left: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
    position: "absolute",
    top: 13,
    width: "58%",
  },
  pointCoachEyebrow: {
    color: colors.jade,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  pointCoachText: {
    color: colors.cream,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  pointCoachTechnical: { color: colors.muted, fontSize: 9 },
  pointMarker: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    marginLeft: -12,
    marginTop: -12,
    position: "absolute",
    width: 24,
    zIndex: 4,
  },
  pointMarkerInactive: { opacity: 0.3 },
  pointDot: {
    backgroundColor: "#dfffb1",
    borderColor: "#fff",
    borderRadius: 7,
    borderWidth: 1,
    height: 9,
    shadowColor: "#baff8f",
    shadowOpacity: 0.5,
    shadowRadius: 5,
    width: 9,
  },
  pointDotActive: {
    height: 13,
    shadowOpacity: 0.95,
    shadowRadius: 9,
    width: 13,
  },
  pointMarkerLabel: {
    backgroundColor: "rgba(5,12,8,.82)",
    borderColor: "rgba(141,213,176,.48)",
    borderRadius: 99,
    borderWidth: 1,
    color: "#e8ffd0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: "absolute",
    top: 1,
  },
  pointMarkerLabelLeft: { right: 20 },
  pointMarkerLabelRight: { left: 20 },
  deepOverlay: { ...StyleSheet.absoluteFill },
  meridianLabel: {
    backgroundColor: "rgba(5,12,8,.78)",
    borderColor: "rgba(215,168,88,.45)",
    borderRadius: 99,
    borderWidth: 1,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: "absolute",
  },
  caption: {
    alignItems: "flex-end",
    bottom: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 17,
    position: "absolute",
    right: 17,
  },
  captionText: { color: "rgba(243,238,229,.72)", flex: 1, fontSize: 13 },
  captionLayer: {
    color: colors.jade,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginLeft: 8,
    textTransform: "uppercase",
  },
  layers: { flexDirection: "row", gap: 6 },
  layer: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.025)",
    borderColor: colors.line,
    borderRadius: 13,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 5,
  },
  layerActive: {
    backgroundColor: "rgba(141,213,176,.1)",
    borderColor: "rgba(141,213,176,.48)",
  },
  dot: { backgroundColor: colors.muted, borderRadius: 3, height: 6, width: 6 },
  dotActive: { backgroundColor: colors.jade },
  layerText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  layerTextActive: { color: colors.jade },
  ritual: {
    alignItems: "center",
    backgroundColor: "rgba(5,12,8,.58)",
    borderColor: "rgba(215,168,88,.26)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 11,
    minHeight: 70,
    padding: 10,
  },
  ritualActive: { borderColor: "rgba(141,213,176,.55)" },
  timer: {
    alignItems: "center",
    borderColor: "rgba(215,168,88,.55)",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  timerText: {
    color: colors.gold,
    fontFamily: fonts.displayStrong,
    fontSize: 23,
  },
  ritualTitle: { color: colors.cream, fontSize: 15, fontWeight: "800" },
  ritualCopy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  ritualAction: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  detail: {
    backgroundColor: colors.surface,
    borderColor: "rgba(215,168,88,.2)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 14,
    padding: spacing.md,
  },
  detailTitle: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 28,
    lineHeight: 34,
  },
  innerWorld: { gap: 10 },
  organMap: {
    aspectRatio: 4 / 5,
    backgroundColor: "#08100c",
    borderColor: "rgba(141,213,176,.22)",
    borderRadius: 19,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  organImage: { ...StyleSheet.absoluteFill, height: "100%", opacity: 0.78, width: "100%" },
  organShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(5,11,8,.14)" },
  innerWorldLabel: {
    color: "rgba(243,238,229,.58)",
    fontSize: 9,
    fontWeight: "900",
    left: 12,
    letterSpacing: 1.7,
    position: "absolute",
    top: 11,
  },
  organMarker: {
    alignItems: "center",
    flexDirection: "row",
    position: "absolute",
  },
  organPrimary: { opacity: 1, zIndex: 2 },
  organSecondary: { opacity: 0.76 },
  organDot: {
    backgroundColor: colors.jade,
    borderColor: colors.cream,
    borderRadius: 6,
    borderWidth: 1,
    height: 11,
    shadowColor: colors.jade,
    shadowOpacity: 0.9,
    shadowRadius: 9,
    width: 11,
  },
  organMarkerLabel: {
    backgroundColor: "rgba(5,12,8,.84)",
    borderColor: "rgba(141,213,176,.42)",
    borderRadius: 99,
    borderWidth: 1,
    color: colors.cream,
    fontSize: 9,
    fontWeight: "800",
    marginLeft: 5,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  organLegend: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  organLegendItem: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,.025)",
    borderColor: colors.line,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    minWidth: "47%",
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  organLegendDot: { backgroundColor: colors.gold, borderRadius: 3, height: 6, width: 6 },
  organLegendDotPrimary: { backgroundColor: colors.jade },
  organLegendName: { color: colors.cream, fontSize: 11, fontWeight: "800" },
  organLegendCue: { color: colors.muted, fontSize: 9, marginTop: 1 },
  detailLabel: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 3,
  },
  body: { color: colors.muted, fontSize: 16, lineHeight: 25 },
  cue: {
    backgroundColor: "rgba(141,213,176,.08)",
    borderColor: "rgba(141,213,176,.22)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  cueText: {
    color: colors.cream,
    fontFamily: fonts.displayStrong,
    fontSize: 20,
    lineHeight: 27,
  },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  pill: {
    backgroundColor: "rgba(255,255,255,.03)",
    borderColor: colors.line,
    borderRadius: 99,
    borderWidth: 1,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pillJade: { borderColor: "rgba(141,213,176,.35)", color: colors.jade },
  pillGold: { borderColor: "rgba(215,168,88,.35)", color: colors.gold },
  flex: { flex: 1 },
  practiceButton: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 54,
  },
  practiceButtonText: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  boundary: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 7,
    paddingTop: 15,
  },
  boundaryText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  boundarySmall: {
    color: "rgba(243,238,229,.38)",
    fontSize: 12,
    lineHeight: 18,
  },
});
