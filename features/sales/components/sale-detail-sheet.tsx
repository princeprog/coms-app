"use client";

import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createSalesHref,
  type SalesPageFilters,
} from "@/features/sales/services/sales-page-params";
import type { Sale, SaleVoidAction } from "@/features/sales/types/sale.types";
import { SaleDetailContent } from "./sale-detail-content";

export function SaleDetailSheet({
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
  const closeHref = createSalesHref({ ...filters, saleId: undefined });

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.replace(closeHref, { scroll: false });
      }}
    >
      <SheetContent
        data-coms-ui="operational"
        side="right"
        className="w-full gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b px-5 py-5 pr-14 sm:px-6">
          <SheetTitle>Sale details</SheetTitle>
          <SheetDescription>
            Recorded {format(parseISO(sale.created_at), "PP p")} ·{" "}
            {sale.tender_method}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <SaleDetailContent
            sale={sale}
            branchId={branchId}
            canVoid={canVoid}
            voidAction={voidAction}
          />
        </div>
        <SheetFooter className="shrink-0 border-t px-5 py-4 sm:px-6">
          <SheetClose render={<Button type="button" variant="outline" />}>
            Close sale details
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
