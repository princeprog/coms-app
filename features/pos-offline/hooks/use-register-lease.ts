"use client";
import { useEffect, useState } from "react";

/** Lifetime ownership complements the store's short atomic writer locks. Never steal it. */
export function useRegisterLease(deviceId?: string) {
  const [lease, setLease] = useState<{
    device: string;
    active: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!deviceId || !navigator.locks) return;
    let disposed = false;
    let release: (() => void) | undefined;
    void navigator.locks
      .request(
        `coms-pos-offline-register:${deviceId}`,
        { mode: "exclusive", ifAvailable: true },
        async (lock) => {
          if (disposed) return;
          setLease({ device: deviceId, active: Boolean(lock) });
          if (lock)
            await new Promise<void>((resolve) => {
              release = resolve;
            });
        },
      )
      .catch(() => {
        if (!disposed) setLease({ device: deviceId, active: false });
      });
    return () => {
      disposed = true;
      release?.();
    };
  }, [deviceId, attempt]);
  return {
    readOnly: Boolean(
      deviceId && (lease?.device !== deviceId || !lease.active),
    ),
    retryLease: () => {
      setLease(null);
      setAttempt((value) => value + 1);
    },
  };
}
