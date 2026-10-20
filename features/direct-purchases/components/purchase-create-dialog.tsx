"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  calculateSupplierReceiptTotal as total,
  calculateSupplierReceiptLineTotal as lineTotal,
} from "@/features/supplier-receipts/services/supplier-receipt-total";
import { usePurchaseForm } from "../hooks/use-purchase-form";
import { PurchaseEntry } from "./purchase-entry";
import { PurchaseSummary } from "./purchase-summary";
export function PurchaseCreateDialog({ onClose }: { onClose: () => void }) {
  const form = usePurchaseForm(onClose);
  const [discard, setDiscard] = useState(false);
  function close() {
    if (form.pending) return;
    if (form.dirty) setDiscard(true);
    else onClose();
  }
  const review = form.review;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl motion-reduce:animate-none"
        showCloseButton={!form.pending}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>
            {review ? "Review purchase" : "Direct purchase"}
          </DialogTitle>
          <DialogDescription className={review ? "text-sm" : "sr-only"}>
            {review
              ? "Confirming adds these quantities to commissary stock."
              : "Record stock bought directly from a store."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.submit}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="min-h-0 overflow-y-auto px-6 py-5">
            {review ? (
              <PurchaseSummary
                purchase={{
                  ...review,
                  store_name: review.store_name || null,
                  receipt_number: review.receipt_number || null,
                  notes: review.notes || null,
                  total_cost: total(review),
                  items: review.items.map((item, index) => ({
                    ...item,
                    stock_item_name: form.lines[index].stock!.stock_item_name,
                    unit: form.lines[index].stock!.unit,
                    line_total: lineTotal(
                      item.quantity_received,
                      item.unit_cost,
                    ),
                  })),
                }}
              />
            ) : (
              <PurchaseEntry form={form} />
            )}{" "}
            {form.error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {form.error}
              </p>
            )}
          </div>
          <DialogFooter className="m-0 shrink-0 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={form.pending}
              onClick={() => (review ? form.setReview(null) : close())}
            >
              {review ? "Back to edit" : "Cancel"}
            </Button>
            {review ? (
              <Button
                type="button"
                disabled={form.pending}
                onClick={form.confirm}
              >
                {form.pending && (
                  <Loader2
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
                {form.pending ? "Recording purchase..." : "Confirm purchase"}
              </Button>
            ) : (
              <Button type="submit">Review purchase</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard purchase?</AlertDialogTitle>
            <AlertDialogDescription>
              Your unsaved purchase details will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
