/** Expo media calls can reject after React has released the native shared object. */
export function safeMediaAction(action: () => unknown): void {
  try {
    const result = action();
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      void (result as Promise<unknown>).catch(() => {});
    }
  } catch {}
}
