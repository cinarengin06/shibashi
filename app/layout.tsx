import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter, Manrope } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-metric",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shibashi EFE — 5 Shen İçsel Yolculuk",
  description: "Nefes, hareket ve farkındalıkla beş Shen'in dengeli yolculuğu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#101813",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${display.variable} ${inter.variable} ${manrope.variable}`}>{children}</body>
    </html>
  );
}
