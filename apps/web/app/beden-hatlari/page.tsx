import type { Metadata } from "next";
import { WebHeader } from "@/components/web/WebHeader";
import { BodyLinesScreen } from "@/features/body-lines/components/BodyLinesScreen";

export const metadata: Metadata = {
  title: "Yaşayarak Öğren · Shibashi EFE",
  description: "18 Shibashi hareketini hoca animasyonu, kamera pratiği ve klasik kanal okumasıyla deneyimle.",
};

export default function BodyLinesPage() {
  return <><WebHeader active="bodyLines" /><BodyLinesScreen /></>;
}
