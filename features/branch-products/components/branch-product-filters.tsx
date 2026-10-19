import { MapPin } from "lucide-react";
import { MenuListControls } from "@/features/menus/components/menu-list-controls";
import type { BranchProductBranchOption } from "../types/branch-product.types";
import type { BranchProductPageFilters } from "../services/branch-product-page-params";
import {
  branchMenuAvailabilityOptions,
  branchMenuServiceOptions,
  branchMenuSortOptions,
} from "./branch-product-filter-options";
export function BranchProductFilters({
  branchOptions,
  selectedBranchId,
  filters,
}: {
  branchOptions: BranchProductBranchOption[];
  selectedBranchId?: string;
  filters: BranchProductPageFilters;
}) {
  const branch =
    branchOptions.find((option) => option.id === selectedBranchId) ??
    branchOptions[0];
  const services = branch?.serviceTypes;
  const description = services
    ? services.length === 2
      ? "Supports Dine-in and Takeout"
      : services.includes("DINE_IN")
        ? "Supports Dine-in only"
        : services.includes("TAKEAWAY")
          ? "Supports Takeout only"
          : "No services enabled for this branch"
    : undefined;

  return (
    <MenuListControls
      route="/branch-products"
      preserveKeys={["page_size"]}
      search={filters.search}
      searchLabel="Search products"
      searchPlaceholder="Search by product name…"
      comfortable
      alignItemWithTrigger={false}
      context={{
        key: "branch_id",
        label: "Branch",
        value: branch?.id ?? "",
        options: branchOptions.map((option) => ({
          value: option.id,
          label: option.name,
        })),
        description,
        icon: (
          <MapPin
            aria-hidden="true"
            className="size-4 shrink-0 text-primary! [&_*]:text-inherit!"
          />
        ),
      }}
      filters={[
        {
          key: "is_available",
          label: "Availability",
          value:
            filters.isAvailable === undefined
              ? ""
              : String(filters.isAvailable),
          options: branchMenuAvailabilityOptions,
        },
        {
          key: "service_type",
          label: "Service",
          value: filters.serviceType ?? "",
          options: branchMenuServiceOptions,
        },
        {
          key: "sort",
          label: "Sort by",
          value: filters.sort ?? "product_name:asc",
          options: branchMenuSortOptions,
        },
      ]}
    />
  );
}
