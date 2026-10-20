"use client";
import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import { DatePicker } from "@/components/shared/date-picker";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PurchaseLineFields, PURCHASE_LINE_GRID } from "./purchase-line-fields";
import type { usePurchaseForm } from "../hooks/use-purchase-form";

function Optional() {
  return <span className="font-normal text-muted-foreground">(optional)</span>;
}

export function PurchaseEntry({
  form,
}: {
  form: ReturnType<typeof usePurchaseForm>;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const notesVisible = showNotes || form.notes.length > 0;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={!!form.errors.purchase_date}>
          <FieldLabel htmlFor="purchase-date">Purchase date</FieldLabel>
          <DatePicker
            id="purchase-date"
            label="Purchase date"
            value={form.purchase_date}
            onChange={form.setDate}
            className="h-11"
            invalid={!!form.errors.purchase_date}
            describedBy={
              form.errors.purchase_date ? "purchase-date-error" : undefined
            }
          />
          {form.errors.purchase_date && (
            <FieldError id="purchase-date-error">
              {form.errors.purchase_date}
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="purchase-store">
            Store <Optional />
          </FieldLabel>
          <Input
            id="purchase-store"
            value={form.store_name}
            onChange={(event) => form.setStore(event.target.value)}
            maxLength={160}
            autoComplete="off"
            placeholder="e.g. Puregold"
            className="h-11"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="purchase-receipt">
            Receipt number <Optional />
          </FieldLabel>
          <Input
            id="purchase-receipt"
            value={form.receipt_number}
            onChange={(event) => form.setReceipt(event.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder="e.g. OR-10234"
            className="h-11"
          />
        </Field>
      </div>
      <FieldSet className="gap-0">
        <FieldLegend variant="label" className="mb-3">
          Stock items
        </FieldLegend>
        <div
          aria-hidden="true"
          className={`hidden gap-3 border-b border-border/60 pb-2 text-xs font-medium text-muted-foreground sm:grid ${PURCHASE_LINE_GRID}`}
        >
          <span>Item</span>
          <span>Quantity</span>
          <span>Unit cost</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        {form.lines.map((line, index) => (
          <PurchaseLineFields
            key={line.key}
            line={line}
            index={index}
            errors={form.errors}
            excluded={
              new Set(
                form.lines
                  .filter((other) => other.key !== line.key)
                  .flatMap((other) => (other.stock ? [other.stock.id] : [])),
              )
            }
            onChange={(patch) => form.changeLine(line.key, patch)}
            onRemove={() => form.removeLine(line.key)}
            canRemove={form.lines.length > 1}
          />
        ))}
        {form.errors.items && (
          <p role="alert" className="pt-2 text-sm text-destructive">
            {form.errors.items}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          className="mt-2 min-h-10 w-fit gap-2 px-2 text-primary hover:text-primary"
          onClick={form.addLine}
          disabled={form.lines.length >= 100}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add stock item
        </Button>
      </FieldSet>
      {notesVisible ? (
        <Field>
          <FieldLabel htmlFor="purchase-notes">
            Note <Optional />
          </FieldLabel>
          <Textarea
            id="purchase-notes"
            value={form.notes}
            onChange={(event) => form.setNotes(event.target.value)}
            maxLength={1000}
            rows={2}
            autoFocus={showNotes && form.notes.length === 0}
          />
        </Field>
      ) : (
        <Button
          type="button"
          variant="ghost"
          className="-mt-2 min-h-10 w-fit gap-2 px-2 text-muted-foreground"
          onClick={() => setShowNotes(true)}
        >
          <StickyNote data-icon="inline-start" aria-hidden="true" />
          Add note
        </Button>
      )}
    </div>
  );
}
