import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DirectorySelect } from "@/components/shared/directory-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSupplierReceiptCost as cost } from "@/features/supplier-receipts/services/supplier-receipt-total";
import { purchaseDateLabel } from "../services/purchase-date";
import { PurchaseRowActions } from "./purchase-row-actions";
import type { usePurchaseHistory } from "../hooks/use-purchase-history";
export function PurchaseHistoryTable({
  history,
}: {
  history: ReturnType<typeof usePurchaseHistory>;
}) {
  const params = useSearchParams();
  const { result, query, loading, update } = history;
  const data = result.data;
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / query.page_size));
  return (
    <div className="overflow-hidden rounded-xl border" aria-busy={loading}>
      <Table aria-label="Direct purchases">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="pl-5">Store / receipt</TableHead>
            <TableHead>Purchase date</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="text-right">Total (PHP)</TableHead>
            <TableHead>Recorded by</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={6} className="px-5 py-4">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : result.isError ? (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center">
                <p role="alert">Purchases could not be loaded.</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => result.refetch()}
                >
                  Try again
                </Button>
              </TableCell>
            </TableRow>
          ) : !data?.items.length ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-12 text-center text-muted-foreground"
              >
                {data?.total
                  ? "No purchases on this page. Choose Previous."
                  : "No purchases found."}
              </TableCell>
            </TableRow>
          ) : (
            data.items.map((item) => {
              const detailParams = new URLSearchParams(params);
              detailParams.set("purchase_id", item.id);
              return (
                <TableRow key={item.id}>
                  <TableCell className="py-4 pl-5">
                    <span className="block max-w-64 truncate font-medium">
                      {item.store_name || "Direct purchase"}
                    </span>
                    {item.receipt_number && (
                      <span className="text-xs text-muted-foreground">
                        {item.receipt_number}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{purchaseDateLabel(item.purchase_date)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.item_count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cost(item.total_cost)}
                  </TableCell>
                  <TableCell>{item.recorded_by_name}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <PurchaseRowActions
                      href={`/inventory/purchases?${detailParams}`}
                      label={item.store_name || "purchase"}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading
            ? "Loading purchases..."
            : data?.total
              ? `Showing ${Math.min((query.page - 1) * query.page_size + 1, data.total)}-${Math.min(query.page * query.page_size, data.total)} of ${data.total} purchases`
              : "0 purchases"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <DirectorySelect
            id="purchase-page-size"
            label="Rows per page"
            hideLabel
            alignItemWithTrigger={false}
            className="sm:w-32"
            value={String(query.page_size)}
            options={[10, 30, 50].map((value) => ({
              value: String(value),
              label: `${value} per page`,
            }))}
            onChange={(value) =>
              update({ page_size: Number(value) as 10 | 30 | 50 })
            }
          />
          <Button
            variant="outline"
            disabled={loading || query.page <= 1}
            onClick={() => update({ page: query.page - 1 }, false)}
          >
            Previous
          </Button>
          <span className="text-sm tabular-nums">
            {query.page} of {pages}
          </span>
          <Button
            variant="outline"
            disabled={loading || query.page >= pages}
            onClick={() => update({ page: query.page + 1 }, false)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
