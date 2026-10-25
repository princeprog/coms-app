"use client";

import { useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
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
import { deactivateStaffAction } from "@/features/staff/services/staff-actions";
import type {
  StaffMember,
  StaffMutationResult,
} from "@/features/staff/types/staff.types";

export function StaffDeactivateControl({
  staff,
  branchId,
  onClose,
  triggerRef,
}: {
  staff: StaffMember;
  branchId?: string;
  onClose: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function deactivate() {
    if (pending) return;
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
    toast.add({ type: "success", title: "Staff account deactivated." });
    onClose();
    router.refresh();
  }

  return (
    <AlertDialog
      open
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <AlertDialogContent
        data-coms-ui="operational"
        finalFocus={triggerRef}
        className="gap-5 p-6 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md"
      >
        <AlertDialogHeader className="place-items-start gap-2 text-left">
          <AlertDialogTitle className="text-xl font-semibold wrap-anywhere">
            Deactivate {staff.full_name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The account will lose access to COMS and its active sessions will be
            revoked.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter className="-mx-6 -mb-6 px-6 py-4 [&_button]:h-10">
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
