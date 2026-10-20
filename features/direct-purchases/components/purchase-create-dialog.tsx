"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, XIcon } from "lucide-react";
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
import type { PurchaseStock } from "../schemas/purchase.schema";
import {
  addPurchaseQuantity,
  isPurchaseDecimal,
  purchaseAmount,
} from "../services/purchase-totals";
import { PurchaseEntry } from "./purchase-entry";
import { PurchaseSummary } from "./purchase-summary";
import styles from "./purchase-create.module.css";

function ReviewHeading() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <h3 ref={heading} tabIndex={-1} className="sr-only outline-none">
      Review restock
    </h3>
  );
}

export function PurchaseCreateDialog({
  onClose,
  initialStock = null,
}: {
  onClose: () => void;
  initialStock?: PurchaseStock | null;
}) {
  const form = usePurchaseForm(onClose, initialStock);
  const [discard, setDiscard] = useState(false);
  function close() {
    if (form.pending) return;
    if (form.dirty) setDiscard(true);
    else onClose();
  }
  const review = form.review;
  const completeLines = form.lines.filter(
    (line) =>
      isPurchaseDecimal(line.quantity_received) &&
      isPurchaseDecimal(line.unit_cost),
  );
  const runningTotal = purchaseAmount(completeLines) ?? "0.00";
  const itemCount = form.lines.filter((line) => line.stock).length;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        overlayClassName={`${styles.overlay} bg-black/30 supports-backdrop-filter:backdrop-blur-xs`}
        className={`${styles.modal} flex max-h-[min(90dvh,48rem)] min-h-0 w-full flex-col gap-0 overflow-clip rounded-2xl p-0 shadow-xl sm:max-w-3xl`}
      >
        <DialogHeader className="relative shrink-0 px-5 pt-6 pb-5 pr-16 sm:px-6 sm:pr-16">
          <DialogTitle className="text-xl leading-tight font-semibold tracking-tight">
            {review ? "Review restock" : "Restock"}
          </DialogTitle>
          <DialogDescription
            className={review ? "text-sm text-muted-foreground" : "sr-only"}
          >
            {review
              ? "Confirming adds these quantities to commissary stock."
              : "Record stock bought directly from a store."}
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-muted-foreground"
            aria-label="Close Restock"
            disabled={form.pending}
            onClick={close}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </DialogHeader>
        <form
          onSubmit={form.submit}
          className="flex min-h-0 flex-1 flex-col"
          aria-busy={form.pending}
          noValidate
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
            {review ? (
              <>
                <ReviewHeading />
                <PurchaseSummary
                  showTotal={false}
                  purchase={{
                    ...review,
                    store_name: review.store_name || null,
                    receipt_number: review.receipt_number || null,
                    notes: review.notes || null,
                    total_cost: total(review),
                    items: review.items.map((item, index) => {
                      const stock = form.lines[index].stock!;
                      return {
                        ...item,
                        stock_item_name: stock.stock_item_name,
                        unit: stock.unit,
                        line_total: lineTotal(
                          item.quantity_received,
                          item.unit_cost,
                        ),
                        stock_after:
                          stock.quantity_on_hand === null
                            ? null
                            : addPurchaseQuantity(
                                stock.quantity_on_hand,
                                item.quantity_received,
                              ),
                      };
                    }),
                  }}
                />
              </>
            ) : (
              <PurchaseEntry form={form} />
            )}
            {form.error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
              >
                {form.error}
              </p>
            )}
          </div>
          <DialogFooter className="m-0 shrink-0 flex-row flex-wrap items-center justify-between gap-3 rounded-b-2xl bg-muted/20 px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <div aria-live="polite" className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"} · Total
              </p>
              <p className="text-lg leading-tight font-semibold tabular-nums">
                ₱{review ? purchaseAmount(review.items) : runningTotal}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 px-4"
                disabled={form.pending}
                onClick={() => (review ? form.setReview(null) : close())}
              >
                {review ? "Back to edit" : "Cancel"}
              </Button>
              {review ? (
                <Button
                  type="button"
                  className="min-h-11 gap-2 px-4"
                  disabled={form.pending}
                  onClick={form.confirm}
                >
                  {form.pending && (
                    <LoaderCircle
                      className="animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  )}
                  {form.pending ? "Restocking…" : "Confirm restock"}
                </Button>
              ) : (
                <Button type="submit" className="min-h-11 gap-2 px-4">
                  Review restock
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent data-coms-ui="operational">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard restock?</AlertDialogTitle>
            <AlertDialogDescription>
              The items you entered will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onClose}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
