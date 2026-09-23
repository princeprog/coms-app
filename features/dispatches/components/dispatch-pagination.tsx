import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
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
    <nav
      aria-label="Dispatch pages"
      className="flex items-center justify-between gap-4"
    >
      {filters.page > 1 ? (
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={createDispatchHref({ ...filters, page: filters.page - 1 })}
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
          href={createDispatchHref({ ...filters, page: filters.page + 1 })}
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
