import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

type CameraZoomControlProps = { onChange: (zoom: number) => void; style?: ViewStyle; zoom: number };
const STEP = 0.1;

export function CameraZoomControl({ onChange, style, zoom }: CameraZoomControlProps) {
  const update = (direction: -1 | 1) => onChange(Math.max(0, Math.min(1, Number((zoom + STEP * direction).toFixed(2)))));
  return <View accessibilityLabel={`Kamera yakınlaştırma yüzde ${Math.round(zoom * 100)}`} style={[styles.control, style]}>
    <Pressable accessibilityLabel="Kamerayı uzaklaştır" disabled={zoom <= 0} hitSlop={8} onPress={() => update(-1)} style={({ pressed }) => [styles.button, pressed && styles.pressed, zoom <= 0 && styles.disabled]}><Ionicons color="#F2EEE5" name="remove" size={18} /></Pressable>
    <Text style={styles.value}>{zoom === 0 ? "1×" : `${(1 + zoom * 2).toFixed(1)}×`}</Text>
    <Pressable accessibilityLabel="Kamerayı yakınlaştır" disabled={zoom >= 1} hitSlop={8} onPress={() => update(1)} style={({ pressed }) => [styles.button, pressed && styles.pressed, zoom >= 1 && styles.disabled]}><Ionicons color="#F2EEE5" name="add" size={18} /></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  button: { alignItems: "center", backgroundColor: "rgba(255,255,255,.09)", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  control: { alignItems: "center", backgroundColor: "rgba(5,10,8,.88)", borderColor: "rgba(242,238,229,.2)", borderRadius: 24, borderWidth: 1, flexDirection: "row", gap: 3, padding: 4, position: "absolute", right: 14, top: 76, zIndex: 40 },
  disabled: { opacity: 0.28 },
  pressed: { transform: [{ scale: 0.94 }] },
  value: { color: "rgba(242,238,229,.78)", fontSize: 11, minWidth: 35, textAlign: "center" },
});
