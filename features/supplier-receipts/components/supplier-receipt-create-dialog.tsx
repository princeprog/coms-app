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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [formKey, setFormKey] = useState(0);

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
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) openDialog();
          else requestClose();
        }}
      >
        <DialogTrigger
          render={
            <Button
              type="button"
              className="h-auto min-h-9 max-w-full whitespace-normal text-center leading-snug"
            >
              Record supplier delivery
            </Button>
          }
        />
        <DialogContent
          data-coms-ui="operational"
          showCloseButton={false}
          className="flex max-h-[min(90dvh,48rem)] min-h-0 w-full flex-col gap-0 overflow-clip p-0 sm:max-w-2xl"
        >
          <DialogHeader className="relative shrink-0 gap-1 border-b p-4 sm:p-6">
            <DialogTitle className="pr-10 text-xl font-semibold">
              Record supplier delivery
            </DialogTitle>
            <DialogDescription className="pr-10">
              Enter the delivered items. After confirmation, commissary
              inventory updates immediately and the supplier record is final.
            </DialogDescription>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4 sm:top-6 sm:right-6"
              aria-label="Close Record supplier delivery"
              disabled={pending}
              onClick={requestClose}
            >
              <XIcon />
            </Button>
          </DialogHeader>
          <SupplierReceiptCreateForm
            key={formKey}
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
        </DialogContent>
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
                  setFormKey((value) => value + 1);
                  closeDialog();
                }}
              >
                Discard changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>
    </>
  );
}
