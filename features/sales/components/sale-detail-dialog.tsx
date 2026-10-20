"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSaleTime } from "../services/sales-history-filters";
import { ReceiptTextIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MenuStatusBadge } from "@/features/menus/components/menu-status-badge";
import {
  createSalesHref,
  type SalesPageFilters,
} from "@/features/sales/services/sales-page-params";
import type { Sale, SaleVoidAction } from "@/features/sales/types/sale.types";
import { SaleDetailContent } from "./sale-detail-content";
import { SaleVoidControl } from "./sale-void-control";

export function SaleDetailDialog({
  sale,
  branchId,
  filters,
  canVoid,
  voidAction,
}: {
  sale: Sale;
  branchId: string;
  filters: SalesPageFilters;
  canVoid: boolean;
  voidAction: SaleVoidAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const completed = sale.status === "COMPLETED";

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen)
          router.replace(createSalesHref({ ...filters, saleId: undefined }), {
            scroll: false,
          });
      }}
    >
      <DialogContent
        data-coms-ui="operational"
        showCloseButton={false}
        overlayClassName="bg-black/30 supports-backdrop-filter:backdrop-blur-xs"
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-lg"
      >
        <DialogHeader className="relative shrink-0 flex-row items-center gap-4 p-5 pr-14 sm:p-6 sm:pr-16">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-background shadow-xs"
          >
            <ReceiptTextIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-xl leading-tight font-semibold tracking-tight">
                Sale details
              </DialogTitle>
              <MenuStatusBadge status={completed ? "active" : "inactive"}>
                {completed ? "Completed" : "Voided"}
              </MenuStatusBadge>
            </div>
            <DialogDescription className="tabular-nums">
              {sale.sale_reference && `${sale.sale_reference} · `}
              {formatSaleTime(sale.created_at, true)} ·{" "}
              {formatSaleTime(sale.created_at)}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close sale details"
            className="absolute top-4 right-4"
            onClick={() => setOpen(false)}
          >
            <XIcon />
          </Button>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
          <SaleDetailContent sale={sale} />
        </div>
        <DialogFooter className="m-0 shrink-0 flex-row items-center gap-3 rounded-b-2xl bg-muted/20 px-5 py-4 sm:px-6">
          {canVoid && completed && (
            <SaleVoidControl
              branchId={branchId}
              saleId={sale.id}
              saleReference={sale.sale_reference}
              inventoryDeducted={sale.inventory_deducted ?? true}
              action={voidAction}
            />
          )}
          <Button
            type="button"
            variant="outline"
            className="ml-auto min-h-11 px-5 sm:min-h-10"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
