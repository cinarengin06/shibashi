import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { meridianMovements } from '../../../packages/meridian-knowledge';
import { recommendFormsForPosture, type PostureRegionScores } from '../../../packages/posture-form-recommendations';
import { getShenVisualTheme } from '../../../packages/design-tokens';
import { shibashiPosters } from '../data/shibashiMedia';
import { useApp } from '../store/AppStore';

export function PostureFormSuggestions({ captures, accent }: { captures: PostureRegionScores[]; accent: string }) {
  const { profile } = useApp();
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const recommendations = recommendFormsForPosture(captures);
  if (!recommendations.length) return null;
  return <View style={styles.section}>
    <Text style={[styles.heading, { color: visual.text }]}>Postürün İçin Önerilen Formlar</Text>
    <Text style={[styles.intro, { color: visual.textSecondary }]}>Ölçümünde öne çıkan beden hatları için hareket önerileri.</Text>
    {recommendations.map(item => {
      const movement = meridianMovements.find(candidate => candidate.order === item.order);
      if (!movement) return null;
      return <Pressable key={item.order} accessibilityRole="button" accessibilityLabel={`${movement.sourceTitle} videosunu aç`} onPress={() => router.push({ pathname: '/body-lines', params: { movementOrder: item.order } })} style={[styles.card, { borderColor: `${accent}66`, backgroundColor: visual.surface }]}>
        <Image source={shibashiPosters[item.order]} style={styles.poster} />
        <View style={styles.copy}><Text style={[styles.focus, { color: accent }]}>{item.focus} · FORM {String(item.order).padStart(2, '0')}</Text><Text style={[styles.title, { color: visual.text }]}>{movement.sourceTitle}</Text><Text style={[styles.reason, { color: visual.textSecondary }]}>{item.reason}</Text><Text style={[styles.link, { color: accent }]}>Videoyu 18 Form’da aç →</Text></View>
        <Ionicons name="play-circle-outline" size={25} color={accent} />
      </Pressable>;
    })}
    <Text style={[styles.note, { color: visual.textSecondary }]}>Hareket önerileri, kamera ölçümündeki hizalama skorlarına dayanır; tıbbi değerlendirme değildir.</Text>
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 10, marginTop: 16 },
  heading: { color: '#F4F0E8', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  intro: { color: '#B8BBB3', fontSize: 13, lineHeight: 19 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderWidth: 1, borderRadius: 14, backgroundColor: '#1B2420' },
  poster: { width: 68, height: 82, borderRadius: 9 },
  copy: { flex: 1, gap: 4 },
  focus: { fontSize: 11, fontWeight: '800' },
  title: { color: '#F4F0E8', fontSize: 14, fontWeight: '700' },
  reason: { color: '#C7CBC3', fontSize: 11, lineHeight: 16 },
  link: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  note: { color: '#AAB5AD', fontSize: 11, lineHeight: 16 },
});
