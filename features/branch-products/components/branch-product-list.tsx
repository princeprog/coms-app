import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  OperationalEmptyState,
  OperationalPagination,
} from "@/components/shared/operational-page-ui";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BranchProductRow } from "@/features/branch-products/components/branch-product-row";
import { createBranchProductsHref } from "@/features/branch-products/services/branch-product-page-params";
import type {
  BranchProductOperationAction,
  BranchProductPage,
} from "@/features/branch-products/types/branch-product.types";

export function BranchProductList({
  page,
  branchId,
  branchName,
  search,
  isAvailable,
  canUpdatePrice,
  canUpdateAvailability,
  priceAction,
  availabilityAction,
}: {
  page: BranchProductPage;
  branchId: string;
  branchName: string;
  search: string;
  isAvailable?: boolean;
  canUpdatePrice: boolean;
  canUpdateAvailability: boolean;
  priceAction: BranchProductOperationAction;
  availabilityAction: BranchProductOperationAction;
}) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.page_size));
  const pageHref = (requestedPage: number) =>
    createBranchProductsHref({
      branchId,
      page: requestedPage,
      search,
      isAvailable,
    });
  const hasFilters = Boolean(search) || isAvailable !== undefined;

  return (
    <section
      aria-labelledby="branch-products-heading"
      className="overflow-hidden rounded-lg border bg-card"
    >
      <header className="border-b bg-muted/30 px-4 py-4 sm:px-6">
        <h2 id="branch-products-heading" className="text-lg font-semibold">
          Products offered at {branchName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {page.total} {page.total === 1 ? "offer" : "offers"} · Page{" "}
          {page.page} of {pageCount}
        </p>
      </header>
      {page.items.length > 0 ? (
        <Table
          aria-label={`Products offered at ${branchName}`}
          containerProps={{
            role: "region",
            "aria-label": "Branch product offers",
            tabIndex: 0,
          }}
        >
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Product status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.items.map((offer) => (
              <BranchProductRow
                key={offer.product_id}
                offer={offer}
                canUpdatePrice={canUpdatePrice}
                canUpdateAvailability={canUpdateAvailability}
                priceAction={priceAction}
                availabilityAction={availabilityAction}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="p-4 sm:p-6">
          <OperationalEmptyState
            title={
              search
                ? `No offers at ${branchName} match this search.`
                : isAvailable !== undefined
                  ? `No offers at ${branchName} match the selected availability filter.`
                  : `No products are offered at ${branchName} yet.`
            }
            description={
              hasFilters
                ? "Clear the search and availability filters to see all offers."
                : "Offers will appear here after an active product is configured for this branch."
            }
            actions={
              hasFilters ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={createBranchProductsHref({
                    branchId,
                    page: 1,
                    search: "",
                  })}
                >
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        </div>
      )}
      <div className="border-t px-4 py-3 sm:px-6">
        <OperationalPagination
          ariaLabel={`${branchName} product offer pages`}
          page={page.page}
          pageCount={pageCount}
          previousHref={page.page > 1 ? pageHref(page.page - 1) : undefined}
          nextHref={page.page < pageCount ? pageHref(page.page + 1) : undefined}
          resultSummary={`Page ${page.page} of ${pageCount}`}
        />
      </div>
    </section>
  );
}
