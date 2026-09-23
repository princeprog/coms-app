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
import type { Branch } from "@/features/branches/types/branch.types";
import type { StockItem } from "@/features/stock-items/types/stock-item.types";
import type { StockRequestCreateAction } from "@/features/stock-requests/types/stock-request.types";
import { StockRequestCreateForm } from "./stock-request-create-form";

export function StockRequestCreateDialog({
  branches,
  stockItems,
  selectedBranchId,
  action,
}: {
  branches: Branch[];
  stockItems: StockItem[];
  selectedBranchId?: string;
  action: StockRequestCreateAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={<Button type="button">New stock request</Button>}
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create stock request</DialogTitle>
          <DialogDescription>
            Request stock for an assigned branch. Inventory changes when an
            approved request is dispatched.
          </DialogDescription>
        </DialogHeader>
        <StockRequestCreateForm
          branches={branches}
          stockItems={stockItems}
          selectedBranchId={selectedBranchId}
          action={action}
          onPendingChange={setPending}
          onCreated={(id) => {
            setOpen(false);
            router.push(`/replenishment/${id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
