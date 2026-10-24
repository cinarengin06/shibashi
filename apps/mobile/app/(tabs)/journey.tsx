import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Eyebrow, Screen, Title } from "../../components/ui";
import { colors, fonts, radii } from "../../constants/theme";
import { humanMapStages } from "../../data/journey";
import { BODY_GATE_ORDER, gateGuidance, gateProgress, gates, movementGateWeights, uniqueMovementOrders } from "../../../../packages/eight-gates";
import { meridianMovements } from "../../../../packages/meridian-knowledge";
import { shibashiPosters } from "../../data/shibashiMedia";
import { getShen } from "../../data/fiveShen";
import { loadCompletedMovements } from "../../services/movementCompletion";
import { useApp } from "../../store/AppStore";
import { getShenVisualTheme } from "../../../../packages/design-tokens";

export default function Journey() {
  const { profile, sessions, shenActivities } = useApp();
  const selectedShen = getShen(profile.selectedShenId);
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const accent = selectedShen.color;
  const [completedOrders, setCompletedOrders] = useState<number[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedManually, setSelectedManually] = useState(false);
  const allCompletedOrders = useMemo(() => uniqueMovementOrders([
    ...completedOrders,
    ...sessions.filter((session) => session.postureScore >= 70).map((session) => Number(session.practiceId.match(/^movement-(\d+)$/)?.[1])),
    ...shenActivities.filter((activity) => activity.type === "practice" && activity.completed !== false).map((activity) => Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1])),
  ]), [completedOrders, sessions, shenActivities]);
  const progress = useMemo(() => gateProgress(allCompletedOrders), [allCompletedOrders]);
  const currentGateIndex = BODY_GATE_ORDER.reduce((best, id, index) => {
    const candidate = progress.find((gate) => gate.id === id)!;
    const current = progress.find((gate) => gate.id === BODY_GATE_ORDER[best])!;
    return candidate.percent > current.percent || (candidate.percent === current.percent && candidate.completedCount > current.completedCount) ? index : best;
  }, 0);
  const activeGateId = BODY_GATE_ORDER[activeIndex];
  const gate = progress.find((item) => item.id === activeGateId)!;
  const guidance = gateGuidance[activeGateId];
  const currentGate = progress.find((item) => item.id === BODY_GATE_ORDER[currentGateIndex])!;
  const isCurrentGate = activeIndex === currentGateIndex;
  const relatedMovements = meridianMovements.filter(item => Boolean(movementGateWeights[item.order]?.[activeGateId]));

  useFocusEffect(useCallback(() => {
    let active = true;
    void loadCompletedMovements(profile.authUserId).then((orders) => {
      if (!active) return;
      setCompletedOrders(orders);
      if (!selectedManually) {
        const nextProgress = gateProgress(uniqueMovementOrders([
          ...orders,
          ...sessions.filter((session) => session.postureScore >= 70).map((session) => Number(session.practiceId.match(/^movement-(\d+)$/)?.[1])),
          ...shenActivities.filter((activity) => activity.type === "practice" && activity.completed !== false).map((activity) => Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1])),
        ]));
        const best = BODY_GATE_ORDER.reduce((bestIndex, id, index) => {
          const candidate = nextProgress.find((item) => item.id === id)!;
          const current = nextProgress.find((item) => item.id === BODY_GATE_ORDER[bestIndex])!;
          return candidate.percent > current.percent || (candidate.percent === current.percent && candidate.completedCount > current.completedCount) ? index : bestIndex;
        }, 0);
        setActiveIndex(best);
      }
    });
    return () => { active = false; };
  }, [profile.authUserId, selectedManually, sessions, shenActivities]));

  const selectGate = (index: number) => { setSelectedManually(true); setActiveIndex(index); };

  return (
    <Screen>
      <Eyebrow>HARİTAN · SEKİZ BEDEN KAPISI</Eyebrow>
      <Title>Bedenindeki kapıları gör.</Title>
      <Text style={[styles.lead,{color:visual.textSecondary}]}>Kapılara dokun; beden bölgesini, günlük karşılığını ve mini pratiğini aç. Altın halka en çok ilerlediğin kapıyı gösterir.</Text>

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
            <Text style={styles.currentGateLabel}>{allCompletedOrders.length ? "EN ÇOK İLERLEDİĞİN KAPI" : "BAŞLANGIÇ KAPISI"}</Text>
            <Text style={styles.currentGateTitle}>{currentGate.name}</Text>
          </View>
          {BODY_GATE_ORDER.map((id, index) => {
            const current = index === currentGateIndex;
            const active = index === activeIndex;
            return (
              <Pressable
                accessibilityLabel={`${index + 1}. ${gates[id].name} kapısını aç`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={id}
                onPress={() => selectGate(index)}
                style={[styles.mapHotspot, { left: `${humanMapStages[index].x}%`, top: `${humanMapStages[index].y}%` }, current && styles.mapHotspotCurrent, active && { borderColor: accent, backgroundColor: `${accent}dd`, shadowColor: accent }]}
              >
                <Text style={[styles.mapHotspotText, active && { color: colors.ink }]}>{index + 1}</Text>
              </Pressable>
            );
          })}
          <Text style={styles.mapHint}>Kapıya dokun · açıklamasını aç</Text>
        </View>

        <View style={styles.mapProgress}>
          <Text style={[styles.progressText,{color:visual.textSecondary}]}>İncelenen kapı {activeIndex + 1} / {BODY_GATE_ORDER.length}</Text>
          <Text style={[styles.progressCurrent, { color: accent }]}>Önde: {currentGate.name}</Text>
        </View>
      </Card>

      <Card style={[styles.mapInfo, { borderColor: `${accent}55` }]}>
        <View style={styles.mapInfoTop}>
          <View style={styles.flex}>
            <Text style={[styles.kicker, { color: accent }]}>{isCurrentGate ? (allCompletedOrders.length ? "EN ÇOK İLERLEDİĞİN KAPI" : "BAŞLANGIÇ KAPISI") : "İNCELEDİĞİN KAPI"}</Text>
            <Text style={[styles.mapTitle,{color:visual.text}]}>{gate.name}</Text>
          </View>
          <Text style={[styles.mapReward, { color: accent }]}>{guidance.focus} odağı</Text>
        </View>
        <Text style={[styles.body,{color:visual.textSecondary}]}>%{gate.percent} ({gate.completedCount}/{gate.mappedCount} hareket) · {guidance.outcome}</Text>
        <View style={styles.benefitGrid}>
          {guidance.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefit}>
              <Ionicons name="checkmark" color={accent} size={16} />
              <Text style={[styles.benefitText,{color:visual.text}]}>{benefit}</Text>
            </View>
          ))}
        </View>
        <View style={styles.dailyNote}>
          <Text style={[styles.kicker, { color: accent }]}>GÜNLÜK HAYATTA</Text>
          <Text style={[styles.body,{color:visual.textSecondary}]}>{guidance.dailyUse}</Text>
        </View>
        <View style={styles.dailyNote}>
          <Text style={[styles.kicker, { color: accent }]}>MİNİ PRATİK</Text>
          <Text style={[styles.body,{color:visual.textSecondary}]}>{guidance.microPractice}</Text>
        </View>
        <View style={styles.mapActions}>
          <Pressable disabled={activeIndex === 0} onPress={() => selectGate(Math.max(0, activeIndex - 1))} style={[styles.mapAction, activeIndex === 0 && styles.disabled]}>
            <Text style={[styles.mapActionText,{color:visual.textSecondary}]}>Önceki</Text>
          </Pressable>
          <Pressable onPress={() => selectGate((activeIndex + 1) % BODY_GATE_ORDER.length)} style={[styles.mapActionPrimary, { backgroundColor: accent }]}>
            <Text style={styles.mapActionPrimaryText}>Sonraki kapı</Text>
            <Ionicons name="arrow-forward" color={colors.ink} size={16} />
          </Pressable>
        </View>
      </Card>

      <Text style={[styles.mapTitle, { marginTop: 14, color:visual.text }]}>İlgili videolar aşağıda</Text>
      {relatedMovements.map(item => {
        const done = allCompletedOrders.includes(item.order);
        return <Pressable key={item.order} accessibilityRole="button" accessibilityLabel={`${item.order}. form ${item.sourceTitle}${done ? ', tamamlandı' : ''}`} onPress={() => router.push(`/body-lines?movementOrder=${item.order}`)} style={[styles.relatedVideo, { borderColor: visual.border, backgroundColor:visual.surface }]}><Image source={shibashiPosters[item.order]} style={styles.relatedPoster}/><View style={styles.flex}><Text style={[styles.kicker, { color: accent }]}>FORM {String(item.order).padStart(2, '0')}</Text><Text numberOfLines={2} style={[styles.relatedTitle,{color:visual.text}]}>{item.sourceTitle}</Text><Text style={[styles.relatedStatus, { color: done ? '#A8DCB3' : colors.muted }]}>{done ? '✓ Tamamlandı' : '18 Form’da izle'}</Text></View><Ionicons name="play-circle-outline" color={accent} size={25}/></Pressable>;
      })}
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
  relatedVideo: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 84, padding: 8, borderWidth: 1, borderRadius: 14, backgroundColor: colors.surface },
  relatedPoster: { width: 64, height: 68, borderRadius: 7 },
  relatedTitle: { color: colors.cream, fontFamily: fonts.sansStrong, fontSize: 15, marginTop: 3 },
  relatedStatus: { fontFamily: fonts.sansMedium, fontSize: 12, marginTop: 3 },
});
