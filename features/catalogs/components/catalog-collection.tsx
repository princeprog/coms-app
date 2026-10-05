import type { ComponentProps } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { CatalogTable } from "./catalog-table";
import { CatalogPagination } from "./catalog-pagination";
import { CatalogDirectoryPagination } from "./catalog-directory-pagination";
import type { CatalogPage } from "../types/catalog.types";

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
  pending,
  canCreate,
  onCreate,
  ...tableProps
}: Props) {
  const { title } = tableProps;
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
                  href={routePath}
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
      aria-labelledby="catalog-directory-heading"
      aria-busy={pending}
      className="min-w-0 gap-0 overflow-hidden py-0"
    >
      <CardHeader className="border-b px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle>
              <h3 id="catalog-directory-heading">
                {resourceName === "supplier"
                  ? "Supplier directory"
                  : "Stock item directory"}
              </h3>
            </CardTitle>
            <CardDescription>
              {resourceName === "supplier"
                ? "Supplier contacts for receiving, listed A–Z."
                : "Stock item categories and units, listed A–Z."}
            </CardDescription>
          </div>
          {pending && (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Spinner aria-hidden="true" />
              Updating {title.toLowerCase()}...
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">{content}</CardContent>
      <CardFooter className="border-t px-4 py-3 sm:px-5">
        <CatalogDirectoryPagination
          page={page}
          filters={{ page: page.page, search, active: activeFilter }}
          routePath={routePath}
          title={title}
          resourceName={resourceName}
        />
      </CardFooter>
    </Card>
  );
}
