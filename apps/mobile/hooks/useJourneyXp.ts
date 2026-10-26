import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { journeyRewards } from '../../../packages/gamification';
import { loadCompletedMovements, loadMovementCompletionRecords, subscribeMovementCompletion } from '../services/movementCompletion';
import { loadFormSteps, subscribeFormSteps } from '../services/formSteps';
import { loadMovementPracticeRecords } from '../services/movementPractice';
import { loadShibashiPhotos, subscribeShibashiPhotos } from '../services/shibashiPhotos';
import { useApp } from '../store/AppStore';

export function useJourneyXp(userId?: string) {
  const [xp, setXp] = useState<number | null>(null);
  const { sessions, shenActivities } = useApp();

  useFocusEffect(useCallback(() => {
    let active = true;
    setXp(null);
    const refresh = async () => {
      const [completed, completionRecords, practiceRecords, formSteps, photos] = await Promise.all([
        loadCompletedMovements(userId), loadMovementCompletionRecords(userId), loadMovementPracticeRecords(userId), loadFormSteps(userId), loadShibashiPhotos(),
      ]);
      if (!active) return;
      const photoRecords = photos.map(photo => ({ order: photo.order, date: photo.savedAt }));
      const allPracticeRecords = [...practiceRecords, ...photoRecords];
      const sessionRecords = sessions.map(session => ({ order: Number(session.practiceId.match(/^movement-(\d+)$/)?.[1]), date: session.date }));
      const activityRecords = shenActivities.filter(activity => activity.type === 'practice' && activity.completed !== false).map(activity => ({ order: Number(activity.practiceId?.match(/^movement-(\d+)$/)?.[1]), date: activity.createdAt }));
      const completedOrders = new Set([
        ...completed,
        ...sessions.filter(session => session.postureScore >= 70).map(session => Number(session.practiceId.match(/^movement-(\d+)$/)?.[1])),
        ...activityRecords.map(record => record.order),
      ].filter(order => Number.isInteger(order) && order >= 1 && order <= 18));
      setXp(journeyRewards(completedOrders, [...completionRecords, ...allPracticeRecords, ...sessionRecords, ...activityRecords], formSteps, allPracticeRecords).xp);
    };
    void refresh();
    const unsubscribers = [subscribeMovementCompletion(refresh), subscribeFormSteps(refresh), subscribeShibashiPhotos(refresh)];
    return () => { active = false; unsubscribers.forEach(unsubscribe => unsubscribe()); };
  }, [userId, sessions, shenActivities]));

  return xp;
}
