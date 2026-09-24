"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryAdjustmentForm } from "@/features/inventory/components/inventory-adjustment-form";
import { InventoryDiscardConfirmation } from "@/features/inventory/components/inventory-discard-confirmation";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const keyForRetry = useRef<{ fingerprint: string; key: string } | null>(null);

  function closeAfterDiscard() {
    setDiscardOpen(false);
    setDirty(false);
    setError("");
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function requestClose() {
    if (pending) return;
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    setError("");
    setOpen(false);
  }

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
    setDirty(false);
    setOpen(false);
    onComplete("Inventory adjustment recorded.");
    router.refresh();
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        Adjust {item.stock_item_name}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) setOpen(true);
          else requestClose();
        }}
      >
        <DialogContent data-coms-ui="operational" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust {item.stock_item_name}</DialogTitle>
            <DialogDescription>
              On hand: {item.quantity_on_hand} {item.unit}. Positive quantities
              add stock; negative quantities remove stock.
            </DialogDescription>
          </DialogHeader>
          <InventoryAdjustmentForm
            item={item}
            pending={pending}
            error={error}
            onSubmit={submit}
            onChange={() => setDirty(true)}
            onCancel={requestClose}
          />
        </DialogContent>
      </Dialog>
      <InventoryDiscardConfirmation
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        onDiscard={closeAfterDiscard}
      />
    </>
  );
}
