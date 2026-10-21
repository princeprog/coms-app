import type { ServiceType } from "@/features/menus/schemas/menu.schema";
import {
  recipeLineInputSchema,
  type RecipeLineInput,
  type RecipeStock,
  type RecipeUsageScope,
} from "../schemas/product-recipe.schema";

export type RecipeRow = {
  key: string;
  stock: RecipeStock | null;
  quantity: string;
  scope: RecipeUsageScope;
};
export type RecipeRowErrors = Record<
  string,
  { stock?: string; quantity?: string }
>;

export const recipeScopeLabels: Record<RecipeUsageScope, string> = {
  ALL: "Every sale",
  DINE_IN: "Dine-in only",
  TAKEAWAY: "Takeout only",
};

// With a single service, "every sale" and "that service" mean the same thing.
export function effectiveScope(
  scope: RecipeUsageScope,
  services: ServiceType[],
): RecipeUsageScope {
  return services.length === 1 ? "ALL" : scope;
}

// Mirrors the API: a stock item is used either by every sale or once per
// service. Untouched blank rows are ignored.
export function buildRecipePayload(
  rows: RecipeRow[],
  services: ServiceType[],
): { lines: RecipeLineInput[]; errors: RecipeRowErrors } {
  const errors: RecipeRowErrors = {};
  const lines: RecipeLineInput[] = [];
  const scopesByStock = new Map<string, Set<RecipeUsageScope>>();
  for (const row of rows) {
    if (!row.stock && !row.quantity.trim()) continue;
    const scope = effectiveScope(row.scope, services);
    if (!row.stock) {
      errors[row.key] = { stock: "Choose a stock item." };
      continue;
    }
    const parsed = recipeLineInputSchema.safeParse({
      stock_item_id: row.stock.id,
      quantity: row.quantity,
      usage_scope: scope,
    });
    if (!parsed.success) {
      errors[row.key] = { quantity: parsed.error.issues[0]?.message };
      continue;
    }
    const used = scopesByStock.get(row.stock.id) ?? new Set();
    if (used.has(scope) || used.has("ALL") || (scope === "ALL" && used.size)) {
      errors[row.key] = {
        stock:
          scope === "ALL" || used.has("ALL")
            ? "Already in the recipe. Use one line for every sale or one per service."
            : "Already in the recipe for this service.",
      };
      continue;
    }
    used.add(scope);
    scopesByStock.set(row.stock.id, used);
    lines.push(parsed.data);
  }
  return { lines, errors };
}
