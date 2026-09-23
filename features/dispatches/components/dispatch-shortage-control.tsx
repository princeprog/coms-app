"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { closeDispatchShortageSchema } from "@/features/dispatches/schemas/dispatch.schema";
import {
  isDecimalQuantityWithinLimit,
  isPositiveDecimalQuantity,
} from "@/features/dispatches/services/decimal-quantity";
import type {
  Dispatch,
  DispatchShortageAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchQuantityFields } from "./dispatch-quantity-fields";
import { DispatchShortageReasonField } from "./dispatch-shortage-reason-field";

export function DispatchShortageControl({
  dispatch,
  action,
}: {
  dispatch: Dispatch;
  action: DispatchShortageAction;
}) {
  const router = useRouter();
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const eligibleItems = dispatch.items.filter((item) =>
    isPositiveDecimalQuantity(item.quantity_in_transit),
  );

  if (eligibleItems.length === 0) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (!reason.trim()) {
      setError("Enter a reason for closing the shortage.");
      return;
    }
    const input = {
      reason,
      items: eligibleItems
        .map((item) => ({
          dispatch_item_id: item.id,
          quantity_closed: (quantities[item.id] ?? "").trim(),
        }))
        .filter((item) => item.quantity_closed !== ""),
    };
    if (input.items.length === 0) {
      setError("Enter at least one positive shortage quantity.");
      return;
    }

    const parsed = closeDispatchShortageSchema.safeParse(input);
    if (!parsed.success) {
      setError(
        "Enter a reason of 500 characters or fewer and positive decimals.",
      );
      return;
    }

    const overLimit = parsed.data.items.find((closed) => {
      const item = eligibleItems.find(
        (candidate) => candidate.id === closed.dispatch_item_id,
      );
      return (
        !item ||
        !isDecimalQuantityWithinLimit(
          closed.quantity_closed,
          item.quantity_in_transit,
        )
      );
    });
    if (overLimit) {
      const item = eligibleItems.find(
        (candidate) => candidate.id === overLimit.dispatch_item_id,
      );
      setError(
        `${item?.stock_item_name ?? "Shortage quantity"} cannot exceed ${item?.quantity_in_transit ?? "the remaining"} ${item?.unit ?? "quantity"} remaining in transit.`,
      );
      return;
    }

    const fingerprint = JSON.stringify(parsed.data);
    if (retry.current?.fingerprint !== fingerprint) {
      retry.current = {
        fingerprint,
        key: globalThis.crypto.randomUUID(),
      };
    }

    setError("");
    setPending(true);
    let result: Awaited<ReturnType<DispatchShortageAction>>;
    try {
      result = await action(dispatch.id, parsed.data, retry.current.key);
    } catch {
      result = {
        ok: false,
        error: "COMS could not close this shortage. Try again.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    retry.current = null;
    setReason("");
    setQuantities({});
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setOpen(nextOpen);
        if (nextOpen) setError("");
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            Close shortage
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Close undelivered quantities?</DialogTitle>
          <DialogDescription>
            Record what will not arrive and why. Closed quantities stay out of
            branch inventory and will no longer be in transit.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <DispatchShortageReasonField
            dispatchId={dispatch.id}
            reason={reason}
            disabled={pending}
            onReasonChange={setReason}
          />
          <DispatchQuantityFields
            items={eligibleItems}
            quantities={quantities}
            quantityVerb="shortage closed"
            disabled={pending}
            onQuantityChange={(itemId, value) =>
              setQuantities((current) => ({ ...current, [itemId]: value }))
            }
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Closing…" : "Confirm shortage closure"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
