"use client";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deactivateBranchAction } from "../services/branch-actions";
import type { Branch } from "../types/branch.types";

export function BranchDeactivateDialog({
  branch,
  onOpenChange,
  onComplete,
}: {
  branch: Branch;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function deactivate() {
    if (pending) return;
    setError("");
    setPending(true);
    try {
      const result = await deactivateBranchAction(branch.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      onComplete();
    } catch {
      setError("COMS could not complete this change. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!pending) onOpenChange(open);
      }}
    >
      <AlertDialogContent data-coms-ui="operational">
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate {branch.branch_name}?</AlertDialogTitle>
          <AlertDialogDescription>
            The branch will no longer be available for new operations. Its
            history will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void deactivate()}
          >
            {pending ? "Deactivating…" : "Confirm deactivation"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
