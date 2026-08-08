import {Newsreader_400Regular,Newsreader_500Medium,Newsreader_600SemiBold,useFonts as useDisplayFonts} from '@expo-google-fonts/newsreader';
import {SourceSans3_400Regular,SourceSans3_500Medium,SourceSans3_600SemiBold,SourceSans3_700Bold,useFonts as useSansFonts} from '@expo-google-fonts/source-sans-3';
import {Manrope_600SemiBold,Manrope_700Bold,useFonts as useManropeFonts} from '@expo-google-fonts/manrope';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {colors} from '../constants/theme';
import {AppProvider} from '../store/AppStore';
import {ShenExperienceProvider} from '../store/ShenExperience';
export default function RootLayout(){
 const[displayLoaded]=useDisplayFonts({Newsreader_400Regular,Newsreader_500Medium,Newsreader_600SemiBold});
 const[sansLoaded]=useSansFonts({SourceSans3_400Regular,SourceSans3_500Medium,SourceSans3_600SemiBold,SourceSans3_700Bold});
 const[manropeLoaded]=useManropeFonts({Manrope_600SemiBold,Manrope_700Bold});
 if(!displayLoaded||!sansLoaded||!manropeLoaded)return null;
 return <SafeAreaProvider><AppProvider><ShenExperienceProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.ink},animation:'fade'}}/></ShenExperienceProvider></AppProvider></SafeAreaProvider>
}
