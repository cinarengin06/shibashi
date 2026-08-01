import {Ionicons} from '@expo/vector-icons';
import {Tabs} from 'expo-router';
import {colors,fonts} from '../../constants/theme';
import {useShenExperience} from '../../store/ShenExperience';

const icons:Record<string,keyof typeof Ionicons.glyphMap>={index:'sunny-outline',journey:'compass-outline',practice:'play-circle',pratik2:'analytics-outline',journal:'book-outline',profile:'person-outline'};

export default function TabLayout(){
 const{shen}=useShenExperience();
 return <Tabs screenOptions={({route})=>({
  headerShown:false,
  tabBarActiveTintColor:shen.color,
  tabBarInactiveTintColor:colors.muted,
  tabBarStyle:{position:'absolute',height:78,paddingTop:8,paddingBottom:12,backgroundColor:colors.deep,borderTopColor:colors.line,borderTopWidth:1},
  tabBarLabelStyle:{fontSize:10,fontFamily:fonts.sansStrong},
  tabBarIcon:({color,size})=><Ionicons name={icons[route.name]} size={size} color={color}/>,
 })}>
  <Tabs.Screen name="index" options={{title:'Bugün'}}/>
  <Tabs.Screen name="journey" options={{title:'Yolculuk'}}/>
  <Tabs.Screen name="practice" options={{title:'Pratik'}}/>
  <Tabs.Screen name="pratik2" options={{title:'Pratik2'}}/>
  <Tabs.Screen name="journal" options={{title:'Günlük'}}/>
  <Tabs.Screen name="profile" options={{title:'Profil'}}/>
 </Tabs>
}
