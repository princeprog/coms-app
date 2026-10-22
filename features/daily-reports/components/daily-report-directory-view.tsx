"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import {
  createDailyReportHref,
  type DailyReportPageFilters,
} from "../services/daily-report-page-params";
import type { DailyReportDirectory } from "../types/daily-report.types";
import { DailyReportDirectoryFilters } from "./daily-report-directory-filters";
import { DailyReportDirectoryPagination } from "./daily-report-directory-pagination";
import { DailyReportList } from "./daily-report-list";
import { DailyReportStatusTabs } from "./daily-report-status-tabs";

/** URL-driven list: every change replaces the query and the server renders the page. */
export function DailyReportDirectoryView({
  filters,
  branches,
  directory,
}: {
  filters: DailyReportPageFilters;
  branches: BranchProductBranchOption[];
  directory: DailyReportDirectory;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasFilters = Boolean(
    filters.branchId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.status !== "all" ||
    filters.sort !== "newest",
  );
  function update(patch: Partial<DailyReportPageFilters>, resetPage = true) {
    const next = { ...filters, ...patch, ...(resetPage ? { page: 1 } : {}) };
    startTransition(() =>
      router.replace(createDailyReportHref(next), { scroll: false }),
    );
  }
  function clear() {
    update({
      branchId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      status: "all",
      sort: "newest",
    });
  }
  return (
    <section
      aria-label="Daily report directory"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <DailyReportStatusTabs
          value={filters.status}
          counts={directory.status_counts}
          onChange={(status) => update({ status })}
        />
        <DailyReportDirectoryFilters
          filters={filters}
          branches={branches}
          hasFilters={hasFilters}
          onChange={update}
          onClear={clear}
        />
      </div>
      <div
        aria-busy={pending}
        className={cn(
          "overflow-hidden rounded-xl border bg-card transition-opacity duration-150 ease-out motion-reduce:transition-none",
          pending && "opacity-60",
        )}
      >
        {directory.items.length ? (
          <DailyReportList items={directory.items} filters={filters} />
        ) : (
          <div className="p-5">
            <OperationalEmptyState
              title={
                hasFilters
                  ? "No reports match these filters"
                  : "No daily reports yet"
              }
              description={
                hasFilters
                  ? "Try another status, branch or date range."
                  : "Branches create a report at the end of each business day."
              }
              actions={
                hasFilters ? (
                  <Button type="button" variant="outline" onClick={clear}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
        <DailyReportDirectoryPagination
          filters={filters}
          total={directory.total}
          pending={pending}
          onChange={update}
        />
      </div>
    </section>
  );
}
