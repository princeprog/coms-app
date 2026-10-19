"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { receiveDispatchSchema } from "@/features/dispatches/schemas/dispatch.schema";
import type {
  Dispatch,
  DispatchReceiveAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchCountReview } from "./dispatch-count-review";
import { DispatchDraftDiscardConfirmation } from "./dispatch-draft-discard-confirmation";
import { DispatchQuantityFields } from "./dispatch-quantity-fields";
import { DispatchReceiveDialog } from "./dispatch-receive-dialog";

export function DispatchReceiveControl({
  dispatch,
  action,
  primary = false,
}: {
  dispatch: Dispatch;
  action: DispatchReceiveAction;
  primary?: boolean;
}) {
  const router = useRouter();
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const items = dispatch.items.filter((item) => item.awaiting_count);

  if (items.length === 0) return null;

  function requestClose() {
    if (pending) return;
    if (note || Object.values(quantities).some((value) => value.length > 0)) {
      setConfirmDiscard(true);
      return;
    }
    setOpen(false);
  }

  function discardDraft() {
    setQuantities({});
    setNote("");
    setError("");
    setConfirming(false);
    retry.current = null;
    setConfirmDiscard(false);
    setOpen(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = receiveDispatchSchema.safeParse({
      items: items.map((item) => ({
        dispatch_item_id: item.id,
        quantity_received: (quantities[item.id] ?? "").trim(),
      })),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    if (!parsed.success) {
      setConfirming(false);
      setError(
        "Enter a count for every item. Use 0 for items that did not arrive.",
      );
      return;
    }
    setError("");
    if (!confirming) {
      setConfirming(true);
      return;
    }

    const fingerprint = JSON.stringify(parsed.data);
    if (retry.current?.fingerprint !== fingerprint)
      retry.current = { fingerprint, key: globalThis.crypto.randomUUID() };
    setPending(true);
    let result: Awaited<ReturnType<DispatchReceiveAction>>;
    try {
      result = await action(dispatch.id, parsed.data, retry.current.key);
    } catch {
      result = {
        ok: false,
        error: "COMS could not record this count. Try again.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    retry.current = null;
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <DispatchReceiveDialog
        primary={primary}
        confirming={confirming}
        open={open}
        pending={pending}
        error={error}
        branchName={dispatch.branch_name}
        itemCount={items.length}
        enteredCount={
          items.filter((item) => quantities[item.id]?.trim()).length
        }
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true);
            setError("");
          } else requestClose();
        }}
        onCancel={() => (confirming ? setConfirming(false) : requestClose())}
        onSubmit={submit}
      >
        {confirming ? (
          <DispatchCountReview
            items={items}
            quantities={quantities}
            note={note}
          />
        ) : (
          <>
            <DispatchQuantityFields
              items={items}
              quantities={quantities}
              disabled={pending}
              onQuantityChange={(itemId, value) =>
                setQuantities((current) => ({ ...current, [itemId]: value }))
              }
            />
            <Field>
              <FieldLabel htmlFor={`dispatch-count-note-${dispatch.id}`}>
                Condition or issues{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Textarea
                id={`dispatch-count-note-${dispatch.id}`}
                maxLength={500}
                rows={2}
                className="min-h-24 resize-y rounded-xl px-3 py-3"
                placeholder="Add a note about this delivery…"
                disabled={pending}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </>
        )}
      </DispatchReceiveDialog>
      <DispatchDraftDiscardConfirmation
        open={confirmDiscard}
        title="Discard this count?"
        description="The quantities and note entered here will be discarded."
        discardLabel="Discard count"
        onOpenChange={setConfirmDiscard}
        onDiscard={discardDraft}
      />
    </>
  );
}
