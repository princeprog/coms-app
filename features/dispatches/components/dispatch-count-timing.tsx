"use client";
import { useEffect, useState } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { Dispatch } from "../types/dispatch.types";

export function useCountTiming(dispatch: Dispatch) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setClock(Date.now());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);
  const isLate = (now: number) =>
    !!(dispatch.receive_by && new Date(dispatch.receive_by).getTime() < now);
  const late = isLate(clock);
  function validate(form: HTMLFormElement) {
    const now = Date.now();
    setClock(now);
    if (isLate(now) && !reason.trim()) {
      setError("Explain why this count is late.");
      form.querySelector<HTMLElement>("#late-count-reason")?.focus();
      return false;
    }
    setError("");
    return true;
  }
  return {
    reason,
    error,
    late,
    validate,
    setReason: (value: string) => {
      setReason(value);
      setError("");
    },
    reset: () => {
      setClock(Date.now());
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
        <p className="text-muted-foreground">
          The receiving date and time are recorded when you submit.
        </p>
        {timing.reason && (
          <p className="text-muted-foreground">{timing.reason}</p>
        )}
      </div>
    );
  if (!timing.late) return null;
  return (
    <Field>
      <FieldLabel htmlFor="late-count-reason">Reason for late count</FieldLabel>
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
  );
}
