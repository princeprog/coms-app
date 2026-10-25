"use client";

import { createContext, useContext } from "react";
import { usePwaRegistration } from "../hooks/use-pwa-registration";
import { PwaControls } from "./pwa-controls";

const PwaContext = createContext<ReturnType<typeof usePwaRegistration> | null>(
  null,
);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePwaRegistration();
  return (
    <PwaContext.Provider value={pwa}>
      <PwaControls />
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used inside PwaProvider.");
  return context;
}
