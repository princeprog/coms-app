import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import type { SetupBranch } from "./schemas/product-setup.schema";

export function getBranchAvailability(
  branch: SetupBranch,
  services: ServiceType[],
) {
  const supported = branch.serviceTypes ?? ["DINE_IN", "TAKEAWAY"];
  const reason =
    branch.status === "inactive"
      ? "Inactive branch"
      : !services.some((service) => supported.includes(service))
        ? "No supported service selected"
        : "";
  return { supported, reason };
}
