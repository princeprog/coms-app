"use client";

import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { SalesReportQueryState } from "../hooks/use-sales-report-query";
import type { ReportPeriod, SalesReport } from "../schemas/sales-report.schema";
import { neighbourDate, periodLabel } from "../services/report-format";

const periods: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function ReportControls({
  reportQuery,
  report,
}: {
  reportQuery: SalesReportQueryState;
  report: SalesReport | undefined;
}) {
  const { query, update } = reportQuery;
  const start = report?.period_range.from;
  const next = start ? neighbourDate(query.period, start, 1) : undefined;
  const today = manilaToday();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs
        value={query.period}
        onValueChange={(period) => update({ period: period as string })}
      >
        <TabsList aria-label="Report period" className="h-11">
          {periods.map((period) => (
            <TabsTrigger
              key={period.value}
              value={period.value}
              className="px-4"
            >
              {period.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label="Previous period"
          disabled={!start}
          onClick={() =>
            start && update({ date: neighbourDate(query.period, start, -1) })
          }
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span
          aria-live="polite"
          className="min-w-44 px-2 text-center text-sm font-medium tabular-nums"
        >
          {report ? periodLabel(report) : "…"}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11"
          aria-label="Next period"
          disabled={!next || next > today}
          onClick={() => next && update({ date: next })}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          disabled={!query.date}
          onClick={() => update({ date: undefined })}
        >
          Today
        </Button>
      </div>
      {report && report.branch_options.length > 1 && (
        <DirectorySelect
          id="sales-report-branch"
          label="Branch"
          hideLabel
          alignItemWithTrigger={false}
          className="sm:ml-auto sm:w-64 [&_[data-slot=select-trigger]]:h-11"
          value={query.branch ?? "all"}
          options={[
            { value: "all", label: "All branches" },
            ...report.branch_options.map((branch) => ({
              value: branch.id,
              label: branch.name,
            })),
          ].map((option) => ({
            ...option,
            icon: <Building2 className="text-sky-600" />,
          }))}
          onChange={(branch) =>
            update({ branch: branch === "all" ? undefined : branch })
          }
        />
      )}
    </div>
  );
}
