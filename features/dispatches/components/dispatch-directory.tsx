"use client";

import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DispatchViews } from "./dispatch-views";
import { useDispatchDirectoryRefresh } from "../hooks/use-dispatch-directory-refresh";
import { useDirectoryQuery } from "@/hooks/use-directory-query";
import {
  createDispatchHref,
  type DispatchPageFilters,
} from "../services/dispatch-page-params";
import type { DispatchPage } from "../types/dispatch.types";
import { DispatchFilter } from "./dispatch-filter";
import { DispatchPagination } from "./dispatch-pagination";
import { DispatchTable } from "./dispatch-table";
import { DispatchTableSkeleton } from "./dispatch-table-skeleton";

export function DispatchDirectory({
  page,
  filters,
}: {
  page: DispatchPage;
  filters: DispatchPageFilters;
}) {
  const query = useDirectoryQuery(filters, createDispatchHref);
  const loading =
    query.pending || query.search.trim() !== (filters.search ?? "");
  useDispatchDirectoryRefresh(loading);
  const hasFilters =
    Boolean(filters.receivingStatus || filters.branchId) ||
    Boolean(filters.search) ||
    filters.status !== "all" ||
    filters.discrepancyStatus !== "all";

  return (
    <>
      <Card className="min-w-0 gap-0 overflow-hidden py-0 shadow-none">
        <div className="border-b px-4 pt-2 sm:px-5">
          <DispatchViews
            filters={filters}
            onChange={(receivingStatus) =>
              query.apply({
                receivingStatus,
                status: "all",
                discrepancyStatus: "all",
              })
            }
          />
        </div>
        <div className="p-4 sm:p-5">
          <DispatchFilter filters={filters} query={query} />
        </div>
        <CardContent
          className="p-0"
          aria-busy={loading}
          aria-label="Dispatch results"
        >
          {loading ? (
            <DispatchTableSkeleton rows={page.items.length || 10} />
          ) : page.items.length === 0 ? (
            <OperationalEmptyState
              title={
                hasFilters
                  ? "No dispatches match these filters."
                  : "No dispatches have been created yet."
              }
              description={
                hasFilters
                  ? "Change or clear the filters to see more dispatches."
                  : "Create a dispatch to get started."
              }
            />
          ) : (
            <DispatchTable page={page} />
          )}
        </CardContent>
        <CardFooter className="border-t px-4 py-3 sm:px-5">
          <DispatchPagination
            filters={{ ...filters, page: page.page }}
            pageCount={Math.max(1, Math.ceil(page.total / page.page_size))}
            total={page.total}
            pageSize={page.page_size}
            itemCount={page.items.length}
            loading={loading}
            onPageChange={(nextPage) =>
              query.apply({ page: nextPage }, { resetPage: false })
            }
            onPageSizeChange={(pageSize) => query.apply({ pageSize })}
          />
        </CardFooter>
      </Card>
      <span role="status" className="sr-only">
        {loading ? "Loading dispatches…" : `${page.total} dispatches found.`}
      </span>
    </>
  );
}
