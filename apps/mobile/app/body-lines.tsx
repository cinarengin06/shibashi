import { Redirect, useLocalSearchParams, type Href } from 'expo-router';
export default function BodyLinesAlias() {
  const { movementOrder } = useLocalSearchParams<{ movementOrder?: string }>();
  return <Redirect href={{ pathname: '/(tabs)/moves', params: movementOrder ? { movementOrder } : {} } as unknown as Href} />;
}
