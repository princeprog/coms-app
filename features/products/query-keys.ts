export const productBranchQueryKey = (search: string, page: number) =>
  ["product-branch-options", search, page] as const;
export const productRecipeStockQueryKey = (search: string, page: number) =>
  ["product-recipe-stock", search, page] as const;
