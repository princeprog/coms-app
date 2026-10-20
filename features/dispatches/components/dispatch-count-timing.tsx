"use client";
import { useEffect, useState } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { manilaDate } from "../services/receiving-time";
import type { Dispatch } from "../types/dispatch.types";

export function useCountTiming(dispatch: Dispatch) {
  const [date, setDate] = useState(manilaDate);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setClock(Date.now());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);
  const late =
    date < manilaDate(new Date(clock)) ||
    !!(dispatch.receive_by && new Date(dispatch.receive_by).getTime() < clock);
  function validate(form: HTMLFormElement) {
    setClock(Date.now());
    const invalid =
      !date ||
      date > manilaDate() ||
      (dispatch.dispatched_at &&
        date < manilaDate(new Date(dispatch.dispatched_at)));
    if (invalid || (late && !reason.trim())) {
      setError(
        invalid
          ? "Choose a date between sending and today."
          : "Explain why this count is late.",
      );
      form
        .querySelector<HTMLElement>(
          invalid ? "#actual-delivery-date" : "#late-count-reason",
        )
        ?.focus();
      return false;
    }
    setError("");
    return true;
  }
  return {
    date,
    reason,
    error,
    late,
    validate,
    setDate: (value: string) => {
      setDate(value);
      setError("");
    },
    setReason: (value: string) => {
      setReason(value);
      setError("");
    },
    reset: () => {
      setDate(manilaDate());
      setReason("");
      setError("");
    },
  };
}
export function DispatchCountTiming({
  timing,
  disabled,
  confirming,
}: {
  timing: ReturnType<typeof useCountTiming>;
  disabled: boolean;
  confirming: boolean;
}) {
  if (confirming)
    return (
      <div className="space-y-1 text-sm">
        <p>
          Actual delivery: <strong>{timing.date}</strong>
        </p>
        {timing.reason && (
          <p className="text-muted-foreground">{timing.reason}</p>
        )}
      </div>
    );
  return (
    <div className="grid gap-4">
      <Field>
        <FieldLabel htmlFor="actual-delivery-date">
          Actual delivery date
        </FieldLabel>
        <Input
          id="actual-delivery-date"
          type="date"
          value={timing.date}
          max={manilaDate()}
          className="h-10"
          disabled={disabled}
          aria-describedby={timing.error ? "count-timing-error" : undefined}
          onChange={(event) => timing.setDate(event.target.value)}
        />
      </Field>
      {timing.late && (
        <Field>
          <FieldLabel htmlFor="late-count-reason">
            Reason for late count
          </FieldLabel>
          <Textarea
            id="late-count-reason"
            value={timing.reason}
            maxLength={500}
            disabled={disabled}
            aria-required="true"
            aria-describedby={timing.error ? "count-timing-error" : undefined}
            onChange={(event) => timing.setReason(event.target.value)}
          />
          {timing.error && (
            <FieldError id="count-timing-error">{timing.error}</FieldError>
          )}
        </Field>
      )}
      {!timing.late && timing.error && (
        <FieldError id="count-timing-error">{timing.error}</FieldError>
      )}
    </div>
  );
}
