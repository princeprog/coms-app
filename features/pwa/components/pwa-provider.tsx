"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { usePwaInstall } from "../hooks/use-pwa-install";
import { usePwaRegistration } from "../hooks/use-pwa-registration";
import { PwaNotice } from "./pwa-notice";

export type PwaContextValue = ReturnType<typeof usePwaRegistration> & {
  install: ReturnType<typeof usePwaInstall>;
  /** True while the expanded app sidebar shows the notice, so no floating card appears. */
  sidebarPlacement: boolean;
  setSidebarPlacement: (shown: boolean) => void;
};

export const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePwaRegistration();
  // One owner keeps the browser's single install prompt when the notice moves.
  const install = usePwaInstall();
  const [sidebarPlacement, setSidebarPlacement] = useState(false);
  const value = useMemo(
    () => ({ ...pwa, install, sidebarPlacement, setSidebarPlacement }),
    [pwa, install, sidebarPlacement],
  );
  return (
    <PwaContext.Provider value={value}>
      {children}
      {!sidebarPlacement && <PwaNotice placement="floating" />}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used inside PwaProvider.");
  return context;
}
