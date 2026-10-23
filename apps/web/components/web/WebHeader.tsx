"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fiveShen, type ShenId } from "@/features/home/data/shen";
import { getPracticeStreak } from "@/features/home/components/DojoHomeScreen";
import type { ShenActivity } from "@/packages/shen-domain";
import { ShibashiBrandMark } from "./ShibashiBrandMark";
import { WebNotificationBell } from "./WebNotificationBell";
import styles from "./web-header.module.css";

type WebHeaderTab = "home" | "mainMap" | "lessons" | "practice" | "posture" | "journey" | "bodyLines" | "journal" | "profile";

const navigation: Array<{ id: WebHeaderTab; label: string; href: string }> = [
  { id: "home", label: "Odam", href: "/" },
  { id: "mainMap", label: "Gelişim Haritam", href: "/ana-haritam" },
  { id: "lessons", label: "Isınma Dersleri", href: "/?tab=lessons" },
  { id: "bodyLines", label: "18 Form", href: "/beden-hatlari" },
  { id: "posture", label: "Postür", href: "/?tab=posture" },
  { id: "journey", label: "Beden Haritam", href: "/?tab=journey" },
  { id: "journal", label: "Kayıtlarım", href: "/?tab=journal" },
  { id: "profile", label: "Ayarlar", href: "/?tab=profile" },
];

export function WebHeader({ active }: { active: WebHeaderTab }) {
  const [userName, setUserName] = useState("Çınar");
  const [streak, setStreak] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const refresh = () => {
      setUserName(window.localStorage.getItem("ritim-kapisi-user-name") || "Çınar");
      try {
        const gallery: unknown = JSON.parse(window.localStorage.getItem("ritim-kapisi-practice-gallery") ?? "[]");
        const activities: unknown = JSON.parse(window.localStorage.getItem("shibashi-shen-activities") ?? "[]");
        const galleryDates = Array.isArray(gallery) ? gallery.filter((item): item is { createdAt: string } => typeof item?.createdAt === "string") : [];
        const practiceActivities = Array.isArray(activities) ? activities.filter((item): item is ShenActivity => typeof item?.createdAt === "string" && item?.type === "practice") : [];
        setStreak(getPracticeStreak(galleryDates, practiceActivities).current);
      } catch {
        setStreak(0);
      }
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
        <span className={styles.streak} title="Güncel seri">♨ {streak}</span>
        <button aria-label={`Müziği ${musicPlaying ? "kapat" : "aç"}`} aria-pressed={musicPlaying} className={`${styles.iconButton} ${musicPlaying ? styles.playing : ""}`} onClick={toggleMusic} title={`Shen müziği ${musicPlaying ? "açık" : "kapalı"}`} type="button"><span aria-hidden="true">{musicPlaying ? "♪" : "♪̸"}</span></button>
        <WebNotificationBell />
        <Link className={styles.profile} href="/?tab=profile"><i>{userName.slice(0, 1).toLocaleUpperCase("tr-TR")}</i><span>{userName}</span><b>⌄</b></Link>
      </div>
    </header>
  );
}
