import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { OperationalEmptyState } from "@/components/shared/operational-page-ui";
import { BranchMenuPagination } from "./branch-menu-pagination";
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
  serviceType,
  sort,
  canManage,
  availabilityAction,
}: {
  page: BranchProductPage;
  branchId: string;
  branchName: string;
  search: string;
  isAvailable?: boolean;
  serviceType?: "DINE_IN" | "TAKEAWAY";
  sort?: string;
  canManage: boolean;
  availabilityAction: BranchProductOperationAction;
}) {
  const pageHref = (requestedPage: number) =>
    createBranchProductsHref({
      branchId,
      page: requestedPage,
      search,
      isAvailable,
      serviceType,
      sort,
    });
  const hasFilters =
    Boolean(search || serviceType) || isAvailable !== undefined;

  return (
    <section aria-labelledby="branch-products-heading" className="min-w-0">
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 border-b px-5 py-4">
          <h3 id="branch-products-heading" className="text-lg font-semibold">
            Menu items
          </h3>
          <p className="text-sm text-muted-foreground">
            Selling prices are the same across all branches.
          </p>
        </div>
        {page.items.length > 0 ? (
          <Table
            className="[&_th]:h-12 [&_th]:px-5 [&_td]:px-5 [&_td]:py-2"
            aria-label={`Branch menu for ${branchName}`}
            containerProps={{
              role: "region",
              "aria-label": "Branch menu items",
              tabIndex: 0,
              className:
                "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            }}
          >
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Selling price</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Availability</TableHead>
                {canManage && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((offer) => (
                <BranchProductRow
                  key={offer.product_id}
                  offer={offer}
                  canManage={canManage}
                  availabilityAction={availabilityAction}
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-4 sm:p-6">
            <OperationalEmptyState
              title={
                hasFilters
                  ? `No menu items at ${branchName} match these filters.`
                  : `No products are on the menu at ${branchName} yet.`
              }
              description={
                hasFilters
                  ? "Clear the search and menu filters to see all menu items."
                  : "Super Admin can select this branch when creating or editing a product."
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
      </div>
      <BranchMenuPagination
        page={page}
        branchName={branchName}
        href={pageHref}
      />
    </section>
  );
}
