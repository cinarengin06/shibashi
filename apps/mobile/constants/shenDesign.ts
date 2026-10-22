import type { ViewStyle } from "react-native";
import type { ShenId } from "../types";

export const shenMotifs: Record<ShenId, string> = {
  hun: "🌿",
  shen: "🔥",
  yi: "🌾",
  po: "🌬️",
  zhi: "💧",
};

export function shenShape(id: ShenId, kind: "button" | "card" = "card"): ViewStyle {
  const large = kind === "card";
  switch (id) {
    case "hun": return { borderTopLeftRadius: large ? 27 : 23, borderTopRightRadius: 9, borderBottomRightRadius: large ? 27 : 23, borderBottomLeftRadius: 9 };
    case "shen": return { borderRadius: large ? 30 : 999 };
    case "yi": return { borderRadius: large ? 10 : 7 };
    case "po": return { borderRadius: large ? 4 : 2 };
    case "zhi": return { borderTopLeftRadius: large ? 29 : 999, borderTopRightRadius: large ? 10 : 17, borderBottomRightRadius: large ? 29 : 999, borderBottomLeftRadius: large ? 10 : 17 };
  }
}
