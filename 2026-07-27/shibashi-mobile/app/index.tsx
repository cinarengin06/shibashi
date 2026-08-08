import {Redirect} from 'expo-router';
import {ActivityIndicator,StyleSheet,View} from 'react-native';
import {colors} from '../constants/theme';
import {useApp} from '../store/AppStore';

export default function Index(){
 const{ready}=useApp();
 if(!ready)return <View style={s.loading}><ActivityIndicator color={colors.gold}/></View>;
 return <Redirect href="/welcome"/>;
}

const s=StyleSheet.create({
 loading:{flex:1,backgroundColor:colors.ink,alignItems:'center',justifyContent:'center'},
});
