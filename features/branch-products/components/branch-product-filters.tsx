import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { branchProductsRoute } from "@/features/branch-products/constants";
import type { BranchProductBranchOption } from "@/features/branch-products/types/branch-product.types";
import type { BranchProductPageFilters } from "@/features/branch-products/services/branch-product-page-params";

export function BranchProductFilters({
  branchOptions,
  selectedBranchId,
  filters,
}: {
  branchOptions: BranchProductBranchOption[];
  selectedBranchId?: string;
  filters: BranchProductPageFilters;
}) {
  return (
    <form
      action={branchProductsRoute}
      method="get"
      aria-label="Filter branch products"
      className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,0.8fr)_minmax(12rem,1fr)_minmax(12rem,0.7fr)_auto] xl:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor="branch-product-branch">Branch</Label>
        <NativeSelect
          id="branch-product-branch"
          name="branch_id"
          defaultValue={selectedBranchId ?? ""}
        >
          {selectedBranchId === undefined && (
            <NativeSelectOption value="">Choose a branch</NativeSelectOption>
          )}
          {branchOptions.map((branch) => (
            <NativeSelectOption key={branch.id} value={branch.id}>
              {branch.name}
              {branch.status === "inactive" ? " (inactive)" : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="branch-product-search">Search products</Label>
        <Input
          id="branch-product-search"
          name="search"
          maxLength={100}
          defaultValue={filters.search}
          placeholder="Product name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="branch-product-availability">Availability</Label>
        <NativeSelect
          id="branch-product-availability"
          name="is_available"
          defaultValue={
            filters.isAvailable === undefined ? "" : String(filters.isAvailable)
          }
        >
          <NativeSelectOption value="">All offers</NativeSelectOption>
          <NativeSelectOption value="true">Available</NativeSelectOption>
          <NativeSelectOption value="false">Not available</NativeSelectOption>
        </NativeSelect>
      </div>
      <Button type="submit" variant="outline">
        Apply filters
      </Button>
    </form>
  );
}
