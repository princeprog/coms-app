import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  createStaffPageHref,
  type StaffStatusFilter,
} from "../services/staff-page-params";
import type { StaffPage } from "../types/staff.types";

export function StaffPagination({
  staff,
  branchId,
  search,
  status,
}: {
  staff: StaffPage;
  branchId?: string;
  search: string;
  status: StaffStatusFilter;
}) {
  const { page, total, page_size: pageSize } = staff;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = staff.items.length ? (page - 1) * pageSize + 1 : 0;
  const end = staff.items.length
    ? Math.min(start + staff.items.length - 1, total)
    : 0;
  const visiblePages = [page - 1, page, page + 1].filter(
    (value) => value > 0 && value <= pageCount,
  );
  const href = (targetPage: number) =>
    createStaffPageHref(targetPage, branchId, search, status);
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} staff{" "}
        {total === 1 ? "member" : "members"}
      </p>
      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3 sm:gap-4">
        <Pagination aria-label="Staff pages" className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              {page > 1 ? (
                <Link
                  href={href(page - 1)}
                  aria-label="Previous page"
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon-sm",
                    className: "border-border!",
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
                      className: "border-border!",
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
                    className: "border-border!",
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
    </div>
  );
}
