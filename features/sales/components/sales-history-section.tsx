"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SalesHistoryControls } from "./sales-history-controls";
import { SalesHistoryPagination } from "./sales-history-pagination";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import { formatProductPrice } from "@/lib/format-currency";
import {
  createSalesHref,
  type SalesPageFilters,
} from "../services/sales-page-params";
import type {
  SalePage,
  SaleListItem,
  SaleVoidAction,
} from "../types/sale.types";
import { SalesHistoryTable } from "./sales-history-table";
import { SaleVoidControl } from "./sale-void-control";

export function SalesHistorySection({
  page,
  filters,
  canVoid,
  voidAction,
}: {
  page: SalePage | null;
  filters: SalesPageFilters;
  canVoid: boolean;
  voidAction: SaleVoidAction;
}) {
  const router = useRouter();
  const [voidSale, setVoidSale] = useState<SaleListItem | null>(null);
  const query = useDirectoryQuery(
    {
      ...filters,
      page: filters.historyPage,
      search: filters.historySearch ?? "",
    },
    (next) =>
      createSalesHref({
        ...next,
        page: filters.page,
        search: filters.search,
        historyPage: next.page,
        historySearch: next.search,
        saleId: undefined,
        view: "history",
      }),
  );
  const summary = page?.summary;
  return (
    <section
      aria-label="Sales history workspace"
      className="flex min-w-0 flex-col gap-4"
    >
      <SalesHistoryControls page={page} filters={filters} query={query} />
      <div aria-busy={query.pending} className="flex min-w-0 flex-col gap-4">
        {summary && (
          <dl className="grid grid-cols-1 divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              {
                label: "Net sales",
                value: formatProductPrice(summary.net_sales),
              },
              {
                label: "Completed sales",
                value: String(summary.completed_sales),
              },
              { label: "Voided sales", value: String(summary.voided_sales) },
            ].map(({ label, value }) => (
              <div key={label} className="min-w-0 px-5 py-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight wrap-anywhere tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {query.pending ? (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border p-4"
          >
            <span className="sr-only">Updating sales…</span>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-12 w-full motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : page ? (
          <SalesHistoryTable
            page={page}
            filters={filters}
            onVoid={canVoid ? setVoidSale : undefined}
          />
        ) : (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-xl border p-8"
          >
            <p>Sales history couldn’t be loaded.</p>
            <Button variant="outline" onClick={() => router.refresh()}>
              Retry sales
            </Button>
          </div>
        )}
      </div>
      {page && (
        <SalesHistoryPagination page={page} filters={filters} query={query} />
      )}
      {canVoid && voidSale && (
        <SaleVoidControl
          branchId={filters.branchId!}
          saleId={voidSale.id}
          saleReference={voidSale.sale_reference}
          inventoryDeducted={voidSale.inventory_deducted ?? true}
          action={voidAction}
          controlledOpen
          onOpenChange={(open) => {
            if (!open) setVoidSale(null);
          }}
          hideTrigger
        />
      )}
    </section>
  );
}
