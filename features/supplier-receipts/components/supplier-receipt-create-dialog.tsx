"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { Supplier } from "@/features/suppliers/types/supplier.types";
import type { SupplierReceiptCreateAction } from "@/features/supplier-receipts/types/supplier-receipt.types";
import { SupplierReceiptCreateForm } from "./supplier-receipt-create-form";

export function SupplierReceiptCreateDialog({
  suppliers,
  stockItems,
  action,
}: {
  suppliers: Supplier[];
  stockItems: StockItem[];
  action: SupplierReceiptCreateAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger render={<Button type="button">Create receipt</Button>} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create supplier receipt</DialogTitle>
          <DialogDescription>
            Save the delivery as a draft. Stock changes only after an authorized
            user posts it.
          </DialogDescription>
        </DialogHeader>
        <SupplierReceiptCreateForm
          suppliers={suppliers}
          stockItems={stockItems}
          action={action}
          onPendingChange={setPending}
          onCreated={(id) => {
            setOpen(false);
            router.push(`/receipts/${id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
