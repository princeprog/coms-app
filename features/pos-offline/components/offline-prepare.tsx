"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPwaOfflineStatus } from "@/features/pwa/services/registration";
import { toast } from "@/components/ui/toast";
import type { OfflineRegister } from "../hooks/use-offline-register";
import { useRegisterDeviceStatus } from "../hooks/use-register-device-status";
import { offlineErrorMessage } from "../hooks/offline-errors";
import { RegisterDeviceStatus } from "./register-device-status";

// Development servers never install the service worker, so only production
// builds wait for the offline app files.
const needsAppFiles = process.env.NODE_ENV === "production";

export function OfflinePrepare({
  branchId,
  register,
}: {
  branchId: string;
  register: OfflineRegister;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [filesReady, setFilesReady] = useState(!needsAppFiles);
  const device = useRegisterDeviceStatus(
    branchId,
    register.deviceId,
    register.online,
  );
  useEffect(() => {
    if (!needsAppFiles) return;
    const refresh = () =>
      void getPwaOfflineStatus()
        .then((status) => setFilesReady(status.ready))
        .catch(() => setFilesReady(false));
    refresh();
    window.addEventListener("coms:pwa-status", refresh);
    return () => window.removeEventListener("coms:pwa-status", refresh);
  }, []);
  const status = device.data?.status;
  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-label="Offline preparation"
    >
      {device.isPending ? (
        <Skeleton
          className="h-12 w-72"
          role="status"
          aria-label="Checking this browser"
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <RegisterDeviceStatus device={device.data ?? null} />
          </div>
          {device.isError && (
            <Button variant="outline" onClick={() => void device.refetch()}>
              Try again
            </Button>
          )}
          {!device.isError && !device.data && (
            <Button
              variant="outline"
              disabled={!register.online || register.pending}
              onClick={() => setOpen(true)}
            >
              Register this browser
            </Button>
          )}
          {status === "APPROVED" && (
            <Button
              disabled={!filesReady || !register.online || register.pending}
              onClick={() => void register.prepare(branchId)}
            >
              {register.pending ? "Preparing…" : "Prepare offline POS"}
            </Button>
          )}
        </div>
      )}
      {device.isError && (
        <p role="alert" className="text-sm text-destructive">
          {offlineErrorMessage(device.error)}
        </p>
      )}
      {status === "APPROVED" && !filesReady && (
        <p role="status" className="text-sm text-muted-foreground">
          Saving the offline app on this browser. Keep COMS open online until it
          finishes.
        </p>
      )}
      {register.error && !open && (
        <p role="alert" className="text-sm text-destructive">
          {register.error}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register this browser</DialogTitle>
            <DialogDescription>
              Give this register a recognizable name. A manager approves it from
              Branches before you prepare offline sales.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (await register.register(branchId, name.trim())) {
                setOpen(false);
                await device.refetch();
                toast.add({
                  type: "success",
                  title: "Approval requested",
                  description:
                    "Branch managers were notified. This page updates when they approve it.",
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="register-browser-name">Register name</Label>
              <Input
                id="register-browser-name"
                className="h-11"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
                placeholder="Front counter"
              />
            </div>
            {register.error && (
              <p role="alert" className="text-sm text-destructive">
                {register.error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={register.pending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={register.pending || !name.trim()}>
                {register.pending ? "Submitting…" : "Request approval"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
