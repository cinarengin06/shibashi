import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import "./intro.css";
import "./design-system.css";

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
  themeColor: "#0B0E12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${manrope.variable}`}>{children}</body>
    </html>
  );
}
