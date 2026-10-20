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
type Summary = Pick<
  PurchaseDetail,
  "purchase_date" | "store_name" | "receipt_number" | "notes" | "total_cost"
> & { items: Omit<PurchaseDetail["items"][number], "id">[] };
export function PurchaseSummary({ purchase }: { purchase: Summary }) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Purchase date</dt>
          <dd className="mt-1 font-medium">
            {purchaseDateLabel(purchase.purchase_date)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Location</dt>
          <dd className="mt-1 font-medium">Commissary</dd>
        </div>
        {purchase.store_name && (
          <div>
            <dt className="text-muted-foreground">Store</dt>
            <dd className="mt-1 break-words">{purchase.store_name}</dd>
          </div>
        )}
        {purchase.receipt_number && (
          <div>
            <dt className="text-muted-foreground">Receipt number</dt>
            <dd className="mt-1 break-words">{purchase.receipt_number}</dd>
          </div>
        )}
      </dl>
      <Table aria-label="Purchase stock items">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead>Stock item</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit cost</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchase.items.map((item) => (
            <TableRow key={item.stock_item_id}>
              <TableCell className="min-w-40 whitespace-normal">
                {item.stock_item_name}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {item.quantity_received}
                <span className="block text-xs text-muted-foreground">
                  {stockUnitLabel(item.unit)}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {cost(item.unit_cost)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {cost(item.line_total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between border-t pt-4 font-semibold">
        <span>Total (PHP)</span>
        <span className="tabular-nums">{cost(purchase.total_cost)}</span>
      </div>
      {purchase.notes && (
        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {purchase.notes}
        </p>
      )}
    </div>
  );
}
