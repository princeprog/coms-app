"use client";

import { Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DirectorySelect } from "@/components/shared/directory-select";
import { cn } from "@/lib/utils";
import { useDashboardToday } from "../hooks/use-dashboard-today";
import { businessDayLabel } from "../services/dashboard-format";
import { AttentionList } from "./attention-list";
import { BranchBoard } from "./branch-board";
import { TodayHero } from "./today-hero";
import { TopProductsToday } from "./top-products-today";
import { UpdatedLabel } from "./updated-label";

const press =
  "transition-[scale,background-color] duration-150 ease-out active:scale-97 motion-reduce:active:scale-100";

function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

export function DashboardTodayWorkspace({
  canOpenReport,
}: {
  canOpenReport: boolean;
}) {
  const { result, branchId, selectBranch, navigating } = useDashboardToday();
  const data = result.data;
  const busy = result.isFetching || navigating;
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `Business day ${businessDayLabel(data.business_date)} · ${data.scope_label}`
              : "Today across your branches."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data && <UpdatedLabel asOf={data.as_of} />}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("size-10", press)}
            aria-label="Refresh dashboard"
            disabled={result.isFetching}
            onClick={() => result.refetch()}
          >
            <RefreshCw
              aria-hidden="true"
              className={cn(
                result.isFetching && "animate-spin motion-reduce:animate-none",
              )}
            />
          </Button>
          {data && data.branch_options.length > 1 && (
            <DirectorySelect
              id="dashboard-branch"
              label="Branch"
              hideLabel
              alignItemWithTrigger={false}
              className="sm:w-60 [&_[data-slot=select-trigger]]:h-10"
              value={branchId ?? "all"}
              options={[
                { value: "all", label: "All branches" },
                ...data.branch_options.map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
              ].map((option) => ({
                ...option,
                icon: <Building2 className="text-sky-600" />,
              }))}
              onChange={(value) =>
                selectBranch(value === "all" ? undefined : value)
              }
            />
          )}
        </div>
      </header>
      {result.isError && !data ? (
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
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <div
          aria-busy={busy}
          className="flex flex-col gap-4 transition-opacity duration-200 ease-out-quint aria-busy:opacity-80 motion-reduce:transition-none"
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <TodayHero data={data} canOpenReport={canOpenReport} />
            </div>
            <AttentionList data={data} branchId={branchId} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <BranchBoard branches={data.branches} />
            </div>
            <TopProductsToday products={data.top_products_today} />
          </div>
        </div>
      )}
    </div>
  );
}
