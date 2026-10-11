"use client";

import { useMemo } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { SupplierReceiptLineValue } from "../types/supplier-receipt.types";
import { SupplierReceiptItemRow } from "./supplier-receipt-item-row";

export function SupplierReceiptItemsTable({
  lines,
  stockItems,
  disabled,
  atLineLimit,
  onChange,
  onRemove,
  onAdd,
}: {
  lines: SupplierReceiptLineValue[];
  stockItems: StockItem[];
  disabled: boolean;
  atLineLimit: boolean;
  onChange: (
    key: number,
    field: "stock_item_id" | "quantity_received" | "unit_cost",
    value: string,
  ) => void;
  onRemove: (key: number) => void;
  onAdd: () => void;
}) {
  const stockItemsById = useMemo(
    () => new Map(stockItems.map((item) => [item.id, item])),
    [stockItems],
  );
  const selectedStockItemIds = useMemo(
    () => new Set(lines.map((line) => line.stock_item_id)),
    [lines],
  );

  return (
    <>
      <Table
        aria-label="Received items"
        className="min-w-3xl"
        containerProps={{
          role: "region",
          "aria-label": "Received items table",
          tabIndex: 0,
          className:
            "rounded-lg border focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        }}
      >
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="min-w-56 pl-4">Stock item</TableHead>
            <TableHead className="w-20">Unit</TableHead>
            <TableHead className="min-w-40 text-right">
              Quantity received
            </TableHead>
            <TableHead className="min-w-36 text-right">Unit cost</TableHead>
            <TableHead className="min-w-32 text-right">Line total</TableHead>
            <TableHead className="w-14 pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, index) => (
            <SupplierReceiptItemRow
              key={line.key}
              line={line}
              index={index}
              lineCount={lines.length}
              stockItems={stockItems}
              stockItemsById={stockItemsById}
              selectedStockItemIds={selectedStockItemIds}
              disabled={disabled}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </TableBody>
      </Table>
      <Button
        type="button"
        variant="ghost"
        className="h-11 w-full border border-dashed"
        disabled={disabled || atLineLimit || stockItems.length === 0}
        onClick={onAdd}
      >
        <PlusIcon />
        Add another stock item
      </Button>
    </>
  );
}
