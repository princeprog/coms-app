import Link from "next/link";
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
import type { DashboardToday } from "../schemas/dashboard-today.schema";
import { businessDayLabel } from "../services/dashboard-format";
import { reportHref } from "../services/dashboard-links";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Items counted below expected stock in recent submitted or approved reports. */
export function CountShortages({ data }: { data: DashboardToday }) {
  const { days, branches, items } = data.count_shortages;
  const showCosts = data.show_costs;
  const shortBranches = branches.filter((branch) => branch.short_lines > 0);
  return (
    <section
      aria-labelledby="dashboard-shortages"
      className="flex min-w-0 flex-col rounded-xl border bg-card"
    >
      <div className="border-b px-4 py-3">
        <h2 id="dashboard-shortages" className="font-semibold">
          Count shortages
        </h2>
        <p className="text-xs text-muted-foreground">
          Submitted and approved reports, last {days} days
        </p>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {branches.length === 0
            ? `No submitted reports in the last ${days} days.`
            : "No items counted short."}
        </p>
      ) : (
        <>
          <ul
            aria-label="Shortages by branch"
            className="flex flex-wrap gap-x-4 gap-y-1 px-4 pt-3 text-sm"
          >
            {shortBranches.map((branch) => (
              <li key={branch.branch_id}>
                <span className="font-medium">{branch.branch_name}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  {showCosts && branch.shortage_value !== null
                    ? `${peso(branch.shortage_value)} short · `
                    : ""}
                  {plural(branch.short_lines, "short count")} in{" "}
                  {plural(branch.reports, "report")}
                </span>
              </li>
            ))}
          </ul>
          <Table
            aria-labelledby="dashboard-shortages"
            containerProps={{
              role: "region",
              "aria-label": "Count shortages table",
              tabIndex: 0,
            }}
          >
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead scope="col" className="pl-4">
                  Item
                </TableHead>
                <TableHead scope="col">Branch</TableHead>
                <TableHead scope="col" className="text-right">
                  Short
                </TableHead>
                {showCosts && (
                  <TableHead scope="col" className="text-right">
                    Value
                  </TableHead>
                )}
                <TableHead scope="col">Times short</TableHead>
                <TableHead scope="col" className="pr-4">
                  Latest report
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={`${item.branch_id}:${item.stock_item_id}`}>
                  <TableCell className="pl-4 font-medium whitespace-normal">
                    {item.stock_item_name}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {item.branch_name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {count(item.short_quantity)} {item.unit}
                  </TableCell>
                  {showCosts && (
                    <TableCell className="text-right tabular-nums">
                      {item.shortage_value === null ? (
                        <span className="text-muted-foreground">No cost</span>
                      ) : (
                        peso(item.shortage_value)
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="flex items-center gap-2">
                      {plural(item.times_short, "report")}
                      {item.times_short > 1 && (
                        <Badge className="bg-amber-700 text-white">
                          Recurring
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4">
                    <Link
                      href={reportHref(
                        item.branch_id,
                        item.latest_business_date,
                        item.latest_report_id,
                      )}
                      aria-label={`Open ${item.branch_name} report for ${businessDayLabel(item.latest_business_date)}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {businessDayLabel(item.latest_business_date)}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </section>
  );
}
