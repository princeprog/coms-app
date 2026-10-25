"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { OfflineRegister } from "../hooks/use-offline-register";
import { downloadRecovery } from "../hooks/offline-presentation";

export function OfflineRegisterStatus({
  register,
}: {
  register: OfflineRegister;
}) {
  const [confirm, setConfirm] = useState<"finalize" | "export" | null>(null);
  const state = register.state;
  if (!state) return null;
  const waiting = state.records.filter(
    (record) => record.status !== "ACKNOWLEDGED",
  ).length;
  const held = state.records.filter(
    (record) => record.status === "NEEDS_REVIEW",
  ).length;
  const status =
    held || register.error
      ? "Needs attention"
      : register.syncing
        ? "Syncing"
        : register.online
          ? "Online"
          : "Offline";
  return (
    <section
      aria-label="Register connection and saved sales"
      className="space-y-3 rounded-lg border bg-card p-4"
    >
      {register.readOnly && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 text-sm"
        >
          <p>
            This register is active in another tab. Checkout and order editing
            are read-only here.
          </p>
          <Button variant="outline" size="sm" onClick={register.retryLease}>
            Use this tab after closing the other
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3" role="status">
          <Badge
            className={`${status === "Online" ? "bg-green-700" : status === "Needs attention" ? "bg-amber-800" : "bg-slate-700"} text-white`}
          >
            {status}
          </Badge>
          <span className="text-sm">
            {waiting} pending {waiting === 1 ? "sale" : "sales"}
            {held ? ` · ${held} need manager review` : ""}
          </span>
          <span className="text-xs text-muted-foreground">
            Last sync:{" "}
            {register.lastSync
              ? new Date(register.lastSync).toLocaleTimeString("en-PH", {
                  timeZone: "Asia/Manila",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Not synced yet"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!register.online || register.syncing || register.pending}
            onClick={() => void register.sync()}
          >
            Sync now
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              !register.online ||
              register.pending ||
              register.readOnly ||
              state.sealed ||
              state.cart.items.length > 0
            }
            onClick={async () => {
              if (await register.refreshMenu())
                toast.add({
                  type: "success",
                  title: "Menu updated",
                  description:
                    "New sales use the latest prices. Saved sales keep their original prices.",
                });
            }}
          >
            Update menu
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              register.pending ||
              register.readOnly ||
              state.cart.items.length > 0
            }
            onClick={() => setConfirm("export")}
          >
            Export recovery
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={register.pending || register.syncing || register.readOnly}
            onClick={() => void register.lock()}
          >
            Lock register
          </Button>
          <Button
            size="sm"
            disabled={
              !register.online ||
              register.pending ||
              register.syncing ||
              register.readOnly ||
              waiting > 0 ||
              state.cart.items.length > 0
            }
            onClick={() => setConfirm("finalize")}
          >
            Finalize register
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Cash sales are saved on this device before syncing. Keep browser data
        until every sale is confirmed. Finalize here before closing your shift
        online.
      </p>
      {register.error && (
        <p role="alert" className="text-sm text-destructive">
          {register.error}
        </p>
      )}
      <Dialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open && !register.pending) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "export"
                ? "Stop selling and export recovery?"
                : "Finalize this register?"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "export"
                ? "This stops new sales on this prepared register and exports every saved sale, including confirmed sales. Give the complete file to your manager for recovery. Keep browser data until finalization is confirmed."
                : "Every saved sale has synced. This ends offline selling for this session. Close your shift from the online register when ready."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={register.pending}
              onClick={() => setConfirm(null)}
            >
              Keep open
            </Button>
            <Button
              disabled={register.pending}
              onClick={async () => {
                if (confirm === "export") {
                  const recovery = await register.exportRecovery();
                  if (recovery) {
                    downloadRecovery(
                      recovery,
                      `coms-register-${state.session.business_date}.json`,
                    );
                    setConfirm(null);
                  }
                } else if (await register.finalize()) {
                  setConfirm(null);
                  toast.add({ type: "success", title: "Register finalized" });
                }
              }}
            >
              {register.pending
                ? "Saving…"
                : confirm === "export"
                  ? "Stop selling and export"
                  : "Finalize register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
