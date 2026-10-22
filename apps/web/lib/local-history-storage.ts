import type { PostureReport } from "@/features/posture/types";
import type { PracticeSnapshot } from "@/features/practice/types";
import { isCapturedPracticePhoto } from "@/features/home/utils/practice-photo";

const postureReportDatabaseName = "ritim-kapisi-posture-library";
const postureReportStoreName = "reports";
const practiceSnapshotStoreName = "practice-snapshots";
const deletedPracticeSnapshotKey = "ritim-kapisi-deleted-practice-photos";

function deletedPracticeSnapshotIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = JSON.parse(window.localStorage.getItem(deletedPracticeSnapshotKey) ?? "[]");
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function rememberDeletedPracticeSnapshot(snapshotId: string) {
  const ids = deletedPracticeSnapshotIds();
  ids.add(snapshotId);
  try { window.localStorage.setItem(deletedPracticeSnapshotKey, JSON.stringify([...ids])); }
  catch { /* The IndexedDB record is still removed. */ }
}

export function openPostureReportDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB desteklenmiyor"));
      return;
    }

    const request = window.indexedDB.open(postureReportDatabaseName, 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(postureReportStoreName)) {
        database.createObjectStore(postureReportStoreName, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(practiceSnapshotStoreName)) {
        database.createObjectStore(practiceSnapshotStoreName, { keyPath: "id" });
      }
    };
  });
}

export async function savePostureReportToIndexedDb(report: PostureReport) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(postureReportStoreName, "readwrite");
      transaction.objectStore(postureReportStoreName).put(report);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // Local storage remains as a lightweight fallback when IndexedDB is unavailable.
  }
}

export async function savePracticeSnapshotToIndexedDb(snapshot: PracticeSnapshot) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(practiceSnapshotStoreName, "readwrite");
      transaction.objectStore(practiceSnapshotStoreName).put(snapshot);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
    return true;
  } catch {
    // The caller must not report a saved photo when persistent storage fails.
    return false;
  }
}

export async function deletePracticeSnapshotFromIndexedDb(snapshotId: string) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(practiceSnapshotStoreName, "readwrite");
      transaction.objectStore(practiceSnapshotStoreName).delete(snapshotId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
    return true;
  } catch {
    return false;
  }
}

export async function deletePostureReportFromIndexedDb(reportId: string) {
  try {
    const database = await openPostureReportDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(postureReportStoreName, "readwrite");
      transaction.objectStore(postureReportStoreName).delete(reportId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // The in-memory list is still updated when persistent storage is unavailable.
  }
}

export async function clearLocalShibashiDatabase() {
  if (!window.indexedDB) return;
  await new Promise<void>((resolve) => {
    const request = window.indexedDB.deleteDatabase(postureReportDatabaseName);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

export async function loadPostureReportsFromIndexedDb(): Promise<PostureReport[]> {
  try {
    const database = await openPostureReportDatabase();
    const reports = await new Promise<PostureReport[]>((resolve, reject) => {
      const request = database.transaction(postureReportStoreName, "readonly").objectStore(postureReportStoreName).getAll();
      request.onsuccess = () => resolve(request.result as PostureReport[]);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return reports.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

export async function loadPracticeSnapshotsFromIndexedDb(): Promise<PracticeSnapshot[]> {
  try {
    const database = await openPostureReportDatabase();
    const snapshots = await new Promise<PracticeSnapshot[]>((resolve, reject) => {
      const request = database.transaction(practiceSnapshotStoreName, "readonly").objectStore(practiceSnapshotStoreName).getAll();
      request.onsuccess = () => resolve(request.result as PracticeSnapshot[]);
      request.onerror = () => reject(request.error);
    });
    database.close();
    const deletedIds = deletedPracticeSnapshotIds();
    return snapshots.filter((snapshot) => !deletedIds.has(snapshot.id)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

export function mergePostureReports(...collections: PostureReport[][]): PostureReport[] {
  const reports = new Map<string, PostureReport>();
  collections.flat().forEach((report) => {
    const current = reports.get(report.id);
    if (!current) {
      reports.set(report.id, report);
      return;
    }
    reports.set(report.id, mergePostureReportCopies(current, report));
  });
  return Array.from(reports.values())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 18);
}

export function mergePostureReportCopies(first: PostureReport, second: PostureReport): PostureReport {
  const imageWeight = (report: PostureReport) =>
    (["front", "side", "back"] as const).reduce((total, view) => total + (report.captures?.[view]?.imageData?.length ?? 0), 0);
  const full = imageWeight(second) > imageWeight(first) ? second : first;
  const metadata = full === first ? second : first;
  return {
    ...metadata,
    ...full,
    trainerVisible: metadata.trainerVisible ?? full.trainerVisible,
    captures: Object.fromEntries(
      (["front", "side", "back"] as const).map((view) => {
        const primary = full.captures?.[view];
        const fallback = metadata.captures?.[view];
        return [view, {
          ...fallback,
          ...primary,
          imageData: primary?.imageData || fallback?.imageData || "",
        }];
      }),
    ) as PostureReport["captures"],
  };
}

export function mergePracticeSnapshots(...collections: PracticeSnapshot[][]): PracticeSnapshot[] {
  const snapshots = new Map<string, PracticeSnapshot>();
  const deletedIds = deletedPracticeSnapshotIds();
  collections.flat().forEach((snapshot) => {
    if (deletedIds.has(snapshot.id)) return;
    const current = snapshots.get(snapshot.id);
    if (!current) {
      snapshots.set(snapshot.id, snapshot);
      return;
    }
    snapshots.set(snapshot.id, {
      ...current,
      ...snapshot,
      imageData: isCapturedPracticePhoto(snapshot.imageData) ? snapshot.imageData : current.imageData,
    });
  });
  return Array.from(snapshots.values())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 180);
}

export function persistPostureReportsToLocalStorage(reports: PostureReport[]) {
  const lightweightReports = reports.slice(0, 18).map((report, reportIndex) => ({
    ...report,
    captures: Object.fromEntries(
      (["front", "side", "back"] as const).map((view) => {
        const capture = report.captures?.[view];
        const imageData = portableHistoryImage(capture?.imageData, "");
        return [
          view,
          {
            ...capture,
            imageData: reportIndex < 2 && typeof capture?.imageData === "string" ? capture.imageData : imageData,
          },
        ];
      }),
    ) as PostureReport["captures"],
  }));
  writeLightweightHistory("ritim-kapisi-posture-reports", lightweightReports);
}

export function persistPracticeSnapshotsToLocalStorage(snapshots: PracticeSnapshot[]) {
  const deletedIds = deletedPracticeSnapshotIds();
  const lightweightSnapshots = snapshots.filter((snapshot) => !deletedIds.has(snapshot.id)).slice(0, 180).map((snapshot) => ({
    ...snapshot,
    imageData: portableHistoryImage(snapshot.imageData, ""),
  }));
  writeLightweightHistory("ritim-kapisi-practice-gallery", lightweightSnapshots);
}

export function portableHistoryImage(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return /^(?:data:|blob:)/i.test(value) || value.length > 64_000 ? fallback : value;
}

export function writeLightweightHistory(key: string, value: unknown) {
  const serialized = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, serialized);
  } catch {
    try {
      window.localStorage.removeItem(key);
      window.localStorage.setItem(key, serialized);
    } catch {
      // The full-resolution source remains in IndexedDB or current memory.
    }
  }
}

export function formatSnapshotDate(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatSnapshotTime(date: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
