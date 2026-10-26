import { Redirect, useLocalSearchParams, type Href } from 'expo-router';
export default function BodyLinesAlias() {
  const { movementOrder, energy, status, organ, gate } = useLocalSearchParams<{ movementOrder?: string; energy?: string; status?: string; organ?: string; gate?: string }>();
  return <Redirect href={{ pathname: '/(tabs)/moves', params: { ...(movementOrder?{movementOrder}:{}), ...(energy?{energy}:{}), ...(status?{status}:{}), ...(organ?{organ}:{}), ...(gate?{gate}:{}) } } as unknown as Href} />;
}
