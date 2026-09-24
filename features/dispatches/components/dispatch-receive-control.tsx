"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { receiveDispatchSchema } from "@/features/dispatches/schemas/dispatch.schema";
import {
  isDecimalQuantityWithinLimit,
  isPositiveDecimalQuantity,
} from "@/features/dispatches/services/decimal-quantity";
import type {
  Dispatch,
  DispatchReceiveAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchDraftDiscardConfirmation } from "./dispatch-draft-discard-confirmation";
import { DispatchQuantityFields } from "./dispatch-quantity-fields";
import { DispatchTransitionSheet } from "./dispatch-transition-sheet";

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
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const eligibleItems = dispatch.items.filter((item) =>
    isPositiveDecimalQuantity(item.quantity_in_transit),
  );

  if (eligibleItems.length === 0) return null;

  function requestClose() {
    if (pending) return;
    if (Object.values(quantities).some((quantity) => quantity.length > 0)) {
      setConfirmDiscard(true);
      return;
    }
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true);
      setError("");
      return;
    }
    requestClose();
  }

  function discardDraft() {
    setQuantities({});
    setError("");
    retry.current = null;
    setConfirmDiscard(false);
    setOpen(false);
  }

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
    <>
      <DispatchTransitionSheet
        triggerLabel="Receive stock"
        title="Record branch receipt"
        description="Enter what arrived now. You can record another partial receipt for the remaining quantities later."
        formLabel="Record branch receipt"
        submitLabel="Confirm receipt"
        pendingLabel="Recording…"
        open={open}
        pending={pending}
        error={error}
        onOpenChange={handleOpenChange}
        onCancel={requestClose}
        onSubmit={submit}
      >
        <DispatchQuantityFields
          items={eligibleItems}
          quantities={quantities}
          quantityVerb="received"
          disabled={pending}
          onQuantityChange={(itemId, value) =>
            setQuantities((current) => ({ ...current, [itemId]: value }))
          }
        />
      </DispatchTransitionSheet>
      <DispatchDraftDiscardConfirmation
        open={confirmDiscard}
        title="Discard receipt draft?"
        description="The quantities entered for this partial receipt will be discarded."
        discardLabel="Discard receipt"
        onOpenChange={setConfirmDiscard}
        onDiscard={discardDraft}
      />
    </>
  );
}
