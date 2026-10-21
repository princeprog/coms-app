"use client";

import { OperationalPagination } from "@/components/shared/operational-page-ui";
import { TablePageSize } from "@/components/shared/table-page-size";
import type { useCostQuery } from "../hooks/use-cost-query";

export function CostTableFooter({
  costQuery,
  total,
  label,
  pageParam = "page",
}: {
  costQuery: ReturnType<typeof useCostQuery>;
  total: number;
  label: string;
  pageParam?: "page";
}) {
  const { query, href } = costQuery;
  const pageCount = Math.max(1, Math.ceil(total / query.page_size));
  const first = total ? (query.page - 1) * query.page_size + 1 : 0;
  const last = Math.min(query.page * query.page_size, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <span className="text-sm text-muted-foreground tabular-nums">
        {total ? `Showing ${first}–${last} of ${total} ${label}` : ""}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <TablePageSize pageSize={query.page_size} href={href({})} />
        <OperationalPagination
          ariaLabel={`${label} pages`}
          page={query.page}
          pageCount={pageCount}
          previousHref={
            query.page > 1 ? href({ [pageParam]: query.page - 1 }) : undefined
          }
          nextHref={
            query.page < pageCount
              ? href({ [pageParam]: query.page + 1 })
              : undefined
          }
        />
      </div>
    </div>
  );
}
