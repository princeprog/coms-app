import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { createStockRequestHref } from "@/features/stock-requests/services/stock-request-page-params";
import type { StockRequestPageFilters } from "@/features/stock-requests/services/stock-request-page-params";

export function StockRequestPagination({
  filters,
  pageCount,
}: {
  filters: StockRequestPageFilters;
  pageCount: number;
}) {
  return (
    <nav
      aria-label="Stock request pages"
      className="flex items-center justify-between gap-4"
    >
      {filters.page > 1 ? (
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={createStockRequestHref({
            ...filters,
            page: filters.page - 1,
          })}
        >
          Previous page
        </Link>
      ) : (
        <Button type="button" variant="outline" disabled>
          Previous page
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        Page {filters.page} of {pageCount}
      </span>
      {filters.page < pageCount ? (
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={createStockRequestHref({
            ...filters,
            page: filters.page + 1,
          })}
        >
          Next page
        </Link>
      ) : (
        <Button type="button" variant="outline" disabled>
          Next page
        </Button>
      )}
    </nav>
  );
}
