"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  reportDispatchDiscrepancySchema,
  requestDispatchRecountSchema,
} from "@/features/dispatches/schemas/dispatch.schema";
import type {
  Dispatch,
  DispatchDiscrepancyAction,
} from "@/features/dispatches/types/dispatch.types";
import { DispatchDraftDiscardConfirmation } from "./dispatch-draft-discard-confirmation";
import { DispatchTransitionSheet } from "./dispatch-transition-sheet";

type Mode = "report" | "recount";

export function DispatchDiscrepancyControl({
  dispatch,
  mode,
  action,
}: {
  dispatch: Dispatch;
  mode: Mode;
  action: DispatchDiscrepancyAction;
}) {
  const router = useRouter();
  const retry = useRef<{ fingerprint: string; key: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const isReport = mode === "report";
  const triggerLabel = isReport ? "Report discrepancy" : "Request recount";
  const label = isReport
    ? "What was missing from the delivery?"
    : "Reason for recount";
  const description = isReport
    ? "Record the difference after saving the quantity that arrived. The receipt remains part of the permanent history."
    : "Ask the branch to count the remaining dispatched stock again. Enter a reason that will be saved in the audit history.";

  function requestClose() {
    if (pending) return;
    if (note.trim()) {
      setConfirmDiscard(true);
      return;
    }
    setOpen(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = isReport
      ? reportDispatchDiscrepancySchema.safeParse({ note })
      : requestDispatchRecountSchema.safeParse({ reason: note });
    if (!parsed.success) {
      setError("Enter a note of 1 to 500 characters.");
      return;
    }
    const fingerprint = JSON.stringify(parsed.data);
    if (retry.current?.fingerprint !== fingerprint) {
      retry.current = { fingerprint, key: globalThis.crypto.randomUUID() };
    }
    setPending(true);
    setError("");
    let result: Awaited<ReturnType<DispatchDiscrepancyAction>>;
    try {
      result = await action(dispatch.id, parsed.data, retry.current.key);
    } catch {
      result = {
        ok: false,
        error: "COMS could not save this dispatch note. Try again.",
      };
    }
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    retry.current = null;
    setNote("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <DispatchTransitionSheet
        triggerLabel={triggerLabel}
        title={
          isReport ? "Report a receipt discrepancy" : "Request a branch recount"
        }
        description={description}
        formLabel={triggerLabel}
        submitLabel={isReport ? "Submit discrepancy" : "Send recount request"}
        pendingLabel={isReport ? "Saving…" : "Requesting…"}
        open={open}
        pending={pending}
        error={error}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true);
            setError("");
          } else requestClose();
        }}
        onCancel={requestClose}
        onSubmit={(event) => void submit(event)}
      >
        <div className="grid gap-2">
          <Label htmlFor={`dispatch-discrepancy-${dispatch.id}`}>{label}</Label>
          <Textarea
            id={`dispatch-discrepancy-${dispatch.id}`}
            value={note}
            maxLength={500}
            required
            disabled={pending}
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
          />
          <p className="text-xs text-muted-foreground">
            This note becomes part of the dispatch history.
          </p>
        </div>
      </DispatchTransitionSheet>
      <DispatchDraftDiscardConfirmation
        open={confirmDiscard}
        title="Discard this note?"
        description="The note you entered will be discarded."
        discardLabel="Discard note"
        onOpenChange={setConfirmDiscard}
        onDiscard={() => {
          setNote("");
          setError("");
          retry.current = null;
          setConfirmDiscard(false);
          setOpen(false);
        }}
      />
    </>
  );
}
