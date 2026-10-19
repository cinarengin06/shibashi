import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Eyebrow, Screen, Title } from "../../components/ui";
import { colors, fonts, radii } from "../../constants/theme";
import { humanMapStages } from "../../data/journey";
import { getShen } from "../../data/fiveShen";
import { useApp } from "../../store/AppStore";

export default function Journey() {
  const { profile } = useApp();
  const selectedShen = getShen(profile.selectedShenId);
  const accent = selectedShen.color;
  const normalizedShenId = selectedShen.id === "xin" ? "shen" : selectedShen.id;
  const matchedGateIndex = humanMapStages.findIndex((item) => item.shenId === normalizedShenId);
  const currentGateIndex = matchedGateIndex >= 0 ? matchedGateIndex : 0;
  const [activeIndex, setActiveIndex] = useState(currentGateIndex);

  useEffect(() => setActiveIndex(currentGateIndex), [currentGateIndex]);

  const stage = humanMapStages[activeIndex] ?? humanMapStages[0];
  const currentGate = humanMapStages[currentGateIndex] ?? humanMapStages[0];
  const isCurrentGate = activeIndex === currentGateIndex;

  return (
    <Screen>
      <Eyebrow>HARİTAN · SEKİZ BEDEN KAPISI</Eyebrow>
      <Title>Bedenindeki kapıları gör.</Title>
      <Text style={styles.lead}>Kapılara dokun; beden bölgesini, günlük karşılığını ve mini pratiğini aç. Altın halka şu an bulunduğun kapıyı gösterir.</Text>

      <Card style={[styles.mapCard, { borderColor: `${accent}66` }]}>
        <View style={styles.mapStage}>
          <Image
            accessibilityLabel="Sekiz beden kapısını gösteren insan haritası"
            source={require("../../assets/journey/neijing-map.jpg")}
            resizeMode="cover"
            style={styles.mapImage}
          />
          <View style={styles.mapShade} />
          <View style={styles.currentGateBadge}>
            <Text style={styles.currentGateLabel}>ŞU ANKİ KAPIN</Text>
            <Text style={styles.currentGateTitle}>{currentGate.title}</Text>
          </View>
          {humanMapStages.map((item, index) => {
            const current = index === currentGateIndex;
            const active = index === activeIndex;
            return (
              <Pressable
                accessibilityLabel={`${item.title} kapısını aç`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={item.id}
                onPress={() => setActiveIndex(index)}
                style={[styles.mapHotspot, { left: `${item.x}%`, top: `${item.y}%` }, current && styles.mapHotspotCurrent, active && { borderColor: accent, backgroundColor: `${accent}dd`, shadowColor: accent }]}
              >
                <Text style={[styles.mapHotspotText, active && { color: colors.ink }]}>{index + 1}</Text>
              </Pressable>
            );
          })}
          <Text style={styles.mapHint}>Kapıya dokun · açıklamasını aç</Text>
        </View>

        <View style={styles.mapProgress}>
          <Text style={styles.progressText}>İncelenen kapı {activeIndex + 1} / {humanMapStages.length}</Text>
          <Text style={[styles.progressCurrent, { color: accent }]}>Mevcut kapı {currentGateIndex + 1}</Text>
        </View>
      </Card>

      <Card style={[styles.mapInfo, { borderColor: `${accent}55` }]}>
        <View style={styles.mapInfoTop}>
          <View style={styles.flex}>
            <Text style={[styles.kicker, { color: accent }]}>{isCurrentGate ? "ŞU AN BULUNDUĞUN KAPI" : "İNCELEDİĞİN KAPI"}</Text>
            <Text style={styles.mapTitle}>{stage.title}</Text>
          </View>
          <Text style={[styles.mapReward, { color: accent }]}>{stage.reward}</Text>
        </View>
        <Text style={styles.body}>{stage.text}</Text>
        <View style={styles.benefitGrid}>
          {stage.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefit}>
              <Ionicons name="checkmark" color={accent} size={16} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
        <View style={styles.dailyNote}>
          <Text style={[styles.kicker, { color: accent }]}>GÜNLÜK HAYATTA</Text>
          <Text style={styles.body}>{stage.dailyUse}</Text>
        </View>
        <View style={styles.dailyNote}>
          <Text style={[styles.kicker, { color: accent }]}>MİNİ PRATİK</Text>
          <Text style={styles.body}>{stage.microPractice}</Text>
        </View>
        <View style={styles.mapActions}>
          <Pressable disabled={activeIndex === 0} onPress={() => setActiveIndex((value) => Math.max(0, value - 1))} style={[styles.mapAction, activeIndex === 0 && styles.disabled]}>
            <Text style={styles.mapActionText}>Önceki</Text>
          </Pressable>
          <Pressable onPress={() => setActiveIndex((value) => (value + 1) % humanMapStages.length)} style={[styles.mapActionPrimary, { backgroundColor: accent }]}>
            <Text style={styles.mapActionPrimaryText}>Sonraki kapı</Text>
            <Ionicons name="arrow-forward" color={colors.ink} size={16} />
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, fontSize: 16, lineHeight: 25, marginTop: -10 },
  mapCard: { gap: 12, padding: 12 },
  mapStage: { height: 590, borderRadius: 18, overflow: "hidden", position: "relative", backgroundColor: colors.deep },
  mapImage: { width: "100%", height: "100%" },
  mapShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(1,7,5,.08)" },
  currentGateBadge: { position: "absolute", left: 12, top: 12, maxWidth: 160, borderWidth: 1, borderColor: "rgba(235,195,112,.5)", borderRadius: 14, backgroundColor: "rgba(4,12,9,.88)", paddingHorizontal: 11, paddingVertical: 9 },
  currentGateLabel: { color: "#DDB86F", fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  currentGateTitle: { color: colors.cream, fontSize: 14, fontWeight: "800", lineHeight: 19, marginTop: 3 },
  mapHint: { position: "absolute", bottom: 12, left: 26, right: 26, color: "rgba(242,238,231,.9)", backgroundColor: "rgba(3,10,7,.82)", borderRadius: 99, paddingVertical: 8, textAlign: "center", fontSize: 13, fontWeight: "800" },
  mapHotspot: { position: "absolute", width: 36, height: 36, marginLeft: -18, marginTop: -18, borderRadius: 18, borderWidth: 1, borderColor: "rgba(242,238,231,.65)", backgroundColor: "rgba(10,18,13,.92)", alignItems: "center", justifyContent: "center", shadowOpacity: 0.25, shadowRadius: 8 },
  mapHotspotCurrent: { borderWidth: 2, borderColor: "#FFE09A", shadowColor: "#FFC65B", shadowOpacity: 0.9, shadowRadius: 15, elevation: 8 },
  mapHotspotText: { color: colors.cream, fontSize: 14, fontWeight: "900" },
  mapProgress: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  progressText: { color: colors.muted, flexShrink: 1, fontSize: 14 },
  progressCurrent: { fontSize: 14, fontWeight: "900" },
  mapInfo: { gap: 13 },
  mapInfoTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  flex: { flex: 1 },
  kicker: { fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  mapTitle: { color: colors.cream, fontSize: 23, fontFamily: fonts.displayStrong, marginTop: 4 },
  mapReward: { fontSize: 13, fontWeight: "900", textAlign: "right", maxWidth: 110 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 25 },
  benefitGrid: { gap: 7 },
  benefit: { flexDirection: "row", alignItems: "center", gap: 7 },
  benefitText: { color: colors.cream, fontSize: 15 },
  dailyNote: { gap: 4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  mapActions: { flexDirection: "row", gap: 8 },
  mapAction: { flex: 1, minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  mapActionPrimary: { flex: 1, minHeight: 48, borderRadius: radii.md, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center" },
  mapActionText: { color: colors.muted, fontSize: 15, fontWeight: "800" },
  mapActionPrimaryText: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.35 },
});
