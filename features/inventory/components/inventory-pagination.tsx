import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { createInventoryHref } from "@/features/inventory/services/inventory-page-params";

export function InventoryPagination({
  scope,
  branchId,
  search,
  page,
  pageCount,
  total,
  pageSize,
}: {
  scope: "COMMISSARY" | "BRANCH";
  branchId?: string;
  search: string;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}) {
  const start = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const visiblePages = [page - 1, page, page + 1].filter(
    (value) => value > 0 && value <= pageCount,
  );
  const href = (targetPage: number) =>
    createInventoryHref({ scope, branchId, page: targetPage, search });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} stock {total === 1 ? "item" : "items"}
      </p>
      <Pagination aria-label="Inventory pages" className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            {page > 1 ? (
              <Link
                href={href(page - 1)}
                aria-label="Previous page"
                className={buttonVariants({
                  variant: "outline",
                  size: "icon-sm",
                  className: "rounded-md border-border!",
                })}
              >
                <ChevronLeft aria-hidden="true" />
              </Link>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
            )}
          </PaginationItem>
          {visiblePages.map((value) => (
            <PaginationItem key={value}>
              {value === page ? (
                <Button
                  type="button"
                  size="icon-sm"
                  aria-label={`Page ${value}`}
                  aria-current="page"
                >
                  {value}
                </Button>
              ) : (
                <Link
                  href={href(value)}
                  aria-label={`Page ${value}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon-sm",
                    className: "rounded-md border-border!",
                  })}
                >
                  {value}
                </Link>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            {page < pageCount ? (
              <Link
                href={href(page + 1)}
                aria-label="Next page"
                className={buttonVariants({
                  variant: "outline",
                  size: "icon-sm",
                  className: "rounded-md border-border!",
                })}
              >
                <ChevronRight aria-hidden="true" />
              </Link>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
