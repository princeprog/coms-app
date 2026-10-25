"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useOfflineRegister } from "../hooks/use-offline-register";
import { OfflineCheckout } from "./offline-checkout";
import { OfflineRegisterStatus } from "./offline-register-status";
import { OfflinePrepare } from "./offline-prepare";
import { OfflineLocked } from "./offline-locked";

export function OfflinePosBoundary({
  branchId,
  cashierId,
  canPrepare,
  children,
}: {
  branchId: string;
  cashierId: string;
  canPrepare: boolean;
  children: (deviceId?: string, noncashOnly?: boolean) => ReactNode;
}) {
  const register = useOfflineRegister(cashierId);
  const [noncash, setNoncash] = useState(false);
  if (register.loading)
    return (
      <div
        role="status"
        aria-label="Checking prepared register"
        className="h-64 animate-pulse rounded-lg bg-muted"
      />
    );
  if (register.locked) return <OfflineLocked register={register} />;
  const state = register.state;
  if (state && state.session.branch_id !== branchId)
    return (
      <p role="alert">
        This browser has a prepared register at another branch.{" "}
        <a href="/offline-pos" className="underline">
          Open the prepared register
        </a>{" "}
        to sync and finalize it first.
      </p>
    );
  if (!state)
    return (
      <div className="space-y-5">
        {register.enabled && canPrepare && (
          <OfflinePrepare branchId={branchId} register={register} />
        )}
        {children()}
      </div>
    );
  return (
    <div className="space-y-5">
      <OfflineRegisterStatus register={register} />
      <div className="flex flex-wrap items-center gap-3">
        <a href="/offline-pos" className="text-sm underline">
          Open full-screen cash register
        </a>
        {register.online && (
          <Button
            variant="outline"
            size="sm"
            disabled={register.readOnly || state.sealed}
            onClick={() => setNoncash(!noncash)}
          >
            {noncash ? "Return to saved cash order" : "Online noncash checkout"}
          </Button>
        )}
        {noncash && (
          <p className="text-xs text-muted-foreground">
            Your saved cash order stays separate on this device.
          </p>
        )}
      </div>
      <div
        hidden={
          !noncash || !register.online || register.readOnly || state.sealed
        }
      >
        {children(state.session.device_id, true)}
      </div>
      {(!noncash || !register.online || register.readOnly || state.sealed) && (
        <OfflineCheckout register={register} state={state} />
      )}
    </div>
  );
}
