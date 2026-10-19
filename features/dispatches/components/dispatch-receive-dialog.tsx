"use client";

import type { FormEvent, ReactNode } from "react";
import {
  ArrowRightIcon,
  ClipboardCheckIcon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DispatchReceiveDialog({
  primary,
  confirming,
  open,
  pending,
  error,
  branchName,
  itemCount,
  enteredCount,
  onOpenChange,
  onCancel,
  onSubmit,
  children,
}: {
  primary: boolean;
  confirming: boolean;
  open: boolean;
  pending: boolean;
  error: string;
  branchName: string;
  itemCount: number;
  enteredCount: number;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="lg"
            className="min-h-11"
            variant={primary ? "default" : "outline"}
          />
        }
      >
        Count delivery
      </DialogTrigger>
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        overlayClassName="bg-black/30 supports-backdrop-filter:backdrop-blur-xs"
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-2xl"
      >
        <DialogHeader className="relative shrink-0 flex-row items-center gap-3 p-5 pr-14 sm:gap-4 sm:p-6 sm:pr-16">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background shadow-xs"
          >
            <ClipboardCheckIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <DialogTitle className="text-xl leading-tight font-semibold tracking-tight">
              {confirming ? "Review delivery count" : "Count delivery"}
            </DialogTitle>
            <DialogDescription className="wrap-anywhere">
              {branchName}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            className="absolute top-4 right-4"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            <XIcon />
          </Button>
        </DialogHeader>
        <form
          aria-label="Count delivery"
          aria-busy={pending}
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={onSubmit}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pb-6 sm:px-6">
            {children}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="m-0 shrink-0 gap-3 rounded-b-2xl bg-muted/20 px-5 py-4 sm:items-center sm:px-6">
            <span className="mr-auto hidden text-xs text-muted-foreground sm:block">
              {confirming
                ? "Final review"
                : `${enteredCount} of ${itemCount} items entered`}
            </span>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 px-4 sm:min-h-10"
              disabled={pending}
              onClick={onCancel}
            >
              {confirming ? "Back to edit" : "Cancel"}
            </Button>
            <Button
              type="submit"
              className="min-h-11 gap-2 px-4 sm:min-h-10"
              disabled={pending}
            >
              {pending && (
                <LoaderCircleIcon
                  className="animate-spin"
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              )}
              {pending
                ? "Submitting…"
                : confirming
                  ? "Submit final count"
                  : "Review count"}
              {!pending && !confirming && (
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
