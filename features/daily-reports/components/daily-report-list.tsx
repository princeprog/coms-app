import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  dailyReportRoute,
  dailyReportStatuses,
} from "@/features/daily-reports/constants";
import { createDailyReportHref } from "@/features/daily-reports/services/daily-report-page-params";
import type { DailyReportPage } from "@/features/daily-reports/types/daily-report.types";
import type { DailyReportPageFilters } from "@/features/daily-reports/services/daily-report-page-params";

export function DailyReportList({
  page,
  filters,
}: {
  page: DailyReportPage;
  filters: DailyReportPageFilters;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  return (
    <section aria-labelledby="daily-report-list-title" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="daily-report-list-title"
            className="font-heading text-lg font-medium"
          >
            Reports
          </h2>
          <p className="text-sm text-muted-foreground">
            {page.total} {page.total === 1 ? "report" : "reports"} for this
            branch
          </p>
        </div>
        <form
          action={dailyReportRoute}
          method="get"
          aria-label="Filter daily reports"
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="branch_id" value={filters.branchId} />
          <div className="flex flex-col gap-2">
            <label
              htmlFor="daily-report-status"
              className="text-sm font-medium"
            >
              Status
            </label>
            <select
              id="daily-report-status"
              name="status"
              defaultValue={filters.status}
              className="h-9 rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <option value="all">All statuses</option>
              {dailyReportStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">
            Apply filter
          </Button>
        </form>
      </div>

      {page.items.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="font-medium">
              {filters.status === "all"
                ? "No daily reports yet."
                : `No ${filters.status.toLowerCase()} reports.`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filters.status === "all"
                ? "Create a draft to record this branch’s physical counts."
                : "Choose another status to find a different report."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {page.items.map((report) => (
                <li key={report.id}>
                  <Link
                    href={createDailyReportHref({
                      ...filters,
                      reportId: report.id,
                    })}
                    aria-current={
                      filters.reportId === report.id ? "page" : undefined
                    }
                    className="flex flex-wrap items-center justify-between gap-3 rounded-3xl px-4 py-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    <span>
                      <span className="block font-medium">
                        {report.business_date}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Updated {formatManilaDate(report.updated_at)}{" "}
                        (Asia/Manila)
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Badge variant={statusVariant(report.status)}>
                        {report.status.replaceAll("_", " ")}
                      </Badge>
                      <span className="text-sm text-primary">Open report</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {pageCount > 1 && (
        <nav
          aria-label="Daily report pages"
          className="flex items-center justify-between gap-3"
        >
          {filters.page > 1 ? (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={createDailyReportHref({
                ...filters,
                page: filters.page - 1,
              })}
            >
              Previous page
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Page {filters.page} of {pageCount}
          </span>
          {filters.page < pageCount ? (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={createDailyReportHref({
                ...filters,
                page: filters.page + 1,
              })}
            >
              Next page
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
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
