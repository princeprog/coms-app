"use client";
import { useCallback, useSyncExternalStore } from "react";

const KEY = "coms-pwa-install-dismissed";
const EVENT = "coms:pwa-install-dismissed";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Closing the install offer hides it on this browser; the browser menu can still install. */
export function useInstallDismissal() {
  // Server render assumes dismissed so the card never flashes before hydration.
  const dismissed = useSyncExternalStore(subscribe, read, () => true);
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* Private browsing: the card still closes for this visit. */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { dismissed, dismiss };
}
