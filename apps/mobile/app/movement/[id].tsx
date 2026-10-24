import { Redirect, useLocalSearchParams } from 'expo-router';
import { movements } from '../../data/content';

export default function MovementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = movements.find(item => item.id === id)?.order ?? 1;
  return <Redirect href={{ pathname: '/body-lines', params: { movementOrder: String(order) } }} />;
}
