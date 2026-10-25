"use client";
import { useLayoutEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { usePwa } from "./pwa-provider";
import { PwaNotice } from "./pwa-notice";

/** Places the app notice above the account menu while the desktop sidebar is open. */
export function PwaSidebarNotice() {
  const { isMobile, state } = useSidebar();
  const { setSidebarPlacement } = usePwa();
  const shown = !isMobile && state === "expanded";
  // Before paint, so the floating card never flashes beside the sidebar card.
  useLayoutEffect(() => {
    setSidebarPlacement(shown);
    return () => setSidebarPlacement(false);
  }, [shown, setSidebarPlacement]);
  return shown ? <PwaNotice placement="sidebar" /> : null;
}
