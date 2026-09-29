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
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { Supplier } from "@/features/suppliers/types/supplier.types";
import type { SupplierReceiptCreateAction } from "@/features/supplier-receipts/types/supplier-receipt.types";
import { SupplierReceiptCreateForm } from "./supplier-receipt-create-form";

export function SupplierReceiptCreateDialog({
  suppliers,
  stockItems,
  action,
}: {
  suppliers: Supplier[];
  stockItems: StockItem[];
  action: SupplierReceiptCreateAction;
}) {
  const router = useRouter();
  const { open, openDialog, closeDialog } = useQuickCreateDialog();
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    closeDialog();
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) openDialog();
          else requestClose();
        }}
      >
        <SheetTrigger
          render={
            <Button
              type="button"
              className="h-auto min-h-9 max-w-full whitespace-normal text-center leading-snug"
            >
              Record supplier delivery
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
            <SheetTitle>Record supplier delivery</SheetTitle>
            <SheetDescription>
              Enter the delivered items. After confirmation, commissary
              inventory updates immediately and the supplier record is final.
            </SheetDescription>
          </SheetHeader>
          <SupplierReceiptCreateForm
            suppliers={suppliers}
            stockItems={stockItems}
            action={action}
            onPendingChange={setPending}
            onDirtyChange={setDirty}
            onCancel={requestClose}
            onCreated={(id) => {
              setDirty(false);
              closeDialog();
              router.push("/receipts/" + id);
            }}
          />
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent data-coms-ui="operational">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard delivery details?</AlertDialogTitle>
            <AlertDialogDescription>
              Your unsaved supplier and item entries will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => {
                setDirty(false);
                setConfirmDiscard(false);
                closeDialog();
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
