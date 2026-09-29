"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuickCreateDialog } from "@/components/layout/use-quick-create-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  DispatchCreateAction,
  DispatchCreateOptions,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchCreateForm } from "./dispatch-create-form";

export function DispatchCreateDialog({
  canCreate,
  options,
  optionsIssue,
  action,
}: {
  canCreate: boolean;
  options: DispatchCreateOptions | null;
  optionsIssue: "permissions" | "forbidden" | "unavailable" | null;
  action: DispatchCreateAction;
}) {
  const router = useRouter();
  const { open, openDialog, closeDialog } = useQuickCreateDialog();
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    closeDialog();
  }

  const catalogIssue =
    optionsIssue === "permissions"
      ? "Your role needs permission to view branches and stock items before creating a dispatch."
      : optionsIssue === "forbidden"
        ? "You do not have access to the dispatch catalogs. Ask an administrator to review your permissions."
        : optionsIssue === "unavailable"
          ? "Branch and stock item options could not be loaded. Close this sheet and refresh to try again."
          : null;

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) openDialog();
          else requestClose();
        }}
      >
        {canCreate && (
          <SheetTrigger
            render={<Button type="button">Create dispatch</Button>}
          />
        )}
        <SheetContent
          data-coms-ui="operational"
          side="right"
          showCloseButton
          className="h-full w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b pr-16">
            <SheetTitle>Create dispatch</SheetTitle>
            <SheetDescription>
              Choose an active branch and the stock items and quantities to send.
            </SheetDescription>
          </SheetHeader>
          {!canCreate ? (
            <p className="m-6 rounded-lg border p-4 text-sm">
              Your role does not have permission to create dispatches.
            </p>
          ) : catalogIssue ? (
            <p role="alert" className="m-6 rounded-lg border p-4 text-sm">
              {catalogIssue}
            </p>
          ) : !options?.branches.length ? (
            <p role="status" className="m-6 rounded-lg border p-4 text-sm">
              No active branch is available to your account. Assign an active
              branch before creating a dispatch.
            </p>
          ) : !options.stockItems.length ? (
            <p role="status" className="m-6 rounded-lg border p-4 text-sm">
              There are no active stock items to dispatch. Add or activate a
              stock item first.
            </p>
          ) : (
            <DispatchCreateForm
              key={formKey}
              options={options}
              action={action}
              onPendingChange={setPending}
              onDirtyChange={setDirty}
              onCancel={requestClose}
              onCreated={(id) => {
                setDirty(false);
                closeDialog();
                router.push(`/dispatches/${id}`);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent data-coms-ui="operational">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard dispatch details?</AlertDialogTitle>
            <AlertDialogDescription>
              Your branch, stock items, and quantities have not been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => {
                setDirty(false);
                setFormKey((value) => value + 1);
                setConfirmDiscard(false);
                closeDialog();
              }}
            >
              Discard details
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
