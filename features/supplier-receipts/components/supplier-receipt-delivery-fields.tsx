import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { DatePicker } from "@/components/shared/date-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Supplier } from "@/features/suppliers/types/supplier.types";

export function SupplierReceiptDeliveryFields({
  suppliers,
  supplierId,
  receivedAt,
  disabled,
  onSupplierChange,
  onReceivedAtChange,
}: {
  suppliers: Supplier[];
  supplierId: string;
  receivedAt: string;
  disabled: boolean;
  onSupplierChange: (value: string) => void;
  onReceivedAtChange: (value: string) => void;
}) {
  return (
    <FieldGroup className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="receipt-supplier">
          Supplier{" "}
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        </FieldLabel>
        <Select
          value={supplierId}
          disabled={disabled}
          onValueChange={(value) => onSupplierChange(value ?? "")}
        >
          <SelectTrigger id="receipt-supplier" className="w-full">
            <SelectValue>
              {(value: unknown) =>
                suppliers.find((supplier) => supplier.id === value)
                  ?.supplier_name ?? "Select a supplier"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            alignItemWithTrigger={false}
            collisionAvoidance={{
              side: "none",
              align: "shift",
              fallbackAxisSide: "none",
            }}
            className="max-h-56"
            data-coms-ui="operational"
          >
            <SelectGroup>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.supplier_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldDescription>Choose an active supplier.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="receipt-date">
          Delivery date{" "}
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        </FieldLabel>
        <DatePicker
          id="receipt-date"
          label="Delivery date"
          value={receivedAt}
          disabled={disabled}
          onChange={onReceivedAtChange}
        />
        <FieldDescription>
          Select the date the delivery arrived.
        </FieldDescription>
      </Field>
    </FieldGroup>
  );
}
