"use client";
import { useCallback, useSyncExternalStore } from "react";

const changed = "coms:notification-sound-changed";
const fallback = new Map<string, boolean>();
const key = (userId: string) => `coms:notification-sound:v1:${userId}`;
export function notificationSoundEnabled(userId: string) {
  if (fallback.has(userId)) return fallback.get(userId)!;
  try {
    return localStorage.getItem(key(userId)) !== "muted";
  } catch {
    return fallback.get(userId) ?? true;
  }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(changed, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(changed, listener);
  };
}
export function useNotificationSoundPreference(userId: string) {
  const enabled = useSyncExternalStore(
    subscribe,
    useCallback(() => notificationSoundEnabled(userId), [userId]),
    () => true,
  );
  const setEnabled = (value: boolean) => {
    try {
      localStorage.setItem(key(userId), value ? "enabled" : "muted");
      fallback.delete(userId);
    } catch {
      fallback.set(userId, value);
    }
    window.dispatchEvent(new Event(changed));
  };
  return { enabled, setEnabled };
}
