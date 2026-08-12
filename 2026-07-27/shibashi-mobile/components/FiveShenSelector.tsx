import * as Haptics from 'expo-haptics';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {colors,fonts,radii} from '../constants/theme';
import {fiveShen} from '../data/fiveShen';
import {shenIcons} from '../data/shenIcons';
import {ShenId} from '../types';

export function FiveShenSelector({selected,onSelect}:{selected:ShenId;onSelect:(id:ShenId)=>void}){
 return <View style={s.row}>{fiveShen.map(shen=>{const active=shen.id===selected;return <Pressable accessibilityLabel={shen.dailyName} accessibilityHint={`Geleneksel adı ${shen.name} Shen`} accessibilityRole="button" accessibilityState={{selected:active}} key={shen.id} onPress={()=>{void Haptics.selectionAsync();onSelect(shen.id)}} style={[s.item,active&&{borderColor:shen.color,backgroundColor:`${shen.color}16`}]}><Image source={shenIcons[shen.id]} style={s.symbol}/><Text numberOfLines={1} style={[s.name,active&&{color:shen.color}]}>{shen.name}</Text></Pressable>})}</View>
}
const s=StyleSheet.create({row:{flexDirection:'row',gap:5,justifyContent:'space-between',padding:5,borderRadius:radii.lg,borderWidth:1,borderColor:colors.line,backgroundColor:'rgba(5,7,8,.72)'},item:{flex:1,minHeight:66,borderRadius:radii.md,borderWidth:1,borderColor:'transparent',alignItems:'center',justifyContent:'center',gap:4,paddingHorizontal:2},symbol:{borderRadius:15,height:30,width:30},name:{color:colors.muted,fontSize:14,fontFamily:fonts.displayStrong}});
