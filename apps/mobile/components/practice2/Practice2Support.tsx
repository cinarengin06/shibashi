import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import type { Practice2Analysis, Practice2PosePoint } from "../../../../packages/practice2";
import { s } from "./styles";

const links = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
] as const;

export function Feedback({
  analysis,
  fallback,
}: {
  analysis: Practice2Analysis | null;
  fallback: string;
}) {
  return (
    <View style={s.feedback}>
      <Text style={s.panelTitle}>CANLI GERİ BİLDİRİM</Text>
      {analysis?.correction ? (
        <View style={s.feedbackRow}>
          <Ionicons name="warning-outline" color="#D7A85B" size={17} />
          <Text style={s.correction}>{analysis.correction}</Text>
        </View>
      ) : null}
      {analysis?.positive ? (
        <View style={s.feedbackRow}>
          <Ionicons name="checkmark-circle-outline" color="#A9D977" size={17} />
          <Text style={s.positive}>{analysis.positive}</Text>
        </View>
      ) : null}
      {!analysis ? <Text style={s.fallback}>{fallback}</Text> : null}
    </View>
  );
}
export function Metrics({ analysis }: { analysis: Practice2Analysis | null }) {
  return (
    <View style={s.metrics}>
      <Text style={s.panelTitle}>METRİK ANALİZİ</Text>
      {analysis?.metrics.map((item) => (
        <View style={s.metric} key={item.id}>
          <View style={s.metricCopy}>
            <Text style={s.metricName}>{item.label}</Text>
            <Text numberOfLines={1} style={s.metricDetail}>
              {item.detail}
            </Text>
          </View>
          {item.available ? (
            <>
              <View style={s.metricTrack}>
                <View
                  style={[s.metricFill, { width: `${item.value ?? 0}%` }]}
                />
              </View>
              <Text style={s.metricValue}>{item.value}%</Text>
            </>
          ) : (
            <Text style={s.unavailable}>Ölçülemiyor</Text>
          )}
        </View>
      )) ?? (
        <Text style={s.fallback}>
          Kamera ölçümü başladığında yalnızca gerçek metrikler gösterilir.
        </Text>
      )}
    </View>
  );
}
export function PoseMini({ pose }: { pose: readonly Practice2PosePoint[] }) {
  const get = (name: string) => pose.find((item) => item.name === name),
    visibleNames = new Set<string>(links.flat());
  return (
    <Svg width={76} height={76} viewBox="0 0 100 100">
      {links.map(([a, b]) => {
        const p1 = get(a),
          p2 = get(b);
        return p1 && p2 ? (
          <Line
            key={`${a}-${b}`}
            x1={p1.x * 100}
            y1={p1.y * 100}
            x2={p2.x * 100}
            y2={p2.y * 100}
            stroke="#FFF0BD"
            strokeWidth={1.65}
          />
        ) : null;
      })}
      {pose
        .filter((item) => visibleNames.has(item.name))
        .map((item) => (
          <Circle
            key={item.name}
            cx={item.x * 100}
            cy={item.y * 100}
            r={2.05}
            fill="#F3CF8B"
            stroke="#FFF0BD"
            strokeWidth={0.3}
          />
        ))}
    </Svg>
  );
}
