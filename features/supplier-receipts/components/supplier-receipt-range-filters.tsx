"use client";
import { useState } from "react";
import { DatePicker } from "@/components/shared/date-picker";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SupplierReceiptPageFilters } from "../services/supplier-receipt-page-params";

export function SupplierReceiptRangeFilters({
  filters,
  onChange,
}: {
  filters: SupplierReceiptPageFilters;
  onChange: (change: Partial<SupplierReceiptPageFilters>) => void;
}) {
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState("");
  function commit(next: SupplierReceiptPageFilters) {
    setDraft(next);
    if (
      next.received_from &&
      next.received_to &&
      next.received_from > next.received_to
    ) {
      setError("Start date must be on or before the end date.");
      return;
    }
    for (const cost of [next.min_cost, next.max_cost]) {
      if (cost && (!/^\d+(?:\.\d+)?$/.test(cost) || cost.length > 80)) {
        setError("Enter a nonnegative decimal cost.");
        return;
      }
    }
    if (next.min_cost && next.max_cost) {
      const [a, af = ""] = next.min_cost.split(".");
      const [b, bf = ""] = next.max_cost.split(".");
      const scale = Math.max(af.length, bf.length);
      if (
        BigInt(a + af.padEnd(scale, "0")) > BigInt(b + bf.padEnd(scale, "0"))
      ) {
        setError("Minimum cost must not exceed maximum cost.");
        return;
      }
    }
    setError("");
    if (
      !["received_from", "received_to", "min_cost", "max_cost"].some(
        (key) =>
          (next[key as keyof SupplierReceiptPageFilters] ?? "") !==
          (filters[key as keyof SupplierReceiptPageFilters] ?? ""),
      )
    )
      return;
    onChange({
      received_from: next.received_from,
      received_to: next.received_to,
      min_cost: next.min_cost,
      max_cost: next.max_cost,
    });
  }
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
      <FieldGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(["received_from", "received_to"] as const).map((key) => (
          <Field key={key}>
            <FieldLabel htmlFor={`receipt-${key}`}>
              {key === "received_from" ? "Delivery from" : "Delivery to"}
            </FieldLabel>
            <DatePicker
              id={`receipt-${key}`}
              label={key === "received_from" ? "Delivery from" : "Delivery to"}
              value={draft[key] ?? ""}
              clearable
              onChange={(value) => commit({ ...draft, [key]: value })}
            />
          </Field>
        ))}
        {(["min_cost", "max_cost"] as const).map((key) => (
          <Field key={key}>
            <FieldLabel htmlFor={`receipt-${key}`}>
              {key === "min_cost" ? "Minimum total cost" : "Maximum total cost"}
            </FieldLabel>
            <Input
              id={`receipt-${key}`}
              inputMode="decimal"
              maxLength={80}
              autoComplete="off"
              placeholder="Any amount"
              value={draft[key] ?? ""}
              aria-describedby={error ? "receipt-range-error" : undefined}
              onChange={(event) =>
                setDraft({ ...draft, [key]: event.target.value })
              }
              onBlur={() => commit(draft)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commit(draft);
                }
              }}
            />
          </Field>
        ))}
      </FieldGroup>
      {error ? (
        <p
          id="receipt-range-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Dates include both endpoints. Cost filters update when you leave the
          field or press Enter.
        </p>
      )}
    </div>
  );
}
