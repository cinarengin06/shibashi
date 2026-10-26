import { Redirect, type Href } from 'expo-router';

export default function JourneyRedirect() {
  return <Redirect href={'/(tabs)/main-map?section=gates' as Href} />;
}
