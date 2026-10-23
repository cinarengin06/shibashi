import type { Metadata } from "next";
import { WebHeader } from "@/components/web/WebHeader";
import { MainMapScreen } from "@/features/main-map/components/MainMapScreen";

export const metadata: Metadata = {
  title: "Gelişim Haritam · Shibashi EFE",
  description: "18 hareketlik Shibashi serindeki ve sekiz sembolik Kapıdaki pratik ilerlemeni gör.",
};

export default function MainMapPage() {
  return <><WebHeader active="mainMap" /><MainMapScreen /></>;
}
