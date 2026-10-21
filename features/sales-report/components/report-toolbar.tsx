"use client";

import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { SalesReportQueryState } from "../hooks/use-sales-report-query";
import type { ReportPeriod, SalesReport } from "../schemas/sales-report.schema";
import {
  currentPeriodName,
  manilaToday,
  neighbourDate,
  periodStartOf,
  rangeLabel,
  relativeName,
  shortDate,
} from "../services/report-format";

const periods: { value: ReportPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];
const press =
  "transition-[scale,background-color] duration-150 ease-out active:scale-97 motion-reduce:active:scale-100";

export function ReportToolbar({
  reportQuery,
  report,
}: {
  reportQuery: SalesReportQueryState;
  report: SalesReport | undefined;
}) {
  const { query, update } = reportQuery;
  const today = manilaToday();
  const start = report?.period_range.from;
  const next = start ? neighbourDate(query.period, start, 1) : undefined;
  const isCurrent = start === periodStartOf(query.period, today);
  const relative = start ? relativeName(query.period, start, today) : null;
  const dates = report ? rangeLabel(report) : "";
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-2 lg:flex-row lg:items-center">
      <Tabs
        value={query.period}
        onValueChange={(period) => update({ period: period as string })}
      >
        <TabsList aria-label="Report period" className="h-10 w-full lg:w-auto">
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
      <div className="flex items-center gap-1 lg:ml-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`size-10 ${press}`}
          aria-label="Previous period"
          disabled={!start}
          onClick={() =>
            start && update({ date: neighbourDate(query.period, start, -1) })
          }
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <div
          aria-live="polite"
          className="min-w-0 flex-1 px-1 text-center lg:min-w-52 lg:flex-none"
        >
          <p className="truncate text-sm font-semibold">
            {relative ?? (dates || "…")}
          </p>
          <p className="truncate text-xs text-muted-foreground tabular-nums">
            {relative ? dates : " "}
            {report?.in_progress && report.period !== "day"
              ? ` · through ${shortDate(report.range.to)}`
              : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`size-10 ${press}`}
          aria-label="Next period"
          disabled={!next || next > today}
          onClick={() => next && update({ date: next })}
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        {report && !isCurrent && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`ml-1 ${press}`}
            onClick={() => update({ date: undefined })}
          >
            {currentPeriodName(query.period)}
          </Button>
        )}
      </div>
      {report && report.branch_options.length > 1 && (
        <DirectorySelect
          id="sales-report-branch"
          label="Branch"
          hideLabel
          alignItemWithTrigger={false}
          className="lg:ml-auto lg:w-60 [&_[data-slot=select-trigger]]:h-10"
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
