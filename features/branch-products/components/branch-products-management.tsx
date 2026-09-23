import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BranchProductCreateForm,
  type BranchProductCreateAction,
} from "@/features/branch-products/components/branch-product-create-form";
import { BranchProductFilters } from "@/features/branch-products/components/branch-product-filters";
import { BranchProductList } from "@/features/branch-products/components/branch-product-list";
import type {
  BranchProductBranchOption,
  BranchProductOperationAction,
  BranchProductPage,
  BranchProductProductOption,
} from "@/features/branch-products/types/branch-product.types";
import type { BranchProductPageFilters } from "@/features/branch-products/services/branch-product-page-params";

export function BranchProductsManagement({
  branchOptions,
  selectedBranch,
  filters,
  page,
  productOptions,
  productOptionsUnavailable,
  canCreate,
  canUpdatePrice,
  canUpdateAvailability,
  errorMessage,
  createAction,
  priceAction,
  availabilityAction,
}: {
  branchOptions: BranchProductBranchOption[];
  selectedBranch?: BranchProductBranchOption;
  filters: BranchProductPageFilters;
  page: BranchProductPage | null;
  productOptions: BranchProductProductOption[];
  productOptionsUnavailable: boolean;
  canCreate: boolean;
  canUpdatePrice: boolean;
  canUpdateAvailability: boolean;
  errorMessage?: string;
  createAction: BranchProductCreateAction;
  priceAction: BranchProductOperationAction;
  availabilityAction: BranchProductOperationAction;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Branch product management summary">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Configure branch-specific prices and availability for active products.
          Sales and inventory movements are recorded in their own workflows.
        </p>
      </section>

      {branchOptions.length > 0 && (
        <BranchProductFilters
          branchOptions={branchOptions}
          selectedBranchId={selectedBranch?.id}
          filters={filters}
        />
      )}

      {selectedBranch?.status === "inactive" && (
        <p role="status" className="text-sm text-muted-foreground">
          This branch is inactive. Existing offers remain readable, while
          configuration changes are disabled.
        </p>
      )}

      {errorMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Branch products unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p role="alert" className="text-sm text-muted-foreground">
              {errorMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {!errorMessage && canCreate && productOptionsUnavailable && (
        <Card>
          <CardHeader>
            <CardTitle>Product choices unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p role="alert" className="text-sm text-muted-foreground">
              Active product choices could not be loaded. Confirm products.read
              access, then refresh this page.
            </p>
          </CardContent>
        </Card>
      )}

      {!errorMessage &&
        canCreate &&
        !productOptionsUnavailable &&
        selectedBranch && (
          <BranchProductCreateForm
            branchId={selectedBranch.id}
            branchName={selectedBranch.name}
            products={productOptions}
            action={createAction}
          />
        )}

      {!errorMessage && page && selectedBranch && (
        <BranchProductList
          page={page}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
          search={filters.search}
          isAvailable={filters.isAvailable}
          canUpdatePrice={canUpdatePrice}
          canUpdateAvailability={canUpdateAvailability}
          priceAction={priceAction}
          availabilityAction={availabilityAction}
        />
      )}
    </div>
  );
}
