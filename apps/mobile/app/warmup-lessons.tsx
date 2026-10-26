import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { shenThemes } from '../../../packages/design-tokens';
import { shenShape } from '../constants/shenDesign';
import { fonts } from '../constants/theme';
import { useApp } from '../store/AppStore';
import { shibashiPosters } from '../data/shibashiMedia';

const lessons = [
  { order: '01', title: 'Wuji: Temel Duruş', focus: 'Hizalanma', detail: 'Baş, omuz, pelvis, diz ve ayak tabanını zorlamadan aynı dikey bütünlükte buluştur.', breath: 'Burundan gelen doğal nefesi izle.', videoId: '9K2yhF0kh1g', posterOrder: 1 },
  { order: '02', title: 'Isınma: Eklemleri Aç', focus: 'Hareketlilik', detail: 'Kasları ısıt, eklem çevresini rahatlat ve ana forma nazikçe hazırlan.', breath: 'Açılırken nefes al, merkeze dönerken ver.', videoId: 'WmC0lMoFZnA', posterOrder: 4 },
  { order: '03', title: 'Pelvis, Kua ve Dan Tian', focus: 'Merkez', detail: 'Hareketi belden zorlamadan kalça kıvrımı ve alt karın merkezinden başlat.', breath: 'Merkez açılırken nefes al, yerleşirken ver.', videoId: 'eem4xQX8mfc', posterOrder: 7 },
] as const;

export default function WarmupLessons() {
  return <Redirect href="/body-lines?section=preparation" />;
}

export function WarmupLessonsContent() {
  const { profile } = useApp();
  const theme = shenThemes[profile.selectedShenId];
  const [playingId, setPlayingId] = useState<string | null>(null);
  const toggleLesson = (videoId: string) => setPlayingId(current => current === videoId ? null : videoId);
  return <View style={styles.embedded}>
      <Text style={[styles.eyebrow, { color: theme.button }]}>FORMDAN ÖNCE</Text>
      <Text style={[styles.title, { color: theme.light }]}>Temel Dersler</Text>
      <Text style={styles.lead}>Bedenini hazırlamak için kısa bir ders seç. Videoyu açıp kendi hızında izle.</Text>
      {lessons.map(lesson => <View key={lesson.order} style={[styles.card, { backgroundColor: theme.surfaceRaised, borderColor: `${theme.primary}55` }, shenShape(profile.selectedShenId)]}>
        {playingId === lesson.videoId ? <View style={styles.playerWrap}>
          <WebView
            key={lesson.videoId}
            source={{ uri: `https://shibashi.vercel.app/lesson-player.html?id=${lesson.videoId}` }}
            style={styles.player}
            allowsInlineMediaPlayback
            allowsFullscreenVideo
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={request => !/youtube\.com\/watch|youtu\.be\//.test(request.url)}
          />
        </View> : <Pressable accessibilityRole="button" accessibilityLabel={`${lesson.title} videosunu aç`} onPress={() => toggleLesson(lesson.videoId)} style={styles.posterWrap}>
          <ImageBackground source={shibashiPosters[lesson.posterOrder]} resizeMode="cover" style={styles.poster}>
            <View style={styles.posterShade}><View style={[styles.playCircle, { backgroundColor: theme.button }]}><Ionicons name="play" color={theme.buttonInk} size={24}/></View></View>
          </ImageBackground>
        </Pressable>}
        <View style={styles.cardTop}><View style={[styles.number, { backgroundColor: theme.button }]}><Text style={[styles.numberText, { color: theme.buttonInk }]}>{lesson.order}</Text></View><Text style={[styles.focus, { color: theme.button }]}>{lesson.focus.toLocaleUpperCase('tr-TR')}</Text></View>
        <Text style={[styles.cardTitle, { color: theme.light }]}>{lesson.title}</Text>
        <Text style={styles.body}>{lesson.detail}</Text>
        <View style={[styles.breath, { borderColor: `${theme.primary}55` }]}><Ionicons name="water-outline" color={theme.button} size={17}/><Text style={styles.breathText}>{lesson.breath}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${lesson.title} videosunu ${playingId === lesson.videoId ? 'kapat' : 'aç'}`} onPress={() => toggleLesson(lesson.videoId)} style={[styles.action, { backgroundColor: theme.button }, shenShape(profile.selectedShenId, 'button')]}><Ionicons name={playingId === lesson.videoId ? 'close' : 'play'} color={theme.buttonInk} size={19}/><Text style={[styles.actionText, { color: theme.buttonInk }]}>{playingId === lesson.videoId ? 'Dersi kapat' : 'Dersi izle'}</Text></Pressable>
      </View>)}
  </View>;
}

const styles = StyleSheet.create({
  embedded: { gap: 13, paddingBottom: 20 }, eyebrow: { fontFamily: fonts.sansStrong, fontSize: 11, letterSpacing: 1.6, marginTop: 10 }, title: { fontFamily: fonts.displayMedium, fontSize: 33, lineHeight: 39 }, lead: { color: '#A7ADA6', fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, marginBottom: 8 }, card: { borderWidth: 1, padding: 18, gap: 10 }, posterWrap: { height: 160, borderRadius: 13, overflow: 'hidden', backgroundColor: '#0A1714' }, playerWrap: { aspectRatio: 16 / 9, borderRadius: 13, overflow: 'hidden', backgroundColor: '#050908' }, player: { flex: 1, backgroundColor: '#050908' }, poster: { flex: 1 }, posterShade: { flex: 1, backgroundColor: 'rgba(1,8,7,.22)', alignItems: 'center', justifyContent: 'center' }, playCircle: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, number: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, numberText: { fontFamily: fonts.sansStrong, fontSize: 12 }, focus: { fontFamily: fonts.sansStrong, fontSize: 11, letterSpacing: 1.2 }, cardTitle: { fontFamily: fonts.displayMedium, fontSize: 23 }, body: { color: '#D4D8D0', fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 }, breath: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 }, breathText: { color: '#A7ADA6', fontFamily: fonts.sans, fontSize: 13, flex: 1 }, action: { minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 5 }, actionText: { fontFamily: fonts.sansStrong, fontSize: 15 },
});
