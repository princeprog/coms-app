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
import type {
  DashboardToday,
  ReportProgress,
} from "../schemas/dashboard-today.schema";
import { timeOfDay } from "../services/dashboard-format";

import { BranchActions } from "./branch-actions";
import { ReportProgressCell } from "./report-progress-cell";

export function BranchBoard({ data }: { data: DashboardToday }) {
  const { branches, access } = data;
  const progress = new Map<string, ReportProgress[]>();
  for (const report of data.report_progress) {
    const reports = progress.get(report.branch_id) ?? [];
    reports.push(report);
    progress.set(report.branch_id, reports);
  }
  return (
    <section
      aria-labelledby="dashboard-branches"
      className="min-w-0 rounded-xl border bg-card"
    >
      <h2 id="dashboard-branches" className="border-b px-4 py-3 font-semibold">
        {data.workspace === "branch" ? "Your branches today" : "Branches today"}
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
            {access.reports && (
              <>
                <TableHead scope="col">Today&apos;s report</TableHead>
                <TableHead scope="col">Yesterday&apos;s report</TableHead>
              </>
            )}
            <TableHead scope="col">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={access.reports ? 8 : 6}
                className="py-8 text-center text-muted-foreground"
              >
                No branches to show in this view.
              </TableCell>
            </TableRow>
          )}
          {branches.map((branch) => {
            const reports = progress.get(branch.branch_id) ?? [];
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
                      <Badge className="bg-emerald-700 text-white">
                        Open · Shift {branch.shift_number}
                      </Badge>
                      {branch.cashier_name && (
                        <span className="text-xs text-muted-foreground">
                          {branch.cashier_name}
                        </span>
                      )}
                    </span>
                  ) : (
                    <Badge className="bg-slate-600 text-white">Closed</Badge>
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
                {access.reports &&
                  ["today", "yesterday"].map((period) => (
                    <TableCell key={period} className="align-top">
                      <ReportProgressCell
                        report={reports.find(
                          (report) => report.period === period,
                        )}
                        bypassed={data.submission_checklist_bypassed}
                      />
                    </TableCell>
                  ))}
                <TableCell className="pr-4">
                  <BranchActions
                    branch={branch}
                    reports={reports}
                    access={access}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
