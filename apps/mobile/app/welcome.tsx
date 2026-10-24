import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { GOOGLE_AUTH_UI_ENABLED } from '../constants/features';
import { useApp } from '../store/AppStore';

const splashImage = require('../assets/shibashi-splash-v2.png');

export default function Welcome() {
  const { profile } = useApp();
  const finished = useRef(false);
  const [visible, setVisible] = useState(false);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    router.replace(profile.onboardingDone ? '/(tabs)' : GOOGLE_AUTH_UI_ENABLED ? '/auth' : '/onboarding');
  }, [profile.onboardingDone]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(finish, 3000);
    return () => clearTimeout(timer);
  }, [finish, visible]);

  return <View style={styles.root}>
    <StatusBar hidden />
    <Image source={splashImage} resizeMode="cover" style={styles.image} accessibilityLabel="Shibashi Efe açılış görseli" onLoadEnd={() => { setVisible(true); void SplashScreen.hideAsync(); }} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020604' },
  image: { width: '100%', height: '100%' },
});
