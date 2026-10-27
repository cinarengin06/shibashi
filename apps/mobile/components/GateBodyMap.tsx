import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { BODY_GATE_ORDER, gateProgress, gates, type GateId } from '../../../packages/eight-gates';

const imageRatio = 832 / 464;
const organs: Record<GateId, { name: string; x: number; y: number }> = {
  peng: { name: 'Akciğerler', x: 52, y: 82 },
  lu: { name: 'Mide', x: 76, y: 79 },
  kao: { name: 'Karaciğer', x: 54, y: 65 },
  ji: { name: 'Kalın bağırsak', x: 68, y: 49 },
  zhou: { name: 'Safra kesesi', x: 33, y: 46 },
  an: { name: 'Böbrekler', x: 55, y: 31 },
  lie: { name: 'Kalp çevresi', x: 54, y: 10 },
  cai: { name: 'Mesane', x: 29, y: 69 },
};

const ringPlaces = [
  { side: 'left', row: 0 }, { side: 'right', row: 0 },
  { side: 'left', row: 1 }, { side: 'right', row: 1 },
  { side: 'left', row: 2 }, { side: 'right', row: 2 },
  { side: 'left', row: 3 }, { side: 'right', row: 3 },
] as const;

export function GateBodyMap({ progress, selectedGate, onSelect, accent, ink }: {
  progress: ReturnType<typeof gateProgress>;
  selectedGate: GateId;
  onSelect: (id: GateId) => void;
  accent: string;
  ink: string;
}) {
  const [width, setWidth] = useState(0);
  const imageWidth = Math.min(width * 0.68, 300);
  const imageHeight = imageWidth * imageRatio;
  const height = imageHeight + 22;
  const imageLeft = (width - imageWidth) / 2;
  const imageTop = 11;
  const selectedIndex = BODY_GATE_ORDER.indexOf(selectedGate);
  const selectedPlace = ringPlaces[selectedIndex];
  const origin = organs[selectedGate];
  const startX = imageLeft + imageWidth * origin.x / 100;
  const startY = imageTop + imageHeight * origin.y / 100;
  const endX = selectedPlace.side === 'left' ? 31 : width - 31;
  const endY = 43 + selectedPlace.row * ((height - 86) / 3);
  const distance = Math.hypot(endX - startX, endY - startY) || 1;
  const dx = (endX - startX) / distance;
  const dy = (endY - startY) / distance;
  const arrowX = endX - dx * 24;
  const arrowY = endY - dy * 24;

  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[s.map, { height: width ? height : 570 }]}>
    {width > 0 && <>
      <Image source={require('../assets/journey/neijing-map.jpg')} resizeMode="stretch" style={{ position: 'absolute', left: imageLeft, top: imageTop, width: imageWidth, height: imageHeight }} accessibilityLabel="Sekiz kapılı iç dünya beden haritası" />
      <View pointerEvents="none" style={[s.shade, { left: imageLeft, top: imageTop, width: imageWidth, height: imageHeight }]} />
      <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
        <Line x1={startX + dx * 15} y1={startY + dy * 15} x2={arrowX} y2={arrowY} stroke={accent} strokeWidth={2.5} strokeDasharray="7 6" />
        <Polygon points={`${arrowX},${arrowY} ${arrowX - dx * 10 - dy * 5},${arrowY - dy * 10 + dx * 5} ${arrowX - dx * 10 + dy * 5},${arrowY - dy * 10 - dx * 5}`} fill={accent} />
      </Svg>
      {BODY_GATE_ORDER.map((id, index) => {
        const point = organs[id];
        const active = selectedGate === id;
        return <Pressable key={`organ-${id}`} accessibilityRole="button" accessibilityLabel={`${index + 1}. ${point.name}: ${gates[id].name} kapısını seç`} accessibilityState={{ selected: active }} onPress={() => onSelect(id)} style={[s.organ, { left: imageLeft + imageWidth * point.x / 100 - 15, top: imageTop + imageHeight * point.y / 100 - 15, borderColor: active ? accent : '#A8E8F2', backgroundColor: active ? accent : '#184553' }]}><Text style={[s.organNumber, { color: active ? '#061913' : '#fff' }]}>{index + 1}</Text></Pressable>;
      })}
      {BODY_GATE_ORDER.map((id, index) => {
        const gate = progress.find((item) => item.id === id)!;
        const place = ringPlaces[index];
        const active = selectedGate === id;
        const cy = 43 + place.row * ((height - 86) / 3);
        return <Pressable key={`ring-${id}`} accessibilityRole="button" accessibilityLabel={`${index + 1}. ${gate.name}, ${organs[id].name}, yüzde ${gate.percent}`} accessibilityState={{ selected: active }} onPress={() => onSelect(id)} style={[s.ringGate, { left: place.side === 'left' ? 0 : width - 85, top: cy - 38 }]}>
          <View style={s.circleWrap}><Svg width={52} height={52} style={StyleSheet.absoluteFill}><Circle cx={26} cy={26} r={23} stroke="#496465" strokeWidth={3} fill="#081717" /><Circle cx={26} cy={26} r={23} stroke={accent} strokeWidth={3} fill="none" strokeDasharray={`${2 * Math.PI * 23}`} strokeDashoffset={2 * Math.PI * 23 * (1 - gate.percent / 100)} rotation={-90} origin="26, 26" /></Svg><Text style={[s.symbol, { color: active ? accent : '#C7DFD9' }]}>{gates[id].symbol}</Text><Text style={[s.badge, { backgroundColor: active ? accent : '#265764', color: active ? '#061913' : '#fff' }]}>{index + 1}</Text></View>
          <Text numberOfLines={2} style={[s.name, { color: ink }]}>{gate.name}</Text><Text style={[s.percent, { color: accent }]}>%{gate.percent}</Text>
        </Pressable>;
      })}
    </>}
  </View>;
}

const s = StyleSheet.create({
  map: { position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 18, backgroundColor: '#06111B' },
  shade: { position: 'absolute', backgroundColor: 'rgba(0, 9, 15, .18)' },
  organ: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  organNumber: { fontSize: 13, fontWeight: '900' },
  ringGate: { position: 'absolute', width: 85, minHeight: 76, alignItems: 'center', zIndex: 3 },
  circleWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 23, fontWeight: '700' },
  badge: { position: 'absolute', right: -3, bottom: -1, width: 18, height: 18, borderRadius: 9, overflow: 'hidden', textAlign: 'center', fontSize: 10, lineHeight: 18, fontWeight: '900' },
  name: { fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 12, marginTop: 3 },
  percent: { fontSize: 10, fontWeight: '800' },
});
