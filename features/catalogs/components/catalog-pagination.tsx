import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

function pageHref(
  routePath: string,
  page: number,
  search: string,
  activeFilter: string,
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (search) params.set("search", search);
  if (activeFilter !== "all") params.set("is_active", activeFilter);
  return `${routePath}?${params.toString()}`;
}

export function CatalogPagination({
  title,
  routePath,
  page,
  pageCount,
  search,
  activeFilter,
}: {
  title: string;
  routePath: string;
  page: number;
  pageCount: number;
  search: string;
  activeFilter: "all" | "true" | "false";
}) {
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label={`${title} pages`}
      className="flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={pageHref(routePath, page - 1, search, activeFilter)}
        >
          Previous page
        </Link>
      ) : (
        <Button type="button" variant="outline" disabled>
          Previous page
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={pageHref(routePath, page + 1, search, activeFilter)}
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
