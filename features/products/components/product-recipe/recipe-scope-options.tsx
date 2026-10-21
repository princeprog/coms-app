import type { ReactNode } from "react";
import { Layers, ShoppingBag, Utensils } from "lucide-react";
import type { RecipeUsageScope } from "../../schemas/product-recipe.schema";
import { recipeScopeLabels } from "../../services/product-recipe-rules";

const icons = {
  ALL: <Layers className="text-sky-600 dark:text-sky-400" />,
  DINE_IN: <Utensils className="text-amber-600 dark:text-amber-400" />,
  TAKEAWAY: <ShoppingBag className="text-violet-600 dark:text-violet-400" />,
} satisfies Record<RecipeUsageScope, ReactNode>;

export function RecipeScopeLabel({ scope }: { scope: RecipeUsageScope }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="flex shrink-0 [&>svg]:size-4">
        {icons[scope]}
      </span>
      <span className="truncate">{recipeScopeLabels[scope]}</span>
    </span>
  );
}
