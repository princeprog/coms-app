"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportCsvButton } from "@/features/exports/components/export-csv-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usePurchaseHistory } from "../hooks/use-purchase-history";
import { purchaseRecordedAt } from "../services/purchase-date";
import { PurchaseActions } from "./purchase-actions";
import { RestockProvider } from "./restock-provider";
import { PurchaseHistoryFilters } from "./purchase-history-filters";
import { PurchaseHistoryTable } from "./purchase-history-table";
import { PurchaseSummary } from "./purchase-summary";
export function PurchaseHistory({ canCreate }: { canCreate: boolean }) {
  const history = usePurchaseHistory();
  const detail = history.detail;
  return (
    <RestockProvider enabled={canCreate}>
      <div data-coms-ui="operational" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/inventory"
              className="text-sm text-muted-foreground hover:underline"
            >
              Inventory
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Direct purchases
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!!history.result.data?.total && (
              <ExportCsvButton
                kind="direct-purchases"
                params={{
                  search: history.query.search,
                  purchased_from: history.query.purchased_from,
                  purchased_to: history.query.purchased_to,
                  sort: history.query.sort,
                }}
              />
            )}
            <PurchaseActions canRead showHistory={false} />
          </div>
        </div>
        <PurchaseHistoryFilters history={history} />
        <PurchaseHistoryTable history={history} />
        <Dialog
          open={!!history.purchaseId}
          onOpenChange={(open) => {
            if (!open) history.closeDetail();
          }}
        >
          <DialogContent
            data-coms-ui="operational"
            className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl motion-reduce:animate-none"
          >
            <DialogHeader>
              <DialogTitle>Purchase details</DialogTitle>
              <DialogDescription className="sr-only">
                Recorded commissary stock purchase
              </DialogDescription>
            </DialogHeader>
            {detail.isPending ? (
              <div aria-busy="true" aria-label="Loading purchase">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : detail.isError ? (
              <div role="alert" className="space-y-3">
                <p>Purchase details could not be loaded.</p>
                <Button variant="outline" onClick={() => detail.refetch()}>
                  Try again
                </Button>
              </div>
            ) : (
              detail.data && (
                <>
                  <PurchaseSummary purchase={detail.data} />
                  <p className="border-t pt-4 text-xs text-muted-foreground">
                    Recorded by {detail.data.recorded_by_name} ·{" "}
                    {purchaseRecordedAt(detail.data.recorded_at)} PHT
                  </p>
                </>
              )
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RestockProvider>
  );
}
