"use client";

import { useState } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPeso } from "../services/shift-money";
import { PesoField } from "./peso-field";

/** Philippine bills and coins, in centavos. ₱20 circulates as both and is counted together. */
const denominations = [
  { cents: 100000, label: "₱1,000" },
  { cents: 50000, label: "₱500" },
  { cents: 20000, label: "₱200" },
  { cents: 10000, label: "₱100" },
  { cents: 5000, label: "₱50" },
  { cents: 2000, label: "₱20" },
  { cents: 1000, label: "₱10" },
  { cents: 500, label: "₱5" },
  { cents: 100, label: "₱1" },
  { cents: 25, label: "₱0.25" },
] as const;

const toAmount = (cents: number) => (cents / 100).toFixed(2);

/**
 * Cash count entered as one total or by bills and coins. Reports the total as a
 * peso string either way so callers validate a single value.
 */
export function CashCountField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [mode, setMode] = useState<"total" | "count">("total");
  const [counts, setCounts] = useState<Record<number, string>>({});
  const total = denominations.reduce(
    (sum, item) => sum + item.cents * (Number(counts[item.cents]) || 0),
    0,
  );
  function setCount(cents: number, next: string) {
    const clean = next.replace(/\D/g, "").slice(0, 5);
    const updated = { ...counts, [cents]: clean };
    setCounts(updated);
    const sum = denominations.reduce(
      (acc, item) => acc + item.cents * (Number(updated[item.cents]) || 0),
      0,
    );
    onChange(toAmount(sum));
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
        <div
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          className="grid grid-cols-2 rounded-lg bg-muted p-0.5 text-xs"
        >
          {(["total", "count"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              disabled={disabled}
              onClick={() => {
                setMode(option);
                if (option === "count") onChange(toAmount(total));
              }}
              className={cn(
                "min-h-8 rounded-md px-3 font-medium transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                mode === option
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option === "total" ? "Enter total" : "Count bills & coins"}
            </button>
          ))}
        </div>
      </div>
      {mode === "total" ? (
        <PesoField
          id={id}
          label={<span className="sr-only">{label}</span>}
          value={value}
          onChange={onChange}
          error={error}
          hint={hint}
          disabled={disabled}
          autoFocus={autoFocus}
        />
      ) : (
        <Field data-invalid={Boolean(error)}>
          <FieldLabel className="sr-only">{label} by denomination</FieldLabel>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-2">
              {denominations.map((item, index) => {
                const count = counts[item.cents] ?? "";
                const subtotal = item.cents * (Number(count) || 0);
                return (
                  <label
                    key={item.cents}
                    htmlFor={`${id}-${item.cents}`}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <span className="w-14 shrink-0 text-sm font-medium tabular-nums">
                      {item.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-xs text-muted-foreground"
                    >
                      ×
                    </span>
                    <Input
                      id={`${id}-${item.cents}`}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      aria-label={`Number of ${item.label}`}
                      className="h-9 w-16 text-center tabular-nums"
                      value={count}
                      disabled={disabled}
                      autoFocus={autoFocus && index === 0}
                      onChange={(event) =>
                        setCount(item.cents, event.target.value)
                      }
                    />
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                      {subtotal ? formatPeso(toAmount(subtotal)) : ""}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Total counted
              </span>
              <span
                aria-live="polite"
                className="text-lg font-semibold tabular-nums"
              >
                {formatPeso(toAmount(total))}
              </span>
            </div>
          </div>
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            hint && <FieldDescription>{hint}</FieldDescription>
          )}
        </Field>
      )}
    </div>
  );
}
