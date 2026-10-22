import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { ShenThemeBoundary } from "@/components/ShenThemeBoundary";
import "./globals.css";
import "./intro.css";
import "./design-system.css";
import "./shen-coherence.css";
import "./responsive.css";

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
    <html lang="tr" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{var s=localStorage.getItem('ritim-kapisi-selected-shen');var v=localStorage.getItem('shibashi-visual-theme');if(['hun','yi','po','zhi','shen'].includes(s)||['ink-night','jade-garden','moon-water'].includes(v)){document.documentElement.classList.add('theme-booting');document.documentElement.style.setProperty('--boot-bg',({hun:'#172019',yi:'#202120',po:'#221d19',zhi:'#121c23',shen:'#211c15'})[s]||'#211c15')}}catch(e){}` }} /></head>
      <body className={`${inter.variable} ${manrope.variable}`}><ShenThemeBoundary>{children}</ShenThemeBoundary></body>
    </html>
  );
}
