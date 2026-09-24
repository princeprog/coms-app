import { OperationalPagination } from "@/components/shared/operational-page-ui";
import { createDispatchHref } from "@/features/dispatches/services/dispatch-page-params";
import type { DispatchPageFilters } from "@/features/dispatches/services/dispatch-page-params";

export function DispatchPagination({
  filters,
  pageCount,
}: {
  filters: DispatchPageFilters;
  pageCount: number;
}) {
  return (
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
  );
}
