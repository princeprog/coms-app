"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRegisterRecovery } from "../hooks/use-register-recovery";

export function OfflineRecoveryPanel({ branchId }: { branchId: string }) {
  const recovery = useRegisterRecovery(branchId);
  const [confirm, setConfirm] = useState(false);
  return (
    <section
      className="space-y-4 rounded-lg border p-4 sm:p-6"
      aria-labelledby="register-recovery-title"
    >
      <div>
        <h2 id="register-recovery-title" className="text-lg font-semibold">
          Recover an original device export
        </h2>
        <p className="text-sm text-muted-foreground">
          Import the complete recovery file exported from the cashier’s
          register. Original cashier, prices and sale contents are retained.
          Keep the file until all sales are confirmed.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-recovery-file">Recovery file</Label>
        <Input
          id="register-recovery-file"
          type="file"
          accept="application/json,.json"
          disabled={recovery.pending}
          onChange={(event) => void recovery.load(event.target.files?.[0])}
        />
      </div>
      {recovery.evidence && (
        <p className="text-sm">
          {recovery.evidence.recovery.snapshot.branch.name} · Business date{" "}
          {recovery.evidence.recovery.session.business_date} ·{" "}
          {recovery.evidence.transactions.length} saved sales
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="register-recovery-reason">Recovery reason</Label>
        <Textarea
          id="register-recovery-reason"
          value={recovery.reason}
          onChange={(event) => recovery.setReason(event.target.value)}
          minLength={3}
          maxLength={500}
          disabled={recovery.pending}
          placeholder="Explain why manager recovery is needed"
        />
      </div>
      {recovery.error && (
        <p role="alert" className="text-sm text-destructive">
          {recovery.error}
        </p>
      )}
      {recovery.result && (
        <p role="status" className="text-sm">
          {recovery.result}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={
            !recovery.evidence ||
            recovery.reason.trim().length < 3 ||
            recovery.pending
          }
          onClick={() => void recovery.run()}
        >
          {recovery.pending
            ? "Processing recovery…"
            : "Import and retry saved sales"}
        </Button>
        <Button
          variant="outline"
          disabled={
            !recovery.acknowledged ||
            recovery.reason.trim().length < 3 ||
            recovery.pending
          }
          onClick={() => setConfirm(true)}
        >
          Finalize recovered register
        </Button>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize recovered register?</DialogTitle>
            <DialogDescription>
              COMS will verify every sale in the original export is confirmed
              and that the complete sequence is present. This ends the original
              register’s offline session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={recovery.pending}
              onClick={() => setConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={recovery.pending}
              onClick={async () => {
                if (await recovery.run(true)) setConfirm(false);
              }}
            >
              {recovery.pending ? "Finalizing…" : "Confirm finalization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
