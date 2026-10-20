"use client";

import { useRef } from "react";

/** Reuses one idempotency key while the submitted values stay the same, so retries never double-post. */
export function useRetryKey() {
  const saved = useRef<{ fingerprint: string; key: string } | null>(null);
  return (fingerprint: string) => {
    if (saved.current?.fingerprint !== fingerprint)
      saved.current = { fingerprint, key: crypto.randomUUID() };
    return saved.current.key;
  };
}
