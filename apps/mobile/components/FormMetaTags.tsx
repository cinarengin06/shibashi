import { StyleSheet, Text, View } from 'react-native';
import { formCatalog } from '../../../packages/form-catalog';

export function FormMetaTags({ order, compact = false }: { order: number; compact?: boolean }) {
  const form = formCatalog.find(item => item.order === order);
  if (!form) return null;
  return <View style={styles.tags} accessibilityLabel={`${form.energy}; kapılar: ${form.gateNames.join(', ') || 'yok'}; organlar: ${form.organs.join(', ') || 'yok'}`}>
    <Text style={[styles.tag, compact && styles.compact, form.energy === 'Yin' ? styles.yin : styles.yang]}>{form.energy}</Text>
    {form.gateNames.length ? <Text numberOfLines={1} style={[styles.tag, compact && styles.compact]}>Kapı · {form.gateNames[0]}{form.gateNames.length > 1 ? ` +${form.gateNames.length - 1}` : ''}</Text> : null}
    {form.organs.length ? <Text numberOfLines={1} style={[styles.tag, compact && styles.compact]}>Organ · {form.organs[0]}{form.organs.length > 1 ? ` +${form.organs.length - 1}` : ''}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { backgroundColor: 'rgba(183,202,177,.14)', borderColor: 'rgba(207,221,196,.26)', borderRadius: 99, borderWidth: 1, color: '#D6DED3', fontSize: 10, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  compact: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 4 },
  yin: { backgroundColor: 'rgba(106,187,216,.18)', borderColor: 'rgba(142,214,235,.48)', color: '#B5E5F1' },
  yang: { backgroundColor: 'rgba(230,176,95,.18)', borderColor: 'rgba(248,207,138,.48)', color: '#F6D7A2' },
});
