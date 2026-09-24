"use client";

import type { ChangeEventHandler, FormEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InventoryItem } from "@/features/inventory/types/inventory.types";

export function InventoryAdjustmentForm({
  item,
  pending,
  error,
  onSubmit,
  onChange,
  onCancel,
}: {
  item: InventoryItem;
  pending: boolean;
  error: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onChange: ChangeEventHandler<HTMLFormElement>;
  onCancel: () => void;
}) {
  const fieldPrefix = "inventory-adjustment-" + item.id;

  return (
    <form
      aria-label="Inventory adjustment"
      className="flex flex-col gap-5"
      onSubmit={onSubmit}
      onChange={onChange}
    >
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor={fieldPrefix + "-quantity"}>
            Quantity change ({item.unit})
          </FieldLabel>
          <Input
            id={fieldPrefix + "-quantity"}
            name="quantity_delta"
            type="text"
            inputMode="decimal"
            maxLength={80}
            required
            disabled={pending}
            aria-describedby={fieldPrefix + "-quantity-help"}
          />
          <FieldDescription id={fieldPrefix + "-quantity-help"}>
            Use a positive amount to add stock or a negative amount to remove
            stock.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={fieldPrefix + "-reason"}>
            Reason for adjustment
          </FieldLabel>
          <Textarea
            id={fieldPrefix + "-reason"}
            name="reason"
            maxLength={500}
            required
            disabled={pending}
          />
        </Field>
      </FieldGroup>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter className="border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save adjustment"}
        </Button>
      </DialogFooter>
    </form>
  );
}
