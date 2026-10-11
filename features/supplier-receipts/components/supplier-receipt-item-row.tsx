"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import {
  calculateSupplierReceiptLineTotal,
  formatSupplierReceiptCost,
} from "../services/supplier-receipt-total";
import type { SupplierReceiptLineValue } from "../types/supplier-receipt.types";

const decimalText = /^\d+(?:\.\d+)?$/;

export function SupplierReceiptItemRow({
  line,
  index,
  lineCount,
  stockItems,
  stockItemsById,
  selectedStockItemIds,
  disabled,
  onChange,
  onRemove,
}: {
  line: SupplierReceiptLineValue;
  index: number;
  lineCount: number;
  stockItems: StockItem[];
  stockItemsById: ReadonlyMap<string, StockItem>;
  selectedStockItemIds: ReadonlySet<string>;
  disabled: boolean;
  onChange: (
    key: number,
    field: "stock_item_id" | "quantity_received" | "unit_cost",
    value: string,
  ) => void;
  onRemove: (key: number) => void;
}) {
  const stockItem = stockItemsById.get(line.stock_item_id);
  const lineTotal =
    decimalText.test(line.quantity_received) && decimalText.test(line.unit_cost)
      ? formatSupplierReceiptCost(
          calculateSupplierReceiptLineTotal(
            line.quantity_received,
            line.unit_cost,
          ),
        )
      : "—";

  return (
    <TableRow>
      <TableCell className="pl-4">
        <FieldLabel
          htmlFor={`receipt-stock-item-${line.key}`}
          className="sr-only"
        >
          Stock item for line {index + 1}
        </FieldLabel>
        <Select
          value={line.stock_item_id}
          disabled={disabled}
          onValueChange={(value) =>
            onChange(line.key, "stock_item_id", value ?? "")
          }
        >
          <SelectTrigger
            id={`receipt-stock-item-${line.key}`}
            className="h-9 w-full"
          >
            <SelectValue>
              {(value: unknown) =>
                stockItemsById.get(String(value))?.stock_item_name ??
                "Select an item"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            alignItemWithTrigger={false}
            className="max-h-64"
            data-coms-ui="operational"
          >
            <SelectGroup>
              {stockItems.map((item) => (
                <SelectItem
                  key={item.id}
                  value={item.id}
                  disabled={
                    item.id !== line.stock_item_id &&
                    selectedStockItemIds.has(item.id)
                  }
                >
                  {item.stock_item_name} ({item.unit})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {stockItem?.unit ?? "—"}
      </TableCell>
      <TableCell>
        <FieldLabel
          htmlFor={`receipt-quantity-${line.key}`}
          className="sr-only"
        >
          Quantity received for line {index + 1}
        </FieldLabel>
        <Input
          id={`receipt-quantity-${line.key}`}
          className="h-9 text-right tabular-nums"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          maxLength={80}
          value={line.quantity_received}
          disabled={disabled}
          onChange={(event) =>
            onChange(line.key, "quantity_received", event.target.value)
          }
          required
        />
      </TableCell>
      <TableCell>
        <FieldLabel
          htmlFor={`receipt-unit-cost-${line.key}`}
          className="sr-only"
        >
          Unit cost for line {index + 1}
        </FieldLabel>
        <Input
          id={`receipt-unit-cost-${line.key}`}
          className="h-9 text-right tabular-nums"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          maxLength={80}
          value={line.unit_cost}
          disabled={disabled}
          onChange={(event) =>
            onChange(line.key, "unit_cost", event.target.value)
          }
          required
        />
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {lineTotal}
      </TableCell>
      <TableCell className="pr-4 text-right">
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          disabled={disabled || lineCount === 1}
          onClick={() => onRemove(line.key)}
          aria-label={`Remove line ${index + 1}`}
        >
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  );
}
