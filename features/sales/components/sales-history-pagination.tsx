"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectorySelect } from "@/components/shared/directory-select";
import type { useDirectoryQuery } from "@/hooks/use-directory-query";
import type { SalesPageFilters } from "../services/sales-page-params";
import type { SalePage } from "../types/sale.types";
export function SalesHistoryPagination({
  page,
  filters,
  query,
}: {
  page: SalePage;
  filters: SalesPageFilters;
  query: ReturnType<typeof useDirectoryQuery<SalesPageFilters>>;
}) {
  const pages = Math.max(1, Math.ceil(page.total / page.page_size));
  return (
    <nav
      aria-label="Sales history pages"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-muted-foreground">
        {page.total === 0
          ? "0 sales"
          : `${(page.page - 1) * page.page_size + 1}–${Math.min(page.page * page.page_size, page.total)} of ${page.total} sales`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <DirectorySelect
            id="history-page-size"
            label="Rows per page"
            hideLabel
            alignItemWithTrigger={false}
            className="w-20 sm:w-20 [&_[data-slot=select-trigger]]:h-10"
            value={String(filters.historyPageSize ?? 10)}
            options={[10, 30, 50].map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            onChange={(value) =>
              query.apply({ historyPageSize: Number(value) })
            }
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous sales page"
          disabled={query.pending || page.page <= 1}
          onClick={() =>
            query.apply({ page: page.page - 1 }, { resetPage: false })
          }
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="text-sm tabular-nums">
          {page.page} / {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next sales page"
          disabled={query.pending || page.page >= pages}
          onClick={() =>
            query.apply({ page: page.page + 1 }, { resetPage: false })
          }
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
