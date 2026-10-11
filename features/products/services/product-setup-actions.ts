"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import {
  menuAccess,
  menuError,
  menuRequest,
} from "@/features/menus/services/menu-server";
import { productSetupEndpoint } from "../constants";
import {
  productSetupInputSchema,
  productSetupSchema,
} from "../schemas/product-setup.schema";
export async function saveProductSetupAction(
  id: string | undefined,
  input: unknown,
  key: string,
) {
  const parsed = productSetupInputSchema.safeParse(input);
  if (
    !parsed.success ||
    !z.uuid().safeParse(key).success ||
    (id && !z.uuid().safeParse(id).success)
  )
    return {
      ok: false as const,
      error: parsed.error?.issues[0]?.message ?? "Check the product details.",
    };
  try {
    const user = await menuAccess(id ? "products.read" : "products.create");
    if (!isProtectedSuperAdmin(user))
      throw Error("Only Super Admin can manage products and branch menus.");
    const data = await menuRequest(
      productSetupEndpoint(id),
      productSetupSchema,
      id ? "PUT" : "POST",
      parsed.data,
      key,
    );
    for (const path of ["/products", "/branch-products", "/pos"])
      revalidatePath(path);
    revalidatePath(`/products/${data.product.id}`);
    revalidatePath(`/products/${data.product.id}/setup`);
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: menuError(error) };
  }
}
