"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import {
  productRecipeEndpoint,
  recipesRoute,
} from "@/features/recipes/constants";
import {
  recipeResponseSchema,
  recipeInputSchema,
} from "@/features/recipes/schemas/recipe.schema";
import type { RecipeMutationResult } from "@/features/recipes/types/recipe.types";
import { ApiRequestError } from "@/services/api-services";
import { requestComsApi } from "@/services/server-api-services";

function getActionError(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return "You do not have permission to manage recipes.";
    if (error.status === 404)
      return "The product or a stock item is no longer available.";
    if (error.status === 409)
      return "The recipe changed or cannot be edited in its current state. Refresh and try again.";
    if (error.status === 400)
      return "Check the ingredient quantities and selections.";
    return error.message;
  }
  return "COMS could not save this recipe. Try again.";
}

export async function saveRecipeAction(
  productId: string,
  mode: unknown,
  input: unknown,
): Promise<RecipeMutationResult> {
  if (mode !== "create" && mode !== "update")
    return { ok: false, error: "Select a valid recipe operation." };
  if (!z.uuid().safeParse(productId).success)
    return { ok: false, error: "Select a valid product." };
  const parsedInput = recipeInputSchema.safeParse(input);
  if (!parsedInput.success)
    return {
      ok: false,
      error: "Check the ingredient quantities and selections.",
    };

  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated")
    return { ok: false, error: "Your session expired. Sign in again." };
  if (session.status === "recovering")
    return {
      ok: false,
      error: "Your session is being restored. Try again shortly.",
    };
  if (session.status === "unavailable")
    return {
      ok: false,
      error: "COMS authentication is unavailable. Try again shortly.",
    };
  const permission = mode === "create" ? "recipes.create" : "recipes.update";
  if (!hasPermission(session.user, permission))
    return {
      ok: false,
      error: "You do not have permission to manage recipes.",
    };
  if (!hasPermission(session.user, "stock_items.read"))
    return {
      ok: false,
      error: "Stock item access is required to edit recipes.",
    };

  try {
    const payload = await requestComsApi<unknown>(
      productRecipeEndpoint(productId),
      {
        cookieHeader: (await cookies()).toString(),
        method: mode === "create" ? "POST" : "PUT",
        body: parsedInput.data,
      },
    );
    if (!recipeResponseSchema.safeParse(payload).success)
      throw new ApiRequestError("Invalid recipe mutation response.", 502);
    revalidatePath(recipesRoute);
    revalidatePath(`${recipesRoute}/${productId}`);
    revalidatePath("/products");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: getActionError(error) };
  }
}
