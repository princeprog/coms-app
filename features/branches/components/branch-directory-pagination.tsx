import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import type { BranchPage } from "../types/branch.types";

export function BranchDirectoryPagination({
  branches,
  href,
}: {
  branches: BranchPage;
  href: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(branches.total / branches.page_size));
  const start = branches.items.length
    ? (branches.page - 1) * branches.page_size + 1
    : 0;
  const end = start
    ? Math.min(start + branches.items.length - 1, branches.total)
    : 0;
  const first = Math.max(1, Math.min(branches.page - 1, pages - 2));
  const numbers = Array.from(
    { length: Math.min(3, pages) },
    (_, index) => first + index,
  );
  function arrow(previous: boolean) {
    const target = branches.page + (previous ? -1 : 1);
    const label = previous ? "Previous page" : "Next page";
    const icon = previous ? (
      <ChevronLeft aria-hidden="true" />
    ) : (
      <ChevronRight aria-hidden="true" />
    );
    return target >= 1 && target <= pages ? (
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
        disabled
        aria-label={label}
      >
        {icon}
      </Button>
    );
  }
  return (
    <footer className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Showing {start}–{end} of {branches.total}{" "}
        {branches.total === 1 ? "branch" : "branches"}
      </p>
      {pages > 1 && (
        <Pagination
          aria-label="Branch pages"
          className="mx-0 w-auto max-w-full"
        >
          <PaginationContent className="flex-wrap">
            <PaginationItem>{arrow(true)}</PaginationItem>
            {numbers.map((number) => (
              <PaginationItem key={number}>
                {number === branches.page ? (
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
    </footer>
  );
}
