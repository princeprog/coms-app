"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { branchProductsEndpoint } from "@/features/branch-products/constants";
import {
  branchProductSchema,
  branchProductServicesSchema,
} from "@/features/branch-products/schemas/branch-product.schema";
import { menuAccess, menuError, menuRequest } from "./menu-server";
export async function updateMenuServicesAction(
  branch: string,
  product: string,
  input: unknown,
) {
  try {
    const user = await menuAccess("branch_products.read", branch);
    if (!isProtectedSuperAdmin(user))
      throw Error("Only Super Admin can manage branch menus.");
    z.uuid().parse(product);
    await menuRequest(
      `${branchProductsEndpoint(branch)}/${product}/services`,
      branchProductSchema,
      "PATCH",
      branchProductServicesSchema.parse(input),
    );
    revalidatePath("/products");
    revalidatePath("/branch-products");
    revalidatePath("/pos");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: menuError(error) };
  }
}
