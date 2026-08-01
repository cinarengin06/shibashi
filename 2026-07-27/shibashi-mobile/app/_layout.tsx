import {CormorantGaramond_400Regular,CormorantGaramond_500Medium,CormorantGaramond_600SemiBold,useFonts as useDisplayFonts} from '@expo-google-fonts/cormorant-garamond';
import {Inter_400Regular,Inter_500Medium,Inter_600SemiBold,Inter_700Bold,useFonts as useInterFonts} from '@expo-google-fonts/inter';
import {Manrope_500Medium,Manrope_600SemiBold,Manrope_700Bold,useFonts as useManropeFonts} from '@expo-google-fonts/manrope';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {colors} from '../constants/theme';
import {AppProvider} from '../store/AppStore';
import {ShenExperienceProvider} from '../store/ShenExperience';
export default function RootLayout(){
 const[displayLoaded]=useDisplayFonts({CormorantGaramond_400Regular,CormorantGaramond_500Medium,CormorantGaramond_600SemiBold});
 const[interLoaded]=useInterFonts({Inter_400Regular,Inter_500Medium,Inter_600SemiBold,Inter_700Bold});
 const[manropeLoaded]=useManropeFonts({Manrope_500Medium,Manrope_600SemiBold,Manrope_700Bold});
 if(!displayLoaded||!interLoaded||!manropeLoaded)return null;
 return <SafeAreaProvider><AppProvider><ShenExperienceProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.ink},animation:'fade'}}/></ShenExperienceProvider></AppProvider></SafeAreaProvider>
}
