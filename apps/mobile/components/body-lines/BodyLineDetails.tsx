import { Image, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  getMovementOrganVisuals,
  getPoint,
  movementPointMarkers,
  pointGuidance,
  type MeridianMovementKnowledge,
} from "../../../../packages/meridian-knowledge";
import { s } from "./styles";

export type BodyLayer = "body" | "lines" | "deep";
const innerWorldImage = require("../../assets/body-lines/inner-world-organs-v1.jpg");
export const layers: {
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

export function Detail({
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

export function MovementPointOverlay({
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
