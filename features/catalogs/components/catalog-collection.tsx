import { cn } from "@/lib/utils";
import { CatalogCollectionHeader } from "./catalog-collection-header";
import type { ComponentProps } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { CatalogTable } from "./catalog-table";
import { CatalogPagination } from "./catalog-pagination";
import { CatalogDirectoryPagination } from "./catalog-directory-pagination";
import type { CatalogPage } from "../types/catalog.types";
import { createCatalogHref } from "../services/catalog-page-params";

type Props = Omit<
  ComponentProps<typeof CatalogTable>,
  "pageItems" | "responsive"
> & {
  page: CatalogPage;
  routePath: string;
  resourceName: string;
  search: string;
  activeFilter: "all" | "true" | "false";
  directoryLayout: boolean;
  directoryTitle?: string;
  directoryDescription?: string;
  pending: boolean;
  canCreate: boolean;
  onCreate: () => void;
};

export function CatalogCollection({
  page,
  routePath,
  resourceName,
  search,
  activeFilter,
  directoryLayout,
  directoryTitle,
  directoryDescription,
  pending,
  canCreate,
  onCreate,
  ...tableProps
}: Props) {
  const { title } = tableProps;
  const isStockItems = routePath === "/stock-items";
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const filtered = Boolean(search) || activeFilter !== "all";
  const content =
    page.items.length > 0 ? (
      <CatalogTable
        {...tableProps}
        pageItems={page.items}
        responsive={directoryLayout}
      />
    ) : (
      <div className={directoryLayout ? "px-4 py-8 sm:px-5" : undefined}>
        <OperationalEmptyState
          title={
            filtered
              ? `No ${title.toLowerCase()} found`
              : `No ${title.toLowerCase()} yet`
          }
          description={
            filtered
              ? "Try changing or clearing the current filters."
              : canCreate
                ? `Add the first ${resourceName} to get started.`
                : `Ask an administrator to add a ${resourceName}.`
          }
          actions={
            directoryLayout ? (
              filtered ? (
                <Link
                  href={createCatalogHref(routePath, {
                    page: 1,
                    search: "",
                    active: "all",
                    ...(["/products", "/stock-items"].includes(routePath)
                      ? { pageSize: page.page_size }
                      : {}),
                  })}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Clear filters
                </Link>
              ) : canCreate ? (
                <Button onClick={onCreate}>Add {resourceName}</Button>
              ) : undefined
            ) : undefined
          }
        />
      </div>
    );
  if (!directoryLayout)
    return (
      <section
        aria-labelledby="catalog-directory-heading"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="catalog-directory-heading" className="text-lg font-semibold">
            Directory
          </h2>
          {page.total > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {page.items.length} of {page.total} · Page {page.page} of{" "}
              {pageCount}
            </p>
          )}
        </div>
        {page.items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            {content}
          </div>
        ) : (
          content
        )}
        <CatalogPagination
          title={title}
          routePath={routePath}
          page={page.page}
          pageCount={pageCount}
          search={search}
          activeFilter={activeFilter}
        />
      </section>
    );
  return (
    <Card
      aria-label={isStockItems ? title : undefined}
      aria-labelledby={isStockItems ? undefined : "catalog-directory-heading"}
      aria-busy={pending}
      className={cn(
        "min-w-0 gap-0 overflow-hidden py-0",
        isStockItems && "[&_[data-slot=table-header]]:bg-muted",
      )}
    >
      {!isStockItems && (
        <CatalogCollectionHeader
          title={title}
          resourceName={resourceName}
          directoryTitle={directoryTitle}
          directoryDescription={directoryDescription}
          pending={pending}
        />
      )}
      <CardContent
        className={cn("p-0", isStockItems && pending && "opacity-60")}
      >
        {content}
      </CardContent>
      <CardFooter
        className={cn(
          "border-t px-4 py-3 sm:px-5",
          isStockItems && "flex-col items-stretch gap-2",
        )}
      >
        {isStockItems && pending && (
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner aria-hidden="true" />
            Updating stock items...
          </p>
        )}
        <CatalogDirectoryPagination
          page={page}
          filters={{
            page: page.page,
            ...(["/products", "/stock-items"].includes(routePath)
              ? { pageSize: page.page_size }
              : {}),
            search,
            active: activeFilter,
          }}
          routePath={routePath}
          title={title}
          resourceName={resourceName}
        />
      </CardFooter>
    </Card>
  );
}
