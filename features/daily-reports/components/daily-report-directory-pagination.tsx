"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DirectorySelect } from "@/components/shared/directory-select";
import { Button } from "@/components/ui/button";
import {
  dailyReportPageSizes,
  type DailyReportPageFilters,
} from "../services/daily-report-page-params";

export function DailyReportDirectoryPagination({
  filters,
  total,
  pending,
  onChange,
}: {
  filters: DailyReportPageFilters;
  total: number;
  pending: boolean;
  onChange: (
    patch: Partial<DailyReportPageFilters>,
    resetPage?: boolean,
  ) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / filters.pageSize));
  const start = total ? (filters.page - 1) * filters.pageSize + 1 : 0;
  const end = Math.min(filters.page * filters.pageSize, total);
  return (
    <nav
      aria-label="Daily report pages"
      className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3"
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {pending
          ? "Loading reports…"
          : total
            ? `Showing ${start}–${end} of ${total} ${total === 1 ? "report" : "reports"}`
            : "No reports"}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <DirectorySelect
            id="daily-report-page-size"
            label="Rows per page"
            hideLabel
            alignItemWithTrigger={false}
            className="w-20 sm:w-20 [&_[data-slot=select-trigger]]:h-10"
            value={String(filters.pageSize)}
            options={dailyReportPageSizes.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            onChange={(value) =>
              onChange({
                pageSize:
                  dailyReportPageSizes.find((size) => String(size) === value) ??
                  10,
              })
            }
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={pending || filters.page <= 1}
            onClick={() => onChange({ page: filters.page - 1 }, false)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="px-2 text-sm tabular-nums">
            {filters.page} of {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={pending || filters.page >= pages}
            onClick={() => onChange({ page: filters.page + 1 }, false)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
