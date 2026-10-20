"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { useRetryKey } from "./use-retry-key";
import { shiftKeys } from "../query-keys";
import { pesoInputSchema, type ShiftDetail } from "../schemas/shift.schema";
import {
  closeShiftAction,
  explainShiftAction,
} from "../services/shift-actions";

const toCents = (value: string) => {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
};

/** Blind end-of-shift count: expected cash is only known after closeShiftAction returns. */
export function useEndShift(shift: ShiftDetail | null | undefined) {
  const client = useQueryClient();
  const keyFor = useRetryKey();
  const [counted, setCounted] = useState("");
  const [left, setLeft] = useState("");
  const [errors, setErrors] = useState<{
    counted?: string;
    left?: string;
    form?: string;
  }>({});
  const [pending, setPending] = useState(false);
  const [closed, setClosed] = useState<ShiftDetail | null>(null);
  const countedValue = pesoInputSchema.safeParse(counted);
  const leftValue = pesoInputSchema.safeParse(left);

  function validate() {
    const next = {
      counted: countedValue.success
        ? undefined
        : "Count the cash in the drawer",
      left: leftValue.success ? undefined : leftValue.error.issues[0]?.message,
    };
    if (
      countedValue.success &&
      leftValue.success &&
      toCents(leftValue.data) > toCents(countedValue.data)
    )
      next.left = "Cannot be more than the counted cash";
    setErrors(next);
    return !next.counted && !next.left;
  }

  async function end() {
    if (!shift || !countedValue.success || !leftValue.success) return false;
    const input = {
      counted_cash: countedValue.data,
      left_in_drawer: leftValue.data,
    };
    setPending(true);
    setErrors({});
    const result = await closeShiftAction(
      shift.branch_id,
      shift.id,
      input,
      keyFor(JSON.stringify(input)),
    );
    setPending(false);
    if (!result.ok) {
      setErrors({ form: result.error });
      return false;
    }
    setClosed(result.data);
    await client.invalidateQueries({ queryKey: shiftKeys.all });
    toast.add({
      type: "success",
      title: `Shift ${result.data.shift_number} ended`,
    });
    return true;
  }

  async function explain(text: string) {
    if (!closed || !text.trim()) return true;
    setPending(true);
    const result = await explainShiftAction(
      closed.branch_id,
      closed.id,
      text.trim(),
    );
    setPending(false);
    if (!result.ok) setErrors({ form: result.error });
    return result.ok;
  }

  const removed =
    countedValue.success && leftValue.success
      ? ((toCents(countedValue.data) - toCents(leftValue.data)) / 100).toFixed(
          2,
        )
      : null;

  return {
    counted,
    left,
    setCounted: (value: string) => {
      setCounted(value);
      setErrors((current) => ({ ...current, counted: undefined }));
    },
    setLeft: (value: string) => {
      setLeft(value);
      setErrors((current) => ({ ...current, left: undefined }));
    },
    countedAmount: countedValue.success ? countedValue.data : null,
    leftAmount: leftValue.success ? leftValue.data : null,
    removed,
    errors,
    pending,
    closed,
    validate,
    end,
    explain,
  };
}
