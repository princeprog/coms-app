"use client";
import { defaultReceiveBy, receiveByIso } from "../services/receiving-time";
import { useRef, useState, type FormEvent } from "react";
import {
  createDispatchSchema,
  sendDispatchSchema,
} from "../schemas/dispatch.schema";
import type {
  DispatchCreateAction,
  DispatchMutationResult,
  CreateDispatchInput,
} from "../types/dispatch.types";
import type { DispatchCreateLine } from "../components/dispatch-create-line-fields";
import {
  isDecimalQuantityWithinLimit,
  isPositiveDecimalQuantity,
} from "../services/decimal-quantity";
export type DispatchSendFormCallbacks = {
  availabilityVisible?: boolean;
  action: DispatchCreateAction;
  onPendingChange: (value: boolean) => void;
  onDirtyChange: (value: boolean) => void;
  onCreated: (id: string) => void;
};
export function useDispatchSendForm({
  availabilityVisible = false,
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
  const [deliveredBy, setDeliveredBy] = useState("");
  const [receiveBy, setReceiveBy] = useState(defaultReceiveBy);
  const [deadlineError, setDeadlineError] = useState("");
  const [deliveredByError, setDeliveredByError] = useState("");
  const submitting = useRef(false);
  const nextLineKey = useRef(2);
  const keyForRetry = useRef<{ fingerprint: string; key: string } | null>(null);
  const quantityErrors: Record<number, string> = {};
  if (availabilityVisible) {
    for (const line of lines) {
      const stock = line.stock;
      const quantity = line.quantity_dispatched.trim();
      if (
        stock?.id === line.stock_item_id &&
        stock?.quantity_on_hand != null &&
        isPositiveDecimalQuantity(quantity) &&
        !isDecimalQuantityWithinLimit(quantity, stock.quantity_on_hand)
      ) {
        quantityErrors[line.key] =
          `Exceeds commissary stock (${stock.quantity_on_hand} ${stock.unit} available).`;
      }
    }
  }

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
      const invalidLine = lines.find((line) => quantityErrors[line.key]);
      if (invalidLine) {
        event.currentTarget
          ?.querySelector<HTMLInputElement>(
            `#dispatch-quantity-${invalidLine.key}`,
          )
          ?.focus();
        return;
      }
      setReview(parsed.data);
      return;
    }
    const deadline = receiveByIso(receiveBy);
    if (!deadline || new Date(deadline).getTime() <= Date.now()) {
      setDeadlineError("Choose an estimated arrival in the future.");
      event.currentTarget
        .querySelector<HTMLElement>(
          receiveBy.split("T")[1]
            ? "#dispatch-receive-by"
            : "#dispatch-arrival-time",
        )
        ?.focus();
      return;
    }
    setDeadlineError("");
    const sendInput = sendDispatchSchema.safeParse({
      receive_by: deadline,
      ...parsed.data,
      delivered_by_name: deliveredBy,
    });
    if (!sendInput.success) {
      setDeliveredByError("Enter who is delivering this dispatch.");
      event.currentTarget
        .querySelector<HTMLInputElement>("#dispatch-delivered-by")
        ?.focus();
      return;
    }
    setDeliveredByError("");
    // Compare the submitted meaning, not intermediate edits or decimal formatting.
    const fingerprint = JSON.stringify({
      receive_by: deadline,
      branch_id: parsed.data.branch_id,
      delivered_by_name: sendInput.data.delivered_by_name,
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
      result = await action(sendInput.data, keyForRetry.current.key);
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
    quantityErrors,
    branchId,
    setBranchId,
    lines,
    setLines,
    review,
    setReview,
    deliveredBy,
    deliveredByError,
    receiveBy,
    deadlineError,
    setReceiveBy: (value: string) => {
      setReceiveBy(value);
      setDeadlineError("");
      onDirtyChange(true);
    },
    setDeliveredBy: (value: string) => {
      setDeliveredBy(value);
      if (value.trim()) setDeliveredByError("");
    },
    setError,
    updateLine,
    submit,
    nextLineKey,
  };
}
