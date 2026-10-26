import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { shenThemes } from '../../../packages/design-tokens';
import { milestoneDefinitions, personalMilestones } from '../../../packages/gamification';
import { loadShibashiPhotos, subscribeShibashiPhotos, type ShibashiPhoto } from '../services/shibashiPhotos';
import { loadCompletedMovements, loadMovementCompletionRecords, subscribeMovementCompletion } from '../services/movementCompletion';
import { unlockMilestones } from '../services/milestones';
import { useApp } from '../store/AppStore';

export function MilestoneCelebration() {
  const { profile, postureReports } = useApp();
  const pathname = usePathname();
  const [photos, setPhotos] = useState<ShibashiPhoto[]>([]);
  const [completedOrders,setCompletedOrders] = useState<number[]>([]);
  const [completionRecords,setCompletionRecords] = useState<{order:number;date:string}[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const theme = shenThemes[profile.selectedShenId];
  useEffect(() => {
    let active = true;
    const refresh = () => { void loadShibashiPhotos().then(items => { if (active) setPhotos(items); }); void loadCompletedMovements(profile.authUserId).then(items=>{if(active)setCompletedOrders(items)}); void loadMovementCompletionRecords(profile.authUserId).then(items=>{if(active)setCompletionRecords(items)}); };
    refresh();
    const unsubscribe = subscribeShibashiPhotos(refresh);
    const unsubscribeCompletion=subscribeMovementCompletion(refresh);
    return () => { active = false; unsubscribe(); unsubscribeCompletion(); };
  }, [pathname,profile.authUserId]);
  const earnedIds = personalMilestones([...photos.map(item => ({ order:item.order, date:item.savedAt })),...completedOrders.map(order=>({order,date:completionRecords.find(item=>item.order===order)?.date??''}))], postureReports.length).filter(item => item.earned).map(item => item.id).join(',');
  useEffect(() => {
    if (!profile.onboardingDone || !earnedIds) return;
    let active = true;
    void unlockMilestones(earnedIds.split(','), profile.authUserId).then(items => { if (active && items.length) setPending(current => [...current,...items.map(item => item.id)]); });
    return () => { active = false; };
  }, [earnedIds, profile.authUserId, profile.onboardingDone]);
  const current = milestoneDefinitions.find(item => item.id === pending[0]);
  const close = () => setPending(items => items.slice(1));
  return <Modal visible={Boolean(current) && pathname !== '/body-lines'} transparent animationType="fade" onRequestClose={close}><View style={s.backdrop}><View style={[s.dialog,{backgroundColor:theme.surface,borderColor:theme.button}]}><Text style={[s.eyebrow,{color:theme.button}]}>YENİ ROZET KAZANDIN</Text><View style={[s.icon,{backgroundColor:theme.button}]}><Text style={s.iconText}>{current?.icon}</Text></View><Text style={s.title}>{current?.title}</Text><Text style={s.message}>{current?.message}</Text><Pressable accessibilityRole="button" onPress={close} style={[s.button,{backgroundColor:theme.button}]}><Text style={[s.buttonText,{color:theme.buttonInk}]}>Devam et</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { close(); router.push('/(tabs)/journal'); }} style={s.journalButton}><Text style={[s.journalText,{color:theme.button}]}>İstatistiklerimde gör →</Text></Pressable></View></View></Modal>;
}

const s = StyleSheet.create({
  backdrop:{flex:1,backgroundColor:'rgba(2,9,7,.88)',alignItems:'center',justifyContent:'center',padding:22},
  dialog:{width:'100%',maxWidth:410,borderWidth:1,borderRadius:24,padding:26,alignItems:'center'},
  eyebrow:{fontSize:11,fontWeight:'800',letterSpacing:2},
  icon:{width:106,height:106,borderRadius:53,alignItems:'center',justifyContent:'center',marginVertical:22},
  iconText:{fontSize:47,color:'#132018'},
  title:{color:'#F6F3EC',fontSize:29,fontWeight:'700',textAlign:'center'},
  message:{color:'#D6D4C9',fontSize:16,lineHeight:24,textAlign:'center',marginTop:12,marginBottom:23},
  button:{width:'100%',borderRadius:12,minHeight:48,alignItems:'center',justifyContent:'center'},
  buttonText:{fontSize:15,fontWeight:'800'},
  journalButton:{minHeight:45,justifyContent:'center'},
  journalText:{fontSize:14,fontWeight:'700'},
});
