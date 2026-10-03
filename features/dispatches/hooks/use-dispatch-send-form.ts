"use client";
import { useRef, useState, type FormEvent } from "react";
import { createDispatchSchema } from "../schemas/dispatch.schema";
import type {
  DispatchCreateAction,
  DispatchMutationResult,
  CreateDispatchInput,
} from "../types/dispatch.types";
import type { DispatchCreateLine } from "../components/dispatch-create-line-fields";
export type DispatchSendFormCallbacks = {
  action: DispatchCreateAction;
  onPendingChange: (value: boolean) => void;
  onDirtyChange: (value: boolean) => void;
  onCreated: (id: string) => void;
};
export function useDispatchSendForm({
  action,
  onPendingChange,
  onDirtyChange,
  onCreated,
}: DispatchSendFormCallbacks) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [branchId, setBranchId] = useState("");
  const [lines, setLines] = useState<DispatchCreateLine[]>([
    { key: 1, stock_item_id: "", quantity_dispatched: "" },
  ]);
  const [review, setReview] = useState<CreateDispatchInput | null>(null);
  const submitting = useRef(false);
  const nextLineKey = useRef(2);
  const keyForRetry = useRef<{ fingerprint: string; key: string } | null>(null);

  function updateLine(
    key: number,
    field: "stock_item_id" | "quantity_dispatched",
    value: string,
  ) {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, [field]: value } : line,
      ),
    );
    onDirtyChange(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    const parsed = createDispatchSchema.safeParse({
      branch_id: branchId,
      items: lines.map(({ stock_item_id, quantity_dispatched }) => ({
        stock_item_id,
        quantity_dispatched: quantity_dispatched.trim(),
      })),
    });
    if (!parsed.success) {
      setError(
        "Choose a branch, add unique stock items, and enter a positive decimal quantity for each line.",
      );
      return;
    }

    if (!review) {
      setReview(parsed.data);
      return;
    }
    // Compare the submitted meaning, not intermediate edits or decimal formatting.
    const fingerprint = JSON.stringify({
      branch_id: parsed.data.branch_id,
      items: parsed.data.items
        .map(({ stock_item_id, quantity_dispatched }) => ({
          stock_item_id,
          quantity_dispatched: quantity_dispatched
            .replace(/^0+(?=\d)/, "")
            .replace(/(\.\d*?)0+$/, "$1")
            .replace(/\.$/, ""),
        }))
        .sort((a, b) => a.stock_item_id.localeCompare(b.stock_item_id)),
    });
    if (keyForRetry.current?.fingerprint !== fingerprint) {
      try {
        keyForRetry.current = {
          fingerprint,
          key: globalThis.crypto.randomUUID(),
        };
      } catch {
        setError("This browser cannot safely submit a dispatch.");
        return;
      }
    }

    submitting.current = true;
    setPending(true);
    onPendingChange(true);
    let result: DispatchMutationResult;
    try {
      result = await action(parsed.data, keyForRetry.current.key);
    } catch {
      result = {
        ok: false,
        error:
          "The sending response could not be confirmed. Retry without editing to safely check the same dispatch.",
      };
    }
    submitting.current = false;
    setPending(false);
    onPendingChange(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    keyForRetry.current = null;
    onCreated(result.dispatch_id);
  }

  return {
    pending,
    error,
    branchId,
    setBranchId,
    lines,
    setLines,
    review,
    setReview,
    setError,
    updateLine,
    submit,
    nextLineKey,
  };
}
