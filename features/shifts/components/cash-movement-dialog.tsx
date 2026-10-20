"use client";

import { useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useRetryKey } from "../hooks/use-retry-key";
import { pesoInputSchema } from "../schemas/shift.schema";
import { shiftCashMovementAction } from "../services/shift-actions";
import { focusFirstInvalid } from "../services/focus-invalid";
import { formatPeso } from "../services/shift-money";
import { PesoField } from "./peso-field";
import { ShiftDialogShell } from "./shift-dialog-shell";

const directions = [
  {
    value: "OUT",
    label: "Cash out",
    icon: ArrowUpRight,
    hint: "e.g. Moved to safe, bought ice",
  },
  {
    value: "IN",
    label: "Cash in",
    icon: ArrowDownLeft,
    hint: "e.g. Added change fund",
  },
] as const;

export function CashMovementDialog({
  branchId,
  shiftId,
  onClose,
  onRecorded,
}: {
  branchId: string;
  shiftId: string;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [direction, setDirection] = useState<"IN" | "OUT">("OUT");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{
    amount?: string;
    reason?: string;
    form?: string;
  }>({});
  const [pending, setPending] = useState(false);
  const keyFor = useRetryKey();
  const current = directions.find((item) => item.value === direction)!;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = pesoInputSchema.safeParse(amount);
    const next = {
      amount: !parsed.success
        ? parsed.error.issues[0]?.message
        : !/[1-9]/.test(parsed.data)
          ? "Enter an amount greater than zero"
          : undefined,
      reason: reason.trim() ? undefined : "Enter a reason",
    };
    if (next.amount || next.reason || !parsed.success) {
      setErrors(next);
      focusFirstInvalid(event.currentTarget);
      return;
    }
    const input = { direction, amount: parsed.data, reason: reason.trim() };
    setPending(true);
    setErrors({});
    const result = await shiftCashMovementAction(
      branchId,
      shiftId,
      input,
      keyFor(JSON.stringify(input)),
    );
    setPending(false);
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    toast.add({
      type: "success",
      title: `${current.label} of ${formatPeso(parsed.data)} recorded`,
    });
    onRecorded();
  }
  return (
    <ShiftDialogShell
      title="Cash in or out"
      description="Record cash added to or taken from the drawer."
      pending={pending}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" className="min-h-11 gap-2" disabled={pending}>
            {pending && (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            Record {current.label.toLowerCase()}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div
          role="radiogroup"
          aria-label="Direction"
          className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
        >
          {directions.map((item) => {
            const Icon = item.icon;
            const selected = item.value === direction;
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={pending}
                onClick={() => setDirection(item.value)}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-4",
                    item.value === "OUT" ? "text-red-600" : "text-emerald-600",
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </div>
        <PesoField
          id="shift-cash-amount"
          label="Amount"
          value={amount}
          onChange={(value) => {
            setAmount(value);
            setErrors((current) => ({ ...current, amount: undefined }));
          }}
          error={errors.amount}
          disabled={pending}
          autoFocus
        />
        <Field data-invalid={Boolean(errors.reason)}>
          <FieldLabel htmlFor="shift-cash-reason">Reason</FieldLabel>
          <Input
            id="shift-cash-reason"
            className="h-11"
            maxLength={300}
            placeholder={current.hint}
            value={reason}
            disabled={pending}
            aria-invalid={Boolean(errors.reason)}
            aria-describedby={
              errors.reason ? "shift-cash-reason-error" : undefined
            }
            onChange={(event) => {
              setReason(event.target.value);
              setErrors((current) => ({ ...current, reason: undefined }));
            }}
          />
          {errors.reason && (
            <FieldError id="shift-cash-reason-error">
              {errors.reason}
            </FieldError>
          )}
        </Field>
        {errors.form && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            {errors.form}
          </p>
        )}
      </div>
    </ShiftDialogShell>
  );
}
