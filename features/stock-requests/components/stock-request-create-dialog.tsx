"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { StockRequestCreateAction } from "@/features/stock-requests/types/stock-request.types";
import { StockRequestCreateForm } from "./stock-request-create-form";

export function StockRequestCreateDialog({
  branches,
  stockItems,
  selectedBranchId,
  action,
}: {
  branches: Branch[];
  stockItems: StockItem[];
  selectedBranchId?: string;
  action: StockRequestCreateAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    setOpen(false);
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) setOpen(true);
          else requestClose();
        }}
      >
        <SheetTrigger
          render={<Button type="button">New stock request</Button>}
        />
        <SheetContent
          data-coms-ui="operational"
          side="right"
          showCloseButton
          className="h-full w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b pr-16">
            <SheetTitle>Create stock request</SheetTitle>
            <SheetDescription>
              Request stock for an assigned branch. Inventory changes only when
              an approved request is dispatched.
            </SheetDescription>
          </SheetHeader>
          <StockRequestCreateForm
            branches={branches}
            stockItems={stockItems}
            selectedBranchId={selectedBranchId}
            action={action}
            onPendingChange={setPending}
            onDirtyChange={setDirty}
            onCancel={requestClose}
            onCreated={(id) => {
              setDirty(false);
              setOpen(false);
              router.push("/replenishment/" + id);
            }}
          />
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent data-coms-ui="operational">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard stock request?</AlertDialogTitle>
            <AlertDialogDescription>
              Your selected branch, stock items, and quantities will be
              discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => {
                setDirty(false);
                setConfirmDiscard(false);
                setOpen(false);
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
