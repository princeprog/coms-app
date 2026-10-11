"use server";
import { branchProductsEndpoint } from "@/features/branch-products/constants";
import { branchProductSchema } from "@/features/branch-products/schemas/branch-product.schema";
import {
  menuAccess,
  menuError,
  menuRequest,
} from "@/features/menus/services/menu-server";
import { z } from "zod";
export async function refreshCartPricesAction(
  branch: string,
  products: string[],
) {
  try {
    await menuAccess("sales.create", branch);
    await menuAccess("branch_products.read", branch);
    const ids = z.array(z.uuid()).min(1).max(40).parse(products);
    const items = await Promise.all(
      ids.map((id) =>
        menuRequest(
          `${branchProductsEndpoint(branch)}/${id}`,
          branchProductSchema,
        ),
      ),
    );
    return { ok: true as const, items };
  } catch (error) {
    return { ok: false as const, error: menuError(error) };
  }
}
