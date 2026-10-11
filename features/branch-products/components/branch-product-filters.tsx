import { MapPin } from "lucide-react";
import { MenuListControls } from "@/features/menus/components/menu-list-controls";
import type { BranchProductBranchOption } from "../types/branch-product.types";
import type { BranchProductPageFilters } from "../services/branch-product-page-params";
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
      search={filters.search}
      searchLabel="Search products"
      searchPlaceholder="Search by product name…"
      comfortable
      context={{
        key: "branch_id",
        label: "Branch",
        value: branch?.id ?? "",
        options: branchOptions.map((option) => ({
          value: option.id,
          label: option.name,
        })),
        description,
        icon: <MapPin aria-hidden="true" className="size-4 shrink-0" />,
      }}
      filters={[
        {
          key: "is_available",
          label: "Availability",
          value:
            filters.isAvailable === undefined
              ? ""
              : String(filters.isAvailable),
          options: [
            { value: "", label: "All availability" },
            { value: "true", label: "Available" },
            { value: "false", label: "Unavailable" },
          ],
        },
        {
          key: "service_type",
          label: "Service",
          value: filters.serviceType ?? "",
          options: [
            { value: "", label: "All services" },
            { value: "DINE_IN", label: "Dine-in" },
            { value: "TAKEAWAY", label: "Takeout" },
          ],
        },
        {
          key: "sort",
          label: "Sort by",
          value: filters.sort ?? "product_name:asc",
          options: [
            { value: "product_name:asc", label: "Name A–Z" },
            { value: "product_name:desc", label: "Name Z–A" },
            { value: "price:asc", label: "Lowest price" },
            { value: "price:desc", label: "Highest price" },
            { value: "created_at:desc", label: "Newest added" },
            { value: "created_at:asc", label: "Oldest added" },
          ],
        },
      ]}
    />
  );
}
