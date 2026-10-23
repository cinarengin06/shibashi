"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./web-notification-bell.module.css";

type NotificationKind = "practice" | "posture" | "journey";
type WebNotification = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  href: string;
  createdAt: string;
  read: boolean;
};

const storageKey = "shibashi-web-notification-inbox-v1";
const kindIcon: Record<NotificationKind, string> = { practice: "✦", posture: "◇", journey: "◌" };

function loadStored(): WebNotification[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is WebNotification =>
      typeof item?.id === "string" && typeof item?.title === "string" && typeof item?.body === "string" &&
      typeof item?.createdAt === "string" && typeof item?.href === "string" && typeof item?.read === "boolean" &&
      ["practice", "posture", "journey"].includes(item?.kind),
    ) : [];
  } catch { return []; }
}

function persist(items: WebNotification[]) {
  try {
    const serialized = JSON.stringify(items);
    if (window.localStorage.getItem(storageKey) !== serialized) window.localStorage.setItem(storageKey, serialized);
  } catch { /* Readable for this visit even if storage is unavailable. */ }
  return items;
}

function readArray(key: string): Array<{ createdAt?: string }> {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
  } catch { return []; }
}

function refreshNotifications(): WebNotification[] {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const hasPracticeToday = [
    ...readArray("ritim-kapisi-practice-gallery"),
    ...readArray("shibashi-shen-activities").filter((item) => (item as { type?: string; completed?: boolean }).type === "practice" && (item as { completed?: boolean }).completed !== false),
  ].some((item) => item.createdAt && new Date(item.createdAt).toDateString() === now.toDateString());
  const hasPostureReport = readArray("ritim-kapisi-posture-reports").length > 0;
  const existing = loadStored().filter((item) =>
    !(item.id === "first-posture-analysis" && hasPostureReport) &&
    !(item.id === `daily-practice-${todayKey}` && hasPracticeToday),
  );
  const byId = new Map(existing.map((item) => [item.id, item]));
  const add = (item: Omit<WebNotification, "createdAt" | "read">) => {
    if (!byId.has(item.id)) byId.set(item.id, { ...item, createdAt: now.toISOString(), read: false });
  };
  if (!hasPracticeToday) add({ id: `daily-practice-${todayKey}`, title: "Bugün kendine alan aç", body: "Beş sakin dakika bile ritmi yeniden kurabilir.", kind: "practice", href: "/?tab=lessons" });
  if (!hasPostureReport) add({ id: "first-posture-analysis", title: "Beden aynan hazır", body: "İlk postür analizini kaydet; sonraki ölçümlerde değişimi izle.", kind: "posture", href: "/?tab=posture" });
  add({ id: "discover-living-learning", title: "Hareketleri keşfet", body: "18 hareketi videolarıyla birlikte kendi hızında öğren.", kind: "journey", href: "/beden-hatlari" });
  return persist([...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 60));
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = date.toDateString() === today.toDateString()
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" };
  return `${date.toDateString() === today.toDateString() ? "Bugün · " : ""}${new Intl.DateTimeFormat("tr-TR", options).format(date)}`;
}

export function WebNotificationBell({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WebNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => !item.read).length;

  useEffect(() => {
    const refresh = () => setItems(refreshNotifications());
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  const markRead = (id: string) => setItems((current) => persist(current.map((item) => item.id === id ? { ...item, read: true } : item)));
  const markAllRead = () => setItems((current) => persist(current.map((item) => ({ ...item, read: true }))));

  return <div className={styles.root} ref={rootRef}>
    <button aria-expanded={open} aria-haspopup="dialog" aria-label={unread ? `Bildirimler, ${unread} okunmamış` : "Bildirimler"} className={`${styles.trigger} ${className}`} onClick={() => { if (!open) setItems(refreshNotifications()); setOpen(!open); }} type="button">
      <svg aria-hidden="true" fill="none" height="19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="19"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></svg>{unread > 0 ? <span className={styles.badge}>{unread}</span> : null}
    </button>
    {open ? <section aria-label="Bildirimler" className={styles.panel} role="dialog">
      <div className={styles.heading}><div><small>SANA GELENLER</small><h2>Bildirimler</h2></div><button aria-label="Bildirimleri kapat" className={styles.close} onClick={() => setOpen(false)} type="button">×</button></div>
      <div className={styles.summary}><span>{unread ? `${unread} yeni hatırlatma` : "Her şey okundu"}</span>{unread ? <button onClick={markAllRead} type="button">Tümünü oku</button> : null}</div>
      <div className={styles.list}>{items.map((item) => <Link className={`${styles.item} ${item.read ? "" : styles.unread}`} href={item.href} key={item.id} onClick={() => markRead(item.id)}>
        <span aria-hidden="true" className={styles.kind}>{kindIcon[item.kind]}</span><span className={styles.copy}><strong>{item.title}</strong><span>{item.body}</span><small>{formatTime(item.createdAt)}</small></span>{!item.read ? <i aria-label="Okunmadı" className={styles.dot} /> : null}
      </Link>)}{!items.length ? <p className={styles.empty}>Yeni bir hatırlatma geldiğinde burada göreceksin.</p> : null}</div>
    </section> : null}
  </div>;
}
