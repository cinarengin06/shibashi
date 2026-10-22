import { Redirect, type Href } from "expo-router";

export default function LivingLearningAlias() {
  return <Redirect href={"/(tabs)/moves" as Href} />;
}
