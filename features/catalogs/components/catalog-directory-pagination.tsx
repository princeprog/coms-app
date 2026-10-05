import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  createCatalogHref,
  type CatalogDirectoryFilters,
} from "../services/catalog-page-params";
import type { CatalogPage } from "../types/catalog.types";

export function CatalogDirectoryPagination({
  page,
  filters,
  routePath,
  title,
  resourceName,
}: {
  page: CatalogPage;
  filters: CatalogDirectoryFilters;
  routePath: string;
  title: string;
  resourceName: string;
}) {
  const count = Math.max(1, Math.ceil(page.total / page.page_size));
  const start = page.items.length ? (page.page - 1) * page.page_size + 1 : 0;
  const end = page.items.length
    ? Math.min(start + page.items.length - 1, page.total)
    : 0;
  const numbers = [page.page - 1, page.page, page.page + 1].filter(
    (value) => value > 0 && value <= count,
  );
  function arrow(
    value: number,
    label: string,
    enabled: boolean,
    previous: boolean,
  ) {
    const icon = previous ? (
      <ChevronLeft aria-hidden="true" />
    ) : (
      <ChevronRight aria-hidden="true" />
    );
    return enabled ? (
      <Link
        aria-label={label}
        href={createCatalogHref(routePath, { ...filters, page: value })}
        className={buttonVariants({ variant: "outline", size: "icon-sm" })}
      >
        {icon}
      </Link>
    ) : (
      <Button variant="outline" size="icon-sm" aria-label={label} disabled>
        {icon}
      </Button>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {start}–{end} of {page.total}{" "}
        {page.total === 1 ? resourceName : `${resourceName}s`}
      </p>
      <Pagination
        aria-label={`${title} pages`}
        className="mx-0 w-auto max-w-full"
      >
        <PaginationContent className="flex-wrap">
          <PaginationItem>
            {arrow(page.page - 1, "Previous page", page.page > 1, true)}
          </PaginationItem>
          {numbers.map((value) => (
            <PaginationItem key={value}>
              {value === page.page ? (
                <Button
                  size="icon-sm"
                  aria-label={`Page ${value}`}
                  aria-current="page"
                >
                  {value}
                </Button>
              ) : (
                <Link
                  aria-label={`Page ${value}`}
                  href={createCatalogHref(routePath, {
                    ...filters,
                    page: value,
                  })}
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
            {arrow(page.page + 1, "Next page", page.page < count, false)}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
