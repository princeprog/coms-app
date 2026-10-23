import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { count, peso } from "@/lib/metric-format";
import type { DashboardExceptions } from "../schemas/dashboard-exceptions.schema";
import { frequentShortages } from "../services/exception-trend";

/** Cash differences per shift opener and voids per seller, most short first. */
export function CashierExceptionsTable({
  cashiers,
}: {
  cashiers: NonNullable<DashboardExceptions["cashiers"]>;
}) {
  if (cashiers.items.length === 0)
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No closed shifts or sales in the last 4 weeks.
      </p>
    );
  return (
    <>
      <Table
        containerProps={{
          role: "region",
          "aria-label": "Exceptions by cashier table",
          tabIndex: 0,
        }}
      >
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead scope="col" className="pl-4">
              Cashier
            </TableHead>
            <TableHead scope="col">Branches</TableHead>
            <TableHead scope="col">Short shifts</TableHead>
            <TableHead scope="col" className="text-right">
              Total short
            </TableHead>
            <TableHead scope="col">Over shifts</TableHead>
            <TableHead scope="col" className="pr-4">
              Voids
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cashiers.items.map((cashier) => (
            <TableRow key={cashier.user_id}>
              <TableCell className="pl-4 font-medium whitespace-normal">
                {cashier.full_name}
              </TableCell>
              <TableCell className="whitespace-normal text-muted-foreground">
                {cashier.branches.join(", ")}
              </TableCell>
              <TableCell>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="tabular-nums">
                    {count(cashier.short_shifts)} of {count(cashier.shifts)}
                  </span>
                  {frequentShortages(cashier.short_shifts, cashier.shifts) && (
                    <Badge className="bg-amber-700 text-white">Frequent</Badge>
                  )}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {cashier.short_shifts ? peso(cashier.short_amount) : "—"}
              </TableCell>
              <TableCell className="tabular-nums">
                {count(cashier.over_shifts)} of {count(cashier.shifts)}
                {cashier.over_shifts > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {peso(cashier.over_amount)}
                  </span>
                )}
              </TableCell>
              <TableCell className="pr-4 tabular-nums">
                {count(cashier.void_count)} of {count(cashier.sales_count)}{" "}
                sales
                {cashier.void_count > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {peso(cashier.void_amount)}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {cashiers.total > cashiers.items.length && (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Showing the {cashiers.items.length} cashiers with the most shortages
          of {cashiers.total}.
        </p>
      )}
    </>
  );
}
