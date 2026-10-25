"use client";

import type { FormEvent, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

/** Shared layout for the Create and Edit branch modals. */
export function BranchDialogFrame({
  open,
  title,
  description,
  pending,
  error,
  errorTitle,
  submitLabel,
  pendingLabel,
  onRequestClose,
  onSubmit,
  children,
  after,
}: {
  open: boolean;
  title: string;
  description: string;
  pending: boolean;
  error: string;
  errorTitle: string;
  submitLabel: string;
  pendingLabel: string;
  onRequestClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  /** Rendered inside the dialog, after the form (e.g. a discard confirmation). */
  after?: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onRequestClose();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        className="flex max-h-[90dvh] min-h-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-[40rem]"
      >
        <DialogHeader className="shrink-0 px-5 py-5 sm:px-7 sm:py-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Separator />
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
            {children}
          </div>
          {error && (
            <Alert
              variant="destructive"
              className="mx-5 mb-3 w-auto shrink-0 sm:mx-7"
            >
              <CircleAlert />
              <AlertTitle>{errorTitle}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="m-0 shrink-0 flex-row bg-muted/30 px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 sm:min-w-24 sm:flex-none"
              disabled={pending}
              onClick={onRequestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 flex-1 sm:min-w-36 sm:flex-none"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {pendingLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
        {after}
      </DialogContent>
    </Dialog>
  );
}
