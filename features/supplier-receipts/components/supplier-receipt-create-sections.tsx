"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { Supplier } from "@/features/suppliers/types/supplier.types";
import type { SupplierReceiptLineValue } from "../types/supplier-receipt.types";
import { SupplierReceiptDeliveryFields } from "./supplier-receipt-delivery-fields";
import { SupplierReceiptItemsTable } from "./supplier-receipt-items-table";

export function SupplierReceiptDeliveryCard({
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
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-5">
        <CardTitle>
          <h2 className="text-lg font-semibold">Delivery details</h2>
        </CardTitle>
        <CardDescription>
          Choose who delivered the stock and when it arrived.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-5">
        <SupplierReceiptDeliveryFields
          suppliers={suppliers}
          supplierId={supplierId}
          receivedAt={receivedAt}
          disabled={disabled}
          onSupplierChange={onSupplierChange}
          onReceivedAtChange={onReceivedAtChange}
        />
      </CardContent>
    </Card>
  );
}

export function SupplierReceiptItemsCard({
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
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-5">
        <CardTitle>
          <h2 className="text-lg font-semibold">Received items</h2>
        </CardTitle>
        <CardDescription>
          Add each stock item once and enter quantities in its listed unit.
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || atLineLimit}
            onClick={onAdd}
          >
            <PlusIcon />
            Add stock item
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 py-5">
        <SupplierReceiptItemsTable
          lines={lines}
          stockItems={stockItems}
          disabled={disabled}
          atLineLimit={atLineLimit}
          onChange={onChange}
          onRemove={onRemove}
          onAdd={onAdd}
        />
      </CardContent>
    </Card>
  );
}
