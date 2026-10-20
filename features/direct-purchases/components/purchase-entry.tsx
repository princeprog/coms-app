import { purchaseAmount } from "../services/purchase-totals";
import { Plus } from "lucide-react";
import { DatePicker } from "@/components/shared/date-picker";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PurchaseLineFields } from "./purchase-line-fields";
import type { usePurchaseForm } from "../hooks/use-purchase-form";
export function PurchaseEntry({
  form,
}: {
  form: ReturnType<typeof usePurchaseForm>;
}) {
  return (
    <FieldGroup className="gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
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
            Store <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="purchase-store"
            value={form.store_name}
            onChange={(e) => form.setStore(e.target.value)}
            maxLength={160}
            placeholder="e.g. Puregold"
            className="h-11"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="purchase-receipt">
            Receipt number{" "}
            <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="purchase-receipt"
            value={form.receipt_number}
            onChange={(e) => form.setReceipt(e.target.value)}
            maxLength={100}
            className="h-11"
          />
        </Field>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Stock items</h3>
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
          <p role="alert" className="text-sm text-destructive">
            {form.errors.items}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={form.addLine}
            disabled={form.lines.length >= 100}
          >
            <Plus aria-hidden="true" />
            Add stock item
          </Button>
          <p className="text-sm font-medium tabular-nums">
            Total (PHP): {purchaseAmount(form.lines) ?? "—"}
          </p>
        </div>
      </div>
      <Field>
        <FieldLabel htmlFor="purchase-notes">
          Notes <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Textarea
          id="purchase-notes"
          value={form.notes}
          onChange={(e) => form.setNotes(e.target.value)}
          maxLength={1000}
          rows={2}
        />
      </Field>
    </FieldGroup>
  );
}
