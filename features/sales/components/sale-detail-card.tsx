import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createSalesHref,
  type SalesPageFilters,
} from "@/features/sales/services/sales-page-params";
import type { Sale, SaleVoidAction } from "@/features/sales/types/sale.types";
import { SaleVoidControl } from "./sale-void-control";

export function SaleDetailCard({
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
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <CardTitle>
            <h2>Sale details</h2>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(sale.created_at), "PP p")} · {sale.tender_method}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{sale.status}</Badge>
          {canVoid && sale.status === "COMPLETED" && (
            <SaleVoidControl
              branchId={branchId}
              saleId={sale.id}
              action={voidAction}
            />
          )}
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={createSalesHref({ ...filters, saleId: undefined })}
          >
            Close sale details
          </Link>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid gap-3 rounded-3xl border p-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Sale ID</dt>
            <dd className="break-all font-mono text-sm">{sale.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Cashier account</dt>
            <dd className="break-all font-mono text-sm">
              {sale.cashier_user_id}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Recorded total</dt>
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
          <div className="w-full overflow-x-auto rounded-3xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Quantity</th>
                  <th className="px-3 py-2 font-medium">Unit price</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Line total
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2 font-medium">
                      {item.product_name_snapshot}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {item.unit_price}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {item.line_total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <li key={event.id} className="rounded-3xl border p-3">
                <p className="font-medium">
                  {event.event_type === "COMPLETED"
                    ? "Sale completed"
                    : "Sale voided"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(event.created_at), "PP p")} · Recorded by
                  staff
                </p>
                {event.reason && (
                  <p className="mt-2 text-sm">Reason: {event.reason}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      </CardContent>
    </Card>
  );
}
