"use server";
import { z } from "zod";
import { isProtectedSuperAdmin } from "@/features/auth/permissions";
import { menuAccess } from "@/features/menus/services/menu-server";
import { getProductBranchPage } from "./product-setup-queries";

const querySchema = z
  .object({
    page: z.number().int().min(1).max(1_000_000),
    search: z.string().trim().max(100),
  })
  .strict();

export async function searchProductBranchesAction(input: unknown) {
  const query = querySchema.safeParse(input);
  if (!query.success)
    return {
      ok: false as const,
      error: "Check the branch search and try again.",
    };
  try {
    const user = await menuAccess("branches.read");
    if (!isProtectedSuperAdmin(user))
      return {
        ok: false as const,
        error: "Only Super Admin can select product availability.",
      };
    const data = await getProductBranchPage(query.data.page, query.data.search);
    return { ok: true as const, data };
  } catch {
    return {
      ok: false as const,
      error:
        "Unable to load branches. Your selections are preserved; try again.",
    };
  }
}
