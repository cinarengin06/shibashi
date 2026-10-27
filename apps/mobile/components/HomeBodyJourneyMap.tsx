import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BODY_GATE_ORDER, type GateId, type gateProgress } from '../../../packages/eight-gates';

const gatePlaces = [
  { x: 50, y: 2 }, { x: 81, y: 24 }, { x: 19, y: 24 }, { x: 83, y: 49 },
  { x: 17, y: 49 }, { x: 81, y: 72 }, { x: 19, y: 72 }, { x: 50, y: 84 },
] as const;

export function HomeBodyJourneyMap({ progress, activeGate, accent }: {
  progress: ReturnType<typeof gateProgress>;
  activeGate: GateId;
  accent: string;
}) {
  const [width, setWidth] = useState(0);
  const circleSize = Math.max(40, Math.min(58, width * 0.15));
  const labelWidth = Math.max(77, width * 0.29);

  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[s.map, { height: width ? width * 16 / 9 : 570 }]}>
    <Image source={require('../assets/journey/body-map-eight-gates-3d-v2.jpg')} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityLabel="Işıklı beden figürü üzerinde sekiz kapı" />
    {width > 0 && BODY_GATE_ORDER.map((id, index) => {
      const gate = progress.find((item) => item.id === id);
      const place = gatePlaces[index];
      const active = id === activeGate;
      return <View key={id} style={[s.gate, { left: width * place.x / 100 - labelWidth / 2, top: width * 16 / 9 * place.y / 100, width: labelWidth }]}>
        <View style={[s.circle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2, borderColor: accent, backgroundColor: active ? accent : 'rgba(4, 15, 13, .79)' }, active && s.activeCircle]}><Text style={[s.number, { color: active ? '#172018' : '#F4DCA6', fontSize: circleSize * .42 }]}>{index + 1}</Text></View>
        <Text numberOfLines={2} style={s.name}>{gate?.name}</Text>
        <Text style={[s.percent, { color: accent }]}>%{gate?.percent ?? 0}</Text>
      </View>;
    })}
  </View>;
}

const s = StyleSheet.create({
  map: { position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 18, backgroundColor: '#030b0b' },
  gate: { position: 'absolute', alignItems: 'center' },
  circle: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  activeCircle: { shadowColor: '#E9C274', shadowOpacity: .85, shadowRadius: 14, elevation: 8 },
  number: { fontWeight: '700' },
  name: { color: '#F8F5EA', fontSize: 11, lineHeight: 13, fontWeight: '800', textAlign: 'center', marginTop: 5, textShadowColor: '#000', textShadowRadius: 5 },
  percent: { fontSize: 11, fontWeight: '800', marginTop: 3, textShadowColor: '#000', textShadowRadius: 5 },
});
