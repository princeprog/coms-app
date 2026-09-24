import { OperationalPageIntro } from "@/components/shared/operational-page-ui";
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
  const canOfferProduct =
    canCreate &&
    !productOptionsUnavailable &&
    productOptions.length > 0 &&
    Boolean(selectedBranch);

  return (
    <div data-coms-ui="operational" className="flex flex-col gap-6 p-4 sm:p-6">
      <OperationalPageIntro
        description="Configure branch-specific prices and availability for active products. Sales and inventory movements are recorded in their own workflows."
        actions={
          canOfferProduct && selectedBranch ? (
            <BranchProductCreateForm
              branchId={selectedBranch.id}
              branchName={selectedBranch.name}
              products={productOptions}
              action={createAction}
            />
          ) : undefined
        }
      />

      {branchOptions.length > 0 && (
        <BranchProductFilters
          key={`${selectedBranch?.id ?? "none"}:${filters.search}:${filters.isAvailable ?? "all"}`}
          branchOptions={branchOptions}
          selectedBranchId={selectedBranch?.id}
          filters={filters}
        />
      )}

      {selectedBranch?.status === "inactive" && (
        <p
          role="status"
          className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
        >
          This branch is inactive. Existing offers remain readable, while
          configuration changes are disabled.
        </p>
      )}

      {errorMessage && (
        <section
          aria-labelledby="branch-products-error-heading"
          className="rounded-lg border bg-card p-5"
        >
          <h2
            id="branch-products-error-heading"
            className="text-base font-semibold"
          >
            Branch products unavailable
          </h2>
          <p role="alert" className="mt-2 text-sm text-muted-foreground">
            {errorMessage}
          </p>
        </section>
      )}

      {!errorMessage && canCreate && productOptionsUnavailable && (
        <section
          aria-labelledby="branch-product-options-error-heading"
          className="rounded-lg border bg-card p-5"
        >
          <h2
            id="branch-product-options-error-heading"
            className="text-base font-semibold"
          >
            Product choices unavailable
          </h2>
          <p role="alert" className="mt-2 text-sm text-muted-foreground">
            Active product choices could not be loaded. Confirm products.read
            access, then refresh this page.
          </p>
        </section>
      )}

      {!errorMessage &&
        canCreate &&
        !productOptionsUnavailable &&
        productOptions.length === 0 &&
        selectedBranch && (
          <p role="status" className="text-sm text-muted-foreground">
            No active products are available to offer at this branch. Create an
            active product before configuring an offer.
          </p>
        )}

      {!errorMessage && selectedBranch && page && (
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
