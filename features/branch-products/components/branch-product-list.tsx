import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products offered at {branchName}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {page.total} {page.total === 1 ? "offer" : "offers"} · Page{" "}
          {page.page} of {pageCount}
        </p>
      </CardHeader>
      <CardContent>
        {page.items.length > 0 ? (
          <div className="overflow-x-auto">
            <Table aria-label={`Products offered at ${branchName}`}>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Availability</TableHead>
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
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="font-medium">
              {search
                ? `No offers at ${branchName} match this search.`
                : isAvailable !== undefined
                  ? `No offers at ${branchName} match the selected availability filter.`
                  : `No products are offered at ${branchName} yet.`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an active product offer to configure its price and
              availability.
            </p>
            <Link
              className={`${buttonVariants({ variant: "outline" })} mt-4`}
              href="/products"
            >
              Open products
            </Link>
          </div>
        )}
        {pageCount > 1 && (
          <nav
            aria-label={`${branchName} product offer pages`}
            className="mt-4 flex items-center justify-between gap-4"
          >
            {page.page > 1 ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={pageHref(page.page - 1)}
              >
                Previous page
              </Link>
            ) : (
              <Button type="button" variant="outline" disabled>
                Previous page
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page.page} of {pageCount}
            </span>
            {page.page < pageCount ? (
              <Link
                className={buttonVariants({ variant: "outline" })}
                href={pageHref(page.page + 1)}
              >
                Next page
              </Link>
            ) : (
              <Button type="button" variant="outline" disabled>
                Next page
              </Button>
            )}
          </nav>
        )}
      </CardContent>
    </Card>
  );
}
