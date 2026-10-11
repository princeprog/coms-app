import Link from "next/link";
import { Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import { BranchMenuHeader } from "./branch-menu-header";
import { BranchProductFilters } from "./branch-product-filters";
import { BranchProductList } from "./branch-product-list";
import type {
  BranchProductBranchOption,
  BranchProductOperationAction,
  BranchProductPage,
} from "../types/branch-product.types";
import type { BranchProductPageFilters } from "../services/branch-product-page-params";
export function BranchProductsManagement({
  branchOptions,
  selectedBranch,
  filters,
  page,
  canManage = false,
  errorMessage,
  availabilityAction,
}: {
  branchOptions: BranchProductBranchOption[];
  selectedBranch?: BranchProductBranchOption;
  filters: BranchProductPageFilters;
  page: BranchProductPage | null;
  canManage?: boolean;
  errorMessage?: string;
  availabilityAction: BranchProductOperationAction;
}) {
  return (
    <div data-coms-ui="operational" className="flex min-w-0 flex-col gap-5">
      <BranchMenuHeader
        canManage={canManage}
        actions={
          canManage ? (
            <Link
              href="/products"
              className={buttonVariants({ className: "h-10 gap-2 px-4" })}
            >
              <Package
                aria-hidden="true"
                className="size-5"
                data-icon="inline-start"
              />
              Manage products
            </Link>
          ) : undefined
        }
      />
      {branchOptions.length > 0 && (
        <BranchProductFilters
          branchOptions={branchOptions}
          selectedBranchId={selectedBranch?.id ?? filters.requestedBranchId}
          filters={filters}
        />
      )}
      {selectedBranch?.status === "inactive" && (
        <p role="status" className="text-sm text-muted-foreground">
          This branch is inactive. Its menu remains readable.
        </p>
      )}
      {errorMessage && (
        <OperationalLoadError title="branch menu" description={errorMessage} />
      )}
      {!errorMessage && selectedBranch && page && (
        <BranchProductList
          page={page}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
          search={filters.search}
          isAvailable={filters.isAvailable}
          serviceType={filters.serviceType}
          sort={filters.sort}
          canManage={canManage}
          availabilityAction={availabilityAction}
        />
      )}
    </div>
  );
}
