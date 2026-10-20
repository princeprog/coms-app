import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stockUnitLabel } from "@/features/inventory/stock-unit-label";
import { formatSupplierReceiptCost as cost } from "@/features/supplier-receipts/services/supplier-receipt-total";
import { purchaseDateLabel } from "../services/purchase-date";
import type { PurchaseDetail } from "../schemas/purchase.schema";

type SummaryItem = Omit<PurchaseDetail["items"][number], "id"> & {
  /** Commissary balance after this purchase; shown during review only. */
  stock_after?: string | null;
};
type Summary = Pick<
  PurchaseDetail,
  "purchase_date" | "store_name" | "receipt_number" | "notes" | "total_cost"
> & { items: SummaryItem[] };

export function PurchaseSummary({
  purchase,
  showTotal = true,
}: {
  purchase: Summary;
  showTotal?: boolean;
}) {
  const facts = [
    ["Purchase date", purchaseDateLabel(purchase.purchase_date)],
    ["Location", "Commissary"],
    ["Store", purchase.store_name],
    ["Receipt number", purchase.receipt_number],
  ].filter((fact): fact is [string, string] => Boolean(fact[1]));
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border bg-muted/25 p-4 text-sm sm:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-medium wrap-anywhere">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="overflow-hidden rounded-xl border">
        <Table aria-label="Purchase stock items">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="pl-4">Stock item</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit cost</TableHead>
              <TableHead className="pr-4 text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchase.items.map((item) => (
              <TableRow key={item.stock_item_id}>
                <TableCell className="min-w-40 py-3 pl-4 whitespace-normal">
                  <span className="font-medium">{item.stock_item_name}</span>
                  {item.stock_after && (
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      Stock after:{" "}
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {item.stock_after} {stockUnitLabel(item.unit)}
                      </span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-3 text-right tabular-nums">
                  {item.quantity_received}
                  <span className="block text-xs text-muted-foreground">
                    {stockUnitLabel(item.unit)}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-right tabular-nums">
                  ₱{cost(item.unit_cost)}
                </TableCell>
                <TableCell className="py-3 pr-4 text-right font-medium tabular-nums">
                  ₱{cost(item.line_total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {showTotal && (
        <div className="flex justify-between border-t pt-4 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">₱{cost(purchase.total_cost)}</span>
        </div>
      )}
      {purchase.notes && (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Note</p>
          <p className="mt-1 whitespace-pre-wrap wrap-anywhere">
            {purchase.notes}
          </p>
        </div>
      )}
    </div>
  );
}
