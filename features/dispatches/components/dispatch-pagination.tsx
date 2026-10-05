import { OperationalPagination } from "@/components/shared/operational-page-ui";
import { createDispatchHref } from "@/features/dispatches/services/dispatch-page-params";
import type { DispatchPageFilters } from "@/features/dispatches/services/dispatch-page-params";

export function DispatchPagination({
  filters,
  pageCount,
  total,
  pageSize,
  itemCount,
}: {
  filters: DispatchPageFilters;
  pageCount: number;
  total: number;
  pageSize: number;
  itemCount: number;
}) {
  const start = itemCount ? (filters.page - 1) * pageSize + 1 : 0;
  const end = itemCount ? Math.min(start + itemCount - 1, total) : 0;
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {start}–{end} of {total}{" "}
        {total === 1 ? "dispatch" : "dispatches"}
      </p>
      <OperationalPagination
        ariaLabel="Dispatch pages"
        page={filters.page}
        pageCount={pageCount}
        previousHref={
          filters.page > 1
            ? createDispatchHref({ ...filters, page: filters.page - 1 })
            : undefined
        }
        nextHref={
          filters.page < pageCount
            ? createDispatchHref({ ...filters, page: filters.page + 1 })
            : undefined
        }
      />
    </div>
  );
}
