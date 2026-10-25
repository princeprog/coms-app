"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPwaOfflineStatus,
  PWA_STATUS_EVENT,
  registerPwa,
  respondToUpdateSafety,
  unavailableStatus,
  workerRequest,
} from "../services/registration";

export function usePwaRegistration() {
  const [supported, setSupported] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(unavailableStatus);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [updated, setUpdated] = useState(false);

  const refreshOfflineStatus = useCallback(async () => {
    const status = await getPwaOfflineStatus();
    setOfflineStatus(status);
    window.dispatchEvent(new CustomEvent(PWA_STATUS_EVENT, { detail: status }));
    return status;
  }, []);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    let disposed = false;
    let removeRegistrationListeners = () => {};
    const refresh = () => {
      void refreshOfflineStatus();
    };
    navigator.serviceWorker.addEventListener("message", respondToUpdateSafety);
    navigator.serviceWorker.addEventListener("controllerchange", refresh);
    window.addEventListener("online", refresh);
    void registerPwa()
      .then((registration) => {
        if (disposed || !registration) return;
        setSupported(true);
        setWaiting(registration.waiting);
        refresh();
        const installing = new Set<ServiceWorker>();
        const changed = () => {
          if (disposed) return;
          setWaiting(registration.waiting);
          refresh();
        };
        const found = () => {
          if (!registration.installing) return;
          installing.add(registration.installing);
          registration.installing.addEventListener("statechange", changed);
        };
        registration.addEventListener("updatefound", found);
        found();
        removeRegistrationListeners = () => {
          registration.removeEventListener("updatefound", found);
          installing.forEach((worker) =>
            worker.removeEventListener("statechange", changed),
          );
        };
      })
      .catch(() => {
        if (!disposed)
          setError("Offline setup failed. Reconnect and reload to try again.");
      });
    return () => {
      disposed = true;
      removeRegistrationListeners();
      navigator.serviceWorker.removeEventListener(
        "message",
        respondToUpdateSafety,
      );
      navigator.serviceWorker.removeEventListener("controllerchange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [refreshOfflineStatus]);

  const applyUpdate = async () => {
    if (!waiting || applying) return;
    setApplying(true);
    setError(null);
    try {
      const result = await workerRequest<{ applied: boolean }>(
        waiting,
        "COMS_PWA_APPLY_UPDATE",
      );
      if (result.applied) {
        setWaiting(null);
        setUpdated(true);
      } else
        setError(
          "Update paused. Finish open orders and sync pending sales in every COMS window, then try again.",
        );
    } catch {
      setError("The update could not be checked. Please try again.");
    } finally {
      setApplying(false);
    }
  };
  return {
    supported,
    offlineStatus,
    updateAvailable: !!waiting,
    error,
    refreshOfflineStatus,
    applyUpdate,
    applying,
    updated,
  };
}
