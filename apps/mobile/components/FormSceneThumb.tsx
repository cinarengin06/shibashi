import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';
import { shibashiPosters } from '../data/shibashiMedia';

export function FormSceneThumb({ order, width, height, accent }: { order: number; width: number; height: number; accent: string }) {
  return <View style={{ width, height, borderRadius: 9, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
    <Image source={shibashiPosters[order]} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
    <View pointerEvents="none" style={{ position: 'absolute', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingLeft: 2, backgroundColor: accent, borderWidth: 1, borderColor: 'rgba(255,255,255,.7)' }}>
      <Ionicons name="play" size={16} color="#142017" />
    </View>
  </View>;
}
