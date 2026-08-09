import {Ionicons} from '@expo/vector-icons';
import {Tabs} from 'expo-router';
import {colors,fonts} from '../../constants/theme';
import {useShenExperience} from '../../store/ShenExperience';
import {useApp} from '../../store/AppStore';
import {visualThemes} from '../../../../packages/design-tokens';

const icons:Record<string,keyof typeof Ionicons.glyphMap>={index:'sunny-outline',journey:'compass-outline',practice:'play-circle',pratik2:'analytics-outline',journal:'book-outline',profile:'person-outline'};

export default function TabLayout(){
 const{shen}=useShenExperience();
 const{profile}=useApp();
 const visual=visualThemes[profile.visualThemeId??'ink-night'];
 return <Tabs screenOptions={({route})=>({
  headerShown:false,
  tabBarActiveTintColor:shen.color,
  tabBarInactiveTintColor:visual.textSecondary,
  tabBarStyle:{position:'absolute',height:84,paddingTop:8,paddingBottom:12,backgroundColor:visual.navigation,borderTopColor:visual.border,borderTopWidth:1},
  tabBarItemStyle:{minHeight:56},
  tabBarLabelStyle:{fontSize:13,fontFamily:fonts.sansStrong},
  tabBarIcon:({color})=><Ionicons name={icons[route.name]} size={24} color={color}/>,
 })}>
  <Tabs.Screen name="index" options={{title:'Bugün'}}/>
  <Tabs.Screen name="journey" options={{title:'Yolculuk'}}/>
  <Tabs.Screen name="practice" options={{title:'Pratik'}}/>
  <Tabs.Screen name="pratik2" options={{title:'Pratik2'}}/>
  <Tabs.Screen name="journal" options={{title:'Günlük'}}/>
  <Tabs.Screen name="profile" options={{title:'Profil'}}/>
 </Tabs>
}
