import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SalePage } from "@/features/sales/types/sale.types";
import {
  createSalesHref,
  type SalesPageFilters,
} from "@/features/sales/services/sales-page-params";

export function SalesHistoryTable({
  page,
  filters,
}: {
  page: SalePage;
  filters: SalesPageFilters;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));

  return (
    <section
      aria-labelledby="sales-history-heading"
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="sales-history-heading" className="text-lg font-semibold">
          Sales history
        </h2>
        <p className="text-sm text-muted-foreground">{page.total} total</p>
      </div>
      {page.items.length === 0 ? (
        <div className="rounded-4xl border bg-card p-6 text-center">
          <p className="font-medium">
            No sales have been recorded for this branch.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed sales will appear here with their saved tender and total.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-4xl border bg-card">
          <Table aria-label="Sales history">
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Tender</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {format(parseISO(sale.created_at), "PP p")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {sale.cashier_name}
                  </TableCell>
                  <TableCell>{sale.tender_method}</TableCell>
                  <TableCell className="tabular-nums">
                    {sale.total_amount}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sale.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      href={createSalesHref({ ...filters, saleId: sale.id })}
                    >
                      View sale
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {pageCount > 1 && (
        <nav
          aria-label="Sales history pages"
          className="flex justify-between gap-3"
        >
          {page.page > 1 ? (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={createSalesHref({
                ...filters,
                historyPage: page.page - 1,
                saleId: undefined,
              })}
            >
              Previous sales page
            </Link>
          ) : (
            <span />
          )}
          {page.page < pageCount && (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={createSalesHref({
                ...filters,
                historyPage: page.page + 1,
                saleId: undefined,
              })}
            >
              Next sales page
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
