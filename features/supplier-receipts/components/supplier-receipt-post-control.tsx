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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { SupplierReceiptPostResult } from "@/features/supplier-receipts/types/supplier-receipt.types";

export type SupplierReceiptPostAction = (
  id: string,
) => Promise<SupplierReceiptPostResult>;

export function SupplierReceiptPostControl({
  receiptId,
  action,
  onComplete,
}: {
  receiptId: string;
  action: SupplierReceiptPostAction;
  onComplete: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function postReceipt() {
    setError("");
    setPending(true);
    let result: SupplierReceiptPostResult;
    try {
      result = await action(receiptId);
    } catch {
      result = {
        ok: false,
        error: "COMS could not post this receipt. Try again.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    onComplete();
    router.refresh();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setOpen(nextOpen);
        if (nextOpen) setError("");
      }}
    >
      <AlertDialogTrigger
        render={<Button type="button">Post receipt</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Post this receipt to inventory?</AlertDialogTitle>
          <AlertDialogDescription>
            Posting adds the received quantities to commissary inventory. Posted
            receipts cannot be edited.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void postReceipt();
            }}
          >
            {pending ? "Posting…" : "Confirm posting"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
