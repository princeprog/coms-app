"use client";
import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallDismissal } from "../hooks/use-install-dismissal";
import { usePwa } from "./pwa-provider";
import { PwaCard } from "./pwa-card";

/** One app notice at a time: update status first, then the install offer. */
export function PwaNotice({
  placement,
}: {
  placement: "floating" | "sidebar";
}) {
  const pwa = usePwa();
  const { dismissed, dismiss } = useInstallDismissal();
  const [statusHidden, setStatusHidden] = useState(false);
  const buttonClass = placement === "sidebar" ? "w-full" : "self-start";

  if (!statusHidden && (pwa.updateAvailable || pwa.updated || pwa.error)) {
    const close = () => setStatusHidden(true);
    if (pwa.updateAvailable)
      return (
        <PwaCard
          placement={placement}
          title="Update ready"
          closeLabel="Hide update notice"
          onClose={close}
          description={pwa.error ?? "A new version of COMS is available."}
        >
          <Button
            size="sm"
            className={buttonClass}
            disabled={pwa.applying}
            onClick={() => void pwa.applyUpdate()}
          >
            <RefreshCw aria-hidden="true" />
            {pwa.applying ? "Checking open orders…" : "Update COMS"}
          </Button>
        </PwaCard>
      );
    return (
      <PwaCard
        placement={placement}
        closeLabel="Hide app notice"
        onClose={close}
        title={pwa.updated ? "COMS updated" : "Offline setup paused"}
        description={
          pwa.updated
            ? "The new version opens the next time you start COMS."
            : pwa.error
        }
      />
    );
  }
  if (!pwa.install.available || dismissed) return null;
  return (
    <PwaCard
      placement={placement}
      title="Get the COMS app"
      closeLabel="Hide install offer"
      onClose={dismiss}
      description={
        pwa.install.instructions ??
        "Quick access from your desktop, with the register ready offline."
      }
    >
      <Button
        size="sm"
        className={buttonClass}
        disabled={pwa.install.installing}
        onClick={() => void pwa.install.install()}
      >
        <Download aria-hidden="true" />
        {pwa.install.installing ? "Installing…" : "Install COMS"}
      </Button>
    </PwaCard>
  );
}
