"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function OfflinePrepare({
  branchId,
  register,
}: {
  branchId: string;
  register: OfflineRegister;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const refresh = () =>
      void getPwaOfflineStatus()
        .then((status) => setReady(status.ready))
        .catch(() => setReady(false));
    refresh();
    window.addEventListener("coms:pwa-status", refresh);
    return () => window.removeEventListener("coms:pwa-status", refresh);
  }, []);
  return (
    <section
      className="space-y-2 rounded-lg border p-4"
      aria-label="Offline preparation"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-medium">
            Prepare this register for offline cash sales
          </h2>
          <p className="text-sm text-muted-foreground">
            Your own open shift and manager-approved browser are required.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!register.online || register.pending}
          onClick={() => setOpen(true)}
        >
          Register this browser
        </Button>
        <Button
          disabled={!ready || !register.online || register.pending}
          onClick={() => void register.prepare(branchId)}
        >
          {register.pending ? "Preparing…" : "Prepare offline POS"}
        </Button>
      </div>
      {!ready && (
        <p role="status" className="text-sm text-muted-foreground">
          The offline app is not ready on this browser yet. Keep COMS open
          online until its app files finish saving.
        </p>
      )}
      {register.error && (
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
                toast.add({
                  type: "success",
                  title: "Browser registration submitted",
                  description:
                    "Ask a manager to approve this device before preparing.",
                });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="register-browser-name">Register name</Label>
              <Input
                id="register-browser-name"
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
