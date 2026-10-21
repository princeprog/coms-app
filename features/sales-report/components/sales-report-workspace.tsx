"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { ExportCsvButton } from "@/features/exports/components/export-csv-button";
import { useSalesReportQuery } from "../hooks/use-sales-report-query";
import { salesReportKeys } from "../query-keys";
import { getSalesReportAction } from "../services/sales-report-actions";
import { comparisonLabel } from "../services/report-format";
import { ReportBreakdowns, ReportCashAndStock } from "./report-breakdowns";
import { ReportControls } from "./report-controls";
import { ReportHeadline } from "./report-headline";
import { ReportTrendChart } from "./report-trend-chart";

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
  const downloadParams = { ...input, date: report?.range.to ?? query.date };
  const coverage = report?.headline.cost_coverage_percent;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
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
              kind="sales-report-pdf"
              label="Download PDF"
              icon={<FileText aria-hidden="true" data-icon="inline-start" />}
              params={downloadParams}
            />
            <ExportCsvButton kind="sales-report" params={downloadParams} />
          </div>
        )}
      </header>
      <ReportControls reportQuery={reportQuery} report={report} />
      {result.isError && !report ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border px-6 py-12 text-center"
        >
          <p>{result.error.message}</p>
          <Button variant="outline" onClick={() => result.refetch()}>
            Try again
          </Button>
        </div>
      ) : !report ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading sales report"
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div
          aria-busy={result.isFetching}
          className="flex flex-col gap-5 transition-opacity duration-200 aria-busy:opacity-60 motion-reduce:transition-none"
        >
          <ReportHeadline report={report} />
          {report.show_costs &&
            coverage !== null &&
            coverage !== undefined &&
            Number(coverage) < 100 && (
              <Alert>
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>
                  Food cost covers {coverage}% of net sales
                </AlertTitle>
                <AlertDescription>
                  Sales of products without a recipe or with uncosted stock add
                  no food cost, so gross profit is overstated.
                </AlertDescription>
              </Alert>
            )}
          {report.headline.sales_count === 0 &&
          report.headline.void_count === 0 ? (
            <OperationalEmptyState
              title="No sales in this period"
              description="Choose another period or branch to see sales."
            />
          ) : (
            <>
              {report.daily.length > 1 && (
                <ReportTrendChart daily={report.daily} />
              )}
              <ReportBreakdowns report={report} />
            </>
          )}
          <ReportCashAndStock report={report} />
        </div>
      )}
    </div>
  );
}
