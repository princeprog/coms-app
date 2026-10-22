import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPeso } from "@/features/shifts/services/shift-money";
import {
  businessDayLabel,
  shiftDateTime,
} from "@/features/shifts/services/shift-time";
import {
  createDailyReportHref,
  type DailyReportPageFilters,
} from "../services/daily-report-page-params";
import type { DailyReportDirectoryItem } from "../types/daily-report.types";
import { DailyReportRowActions } from "./daily-report-row-actions";
import { DailyReportStatusBadge } from "./daily-report-status-badge";

const weekday = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  timeZone: "UTC",
});

function CountProgress({ report }: { report: DailyReportDirectoryItem }) {
  if (!report.item_count)
    return <span className="text-muted-foreground">—</span>;
  const complete = report.counted_count === report.item_count;
  return (
    <span className={complete ? "text-muted-foreground" : "font-medium"}>
      {report.counted_count} of {report.item_count}
    </span>
  );
}

function Variance({ report }: { report: DailyReportDirectoryItem }) {
  if (!report.counted_count)
    return <span className="text-muted-foreground">—</span>;
  if (!report.variance_count)
    return <span className="text-muted-foreground">None</span>;
  return (
    <span className="font-medium text-amber-700 dark:text-amber-400">
      {report.variance_count} {report.variance_count === 1 ? "item" : "items"}
    </span>
  );
}

export function DailyReportList({
  items,
  filters,
}: {
  items: DailyReportDirectoryItem[];
  filters: DailyReportPageFilters;
}) {
  return (
    <Table
      aria-label="Daily reports"
      className="min-w-3xl"
      containerProps={{ className: "min-w-0" }}
    >
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead scope="col" className="pl-5">
            Business date
          </TableHead>
          <TableHead scope="col">Branch</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className="text-right">
            Counted
          </TableHead>
          <TableHead scope="col" className="text-right">
            Variance
          </TableHead>
          <TableHead scope="col" className="text-right">
            Sales
          </TableHead>
          <TableHead scope="col" className="hidden pl-6 lg:table-cell">
            Submitted
          </TableHead>
          <TableHead scope="col" className="w-12 pr-4">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((report) => {
          const openHref = createDailyReportHref({
            ...filters,
            reportId: report.id,
            reportBranchId: report.branch_id,
          });
          return (
            <TableRow key={report.id}>
              <TableCell className="py-3 pl-5">
                <Link
                  href={openHref}
                  className="rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {businessDayLabel(report.business_date)}
                </Link>
                <span className="block text-xs text-muted-foreground">
                  {weekday.format(
                    new Date(`${report.business_date}T00:00:00Z`),
                  )}
                </span>
              </TableCell>
              <TableCell className="whitespace-normal">
                <span className="font-medium">{report.branch_name}</span>
                {report.branch_status === "inactive" && (
                  <span className="block text-xs text-muted-foreground">
                    Inactive branch
                  </span>
                )}
              </TableCell>
              <TableCell>
                <DailyReportStatusBadge status={report.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <CountProgress report={report} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <Variance report={report} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPeso(report.completed_sales_amount)}
                <span className="block text-xs text-muted-foreground">
                  {report.completed_sales_count}{" "}
                  {report.completed_sales_count === 1 ? "sale" : "sales"}
                </span>
              </TableCell>
              <TableCell className="hidden pl-6 lg:table-cell">
                {report.submitted_at ? (
                  <>
                    <span>{report.submitted_by_name ?? "—"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {shiftDateTime(report.submitted_at)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not submitted</span>
                )}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <DailyReportRowActions
                  report={report}
                  openHref={openHref}
                  branchHref={
                    filters.branchId
                      ? undefined
                      : createDailyReportHref({
                          ...filters,
                          branchId: report.branch_id,
                          page: 1,
                        })
                  }
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
