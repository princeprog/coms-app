"use client";

import type { ReactNode, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function DispatchTransitionSheet({
  triggerLabel,
  title,
  description,
  formLabel,
  submitLabel,
  pendingLabel,
  destructive = false,
  open,
  pending,
  error,
  onOpenChange,
  onCancel,
  onSubmit,
  children,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  formLabel: string;
  submitLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  open: boolean;
  pending: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={
          <Button type="button" variant="outline">
            {triggerLabel}
          </Button>
        }
      />
      <SheetContent
        data-coms-ui="operational"
        side="right"
        showCloseButton
        className="h-full w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b pr-16">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form
          aria-label={formLabel}
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={onSubmit}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
            {children}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter className="mt-0 flex-row justify-end border-t bg-background p-4 sm:p-6">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={destructive ? "destructive" : "default"}
              disabled={pending}
            >
              {pending ? pendingLabel : submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
