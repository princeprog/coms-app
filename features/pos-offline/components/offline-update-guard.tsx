"use client";
import { useEffect } from "react";
import { registerPwaUpdateSafetyCheck } from "@/features/pwa/services/update-safety";
import { savedRegistersAllowUpdate } from "../services/local-update-safety";

/** Mounted in every window so app updates wait for saved register work anywhere. */
export function OfflineUpdateGuard() {
  useEffect(() => {
    const cart = registerPwaUpdateSafetyCheck(
      "cart",
      savedRegistersAllowUpdate,
    );
    const outbox = registerPwaUpdateSafetyCheck(
      "outbox",
      savedRegistersAllowUpdate,
    );
    return () => {
      cart();
      outbox();
    };
  }, []);
  return null;
}
