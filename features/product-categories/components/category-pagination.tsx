import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { TablePageSize } from "@/components/shared/table-page-size";
import {
  createCatalogHref,
  type CatalogDirectoryFilters,
} from "@/features/catalogs/services/catalog-page-params";
import type { ProductCategoryPage } from "../schemas/product-category.schema";

export function CategoryPagination({
  page,
  filters,
}: {
  page: ProductCategoryPage;
  filters: CatalogDirectoryFilters;
}) {
  const count = Math.max(1, Math.ceil(page.total / page.page_size));
  const start = page.items.length ? (page.page - 1) * page.page_size + 1 : 0;
  const end = page.items.length ? start + page.items.length - 1 : 0;
  const href = (number: number) =>
    createCatalogHref("/products/categories", { ...filters, page: number });
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {start}–{end} of {page.total}{" "}
        {page.total === 1 ? "category" : "categories"}
      </p>
      <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3">
        <TablePageSize pageSize={page.page_size} href={href(1)} />
        <nav
          aria-label="Categories pages"
          className="flex flex-wrap items-center gap-1"
        >
          {page.page > 1 ? (
            <Link
              aria-label="Previous page"
              href={href(page.page - 1)}
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
            >
              <ChevronLeft aria-hidden="true" />
            </Link>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
          )}
          {[page.page - 1, page.page, page.page + 1]
            .filter((number) => number > 0 && number <= count)
            .map((number) =>
              number === page.page ? (
                <Button
                  key={number}
                  size="icon-sm"
                  aria-label={`Page ${number}`}
                  aria-current="page"
                >
                  {number}
                </Button>
              ) : (
                <Link
                  key={number}
                  href={href(number)}
                  aria-label={`Page ${number}`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "icon-sm",
                  })}
                >
                  {number}
                </Link>
              ),
            )}
          {page.page < count ? (
            <Link
              aria-label="Next page"
              href={href(page.page + 1)}
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
            >
              <ChevronRight aria-hidden="true" />
            </Link>
          ) : (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          )}
        </nav>
      </div>
    </div>
  );
}
