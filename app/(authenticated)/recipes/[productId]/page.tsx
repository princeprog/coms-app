import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { buttonVariants } from "@/components/ui/button";
import { OperationalLoadError } from "@/components/shared/operational-load-error";
import { OperationalStatusBadge } from "@/components/shared/operational-page-ui";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { AuthServiceError } from "@/features/auth/components/auth-service-error";
import { SessionRecovery } from "@/features/auth/components/session-recovery";
import { hasPermission } from "@/features/auth/permissions";
import { getCurrentUserFromServer } from "@/features/auth/services/auth-server";
import { RecipeEditor } from "@/features/recipes/components/recipe-editor";
import { recipesRoute } from "@/features/recipes/constants";
import type { RecipeResponse } from "@/features/recipes/types/recipe.types";
import { saveRecipeAction } from "@/features/recipes/services/recipe-actions";
import {
  getActiveRecipeStockItems,
  getRecipe,
} from "@/features/recipes/services/recipe-queries";
import type { RecipeStockItem } from "@/features/recipes/types/recipe.types";
import { ApiRequestError } from "@/services/api-services";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await getCurrentUserFromServer();
  if (session.status === "unauthenticated") redirect("/");
  if (session.status === "recovering") return <SessionRecovery />;
  if (session.status === "unavailable")
    return <AuthServiceError context="dashboard" />;
  if (!hasPermission(session.user, "recipes.read")) notFound();

  const { productId } = await params;
  if (!z.uuid().safeParse(productId).success) notFound();

  let recipe: RecipeResponse;
  try {
    recipe = await getRecipe(productId);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) redirect("/");
    if (error instanceof ApiRequestError && [403, 404].includes(error.status))
      notFound();
    return (
      <AppPageShell user={session.user}>
        <div data-coms-ui="operational" className="p-4 sm:p-6">
          <OperationalLoadError
            title="product recipe"
            description="COMS could not load this product recipe. Refresh the page to try again."
          />
        </div>
      </AppPageShell>
    );
  }

  const canReadStockItems = hasPermission(session.user, "stock_items.read");
  let stockItems: RecipeStockItem[] = [];
  let stockOptionsUnavailable = false;
  let stockItemsLoaded = false;
  if (canReadStockItems) {
    try {
      stockItems = await getActiveRecipeStockItems();
      stockItemsLoaded = true;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401)
        redirect("/");
      stockOptionsUnavailable = true;
    }
  }

  return (
    <AppPageShell user={session.user}>
      <div
        data-coms-ui="operational"
        className="flex flex-col gap-6 p-4 sm:p-6"
      >
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href={recipesRoute}
        >
          Back to recipes
        </Link>
        <section
          aria-label="Product details"
          className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card px-4 py-4 sm:px-6"
        >
          <div className="min-w-0">
            <p className="text-base font-semibold">
              {recipe.product.product_name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {recipe.product.description || "No product description"}
            </p>
          </div>
          <OperationalStatusBadge
            variant={recipe.product.is_active ? "secondary" : "outline"}
          >
            {recipe.product.is_active ? "Active product" : "Inactive product"}
          </OperationalStatusBadge>
        </section>
        {stockOptionsUnavailable && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
          >
            Active stock items could not be loaded. Recipe edits are unavailable
            until the catalog can be refreshed.
          </p>
        )}
        <RecipeEditor
          recipe={recipe}
          stockItems={stockItems}
          canReadStockItems={canReadStockItems}
          stockItemsLoaded={stockItemsLoaded}
          canCreate={hasPermission(session.user, "recipes.create")}
          canUpdate={hasPermission(session.user, "recipes.update")}
          action={saveRecipeAction}
        />
      </div>
    </AppPageShell>
  );
}
