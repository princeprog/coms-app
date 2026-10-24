"use client";

import type { FormEvent, ReactNode } from "react";
import { ClipboardCheckIcon, XIcon } from "lucide-react";
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

export function DispatchResolveDialog({
  branchName,
  open,
  pending,
  error,
  onOpenChange,
  onCancel,
  onSubmit,
  children,
}: {
  branchName: string;
  open: boolean;
  pending: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button type="button" size="lg" className="min-h-11" />}
      >
        Resolve variance
      </DialogTrigger>
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        overlayClassName="bg-black/30 supports-backdrop-filter:backdrop-blur-xs"
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 shadow-xl sm:max-w-xl"
      >
        <DialogHeader className="relative shrink-0 flex-row items-center gap-3 border-b p-5 pr-14 sm:p-6 sm:pr-16">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40"
          >
            <ClipboardCheckIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <DialogTitle className="text-lg leading-tight font-semibold tracking-tight">
              Resolve a count variance
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
            onClick={onCancel}
          >
            <XIcon />
          </Button>
        </DialogHeader>
        <form
          aria-label="Resolve count variance"
          aria-busy={pending}
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={onSubmit}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 sm:p-6">
            {children}
            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="m-0 shrink-0 gap-2 bg-muted/20 px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" className="min-h-10" disabled={pending}>
              {pending ? "Saving…" : "Confirm resolution"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
