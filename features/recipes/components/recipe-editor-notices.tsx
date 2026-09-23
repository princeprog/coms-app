export function RecipeEditorNotices({
  canReadStockItems,
  stockItemsLoaded,
  activeStockItemCount,
  productIsActive,
  hasRecipe,
  canCreate,
  canUpdate,
}: {
  canReadStockItems: boolean;
  stockItemsLoaded: boolean;
  activeStockItemCount: number;
  productIsActive: boolean;
  hasRecipe: boolean;
  canCreate: boolean;
  canUpdate: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {canReadStockItems && stockItemsLoaded && activeStockItemCount === 0 && (
        <p className="text-sm text-muted-foreground">
          An active stock item is required before a recipe can be created. Add
          an active stock item to the catalog first.
        </p>
      )}
      {!canReadStockItems && (canCreate || canUpdate) && (
        <p className="text-sm text-muted-foreground">
          Stock item read access is required to edit a recipe.
        </p>
      )}
      {!productIsActive && (
        <p role="status" className="text-sm text-muted-foreground">
          This product is inactive. Its recipe is read-only.
        </p>
      )}
      {hasRecipe && !canUpdate && (
        <p className="text-sm text-muted-foreground">
          You can view this recipe but cannot edit it.
        </p>
      )}
      {!hasRecipe && !canCreate && (
        <p className="text-sm text-muted-foreground">
          You can view this product but cannot create its recipe.
        </p>
      )}
    </div>
  );
}
