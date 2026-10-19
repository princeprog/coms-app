import { TablePageSize } from "@/components/shared/table-page-size";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import type { BranchProductPage } from "../types/branch-product.types";

export function BranchMenuPagination({
  page,
  branchName,
  href,
}: {
  page: BranchProductPage;
  branchName: string;
  href: (page: number) => string;
}) {
  const count = Math.max(1, Math.ceil(page.total / page.page_size));
  const start = page.items.length ? (page.page - 1) * page.page_size + 1 : 0;
  const end = page.items.length
    ? Math.min(start + page.items.length - 1, page.total)
    : 0;
  const first = Math.max(1, Math.min(page.page - 1, count - 2));
  const numbers = Array.from(
    { length: Math.min(3, count) },
    (_, index) => first + index,
  );

  function arrow(previous: boolean) {
    const target = page.page + (previous ? -1 : 1);
    const label = previous ? "Previous page" : "Next page";
    const icon = previous ? (
      <ChevronLeft aria-hidden="true" />
    ) : (
      <ChevronRight aria-hidden="true" />
    );
    return target >= 1 && target <= count ? (
      <Link
        href={href(target)}
        aria-label={label}
        className={buttonVariants({
          variant: "outline",
          size: "icon",
          className: "size-11 sm:size-10",
        })}
      >
        {icon}
      </Link>
    ) : (
      <Button
        variant="outline"
        size="icon"
        className="size-11 sm:size-10"
        aria-label={label}
        disabled
      >
        {icon}
      </Button>
    );
  }

  return (
    <footer className="flex min-w-0 flex-wrap items-center justify-between gap-3 pt-4">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Showing {start}–{end} of {page.total}{" "}
        {page.total === 1 ? "product" : "products"}
      </p>
      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3 sm:gap-4">
        <TablePageSize pageSize={page.page_size} href={href(1)} />
        {count > 1 && (
          <Pagination
            aria-label={`${branchName} menu pages`}
            className="mx-0 w-auto max-w-full"
          >
            <PaginationContent className="flex-wrap">
              <PaginationItem>{arrow(true)}</PaginationItem>
              {numbers.map((number) => (
                <PaginationItem key={number}>
                  {number === page.page ? (
                    <Button
                      size="icon"
                      className="size-11 sm:size-10"
                      aria-current="page"
                      aria-label={`Page ${number}`}
                    >
                      {number}
                    </Button>
                  ) : (
                    <Link
                      href={href(number)}
                      aria-label={`Page ${number}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "icon",
                        className: "size-11 sm:size-10",
                      })}
                    >
                      {number}
                    </Link>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>{arrow(false)}</PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </footer>
  );
}
