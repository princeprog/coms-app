import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Sale, SaleVoidAction } from "@/features/sales/types/sale.types";
import { SaleVoidControl } from "./sale-void-control";

export function SaleDetailContent({
  sale,
  branchId,
  canVoid,
  voidAction,
}: {
  sale: Sale;
  branchId: string;
  canVoid: boolean;
  voidAction: SaleVoidAction;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge variant="outline">{sale.status}</Badge>
        {canVoid && sale.status === "COMPLETED" && (
          <SaleVoidControl
            branchId={branchId}
            saleId={sale.id}
            action={voidAction}
          />
        )}
      </div>

      <dl className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Sale ID</dt>
          <dd className="break-all font-mono text-sm">{sale.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Cashier account</dt>
          <dd className="break-all font-mono text-sm">
            {sale.cashier_user_id}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Recorded total</dt>
          <dd className="font-semibold tabular-nums">{sale.total_amount}</dd>
        </div>
      </dl>

      <section
        aria-labelledby="sale-items-heading"
        className="flex flex-col gap-2"
      >
        <h3 id="sale-items-heading" className="font-semibold">
          Sale items
        </h3>
        <div
          role="region"
          aria-label="Sale item details"
          tabIndex={0}
          className="w-full overflow-x-auto rounded-lg border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Table aria-label="Sale items">
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product_name_snapshot}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.unit_price}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.line_total}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section
        aria-labelledby="sale-events-heading"
        className="flex flex-col gap-2"
      >
        <h3 id="sale-events-heading" className="font-semibold">
          History
        </h3>
        <ol className="flex flex-col gap-3">
          {sale.events.map((event) => (
            <li key={event.id} className="rounded-lg border p-3">
              <p className="font-medium">
                {event.event_type === "COMPLETED"
                  ? "Sale completed"
                  : "Sale voided"}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(event.created_at), "PP p")} · Recorded by staff
              </p>
              {event.reason && (
                <p className="mt-2 text-sm">Reason: {event.reason}</p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
