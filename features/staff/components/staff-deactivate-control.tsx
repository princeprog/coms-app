"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deactivateStaffAction } from "@/features/staff/services/staff-actions";
import type {
  StaffMember,
  StaffMutationResult,
} from "@/features/staff/types/staff.types";

export function StaffDeactivateControl({
  staff,
  branchId,
}: {
  staff: StaffMember;
  branchId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function deactivate() {
    setError("");
    setPending(true);
    let result: StaffMutationResult;
    try {
      result = await deactivateStaffAction(staff.id, branchId);
    } catch {
      setPending(false);
      setError("COMS could not complete this change. Try again.");
      return;
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setStatus("Staff account deactivated.");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2 border-t pt-4">
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) setError("");
        }}
      >
        <AlertDialogTrigger
          render={
            <Button type="button" variant="destructive">
              Deactivate staff
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {staff.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The account will lose access to COMS and its active sessions will
              be revoked.
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
      {status && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}
    </div>
  );
}
