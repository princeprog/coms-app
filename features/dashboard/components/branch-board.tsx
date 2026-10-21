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
import { cn } from "@/lib/utils";
import type { BranchToday } from "../schemas/dashboard-today.schema";
import { timeOfDay } from "../services/dashboard-format";

const reportBadge: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Approved", className: "bg-emerald-600" },
  SUBMITTED: { label: "Submitted", className: "bg-sky-600" },
  RETURNED: { label: "Returned", className: "bg-amber-600" },
  DRAFT: { label: "Draft", className: "bg-slate-500" },
  MISSING: { label: "Not started", className: "bg-red-600" },
};

/** Each branch's register, sales so far and yesterday's report. */
export function BranchBoard({ branches }: { branches: BranchToday[] }) {
  return (
    <section
      aria-labelledby="dashboard-branches"
      className="min-w-0 rounded-xl border bg-card"
    >
      <h2 id="dashboard-branches" className="border-b px-4 py-3 font-semibold">
        Branches today
      </h2>
      <Table
        aria-labelledby="dashboard-branches"
        containerProps={{
          role: "region",
          "aria-label": "Branches today table",
          tabIndex: 0,
        }}
      >
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead scope="col" className="pl-4">
              Branch
            </TableHead>
            <TableHead scope="col">Register</TableHead>
            <TableHead scope="col" className="text-right">
              Sales
            </TableHead>
            <TableHead scope="col" className="text-right">
              Net sales
            </TableHead>
            <TableHead scope="col" className="text-right">
              Last sale
            </TableHead>
            <TableHead scope="col" className="pr-4">
              Yesterday&apos;s report
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => {
            const report = branch.yesterday_report_status
              ? reportBadge[branch.yesterday_report_status]
              : null;
            const quiet = !branch.shift_number && branch.sales_count === 0;
            return (
              <TableRow
                key={branch.branch_id}
                className={cn(quiet && "text-muted-foreground")}
              >
                <TableCell className="pl-4 font-medium whitespace-normal">
                  {branch.branch_name}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {branch.shift_number ? (
                    <span className="flex flex-col items-start gap-0.5">
                      <Badge className="bg-emerald-600 text-white">
                        Open · Shift {branch.shift_number}
                      </Badge>
                      {branch.cashier_name && (
                        <span className="text-xs text-muted-foreground">
                          {branch.cashier_name}
                        </span>
                      )}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Closed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {count(branch.sales_count)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {peso(branch.net_sales)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {branch.last_sale_at ? timeOfDay(branch.last_sale_at) : "—"}
                </TableCell>
                <TableCell className="pr-4">
                  {report ? (
                    <Badge className={cn("text-white", report.className)}>
                      {report.label}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
