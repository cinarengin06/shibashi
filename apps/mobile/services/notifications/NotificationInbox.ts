import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "shibashi-notification-inbox-v1";

export type NotificationKind = "practice" | "posture" | "journey" | "system";

export type AppNotification = {
  body: string;
  createdAt: string;
  id: string;
  kind: NotificationKind;
  read: boolean;
  route?: string;
  title: string;
};

type ReminderContext = {
  hasPostureReport: boolean;
  hasSessionToday: boolean;
  remindersEnabled: boolean;
};

export async function loadNotificationInbox() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const value = raw ? (JSON.parse(raw) as AppNotification[]) : [];
    return Array.isArray(value) ? sortNotifications(value) : [];
  } catch {
    return [];
  }
}

export async function ensureSystemNotifications(context: ReminderContext) {
  const current = await loadNotificationInbox();
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const generated: AppNotification[] = [];

  if (context.remindersEnabled && !context.hasSessionToday) {
    generated.push({
      body: "Bugünün pratiği seni bekliyor. Beş sakin dakika bile ritmi yeniden kurabilir.",
      createdAt: atLocalTime(today, 9, 0).toISOString(),
      id: `daily-practice-${dateKey}`,
      kind: "practice",
      read: false,
      route: "/(tabs)/practice",
      title: "Bugün kendine alan aç",
    });
  }

  if (!context.hasPostureReport) {
    generated.push({
      body: "İlk beden çizgini kaydet; sonraki ölçümlerde değişimi birlikte takip edelim.",
      createdAt: atLocalTime(today, 12, 30).toISOString(),
      id: "first-posture-analysis",
      kind: "posture",
      read: false,
      route: "/posture",
      title: "Beden aynan hazır",
    });
  }

  generated.push({
    body: "Bir hareketi hikâyesiyle öğrenmek, bedenin onu daha kolay hatırlamasını sağlar.",
    createdAt: atLocalTime(today, 16, 0).toISOString(),
    id: "discover-living-learning",
    kind: "journey",
    read: false,
    route: "/living-learning",
    title: "Yaşayarak öğrenmeyi keşfet",
  });

  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of generated) if (!byId.has(item.id)) byId.set(item.id, item);
  const next = sortNotifications(Array.from(byId.values())).slice(0, 60);
  await persist(next);
  return next;
}

export async function publishAppNotification(notification: Omit<AppNotification, "createdAt" | "read"> & { createdAt?: string }) {
  const current = await loadNotificationInbox();
  const next = sortNotifications([
    { ...notification, createdAt: notification.createdAt ?? new Date().toISOString(), read: false },
    ...current.filter((item) => item.id !== notification.id),
  ]).slice(0, 60);
  await persist(next);
  return next;
}

export async function markNotificationRead(id: string) {
  const current = await loadNotificationInbox();
  const next = current.map((item) => item.id === id ? { ...item, read: true } : item);
  await persist(next);
  return next;
}

export async function markAllNotificationsRead() {
  const current = await loadNotificationInbox();
  const next = current.map((item) => ({ ...item, read: true }));
  await persist(next);
  return next;
}

export function unreadNotificationCount(items: readonly AppNotification[]) {
  return items.filter((item) => !item.read).length;
}

async function persist(items: AppNotification[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function sortNotifications(items: AppNotification[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function atLocalTime(date: Date, hour: number, minute: number) {
  const value = new Date(date);
  value.setHours(hour, minute, 0, 0);
  return value;
}
