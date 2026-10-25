"use client";

import { useState, type RefObject } from "react";
import { Check, Copy } from "lucide-react";
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
import { resetStaffPasswordAction } from "@/features/staff/services/staff-actions";
import type { StaffMember } from "@/features/staff/types/staff.types";

export function StaffPasswordResetControl({
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  async function reset() {
    if (pending) return;
    setError("");
    setPending(true);
    const result = await resetStaffPasswordAction(staff.id, branchId).catch(
      () => ({
        ok: false as const,
        error: "COMS could not reset the password. Try again.",
      }),
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPassword(result.temporaryPassword);
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
        {password ? (
          <>
            <AlertDialogHeader className="place-items-start gap-2 text-left">
              <AlertDialogTitle className="text-xl font-semibold wrap-anywhere">
                Temporary password
              </AlertDialogTitle>
              <AlertDialogDescription>
                Give this to {staff.full_name}. It is shown only once, and they
                must choose a new password when they sign in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <code className="min-w-0 flex-1 font-mono text-base tracking-wider wrap-anywhere select-all">
                {password}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  setError("");
                  try {
                    await navigator.clipboard.writeText(password);
                    setCopied(true);
                  } catch {
                    setError(
                      "Could not copy. Select and copy the temporary password manually.",
                    );
                  }
                }}
              >
                {copied ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <AlertDialogFooter className="-mx-6 -mb-6 px-6 py-4 [&_button]:h-10">
              <AlertDialogCancel>Done</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader className="place-items-start gap-2 text-left">
              <AlertDialogTitle className="text-xl font-semibold wrap-anywhere">
                Reset {staff.full_name}&apos;s password?
              </AlertDialogTitle>
              <AlertDialogDescription>
                They will be signed out everywhere and must sign in with a
                temporary password, then choose a new one.
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
                disabled={pending}
                onClick={() => void reset()}
              >
                {pending ? "Resetting…" : "Reset password"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
