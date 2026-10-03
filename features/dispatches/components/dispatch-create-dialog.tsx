"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
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
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  optionsIssue:
    "permissions" | "forbidden" | "unavailable" | "sending-permission" | null;
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
          ? "Branch and stock item options could not be loaded. Close this dialog and refresh to try again."
          : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) openDialog();
        else requestClose();
      }}
    >
      {canCreate && (
        <DialogTrigger
          render={<Button type="button">Create dispatch</Button>}
        />
      )}
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        className="flex max-h-[min(90dvh,48rem)] min-h-0 w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="relative shrink-0 gap-1 border-b px-5 pt-6 pb-4 sm:px-8 sm:pt-7">
          <DialogTitle className="pr-10 text-xl font-semibold">
            Create dispatch
          </DialogTitle>
          <DialogDescription className="pr-10">
            Choose an active branch and the stock items and quantities to send.
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-5 right-5 sm:right-7"
            aria-label="Close Create dispatch"
            disabled={pending}
            onClick={requestClose}
          >
            <XIcon />
          </Button>
        </DialogHeader>
        {!canCreate ? (
          <p className="m-6 rounded-lg border p-4 text-sm">
            Creating a new dispatch requires both dispatch creation and sending
            permissions. Ask an administrator to review your role.
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
        ) : (
          <DispatchCreateForm
            key={formKey}
            options={options}
            action={action}
            onPendingChange={setPending}
            onDirtyChange={setDirty}
            onCancel={requestClose}
            onCreated={(id) => {
              toast.add({
                title: "Dispatch sent",
                description:
                  "The dispatch is in transit. Branch staff can confirm actual receipt.",
              });
              setDirty(false);
              closeDialog();
              router.push(`/dispatches/${id}`);
            }}
          />
        )}
      </DialogContent>
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
    </Dialog>
  );
}
