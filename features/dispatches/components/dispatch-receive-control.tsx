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
import { Input } from "@/components/ui/input";
import { receiveDispatchSchema } from "@/features/dispatches/schemas/dispatch.schema";
import {
  isDecimalQuantityWithinLimit,
  isPositiveDecimalQuantity,
} from "@/features/dispatches/services/decimal-quantity";
import type {
  Dispatch,
  DispatchReceiveAction,
} from "@/features/dispatches/types/dispatch.types";

export function DispatchReceiveControl({
  dispatch,
  action,
}: {
  dispatch: Dispatch;
  action: DispatchReceiveAction;
}) {
  const router = useRouter();
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const eligibleItems = dispatch.items.filter((item) =>
    isPositiveDecimalQuantity(item.quantity_in_transit),
  );

  if (eligibleItems.length === 0) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const input = {
      items: eligibleItems
        .map((item) => ({
          dispatch_item_id: item.id,
          quantity_received: (quantities[item.id] ?? "").trim(),
        }))
        .filter((item) => item.quantity_received !== ""),
    };
    if (input.items.length === 0) {
      setError("Enter at least one positive quantity.");
      return;
    }

    const parsed = receiveDispatchSchema.safeParse(input);
    if (!parsed.success) {
      setError("Enter a positive decimal quantity for each item.");
      return;
    }

    const overLimit = parsed.data.items.find((received) => {
      const item = eligibleItems.find(
        (candidate) => candidate.id === received.dispatch_item_id,
      );
      return (
        !item ||
        !isDecimalQuantityWithinLimit(
          received.quantity_received,
          item.quantity_in_transit,
        )
      );
    });
    if (overLimit) {
      const item = eligibleItems.find(
        (candidate) => candidate.id === overLimit.dispatch_item_id,
      );
      setError(
        `${item?.stock_item_name ?? "Received quantity"} cannot exceed ${item?.quantity_in_transit ?? "the remaining"} ${item?.unit ?? "quantity"} remaining in transit.`,
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
    let result: Awaited<ReturnType<DispatchReceiveAction>>;
    try {
      result = await action(dispatch.id, parsed.data, retry.current.key);
    } catch {
      result = {
        ok: false,
        error: "COMS could not record this receipt. Try again.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    retry.current = null;
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
            Receive stock
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record branch receipt</DialogTitle>
          <DialogDescription>
            Enter what arrived now. You can record another partial receipt for
            the remaining quantities later.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="flex flex-col gap-4">
            {eligibleItems.map((item) => {
              const inputId = `receive-${item.id}`;
              const hintId = `receive-hint-${item.id}`;
              return (
                <div key={item.id} className="flex flex-col gap-2">
                  <label className="font-medium" htmlFor={inputId}>
                    {item.stock_item_name} received ({item.unit})
                  </label>
                  <p id={hintId} className="text-sm text-muted-foreground">
                    {item.quantity_in_transit} {item.unit} currently in transit
                  </p>
                  <Input
                    id={inputId}
                    aria-describedby={hintId}
                    autoComplete="off"
                    inputMode="decimal"
                    disabled={pending}
                    value={quantities[item.id] ?? ""}
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
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
            <Button type="submit" disabled={pending}>
              {pending ? "Recording…" : "Confirm receipt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
