"use client";

import type { FormEvent, ReactNode } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShiftDialogShell({
  title,
  description,
  pending,
  onClose,
  onSubmit,
  children,
  footer,
}: {
  title: string;
  description: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        overlayClassName="bg-black/30 supports-backdrop-filter:backdrop-blur-xs"
        className="flex max-h-[min(90dvh,40rem)] w-full flex-col gap-0 overflow-clip rounded-2xl p-0 shadow-xl sm:max-w-md"
      >
        <DialogHeader className="relative shrink-0 px-6 pt-6 pb-4 pr-16">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-muted-foreground"
            aria-label={`Close ${title}`}
            disabled={pending}
            onClick={onClose}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </DialogHeader>
        <form
          onSubmit={onSubmit}
          noValidate
          aria-busy={pending}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            {children}
          </div>
          <DialogFooter className="m-0 shrink-0 gap-2 rounded-b-2xl bg-muted/20 px-6 py-4">
            {footer}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
