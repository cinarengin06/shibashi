import {Inter_400Regular} from '@expo-google-fonts/inter/400Regular';
import {Inter_500Medium} from '@expo-google-fonts/inter/500Medium';
import {Inter_600SemiBold} from '@expo-google-fonts/inter/600SemiBold';
import {Inter_700Bold} from '@expo-google-fonts/inter/700Bold';
import {useFonts} from '@expo-google-fonts/inter/useFonts';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {colors} from '../constants/theme';
import {AppProvider} from '../store/AppStore';
import {ShenExperienceProvider} from '../store/ShenExperience';
export default function RootLayout(){
 const[fontsLoaded]=useFonts({
  Inter_400Regular,Inter_500Medium,Inter_600SemiBold,Inter_700Bold,
  Newsreader_400Regular:Inter_400Regular,Newsreader_500Medium:Inter_500Medium,Newsreader_600SemiBold:Inter_600SemiBold,
  SourceSans3_400Regular:Inter_400Regular,SourceSans3_500Medium:Inter_500Medium,SourceSans3_600SemiBold:Inter_600SemiBold,SourceSans3_700Bold:Inter_700Bold,
  Manrope_600SemiBold:Inter_600SemiBold,Manrope_700Bold:Inter_700Bold,
 });
 if(!fontsLoaded)return null;
 return <SafeAreaProvider><AppProvider><ShenExperienceProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.ink},animation:'fade'}}/></ShenExperienceProvider></AppProvider></SafeAreaProvider>
}
