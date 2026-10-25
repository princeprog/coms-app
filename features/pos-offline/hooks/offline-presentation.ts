import type { BranchProduct } from "@/features/branch-products/types/branch-product.types";
import type {
  OfflineLocalState,
  OfflineSnapshot,
} from "../services/offline-types";

export function snapshotProducts(state: OfflineLocalState): BranchProduct[] {
  return state.snapshot.products.map((product) => ({
    branch_id: state.session.branch_id,
    product_id: product.id,
    product_name: product.name,
    category_id: product.category_id,
    category_name: product.category_name,
    price: product.price,
    price_revision: product.price_revision,
    description: null,
    product_is_active: true,
    category_is_active: true,
    is_available: true,
    available_service_types: snapshotServices(product),
    created_at: state.session.issued_at,
    updated_at: state.session.issued_at,
  }));
}
export function snapshotServices(
  value: Pick<
    OfflineSnapshot["branch"],
    "supports_dine_in" | "supports_takeaway"
  >,
) {
  const services: ("DINE_IN" | "TAKEAWAY")[] = [];
  if (value.supports_dine_in) services.push("DINE_IN");
  if (value.supports_takeaway) services.push("TAKEAWAY");
  return services;
}
export function downloadRecovery(data: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
