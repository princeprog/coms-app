"use client";

import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "../hooks/use-pwa-install";
import { usePwa } from "./pwa-provider";

export function PwaControls() {
  const pwa = usePwa();
  const install = usePwaInstall();
  if (!install.available && !pwa.updateAvailable && !pwa.error && !pwa.updated)
    return null;
  return (
    <aside
      aria-label="COMS app"
      className="border-border bg-background text-foreground flex flex-wrap items-center justify-end gap-2 border-b px-4 py-2 text-sm"
    >
      {install.instructions && (
        <p role="status" className="w-full">
          {install.instructions}
        </p>
      )}
      {pwa.error && (
        <p role="status" className="text-destructive mr-auto">
          {pwa.error}
        </p>
      )}
      {pwa.updated && (
        <p role="status" className="mr-auto">
          Update installed. It will be used the next time you open COMS.
        </p>
      )}
      {pwa.updateAvailable && (
        <Button
          variant="outline"
          className="min-h-10"
          disabled={pwa.applying}
          onClick={() => void pwa.applyUpdate()}
        >
          <RefreshCw aria-hidden="true" />
          {pwa.applying ? "Checking open orders…" : "Update COMS"}
        </Button>
      )}
      {install.available && (
        <Button
          variant="outline"
          className="min-h-10"
          disabled={install.installing}
          onClick={() => void install.install()}
        >
          <Download aria-hidden="true" />
          {install.installing ? "Installing…" : "Install COMS"}
        </Button>
      )}
    </aside>
  );
}
