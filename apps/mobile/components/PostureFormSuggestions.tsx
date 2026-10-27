import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getMovementEnergyTag, meridianMovements } from '../../../packages/meridian-knowledge';
import { recommendFormsForPosture, type PostureRegionScores } from '../../../packages/posture-form-recommendations';
import { getShenVisualTheme } from '../../../packages/design-tokens';
import { shibashiPosters } from '../data/shibashiMedia';
import { useApp } from '../store/AppStore';
import { FormMetaTags } from './FormMetaTags';

export function PostureFormSuggestions({ captures, accent }: { captures: PostureRegionScores[]; accent: string }) {
  const { profile } = useApp();
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const recommendations = recommendFormsForPosture(captures);
  if (!recommendations.length) return null;
  return <View style={styles.section}>
    <Text style={[styles.heading, { color: visual.text }]}>Postürün İçin Önerilen Formlar</Text>
    {recommendations.map(item => {
      const movement = meridianMovements.find(candidate => candidate.order === item.order);
      if (!movement) return null;
      const energy = getMovementEnergyTag(item.order).quality;
      return <Pressable key={item.order} accessibilityRole="button" accessibilityLabel={`${movement.sourceTitle}, ${energy} videosunu aç`} onPress={() => router.push({ pathname: '/body-lines', params: { movementOrder: item.order } })} style={[styles.card, { borderColor: `${accent}66`, backgroundColor: visual.surface }]}>
        <View style={styles.posterWrap}><Image source={shibashiPosters[item.order]} style={styles.poster} /><View style={[styles.play,{backgroundColor:accent}]}><Ionicons name="play" size={17} color="#142017"/></View></View>
        <View style={styles.copy}><Text style={[styles.title, { color: visual.text }]}>{movement.sourceTitle}</Text><FormMetaTags order={item.order} compact/></View>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 10, marginTop: 16 },
  heading: { color: '#F4F0E8', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderWidth: 1, borderRadius: 14, backgroundColor: '#1B2420' },
  posterWrap: { width:68,height:82,position:'relative',alignItems:'center',justifyContent:'center',overflow:'hidden',borderRadius:9 },
  poster: { width: 68, height: 82, borderRadius: 9 },
  play: { position:'absolute',width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',paddingLeft:2,borderWidth:1,borderColor:'rgba(255,255,255,.65)' },
  copy: { flex: 1, gap: 4 },
  title: { color: '#F4F0E8', fontSize: 14, fontWeight: '700' },
  energy: { fontSize: 12, fontWeight: '800' },
});
