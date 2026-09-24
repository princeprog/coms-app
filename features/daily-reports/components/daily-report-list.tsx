import Link from "next/link";
import {
  OperationalEmptyState,
  OperationalPagination,
  OperationalStatusBadge,
} from "@/components/shared/operational-page-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dailyReportStatuses } from "@/features/daily-reports/constants";
import {
  createDailyReportHref,
  type DailyReportPageFilters,
} from "@/features/daily-reports/services/daily-report-page-params";
import type { DailyReportPage } from "@/features/daily-reports/types/daily-report.types";

export function DailyReportList({
  page,
  filters,
}: {
  page: DailyReportPage;
  filters: DailyReportPageFilters;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const start = page.total === 0 ? 0 : (page.page - 1) * page.page_size + 1;
  const end = Math.min(page.total, start + page.items.length - 1);

  return (
    <section aria-labelledby="daily-report-list-title" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="daily-report-list-title" className="text-lg font-semibold">
            Daily reports
          </h2>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {page.total === 0
              ? "No reports"
              : `Showing ${start}–${end} of ${page.total} reports`}
          </p>
        </div>
      </div>

      {page.items.length === 0 ? (
        <OperationalEmptyState
          title={
            filters.status === "all"
              ? "No daily reports yet"
              : `No ${filters.status.toLowerCase()} reports`
          }
          description={
            filters.status === "all"
              ? "Create a report to record this branch’s physical counts."
              : "Choose another status to find a different report."
          }
        />
      ) : (
        <Table
          className="min-w-[42rem]"
          containerProps={{
            role: "region",
            "aria-label": "Daily report results",
            tabIndex: 0,
            className:
              "rounded-lg border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          }}
        >
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead scope="col">Business date</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Updated</TableHead>
              <TableHead scope="col" className="text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.items.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium tabular-nums">
                  {report.business_date}
                </TableCell>
                <TableCell>
                  <OperationalStatusBadge
                    variant={statusVariant(report.status)}
                  >
                    {report.status.replaceAll("_", " ")}
                  </OperationalStatusBadge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatManilaDate(report.updated_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={createDailyReportHref({
                      ...filters,
                      reportId: report.id,
                    })}
                    aria-current={
                      filters.reportId === report.id ? "page" : undefined
                    }
                    className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Open report
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <OperationalPagination
        ariaLabel="Daily report pages"
        page={filters.page}
        pageCount={pageCount}
        previousHref={
          filters.page > 1
            ? createDailyReportHref({ ...filters, page: filters.page - 1 })
            : undefined
        }
        nextHref={
          filters.page < pageCount
            ? createDailyReportHref({ ...filters, page: filters.page + 1 })
            : undefined
        }
        resultSummary={
          page.total === 0
            ? "No reports"
            : `Showing ${start}–${end} of ${page.total} reports`
        }
      />
    </section>
  );
}

function formatManilaDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function statusVariant(status: (typeof dailyReportStatuses)[number]) {
  if (status === "RETURNED") return "destructive" as const;
  if (status === "APPROVED") return "secondary" as const;
  return "outline" as const;
}
