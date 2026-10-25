import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin", "latin-ext"] });
const serif = Playfair_Display({ variable: "--font-serif", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = { title: "Kokoro Studio — Local text to speech", description: "A private, local studio for creating natural speech with Kokoro." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
