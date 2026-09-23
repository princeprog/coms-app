"use client";

import { useRef, useState } from "react";
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
import type { SaleVoidAction } from "@/features/sales/types/sale.types";

export function SaleVoidControl({
  branchId,
  saleId,
  action,
}: {
  branchId: string;
  saleId: string;
  action: SaleVoidAction;
}) {
  const router = useRouter();
  const retry = useRef<{ reason: string; key: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function confirmVoid(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError("Enter a reason to void this sale.");
      return;
    }

    if (retry.current?.reason !== normalizedReason) {
      retry.current = {
        reason: normalizedReason,
        key: crypto.randomUUID(),
      };
    }

    setPending(true);
    setError("");
    try {
      const result = await action(
        branchId,
        saleId,
        { reason: normalizedReason },
        retry.current.key,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      retry.current = null;
      setOpen(false);
      setReason("");
      router.refresh();
    } catch {
      setError("COMS could not void this sale. Review the reason and retry.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setOpen(nextOpen);
        if (nextOpen) {
          setReason("");
          setError("");
          retry.current = null;
        }
      }}
    >
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" />}
      >
        Void sale
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void this sale?</AlertDialogTitle>
          <AlertDialogDescription>
            COMS will reverse this sale&apos;s stock consumption and record your
            reason. Payment and refunds are handled outside COMS.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`void-reason-${saleId}`}
            className="text-sm font-medium"
          >
            Void reason
          </label>
          <textarea
            id={`void-reason-${saleId}`}
            className="min-h-24 w-full rounded-3xl border bg-input/50 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            maxLength={500}
            required
            value={reason}
            disabled={pending}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={pending || !reason.trim()}
            onClick={confirmVoid}
          >
            {pending ? "Voiding…" : "Confirm void"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
