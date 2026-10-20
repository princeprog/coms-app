"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useRetryKey } from "../hooks/use-retry-key";
import { pesoInputSchema, type ShiftDetail } from "../schemas/shift.schema";
import {
  closeShiftAction,
  explainShiftAction,
  forceCloseShiftAction,
} from "../services/shift-actions";
import { differenceTone, formatPeso } from "../services/shift-money";
import { focusFirstInvalid } from "../services/focus-invalid";
import { PesoField } from "./peso-field";
import { ShiftCountResult } from "./shift-count-result";
import { ShiftDialogShell } from "./shift-dialog-shell";

type Step = "count" | "confirm" | "result";

function cents(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
}

function fromCents(value: bigint) {
  const text = value.toString().padStart(3, "0");
  return `${text.slice(0, -2)}.${text.slice(-2)}`;
}

/** Blind count: expected cash is revealed only after the count is submitted. */
export function CloseShiftDialog({
  branchId,
  shift,
  forced = false,
  onClose,
  onClosed,
}: {
  branchId: string;
  shift: Pick<ShiftDetail, "id" | "shift_number" | "opened_by_name">;
  forced?: boolean;
  onClose: () => void;
  onClosed: () => void;
}) {
  const [step, setStep] = useState<Step>("count");
  const [counted, setCounted] = useState("");
  const [left, setLeft] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, setPending] = useState(false);
  const [closed, setClosed] = useState<ShiftDetail | null>(null);
  const [explanation, setExplanation] = useState("");
  const [explained, setExplained] = useState(false);
  const keyFor = useRetryKey();
  const countedValue = pesoInputSchema.safeParse(counted);
  const leftValue = pesoInputSchema.safeParse(left);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string | undefined> = {
      counted: countedValue.success
        ? undefined
        : countedValue.error.issues[0]?.message,
      left: leftValue.success ? undefined : leftValue.error.issues[0]?.message,
      reason: forced && !reason.trim() ? "Enter a reason" : undefined,
    };
    if (
      countedValue.success &&
      leftValue.success &&
      cents(leftValue.data) > cents(countedValue.data)
    )
      next.left = "Cannot be more than the counted cash";
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      focusFirstInvalid(event.currentTarget);
      return;
    }
    setStep("confirm");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!countedValue.success || !leftValue.success) return;
    const input = {
      counted_cash: countedValue.data,
      left_in_drawer: leftValue.data,
      ...(forced ? { reason: reason.trim() } : {}),
    };
    setPending(true);
    setErrors({});
    const key = keyFor(JSON.stringify(input));
    const result = forced
      ? await forceCloseShiftAction(branchId, shift.id, input, key)
      : await closeShiftAction(branchId, shift.id, input, key);
    setPending(false);
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    setClosed(result.data);
    setStep("result");
    toast.add({ type: "success", title: `Shift ${shift.shift_number} closed` });
  }

  async function saveExplanation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!closed || !explanation.trim() || explained) {
      onClosed();
      return;
    }
    setPending(true);
    const result = await explainShiftAction(
      branchId,
      closed.id,
      explanation.trim(),
    );
    setPending(false);
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    setExplained(true);
    onClosed();
  }

  const title = forced
    ? `Force close shift ${shift.shift_number}`
    : "Close shift";
  const description =
    step === "result"
      ? "Your count is saved. A manager will review this shift."
      : forced
        ? `Count the drawer for ${shift.opened_by_name}'s shift.`
        : "Count the cash in the drawer. Expected cash appears after you submit.";
  const formError = errors.form && (
    <p
      role="alert"
      className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      {errors.form}
    </p>
  );

  if (step === "result" && closed) {
    const needsNote =
      !forced && differenceTone(closed.cash_difference) !== "balanced";
    return (
      <ShiftDialogShell
        title="Shift closed"
        description={description}
        pending={pending}
        onClose={onClosed}
        onSubmit={saveExplanation}
        footer={
          <Button type="submit" className="min-h-11 gap-2" disabled={pending}>
            {pending && (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {needsNote && explanation.trim() ? "Save and finish" : "Done"}
          </Button>
        }
      >
        <ShiftCountResult shift={closed} />
        {needsNote && (
          <Field className="mt-5">
            <FieldLabel htmlFor="shift-explanation">
              What happened?{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FieldLabel>
            <Textarea
              id="shift-explanation"
              rows={3}
              maxLength={500}
              value={explanation}
              disabled={pending}
              onChange={(event) => setExplanation(event.target.value)}
            />
          </Field>
        )}
        {formError}
      </ShiftDialogShell>
    );
  }

  if (step === "confirm" && countedValue.success && leftValue.success) {
    const removed = fromCents(cents(countedValue.data) - cents(leftValue.data));
    return (
      <ShiftDialogShell
        title={title}
        description="Your count can’t be changed after closing."
        pending={pending}
        onClose={onClose}
        onSubmit={submit}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 gap-2"
              disabled={pending}
              onClick={() => setStep("count")}
            >
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Back
            </Button>
            <Button type="submit" className="min-h-11 gap-2" disabled={pending}>
              {pending && (
                <LoaderCircle
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {pending ? "Closing…" : forced ? "Force close" : "Close shift"}
            </Button>
          </>
        }
      >
        <dl className="divide-y rounded-xl border text-sm">
          {[
            ["Counted cash", countedValue.data],
            ["Leave in drawer", leftValue.data],
            ["Remove from drawer", removed],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">{formatPeso(value)}</dd>
            </div>
          ))}
        </dl>
        {forced && (
          <p className="mt-4 text-sm text-muted-foreground">
            Reason: {reason.trim()}
          </p>
        )}
        {formError}
      </ShiftDialogShell>
    );
  }

  return (
    <ShiftDialogShell
      title={title}
      description={description}
      pending={pending}
      onClose={onClose}
      onSubmit={review}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="min-h-11">
            Review count
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <PesoField
          id="shift-counted-cash"
          label="Counted cash"
          value={counted}
          onChange={(value) => {
            setCounted(value);
            setErrors((current) => ({ ...current, counted: undefined }));
          }}
          error={errors.counted}
          autoFocus
        />
        <PesoField
          id="shift-left-in-drawer"
          label="Leave in drawer"
          hint="Starting cash for the next shift."
          value={left}
          onChange={(value) => {
            setLeft(value);
            setErrors((current) => ({ ...current, left: undefined }));
          }}
          error={errors.left}
        />
        {forced && (
          <Field data-invalid={Boolean(errors.reason)}>
            <FieldLabel htmlFor="shift-force-reason">Reason</FieldLabel>
            <Textarea
              id="shift-force-reason"
              rows={2}
              maxLength={500}
              placeholder="e.g. Cashier left without closing"
              value={reason}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={
                errors.reason ? "shift-force-reason-error" : undefined
              }
              onChange={(event) => {
                setReason(event.target.value);
                setErrors((current) => ({ ...current, reason: undefined }));
              }}
            />
            {errors.reason && (
              <FieldError id="shift-force-reason-error">
                {errors.reason}
              </FieldError>
            )}
          </Field>
        )}
      </div>
    </ShiftDialogShell>
  );
}
