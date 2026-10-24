import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { GOOGLE_AUTH_UI_ENABLED } from '../constants/features';
import { useApp } from '../store/AppStore';

const splashImage = require('../assets/shibashi-splash-v2.png');

export default function Welcome() {
  const { profile } = useApp();
  const finished = useRef(false);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    router.replace(profile.onboardingDone ? '/(tabs)' : GOOGLE_AUTH_UI_ENABLED ? '/auth' : '/onboarding');
  }, [profile.onboardingDone]);

  useEffect(() => {
    const timer = setTimeout(finish, 3000);
    return () => clearTimeout(timer);
  }, [finish]);

  return <View style={styles.root}>
    <StatusBar hidden />
    <Image source={splashImage} resizeMode="contain" style={styles.image} accessibilityLabel="Shibashi Efe açılış görseli" />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020604' },
  image: { width: '100%', height: '100%' },
});
