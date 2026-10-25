"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DailyReportReturnForm({
  reportId,
  open,
  pending,
  disabled,
  error,
  onOpenChange,
  onConfirm,
  onClearError,
}: {
  reportId: string;
  open: boolean;
  pending: boolean;
  disabled: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
  onClearError: () => void;
}) {
  const [reason, setReason] = useState("");
  const errorId = `daily-report-return-error-${reportId}`;

  function changeOpen(next: boolean) {
    if (pending) return;
    if (!next) setReason("");
    onOpenChange(next);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || disabled || !reason.trim()) return;
    if (await onConfirm(reason.trim())) {
      setReason("");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={pending || disabled}
          />
        }
      >
        Return for correction
      </DialogTrigger>
      <DialogContent
        data-coms-ui="operational"
        className="sm:max-w-lg"
        showCloseButton={!pending}
      >
        <DialogHeader>
          <DialogTitle>Return report for correction</DialogTitle>
          <DialogDescription>
            Tell the branch what needs correcting before they resubmit this
            report.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4" aria-busy={pending}>
          <FieldGroup>
            <Field data-disabled={pending}>
              <FieldLabel htmlFor={`daily-report-return-${reportId}`}>
                Reason for return
              </FieldLabel>
              <Textarea
                id={`daily-report-return-${reportId}`}
                maxLength={500}
                required
                value={reason}
                disabled={pending}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => {
                  setReason(event.target.value);
                  onClearError();
                }}
              />
            </Field>
          </FieldGroup>
          {error && (
            <p id={errorId} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || disabled || !reason.trim()}
            >
              {pending ? "Returning…" : "Confirm return"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
