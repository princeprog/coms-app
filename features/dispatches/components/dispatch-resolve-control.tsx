"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { closeDispatchShortageSchema } from "@/features/dispatches/schemas/dispatch.schema";
import { isDecimalQuantityWithinLimit } from "@/features/dispatches/services/decimal-quantity";
import { varianceLines } from "@/features/dispatches/services/dispatch-detail-presentation";
import type {
  Dispatch,
  DispatchResolutionOutcome,
  DispatchShortageAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchDraftDiscardConfirmation } from "./dispatch-draft-discard-confirmation";
import { DispatchResolveFields } from "./dispatch-resolve-fields";
import { DispatchResolveDialog } from "./dispatch-resolve-dialog";

export function DispatchResolveControl({
  dispatch,
  action,
}: {
  dispatch: Dispatch;
  action: DispatchShortageAction;
}) {
  const router = useRouter();
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const lines = varianceLines(dispatch);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [itemId, setItemId] = useState("");
  const [outcome, setOutcome] = useState<DispatchResolutionOutcome | "">("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (lines.length === 0) return null;
  const line =
    lines.find((candidate) => candidate.item.id === itemId) ?? lines[0];
  const amount = quantity.trim();
  const parsed = closeDispatchShortageSchema.safeParse({
    outcome: line.direction === "surplus" ? "SURPLUS" : outcome,
    reason,
    items: [{ dispatch_item_id: line.item.id, quantity_closed: amount }],
  });
  const issues = parsed.error?.issues ?? [];
  const fieldErrors = {
    outcome: issues.some((issue) => issue.path[0] === "outcome")
      ? "Choose what happened to the missing stock."
      : undefined,
    quantity: issues.some((issue) => issue.path.includes("quantity_closed"))
      ? "Enter a quantity greater than zero using numbers and a decimal point only."
      : !isDecimalQuantityWithinLimit(amount, line.amount)
        ? `${line.item.stock_item_name} has only ${line.amount} ${line.item.unit} unresolved.`
        : undefined,
    reason: issues.some((issue) => issue.path[0] === "reason")
      ? reason.trim().length > 500
        ? "Use 500 characters or fewer for the reason."
        : "Enter a reason for this resolution."
      : undefined,
  };

  function selectLine(nextId: string) {
    const next = lines.find((candidate) => candidate.item.id === nextId);
    setItemId(nextId);
    setOutcome(next?.direction === "surplus" ? "SURPLUS" : "");
    setQuantity(next?.amount ?? "");
  }

  function reset() {
    setItemId("");
    setOutcome("");
    setQuantity("");
    setReason("");
    setError("");
    setSubmitted(false);
    retry.current = null;
  }

  function requestClose() {
    if (pending) return;
    if (reason.length > 0) {
      setConfirmDiscard(true);
      return;
    }
    reset();
    setOpen(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setSubmitted(true);
    setError("");
    if (!parsed.success || fieldErrors.quantity) {
      return;
    }
    const fingerprint = JSON.stringify(parsed.data);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, key: globalThis.crypto.randomUUID() };
    setError("");
    setPending(true);
    let result: Awaited<ReturnType<DispatchShortageAction>>;
    try {
      result = await action(dispatch.id, parsed.data, retry.current.key);
    } catch {
      result = {
        ok: false,
        error: "COMS could not resolve this variance. Try again.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <DispatchResolveDialog
        branchName={dispatch.branch_name}
        open={open}
        pending={pending}
        error={error}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) return requestClose();
          selectLine(line.item.id);
          setError("");
          setOpen(true);
        }}
        onCancel={requestClose}
        onSubmit={submit}
      >
        <DispatchResolveFields
          dispatchId={dispatch.id}
          lines={lines}
          line={line}
          outcome={outcome}
          quantity={quantity}
          reason={reason}
          disabled={pending}
          errors={submitted ? fieldErrors : {}}
          onLineChange={selectLine}
          onOutcomeChange={setOutcome}
          onQuantityChange={setQuantity}
          onReasonChange={setReason}
        />
      </DispatchResolveDialog>
      <DispatchDraftDiscardConfirmation
        open={confirmDiscard}
        title="Discard this resolution?"
        description="The outcome and reason entered here will be discarded."
        discardLabel="Discard resolution"
        onOpenChange={setConfirmDiscard}
        onDiscard={() => {
          reset();
          setConfirmDiscard(false);
          setOpen(false);
        }}
      />
    </>
  );
}
