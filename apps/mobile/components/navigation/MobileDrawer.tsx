import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getShenVisualTheme, shenThemes } from '../../../../packages/design-tokens';
import { fonts, mobileThemeFont } from '../../constants/theme';
import { shenShape } from '../../constants/shenDesign';
import { shenBackgrounds } from '../../data/shenAssets';
import { shenIcons } from '../../data/shenIcons';
import { shibashiPosters } from '../../data/shibashiMedia';
import { useApp } from '../../store/AppStore';
import { useShenExperience } from '../../store/ShenExperience';
import { loadNotificationInbox, unreadNotificationCount } from '../../services/notifications/NotificationInbox';

const menuItems = [
  { label: 'Odam', tab: 'index', icon: 'home-outline', detail: 'Bugünkü yolculuğun' },
  { label: 'Gelişim Haritam', tab: 'main-map', icon: 'trending-up-outline', detail: 'Formlarında ilerle' },
  { label: 'Temel Dersler', tab: 'lessons', icon: 'play-circle-outline', detail: 'Bedenini hazırla' },
  { label: '18 Form', tab: 'moves', icon: 'fitness-outline', detail: 'Hocayla hareket et' },
  { label: 'Pratikler', tab: 'practice', icon: 'walk-outline', detail: 'Sana uygun rutinler' },
  { label: 'Postür', tab: 'posture', icon: 'body-outline', detail: 'Beden çizgini gör' },
  { label: '8 Kapı', tab: 'journey', icon: 'map-outline', detail: 'Sekiz kapıyı keşfet' },
  { label: 'İstatistiklerim', tab: 'journal', icon: 'book-outline', detail: 'Fotoğraf ve notların' },
  { label: 'Ayarlar', tab: 'profile', icon: 'settings-outline', detail: 'Tercihlerin' },
] as const;

export function MobileMenuHeader({ onOpen }: { onOpen: () => void }) {
  const { shen, soundEnabled, toggleSound } = useShenExperience();
  const theme = shenThemes[shen.id];
  const { profile } = useApp();
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const [unread, setUnread] = useState(0);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    let active = true;
    void loadNotificationInbox().then(items => { if (active) setUnread(unreadNotificationCount(items)); });
    return () => { active = false; };
  }, []);
  return <View style={[styles.topSafe, { paddingTop: insets.top, backgroundColor: visual.navigation, borderColor: visual.border }]}>
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Menüyü aç" onPress={onOpen} style={[styles.topButton, { borderColor: `${theme.button}88`, backgroundColor: visual.surfaceRaised }]}><Ionicons name="menu" size={26} color={theme.button} /></Pressable>
      <View style={styles.brand}><Image source={shenIcons[shen.id]} style={styles.brandIcon} /><Text style={[styles.brandTitle, { color: visual.glow, fontFamily: mobileThemeFont(visual.id) }]}>SHIBASHI EFE</Text></View>
      <View style={styles.topActions}><Pressable accessibilityRole="button" accessibilityLabel={soundEnabled?'Müziği kapat':'Müziği aç'} onPress={toggleSound} style={styles.topButton}><Ionicons name={soundEnabled?'musical-notes':'musical-notes-outline'} size={22} color={theme.button}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Bildirimler" onPress={() => router.push('/notifications')} style={styles.topButton}><Ionicons name="notifications-outline" size={24} color={theme.button} />{unread > 0 && <View style={styles.unreadDot}/>}</Pressable></View>
    </View>
  </View>;
}

export function MobileDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { profile } = useApp();
  const { shen, soundEnabled, toggleSound } = useShenExperience();
  const theme = shenThemes[shen.id];
  const visual = getShenVisualTheme(profile.selectedShenId, profile.visualThemeId);
  const light = visual.id === 'morning-light' || visual.id === 'terra-day';
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(354, width * .86);
  const slide = useRef(new Animated.Value(-drawerWidth)).current;
  useEffect(() => {
    if (!visible) return;
    slide.setValue(-drawerWidth);
    Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, [visible, drawerWidth, slide]);
  const go = (tab: string) => {
    onClose();
    router.navigate((tab === 'index' ? '/(tabs)' : `/(tabs)/${tab}`) as Href);
  };
  const rowImages = [shenBackgrounds[shen.id], shenBackgrounds.hun, shibashiPosters[1], shibashiPosters[2], shenBackgrounds.shen, shenBackgrounds.po, require('../../assets/journey/neijing-map.jpg'), shenBackgrounds.yi, shenBackgrounds.zhi];
  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.modal}>
      <Pressable accessibilityLabel="Menüyü kapat" onPress={onClose} style={styles.dismiss} />
      <Animated.View style={[styles.drawer, { width: drawerWidth, backgroundColor: visual.background, borderColor: visual.border, transform: [{ translateX: slide }] }]}>
        <SafeAreaView style={styles.drawerSafe} edges={['top', 'bottom']}>
          <ImageBackground source={shenBackgrounds[shen.id]} style={styles.drawerHero} resizeMode="cover">
            <LinearGradient colors={['rgba(3,9,8,.48)', theme.surface]} style={styles.drawerHeroShade}>
              <View style={styles.drawerHeader}><Image source={shenIcons[shen.id]} style={styles.drawerLogo} /><Pressable accessibilityLabel="Menüyü kapat" onPress={onClose} style={styles.close}><Ionicons name="close" size={23} color={theme.button}/></Pressable></View>
              <Text style={[styles.drawerBrand, { color: visual.glow, fontFamily: mobileThemeFont(visual.id) }]}>SHIBASHI EFE</Text>
              <Text style={styles.drawerTagline}>Beden · Enerji · Zihin · Denge</Text>
            </LinearGradient>
          </ImageBackground>
          <ScrollView contentContainerStyle={styles.drawerContent} showsVerticalScrollIndicator={false}>
            <Pressable accessibilityRole="button" onPress={() => go('profile')} style={[styles.profileCard, { borderColor: visual.border, backgroundColor: visual.surface }]}><Image source={shenIcons[shen.id]} style={styles.profileImage}/><View style={styles.profileCopy}><Text style={[styles.profileName,{color:visual.text,fontFamily:mobileThemeFont(visual.id)}]}>{profile.name || 'Shibashi Yolcusu'}</Text><Text style={[styles.profileDetail,{color:visual.textSecondary}]}>{shen.name} Shen · Profilim</Text></View><Ionicons name="chevron-forward" size={19} color={visual.glow}/></Pressable>
            {menuItems.map((item, index) => <Pressable key={item.tab} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => go(item.tab)} style={[styles.menuCard, { borderColor: visual.border, backgroundColor: visual.surface }, (pathname === (item.tab === 'index' ? '/' : `/${item.tab}`) || pathname === `/(tabs)/${item.tab}`) && { borderColor: theme.button }]}>
              <ImageBackground source={rowImages[index]} style={styles.rowImage} imageStyle={[styles.rowPhoto,light&&{opacity:.22}]}><LinearGradient colors={light?['rgba(255,252,245,.97)','rgba(255,252,245,.84)','rgba(255,252,245,.55)']:['rgba(4,9,8,.96)', 'rgba(4,9,8,.65)', 'rgba(4,9,8,.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rowShade}><Ionicons name={item.icon} size={23} color={visual.glow}/><View style={styles.rowCopy}><Text style={[styles.rowTitle,{color:visual.text,fontFamily:mobileThemeFont(visual.id)}]}>{item.label}</Text><Text style={[styles.rowDetail,{color:visual.textSecondary}]}>{item.detail}</Text></View><Ionicons name="chevron-forward" size={17} color={visual.glow}/></LinearGradient></ImageBackground>
            </Pressable>)}
            <Pressable accessibilityRole="button" onPress={toggleSound} style={[styles.soundCard, { borderColor: visual.border }]}><Ionicons name={soundEnabled ? 'musical-notes' : 'musical-notes-outline'} size={20} color={theme.button}/><Text style={[styles.soundText,{color:visual.text}]}>Shen müziği {soundEnabled ? 'açık' : 'kapalı'}</Text><Ionicons name={soundEnabled ? 'toggle' : 'toggle-outline'} size={25} color={theme.button}/></Pressable>
            <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push('/notifications'); }} style={styles.extraLink}><Ionicons name="notifications-outline" size={19} color={theme.button}/><Text style={[styles.extraText,{color:visual.text}]}>Bildirimler</Text></Pressable>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  topSafe: { borderBottomWidth: StyleSheet.hairlineWidth },
  topBar: { height: 55, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  topButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent', borderRadius: 18 },
  brand: { alignItems: 'center', gap: 1 },
  brandIcon: { width: 21, height: 21, borderRadius: 11 },
  brandTitle: { fontFamily: fonts.sansStrong, fontSize: 11, letterSpacing: 2.2 },
  unreadDot: { position: 'absolute', top: 5, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E96B4C' },
  modal: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,.7)' },
  dismiss: { ...StyleSheet.absoluteFill },
  drawer: { height: '100%', borderRightWidth: 1, elevation: 16 },
  drawerSafe: { flex: 1 },
  drawerHero: { height: 135 },
  drawerHeroShade: { flex: 1, paddingHorizontal: 20, paddingTop: 9, justifyContent: 'flex-end', paddingBottom: 12 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  drawerLogo: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, borderColor: '#D9B567' },
  close: { width: 37, height: 37, alignItems: 'center', justifyContent: 'center' },
  drawerBrand: { fontFamily: fonts.displayMedium, fontSize: 20, letterSpacing: 3.1 },
  drawerTagline: { color: '#D4C9B2', fontFamily: fonts.sans, fontSize: 10, letterSpacing: 1.1, marginTop: 3 },
  drawerContent: { gap: 8, padding: 14, paddingBottom: 26 },
  profileCard: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 14, backgroundColor: 'rgba(23,29,26,.92)', paddingHorizontal: 12, marginBottom: 2 },
  profileImage: { width: 44, height: 44, borderRadius: 22 },
  profileCopy: { flex: 1 },
  profileName: { color: '#F4F0E8', fontFamily: fonts.sansStrong, fontSize: 14 },
  profileDetail: { color: '#B8BBB3', fontFamily: fonts.sans, fontSize: 11, marginTop: 3 },
  menuCard: { height: 60, borderWidth: 1, borderRadius: 13, overflow: 'hidden', backgroundColor: '#111915' },
  rowImage: { flex: 1 },
  rowPhoto: { opacity: .72 },
  rowShade: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 11 },
  rowCopy: { flex: 1 },
  rowTitle: { color: '#F6F2EB', fontFamily: fonts.sansStrong, fontSize: 14 },
  rowDetail: { color: '#CCD0C7', fontFamily: fonts.sans, fontSize: 10, marginTop: 2 },
  soundCard: { height: 46, borderWidth: 1, borderRadius: 12, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  soundText: { flex: 1, color: '#E4E1D8', fontFamily: fonts.sansMedium, fontSize: 12 },
  extraLink: { minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11 },
  extraText: { color: '#D9D8D0', fontFamily: fonts.sansMedium, fontSize: 12 },
});
