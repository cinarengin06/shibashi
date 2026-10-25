import { Ionicons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Card,
  Eyebrow,
  Metric,
  Screen,
  Section,
  Title,
} from "../../components/ui";
import { colors, mobileThemeFont } from "../../constants/theme";
import { GOOGLE_AUTH_UI_ENABLED } from "../../constants/features";
import { getShen } from "../../data/fiveShen";
import { signOut } from "../../services/auth/SupabaseAuth";
import { useApp } from "../../store/AppStore";
import { useShenExperience } from "../../store/ShenExperience";
import { getShenVisualTheme, visualThemes, visualThemeFonts, type VisualThemeId } from "../../../../packages/design-tokens";

export default function Profile() {
  const {
    profile,
    sessions,
    postureReports,
    saveProfile,
    reset,
    syncStatus,
    syncCode,
    lastSyncedAt,
    syncMessage,
    syncNow,
    setSyncCode,
  } = useApp();
  const { playing, toggleSound } = useShenExperience();
  const shen = getShen(profile.selectedShenId);
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const [pairCode, setPairCode] = useState("");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const connect = async () => {
    const success = await setSyncCode(pairCode);
    if (success) setPairCode("");
    else
      Alert.alert(
        "Kod geçersiz",
        "Eşleştirme kodu XXXX-XXXX-XXXX biçiminde olmalı.",
      );
  };
  const disconnectGoogle = async () => {
    try {
      await signOut();
      saveProfile({
        authEmail: undefined,
        authUserId: undefined,
        avatarUrl: undefined,
      });
      router.replace("/auth");
    } catch (error) {
      Alert.alert(
        "Çıkış yapılamadı",
        error instanceof Error ? error.message : "Lütfen yeniden dene.",
      );
    }
  };
  return (
    <Screen>
      <View style={p.head}>
        <View style={[p.avatar, { borderColor: shen.color }]}>
          <Text style={[p.initial, { color: shen.color }]}>
            {profile.name[0]?.toUpperCase()}
          </Text>
        </View>
        <View>
          <Eyebrow>PRATİK PROFİLİ</Eyebrow>
          <Title>{profile.name}</Title>
          <Text style={[p.muted,{color:visual.textSecondary}]}>{profile.experience}</Text>
        </View>
      </View>
      <View style={p.metrics}>
        <Metric label="Kayıtlı pratik" value={sessions.length} />
        <Metric
          label="Dakika"
          value={sessions.reduce((a, s) => a + s.duration, 0)}
        />
        <Metric label="Postür ölçümü" value={postureReports.length} />
      </View>
      {GOOGLE_AUTH_UI_ENABLED ? (
        <Section
          title="Google hesabı"
          action={profile.authEmail ? "Bağlı" : "Hesapsız"}
        >
          <Card style={[p.accountCard, { borderColor: `${shen.color}44` }]}>
            <View style={[p.syncIcon, { backgroundColor: `${shen.color}18` }]}>
              <Ionicons
                name={profile.authEmail ? "logo-google" : "person-outline"}
                color={shen.color}
                size={23}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[p.text,{color:visual.text}]}>
                {profile.authEmail ? "Hesabın bağlı" : "Hesapsız kullanıyorsun"}
              </Text>
              <Text style={[p.muted,{color:visual.textSecondary}]}>
                {profile.authEmail ??
                  "Google ile giriş yaparak ilerlemeni cihazların arasında taşı."}
              </Text>
            </View>
            {profile.authEmail ? (
              <Pressable
                onPress={() => void disconnectGoogle()}
                style={p.accountAction}
              >
                <Text style={p.accountActionText}>Çıkış</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push("/auth")}
                style={p.accountAction}
              >
                <Text style={p.accountActionText}>Bağla</Text>
              </Pressable>
            )}
          </Card>
        </Section>
      ) : null}
      <Section
        title="App + Web senkronizasyonu"
        action={
          syncStatus === "synced"
            ? "Güncel"
            : syncStatus === "syncing"
              ? "Eşitleniyor"
              : "Çevrimdışı kuyruk açık"
        }
      >
        <Card style={[p.syncCard, { borderColor: `${shen.color}55` }]}>
          <View style={p.syncHead}>
            <View style={[p.syncIcon, { backgroundColor: `${shen.color}18` }]}>
              <Ionicons
                name={
                  syncStatus === "synced"
                    ? "cloud-done-outline"
                    : syncStatus === "syncing"
                      ? "sync-outline"
                      : "cloud-offline-outline"
                }
                color={shen.color}
                size={23}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[p.text,{color:visual.text}]}>
                {syncStatus === "synced"
                  ? "Verilerin iki cihazda güncel"
                  : syncStatus === "syncing"
                    ? "Veriler eşitleniyor"
                    : "Kayıtlar cihazda güvende"}
              </Text>
              <Text style={[p.muted,{color:visual.textSecondary}]}>
                {lastSyncedAt
                  ? `Son eşitleme ${new Date(lastSyncedAt).toLocaleString("tr-TR")}`
                  : (syncMessage ??
                    "İnternet geldiğinde kuyruk otomatik gönderilir.")}
              </Text>
            </View>
          </View>
          <View style={p.codeRow}>
            <View>
              <Text style={[p.codeLabel,{color:visual.textSecondary}]}>EŞLEŞTİRME KODUN</Text>
              <Text selectable style={[p.code, { color: shen.color }]}>
                {syncCode || "Hazırlanıyor…"}
              </Text>
            </View>
            <Pressable
              onPress={() => void syncNow()}
              style={[p.syncButton, { borderColor: shen.color }]}
            >
              <Text style={[p.syncButtonText, { color: shen.color }]}>
                Şimdi eşitle
              </Text>
            </Pressable>
          </View>
          <Text style={[p.muted,{color:visual.textSecondary}]}>
            Web’de aynı kodu girerek geçmişini, serini ve yolculuğunu birleştir.
          </Text>
          <View style={p.pairRow}>
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={14}
              onChangeText={setPairCode}
              placeholder="XXXX-XXXX-XXXX"
              placeholderTextColor={colors.muted}
              style={[p.codeInput,{color:visual.text}]}
              value={pairCode}
            />
            <Pressable
              disabled={!pairCode}
              onPress={() => void connect()}
              style={[
                p.connect,
                { backgroundColor: pairCode ? shen.color : colors.surface2 },
              ]}
            >
              <Text style={p.connectText}>Bağla</Text>
            </Pressable>
          </View>
        </Card>
      </Section>
      <Section title="Temanı seç" action="Renk ve yazı karakteri temaya uyar">
        <View style={p.themeGrid}>
          {(Object.keys(visualThemes) as VisualThemeId[]).map((mode) => {
            const theme = getShenVisualTheme(profile.selectedShenId, mode);
            const active = visual.id === mode;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                key={theme.id}
                onPress={() => saveProfile({ visualThemeId: theme.id })}
                style={[
                  p.themeChoice,
                  {
                    backgroundColor: theme.surface,
                    borderColor: active ? theme.glow : theme.border,
                  },
                ]}
              >
                <View style={p.themeSwatches}>
                  <View style={[p.themeSwatch, { backgroundColor: theme.background }]} />
                  <View style={[p.themeSwatch, { backgroundColor: theme.surfaceRaised }]} />
                  <View style={[p.themeSwatch, { backgroundColor: theme.glow }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[p.themeName, { color: theme.text, fontFamily: mobileThemeFont(theme.id) }]}>{theme.name}</Text>
                  <Text style={[p.themeDescription, { color: theme.textSecondary }]}>{theme.description}</Text>
                  <Text style={[p.themeDescription, { color: theme.glow, fontFamily: mobileThemeFont(theme.id), marginTop: 5 }]}>Dengeyle başla · {visualThemeFonts[theme.id].label}</Text>
                </View>
                <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} color={active ? theme.glow : theme.textSecondary} size={23} />
              </Pressable>
            );
          })}
        </View>
      </Section>
      <Section title="Tercihler">
        <Card style={{ paddingVertical: 4 }}>
          <View style={p.row}>
            <View style={p.rowLabel}>
              <Ionicons
                name={playing ? "musical-notes" : "volume-mute-outline"}
                color={shen.color}
                size={21}
              />
              <View>
                <Text style={[p.text,{color:visual.text}]}>Müzik</Text>
                <Text style={[p.muted,{color:visual.textSecondary}]}>
                  {playing
                    ? `${shen.dailyName} müziği çalıyor`
                    : "Müzik kapalı"}
                </Text>
              </View>
            </View>
            <Switch
              value={profile.soundEnabled}
              onValueChange={toggleSound}
              trackColor={{ false: colors.surface2, true: shen.color }}
            />
          </View>
          <View style={p.row}>
            <View style={p.rowLabel}>
              <Ionicons
                name="notifications-outline"
                color={shen.color}
                size={21}
              />
              <Text style={[p.text,{color:visual.text}]}>Günlük hatırlatma</Text>
            </View>
            <Switch
              value={profile.reminders}
              onValueChange={(v) => saveProfile({ reminders: v })}
              trackColor={{ false: colors.surface2, true: shen.color }}
            />
          </View>
          <View style={p.row}>
            <View style={p.rowLabel}>
              <Ionicons name="time-outline" color={shen.color} size={21} />
              <Text style={[p.text,{color:visual.text}]}>Günlük hedef</Text>
            </View>
            <Text style={[p.gold, { color: shen.color }]}>
              {profile.dailyGoal} dk
            </Text>
          </View>
          <Pressable
            onPress={() => {
              saveProfile({ onboardingDone: false, onboardingVersion: 0 });
              router.replace("/welcome");
            }}
            style={p.row}
          >
            <View style={p.rowLabel}>
              <Ionicons
                name="play-circle-outline"
                color={shen.color}
                size={21}
              />
              <Text style={[p.text,{color:visual.text}]}>Başlangıç Rehberini yeniden başlatmak istiyorum</Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.muted} />
          </Pressable>
          <Pressable onPress={() => void requestCameraPermission()} style={p.row} accessibilityRole="button">
            <View style={p.rowLabel}>
              <Ionicons name="camera-outline" color={shen.color} size={21} />
              <View style={{ flex: 1 }}><Text style={[p.text,{color:visual.text}]}>Kameraya izin ver</Text><Text style={[p.muted,{color:visual.textSecondary}]}>Postür ve Form uyum pratikleri sırasında kameraya erişim iznini onaylıyorum.</Text><Text style={[p.muted,{color:cameraPermission?.granted?shen.color:visual.textSecondary}]}>{cameraPermission?.granted?'Kamera izni verildi':'İzin istemek için dokun'}</Text></View>
            </View>
          </Pressable>
        </Card>
      </Section>
      <Pressable
        onPress={() =>
          Alert.alert(
            "Verileri sıfırla",
            "Tüm pratik ve günlük verilerin silinecek.",
            [
              { text: "Vazgeç" },
              { text: "Sıfırla", style: "destructive", onPress: reset },
            ],
          )
        }
      >
        <Text style={p.reset}>Tüm verileri sıfırla</Text>
      </Pressable>
      <Text style={[p.muted, { textAlign: "center" }]}>
        Shibashi 1.0.0 · Yerel koruma + eşleştirme kodlu bulut senkronizasyonu
      </Text>
    </Screen>
  );
}
const p = StyleSheet.create({
  head: { flexDirection: "row", gap: 15, alignItems: "center" },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 27, fontWeight: "800" },
  muted: { color: colors.muted, fontSize: 16, lineHeight: 28 },
  term: { fontSize: 16, fontWeight: "700" },
  metrics: { flexDirection: "row", gap: 8 },
  accountCard: { alignItems: "center", flexDirection: "row", gap: 11 },
  accountAction: {
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  accountActionText: { color: colors.cream, fontSize: 16, fontWeight: "800" },
  syncCard: { gap: 14 },
  syncHead: { flexDirection: "row", gap: 11, alignItems: "center" },
  syncIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  codeLabel: {
    color: colors.muted,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  code: { fontSize: 17, fontWeight: "900", letterSpacing: 1.5, marginTop: 3 },
  syncButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  syncButtonText: { fontSize: 16, fontWeight: "800" },
  pairRow: { flexDirection: "row", gap: 8 },
  codeInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: colors.cream,
    fontSize: 16,
    letterSpacing: 1,
  },
  connect: {
    minWidth: 66,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  connectText: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  shenCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  shenSymbol: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  shenMode: { fontSize: 16, fontWeight: "900", letterSpacing: 1.2 },
  shenTitle: { color: colors.cream, fontSize: 17, fontWeight: "700" },
  themeGrid: { gap: 10 },
  themeChoice: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 104, padding: 14 },
  themeSwatches: { flexDirection: "row" },
  themeSwatch: { borderColor: "rgba(255,255,255,.16)", borderRadius: 13, borderWidth: 1, height: 28, marginRight: -7, width: 28 },
  themeName: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  themeDescription: { fontSize: 14, lineHeight: 20 },
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  rowLabel: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { color: colors.cream, fontSize: 17 },
  gold: { color: colors.gold, fontWeight: "700" },
  reset: {
    color: colors.danger,
    textAlign: "center",
    fontWeight: "700",
    padding: 12,
  },
});
