"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createInventoryAdjustmentSchema } from "@/features/inventory/schemas/inventory.schema";
import type {
  InventoryItem,
  InventoryMutationResult,
} from "@/features/inventory/types/inventory.types";

type InventoryAdjustmentTarget =
  { scope: "COMMISSARY" } | { scope: "BRANCH"; branch_id: string };

export type InventoryAdjustmentAction = (
  input: unknown,
  target: unknown,
  idempotencyKey: string,
) => Promise<InventoryMutationResult>;

export function InventoryAdjustmentDialog({
  item,
  target,
  action,
  onComplete,
}: {
  item: InventoryItem;
  target: InventoryAdjustmentTarget;
  action: InventoryAdjustmentAction;
  onComplete: (message: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const keyForRetry = useRef<{ fingerprint: string; key: string } | null>(null);
  const fieldPrefix = `inventory-adjustment-${item.id}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const parsed = createInventoryAdjustmentSchema.safeParse({
      stock_item_id: item.id,
      quantity_delta: String(formData.get("quantity_delta") ?? "").trim(),
      reason: String(formData.get("reason") ?? "").trim(),
    });
    if (!parsed.success) {
      setError("Enter a nonzero decimal quantity and a reason.");
      return;
    }

    const fingerprint = JSON.stringify([parsed.data, target]);
    if (keyForRetry.current?.fingerprint !== fingerprint) {
      try {
        keyForRetry.current = {
          fingerprint,
          key: globalThis.crypto.randomUUID(),
        };
      } catch {
        setError("This browser cannot safely submit an inventory adjustment.");
        return;
      }
    }

    setPending(true);
    let result: InventoryMutationResult;
    try {
      result = await action(parsed.data, target, keyForRetry.current.key);
    } catch {
      result = {
        ok: false,
        error: "COMS could not complete this adjustment. Try again.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    keyForRetry.current = null;
    setOpen(false);
    onComplete("Inventory adjustment recorded.");
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Adjust {item.stock_item_name}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (pending) return;
          setError("");
          setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust {item.stock_item_name}</DialogTitle>
            <DialogDescription>
              On hand: {item.quantity_on_hand} {item.unit}. Positive quantities
              add stock; negative quantities remove stock.
            </DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${fieldPrefix}-quantity`}
                className="text-sm font-medium"
              >
                Quantity change ({item.unit})
              </label>
              <Input
                id={`${fieldPrefix}-quantity`}
                name="quantity_delta"
                type="text"
                inputMode="decimal"
                maxLength={80}
                required
                disabled={pending}
                aria-describedby={`${fieldPrefix}-quantity-help`}
              />
              <p
                id={`${fieldPrefix}-quantity-help`}
                className="text-sm text-muted-foreground"
              >
                Use a positive amount to add stock or a negative amount to
                remove stock.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor={`${fieldPrefix}-reason`}
                className="text-sm font-medium"
              >
                Reason for adjustment
              </label>
              <Textarea
                id={`${fieldPrefix}-reason`}
                name="reason"
                maxLength={500}
                required
                disabled={pending}
              />
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
                {pending ? "Saving…" : "Save adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
