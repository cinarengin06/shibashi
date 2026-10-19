import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, ImageBackground, Pressable, Text, View, StyleSheet, type ImageSourcePropType } from "react-native";
import type { PostureReport } from "../../types";
import { colors } from "../../constants/theme";
import { s } from "./home.styles";

export function HomePostureCard({ accent, image, reports }: { accent: string; image: ImageSourcePropType; reports: PostureReport[] }) {
  const recentReports = reports.slice(0, 3);
  const openReport = (reportId: string) => router.push({ pathname: "/posture", params: { reportId } });
  return (
    <View style={[s.postureCard, { borderColor: `${accent}48` }]}>
      <Image resizeMode="contain" source={image} style={s.postureModel} />
      <LinearGradient colors={["rgba(8,14,11,.98)", "rgba(8,14,11,.88)", "rgba(8,14,11,.18)"]} locations={[0, .62, 1]} style={StyleSheet.absoluteFill} />
      <View style={s.postureCardContent}>
        <Text style={[s.portalLabel, { color: accent }]}>BEDEN AYNASI</Text>
        <Text style={s.postureCardTitle}>Postür Analizi</Text>
        {recentReports.length ? <View style={s.postureHistory}>
          {recentReports.map((report) => <Pressable accessibilityLabel={`${report.score} puanlı postür analizini aç`} key={report.id} onPress={() => openReport(report.id)} style={s.postureHistoryRow}>
            <View style={[s.postureHistoryScore, { borderColor: `${accent}88` }]}><Text style={[s.postureHistoryScoreText, { color: accent }]}>{report.score}</Text></View>
            <View style={s.postureHistoryCopy}><Text style={s.postureHistoryDate}>{new Date(report.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</Text><Text numberOfLines={1} style={s.postureHistorySummary}>{report.summary}</Text><Text style={[s.postureHistoryLink, { color: accent }]}>İlgili analize git →</Text></View>
          </Pressable>)}
        </View> : <Text style={s.postureEmpty}>Henüz kayıt yok. İlk beden çizgini ölç.</Text>}
        <Pressable onPress={() => router.push("/posture")} style={[s.postureAnalysisButton, { borderColor: `${accent}88` }]}><Text style={[s.postureAnalysisButtonText, { color: accent }]}>Yeni analiz</Text><Ionicons color={accent} name="scan-outline" size={18} /></Pressable>
      </View>
    </View>
  );
}

export function FeaturePortal({
  accent,
  contain = false,
  image,
  label,
  note,
  onPress,
  title,
}: {
  accent: string;
  contain?: boolean;
  image: ImageSourcePropType;
  label: string;
  note: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`${title}. ${note}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[s.portal, { borderColor: `${accent}48` }]}
    >
      <ImageBackground
        imageStyle={[s.portalImage, contain && s.portalImageContain]}
        resizeMode={contain ? "contain" : "cover"}
        source={image}
        style={s.portalBackground}
      >
        <LinearGradient
          colors={["rgba(4,9,7,.04)", "rgba(4,9,7,.28)", "rgba(4,9,7,.96)"]}
          locations={[0, 0.46, 1]}
          style={s.portalShade}
        >
          <View style={s.portalArrow}>
            <Ionicons color={colors.cream} name="arrow-up-outline" size={15} />
          </View>
          <View style={s.portalSpace} />
          <Text style={[s.portalLabel, { color: accent }]}>{label}</Text>
          <Text numberOfLines={2} style={s.portalTitle}>
            {title}
          </Text>
          <Text numberOfLines={2} style={s.portalNote}>
            {note}
          </Text>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}

export function DashboardMetric({
  accent,
  icon,
  label,
  value,
}: {
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={[s.metricCard, { borderColor: `${accent}42` }]}>
      <View style={s.metricHead}>
        <Ionicons color={accent} name={icon} size={17} />
        <Text style={s.metricLabel}>{label}</Text>
      </View>
      <Text style={[s.metricValue, { color: accent }]}>{value}</Text>
      <View style={s.metricTrack}>
        <View
          style={[s.metricFill, { backgroundColor: accent, width: "68%" }]}
        />
      </View>
    </View>
  );
}

export function formatToday() {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

