export const productBranchQueryKey = (search: string, page: number) =>
  ["product-branch-options", search, page] as const;
