import "server-only";
import { productSetupEndpoint } from "../constants";
import { productSetupSchema } from "../schemas/product-setup.schema";
import { menuRequest } from "@/features/menus/services/menu-server";
import { getBranchPageData } from "@/features/branches/services/branch-queries";
import type { SetupBranch } from "../schemas/product-setup.schema";
export function getProductSetup(id: string) {
  return menuRequest(productSetupEndpoint(id), productSetupSchema);
}
export async function getProductBranchPage(page = 1, search = "") {
  const result = await getBranchPageData(page, search);
  return {
    ...result,
    items: result.items.map((branch): SetupBranch => ({
      id: branch.id,
      name: branch.branch_name,
      status: branch.status,
      serviceTypes: [
        ...(branch.has_dine_in ? ["DINE_IN" as const] : []),
        ...(branch.has_takeaway !== false ? ["TAKEAWAY" as const] : []),
      ],
    })),
  };
}
