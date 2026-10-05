import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { createSupplierReceiptHref } from "@/features/supplier-receipts/services/supplier-receipt-page-params";
import type { SupplierReceiptPageFilters } from "../services/supplier-receipt-page-params";

export function SupplierReceiptPagination({
  page,
  pageCount,
  search,
  total,
  pageSize,
  itemCount,
  filters,
}: {
  page: number;
  pageCount: number;
  search: string;
  total: number;
  pageSize: number;
  itemCount: number;
  filters?: SupplierReceiptPageFilters;
}) {
  const start = itemCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const end = itemCount > 0 ? Math.min(start + itemCount - 1, total) : 0;
  const visiblePages = [page - 1, page, page + 1].filter(
    (value) => value > 0 && value <= pageCount,
  );
  const href = (value: number) =>
    createSupplierReceiptHref({ ...filters, page: value, search });
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {start}–{end} of {total}{" "}
        {total === 1 ? "delivery" : "deliveries"}
      </p>
      <Pagination
        aria-label="Supplier delivery pages"
        className="mx-0 w-auto max-w-full"
      >
        <PaginationContent className="flex-wrap">
          <PaginationItem>
            {page > 1 ? (
              <Link
                href={href(page - 1)}
                aria-label="Previous page"
                className={buttonVariants({
                  variant: "outline",
                  size: "icon-sm",
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
