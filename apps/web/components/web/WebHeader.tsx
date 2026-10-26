"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fiveShen, type ShenId } from "@/features/home/data/shen";
import { ShibashiBrandMark } from "./ShibashiBrandMark";
import { WebNotificationBell } from "./WebNotificationBell";
import { WebXpBadge } from "./WebXpBadge";
import styles from "./web-header.module.css";

type WebHeaderTab = "home" | "mainMap" | "lessons" | "practice" | "posture" | "journey" | "bodyLines" | "journal" | "profile";

const navigation: Array<{ id: WebHeaderTab; label: string; href: string }> = [
  { id: "home", label: "Odam", href: "/" },
  { id: "mainMap", label: "Gelişim Haritam", href: "/ana-haritam" },
  { id: "lessons", label: "Temel Dersler", href: "/?tab=lessons" },
  { id: "bodyLines", label: "18 Form", href: "/beden-hatlari" },
  { id: "posture", label: "Postür", href: "/?tab=posture" },
  { id: "journey", label: "8 Kapı", href: "/?tab=journey" },
  { id: "journal", label: "İstatistiklerim", href: "/?tab=journal" },
  { id: "profile", label: "Ayarlar", href: "/?tab=profile" },
];

export function WebHeader({ active }: { active: WebHeaderTab }) {
  const [userName, setUserName] = useState("Çınar");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const refresh = () => {
      setUserName(window.localStorage.getItem("ritim-kapisi-user-name") || "Çınar");
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      if (audioRef.current && !audioRef.current.paused) window.sessionStorage.setItem("shibashi-session-music", "off");
      audioRef.current?.pause();
    };
  }, []);

  async function toggleMusic() {
    if (musicPlaying) {
      audioRef.current?.pause();
      window.sessionStorage.setItem("shibashi-session-music", "off");
      setMusicPlaying(false);
      return;
    }
    const selectedId = window.localStorage.getItem("ritim-kapisi-selected-shen") as ShenId | null;
    const music = (fiveShen.find((shen) => shen.id === selectedId) ?? fiveShen[1]).music;
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.loop = true;
    audio.volume = 0.46;
    if (!audio.src.endsWith(music)) audio.src = music;
    try {
      await audio.play();
      window.sessionStorage.setItem("shibashi-session-music", "on");
      setMusicPlaying(true);
    } catch {
      setMusicPlaying(false);
    }
  }

  return (
    <header className={styles.header}>
      <Link aria-label="Shibashi EFE ana sayfa" className={styles.brand} href="/">
        <ShibashiBrandMark />
        <span>SHIBASHI EFE</span>
      </Link>
      <nav aria-label="Ana gezinme">
        {navigation.map((item) => (
          <Link aria-current={active === item.id ? "page" : undefined} className={active === item.id ? styles.active : undefined} href={item.href} key={item.id}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div aria-label="Kullanıcı özeti" className={styles.account}>
        <button aria-label={`Müziği ${musicPlaying ? "kapat" : "aç"}`} aria-pressed={musicPlaying} className={`${styles.iconButton} ${musicPlaying ? styles.playing : ""}`} onClick={toggleMusic} title={`Shen müziği ${musicPlaying ? "açık" : "kapalı"}`} type="button"><span aria-hidden="true">{musicPlaying ? "♪" : "♪̸"}</span></button>
        <WebXpBadge />
        <WebNotificationBell />
        <Link className={styles.profile} href="/?tab=profile"><i>{userName.slice(0, 1).toLocaleUpperCase("tr-TR")}</i><span>{userName}</span><b>⌄</b></Link>
      </div>
    </header>
  );
}
