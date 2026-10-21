"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { ExportCsvButton } from "@/features/exports/components/export-csv-button";
import { cn } from "@/lib/utils";
import { useSalesReportQuery } from "../hooks/use-sales-report-query";
import { salesReportKeys } from "../query-keys";
import { comparisonLabel } from "../services/report-format";
import { getSalesReportAction } from "../services/sales-report-actions";
import { ReportBranches } from "./report-branches";
import { ReportBreakdowns } from "./report-breakdowns";
import { ReportCashAndStock } from "./report-cash-stock";
import { ReportHero } from "./report-hero";
import { ReportProfitCard } from "./report-profit-card";
import { ReportStatStrip } from "./report-stat-strip";
import { ReportToolbar } from "./report-toolbar";

const press =
  "transition-[scale,background-color] duration-150 ease-out active:scale-97 motion-reduce:active:scale-100";

function ReportSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading sales report"
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-24" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function SalesReportWorkspace() {
  const reportQuery = useSalesReportQuery();
  const { query } = reportQuery;
  const input = {
    period: query.period,
    date: query.date,
    branch_id: query.branch,
  };
  const result = useQuery({
    queryKey: salesReportKeys.report(input),
    queryFn: async () => {
      const response = await getSalesReportAction(input);
      if (!response.ok) throw new Error(response.error);
      return response.data;
    },
    placeholderData: (previous) => previous,
    retry: false,
  });
  const report = result.data;
  const downloads = { ...input, date: report?.range.to ?? query.date };
  const empty =
    report &&
    report.headline.sales_count === 0 &&
    report.headline.void_count === 0;
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Sales report
          </h1>
          <p className="text-sm text-muted-foreground">
            {report
              ? `${report.scope_label} · ${comparisonLabel(report)}`
              : "Sales, profit and cash for a day, week or month."}
          </p>
        </div>
        {report && (
          <div className="flex flex-wrap gap-2">
            <ExportCsvButton
              kind="sales-report"
              className={press}
              params={downloads}
            />
            <ExportCsvButton
              kind="sales-report-pdf"
              label="Download PDF"
              icon={<FileText aria-hidden="true" data-icon="inline-start" />}
              variant="default"
              className={press}
              params={downloads}
            />
          </div>
        )}
      </header>
      <ReportToolbar reportQuery={reportQuery} report={report} />
      {result.isError && !report ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center"
        >
          <p>{result.error.message}</p>
          <Button
            variant="outline"
            className={press}
            onClick={() => result.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : !report ? (
        <ReportSkeleton />
      ) : (
        <div
          aria-busy={result.isFetching}
          className="flex flex-col gap-4 transition-opacity duration-200 ease-out-quint aria-busy:opacity-60 motion-reduce:transition-none"
        >
          <div
            className={cn("grid gap-4", report.show_costs && "lg:grid-cols-3")}
          >
            <div
              className={cn("min-w-0", report.show_costs && "lg:col-span-2")}
            >
              <ReportHero report={report} />
            </div>
            {report.show_costs && <ReportProfitCard report={report} />}
          </div>
          <ReportStatStrip report={report} />
          {empty ? (
            <OperationalEmptyState
              title="No sales in this period"
              description="Choose another period or branch to see sales."
            />
          ) : (
            <>
              <ReportBranches report={report} />
              <ReportBreakdowns report={report} />
            </>
          )}
          <ReportCashAndStock report={report} />
        </div>
      )}
    </div>
  );
}
