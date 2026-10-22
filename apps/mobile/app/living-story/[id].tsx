import { Redirect, type Href } from "expo-router";

export default function LivingStoryAlias() {
  return <Redirect href={"/(tabs)/moves" as Href} />;
}
