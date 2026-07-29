import {CormorantGaramond_400Regular,CormorantGaramond_500Medium,CormorantGaramond_600SemiBold,useFonts as useCormorantFonts} from '@expo-google-fonts/cormorant-garamond';
import {Inter_400Regular,Inter_500Medium,Inter_600SemiBold,Inter_700Bold,useFonts as useInterFonts} from '@expo-google-fonts/inter';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {colors} from '../constants/theme';
import {AppProvider} from '../store/AppStore';
import {ShenExperienceProvider} from '../store/ShenExperience';
export default function RootLayout(){
 const[cormorantLoaded]=useCormorantFonts({CormorantGaramond_400Regular,CormorantGaramond_500Medium,CormorantGaramond_600SemiBold});
 const[interLoaded]=useInterFonts({Inter_400Regular,Inter_500Medium,Inter_600SemiBold,Inter_700Bold});
 if(!cormorantLoaded||!interLoaded)return null;
 return <SafeAreaProvider><AppProvider><ShenExperienceProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.ink},animation:'fade'}}/></ShenExperienceProvider></AppProvider></SafeAreaProvider>
}
