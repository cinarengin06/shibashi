import type { ImageSourcePropType } from "react-native";
import type { ShenId } from "../types";

export const shenIcons: Record<ShenId, ImageSourcePropType> = {
  hun: require("../assets/five-shen-icons/hun.png"),
  shen: require("../assets/five-shen-icons/shen.png"),
  yi: require("../assets/five-shen-icons/yi.png"),
  po: require("../assets/five-shen-icons/po.png"),
  zhi: require("../assets/five-shen-icons/zhi.png"),
};
