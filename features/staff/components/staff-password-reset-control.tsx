"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
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
import { resetStaffPasswordAction } from "@/features/staff/services/staff-actions";
import type { StaffMember } from "@/features/staff/types/staff.types";

export function StaffPasswordResetControl({
  staff,
  branchId,
}: {
  staff: StaffMember;
  branchId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  async function reset() {
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
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) {
          // The password is shown once; never keep it after closing.
          setPassword("");
          setCopied(false);
          setError("");
        }
      }}
    >
      <AlertDialogTrigger
        render={
          <Button type="button" variant="outline" className="w-fit">
            Reset password
          </Button>
        }
      />
      <AlertDialogContent data-coms-ui="operational">
        {password ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Temporary password</AlertDialogTitle>
              <AlertDialogDescription>
                Give this to {staff.full_name}. It is shown only once, and they
                must choose a new password when they sign in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
              <code className="flex-1 font-mono text-lg tracking-wider select-all">
                {password}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard?.writeText(password);
                  setCopied(true);
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
            <AlertDialogFooter>
              <AlertDialogCancel>Done</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
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
            <AlertDialogFooter>
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
