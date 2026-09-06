import type { Metadata } from "next";
import { WebHeader } from "@/components/web/WebHeader";
import { BodyLinesScreen } from "@/features/body-lines/components/BodyLinesScreen";

export const metadata: Metadata = {
  title: "Beden Hatları · Shibashi EFE",
  description: "Shibashi'nin 18 hareketini anatomi, beden hatları ve derin bağlantılarıyla keşfet.",
};

export default function BodyLinesPage() {
  return <><WebHeader active="bodyLines" /><BodyLinesScreen /></>;
}
