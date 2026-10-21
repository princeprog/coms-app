import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SalesReport } from "../schemas/sales-report.schema";
import { count, peso } from "../services/report-format";

/** Branches with activity in the period; quiet branches are summarised. */
export function ReportBranches({ report }: { report: SalesReport }) {
  const active = report.by_branch.filter(
    (row) => row.sales_count > 0 || Number(row.cash_difference) !== 0,
  );
  const quiet = report.by_branch.length - active.length;
  if (report.by_branch.length <= 1) return null;
  const costs = report.show_costs;
  const headers = [
    "Sales",
    "Net sales",
    "Average sale",
    ...(costs ? ["Gross profit"] : []),
    "Cash over/short",
  ];
  return (
    <section
      aria-labelledby="report-branches"
      className="min-w-0 rounded-xl border bg-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3">
        <h2 id="report-branches" className="font-semibold">
          Branches
        </h2>
        {quiet > 0 && (
          <p className="text-xs text-muted-foreground">
            {quiet} other {quiet === 1 ? "branch" : "branches"} had no sales
          </p>
        )}
      </div>
      <Table
        aria-labelledby="report-branches"
        containerProps={{
          role: "region",
          "aria-label": "Branches table",
          tabIndex: 0,
        }}
      >
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead scope="col" className="pl-4">
              Branch
            </TableHead>
            {headers.map((header, index) => (
              <TableHead
                key={header}
                scope="col"
                className={cn(
                  "text-right",
                  index === headers.length - 1 && "pr-4",
                )}
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {active.map((row) => {
            const cash = Number(row.cash_difference);
            return (
              <TableRow key={row.branch_id}>
                <TableCell className="pl-4 font-medium whitespace-normal">
                  {row.branch_name}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {count(row.sales_count)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {peso(row.net_sales)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {peso(row.average_sale)}
                </TableCell>
                {costs && (
                  <TableCell className="text-right tabular-nums">
                    {peso(row.gross_profit)}
                  </TableCell>
                )}
                <TableCell
                  className={cn(
                    "pr-4 text-right tabular-nums",
                    cash < 0 && "text-red-700 dark:text-red-400",
                    cash > 0 && "text-amber-700 dark:text-amber-400",
                  )}
                >
                  {peso(row.cash_difference)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
