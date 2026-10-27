import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
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
  const sourceX = startX + dx * 15;
  const sourceY = startY + dy * 15;
  const bend = Math.min(18, distance * .09);
  const controlX = (sourceX + arrowX) / 2 - dy * bend;
  const controlY = (sourceY + arrowY) / 2 + dx * bend;
  const tipDistance = Math.hypot(arrowX - controlX, arrowY - controlY) || 1;
  const tipDx = (arrowX - controlX) / tipDistance;
  const tipDy = (arrowY - controlY) / tipDistance;
  const arrowPath = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${arrowX} ${arrowY}`;

  return <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[s.map, { height: width ? height : 570 }]}>
    {width > 0 && <>
      <Image source={require('../assets/journey/neijing-map.jpg')} resizeMode="stretch" style={{ position: 'absolute', left: imageLeft, top: imageTop, width: imageWidth, height: imageHeight }} accessibilityLabel="Sekiz kapılı iç dünya beden haritası" />
      <View pointerEvents="none" style={[s.shade, { left: imageLeft, top: imageTop, width: imageWidth, height: imageHeight }]} />
      <Svg pointerEvents="none" width={width} height={height} style={StyleSheet.absoluteFill}>
        <Path d={arrowPath} stroke="rgba(0,8,10,.72)" strokeWidth={5} strokeLinecap="round" fill="none" />
        <Path d={arrowPath} stroke={accent} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        <Polygon points={`${arrowX},${arrowY} ${arrowX - tipDx * 8 - tipDy * 4},${arrowY - tipDy * 8 + tipDx * 4} ${arrowX - tipDx * 8 + tipDy * 4},${arrowY - tipDy * 8 - tipDx * 4}`} fill={accent} />
      </Svg>
      {BODY_GATE_ORDER.map((id, index) => {
        const point = organs[id];
        const active = selectedGate === id;
        const markerSize = active ? 36 : 30;
        return <Pressable key={`organ-${id}`} accessibilityRole="button" accessibilityLabel={`${index + 1}. ${point.name}: ${gates[id].name} kapısını seç`} accessibilityState={{ selected: active }} onPress={() => onSelect(id)} style={[s.organ, active && s.activeOrgan, { left: imageLeft + imageWidth * point.x / 100 - markerSize / 2, top: imageTop + imageHeight * point.y / 100 - markerSize / 2, width: markerSize, height: markerSize, borderRadius: markerSize / 2, borderColor: active ? '#FFF3D0' : '#A8E8F2', backgroundColor: active ? accent : '#184553' }]}><Text style={[s.organNumber, { color: active ? '#061913' : '#fff' }]}>{index + 1}</Text></Pressable>;
      })}
      {BODY_GATE_ORDER.map((id, index) => {
        const gate = progress.find((item) => item.id === id)!;
        const place = ringPlaces[index];
        const active = selectedGate === id;
        const cy = 43 + place.row * ((height - 86) / 3);
        return <Pressable key={`ring-${id}`} accessibilityRole="button" accessibilityLabel={`${index + 1}. ${gate.name}, ${organs[id].name}, yüzde ${gate.percent}`} accessibilityState={{ selected: active }} onPress={() => onSelect(id)} style={[s.ringGate, { left: place.side === 'left' ? 0 : width - 85, top: cy - 38 }]}>
          <View style={[s.circleWrap, active && s.activeCircle]}><Svg width={52} height={52} style={StyleSheet.absoluteFill}><Circle cx={26} cy={26} r={23} stroke={active ? accent : '#496465'} strokeWidth={active ? 3 : 2} fill="#0C1C1C" /><Circle cx={26} cy={26} r={23} stroke={accent} strokeWidth={2.5} fill="none" strokeDasharray={`${2 * Math.PI * 23}`} strokeDashoffset={2 * Math.PI * 23 * (1 - gate.percent / 100)} rotation={-90} origin="26, 26" /></Svg><Text style={[s.symbol, { color: active ? accent : '#C7DFD9' }]}>{gates[id].symbol}</Text><Text style={[s.badge, { backgroundColor: active ? accent : '#265764', color: active ? '#061913' : '#fff' }]}>{index + 1}</Text></View>
          <Text numberOfLines={2} style={[s.name, { color: active ? accent : ink }]}>{gate.name}</Text><Text style={[s.percent, { color: accent }]}>%{gate.percent}</Text>
        </Pressable>;
      })}
    </>}
  </View>;
}

const s = StyleSheet.create({
  map: { position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 18, backgroundColor: '#06111B' },
  shade: { position: 'absolute', backgroundColor: 'rgba(0, 9, 15, .18)' },
  organ: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  activeOrgan: { shadowColor: '#F7D789', shadowOpacity: .9, shadowRadius: 12, elevation: 8, zIndex: 3 },
  organNumber: { fontSize: 13, fontWeight: '900' },
  ringGate: { position: 'absolute', width: 85, minHeight: 76, alignItems: 'center', zIndex: 3 },
  circleWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  activeCircle: { borderRadius: 26, shadowColor: '#F7D789', shadowOpacity: .45, shadowRadius: 9, elevation: 4 },
  symbol: { fontSize: 23, fontWeight: '700' },
  badge: { position: 'absolute', right: -3, bottom: -1, width: 18, height: 18, borderRadius: 9, overflow: 'hidden', textAlign: 'center', fontSize: 10, lineHeight: 18, fontWeight: '900' },
  name: { fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 12, marginTop: 3 },
  percent: { fontSize: 10, fontWeight: '800' },
});
