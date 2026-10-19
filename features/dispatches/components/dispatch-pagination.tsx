"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { DirectorySelect } from "@/components/shared/directory-select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  createDispatchHref,
  dispatchPageSizes,
} from "@/features/dispatches/services/dispatch-page-params";
import type { DispatchPageFilters } from "@/features/dispatches/services/dispatch-page-params";

export function DispatchPagination({
  filters,
  pageCount,
  total,
  pageSize,
  itemCount,
  loading,
  onPageChange,
  onPageSizeChange,
}: {
  filters: DispatchPageFilters;
  pageCount: number;
  total: number;
  pageSize: number;
  itemCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const start = itemCount ? (filters.page - 1) * pageSize + 1 : 0;
  const end = itemCount ? Math.min(start + itemCount - 1, total) : 0;
  function navigate(event: MouseEvent<HTMLAnchorElement>, nextPage: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (!loading) onPageChange(nextPage);
  }
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <p
        className="text-sm text-muted-foreground"
        aria-live="polite"
        aria-busy={loading}
      >
        Showing {start}–{end} of {total}{" "}
        {total === 1 ? "dispatch" : "dispatches"}
      </p>
      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span id="dispatch-page-size-label">Rows per page</span>
          <DirectorySelect
            id="dispatch-page-size"
            label="Rows per page"
            hideLabel
            className="w-20 sm:w-20 [&_[data-slot=select-trigger]]:h-10"
            value={String(pageSize)}
            options={dispatchPageSizes.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            onChange={(value) => onPageSizeChange(Number(value))}
          />
        </div>
        <Pagination aria-label="Dispatch pages" className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              {filters.page > 1 ? (
                <Link
                  href={createDispatchHref({
                    ...filters,
                    page: filters.page - 1,
                  })}
                  aria-label="Previous page"
                  aria-disabled={loading}
                  onClick={(event) => navigate(event, filters.page - 1)}
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon-sm",
                  })}
                >
                  <ChevronLeftIcon />
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Previous page"
                  disabled
                >
                  <ChevronLeftIcon />
                </Button>
              )}
            </PaginationItem>
            <PaginationItem>
              <Link
                href={createDispatchHref({ ...filters, page: filters.page })}
                aria-label={`Page ${filters.page}`}
                aria-current="page"
                onClick={(event) => navigate(event, filters.page)}
                className={buttonVariants({
                  variant: "outline",
                  size: "icon-sm",
                })}
              >
                {filters.page}
              </Link>
            </PaginationItem>
            <PaginationItem className="px-1 text-sm text-muted-foreground">
              of {pageCount}
            </PaginationItem>
            <PaginationItem>
              {filters.page < pageCount ? (
                <Link
                  href={createDispatchHref({
                    ...filters,
                    page: filters.page + 1,
                  })}
                  aria-label="Next page"
                  aria-disabled={loading}
                  onClick={(event) => navigate(event, filters.page + 1)}
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon-sm",
                  })}
                >
                  <ChevronRightIcon />
                </Link>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Next page"
                  disabled
                >
                  <ChevronRightIcon />
                </Button>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
