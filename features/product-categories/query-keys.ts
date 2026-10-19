export const categoryQueryKeys = {
  all: ["product-categories"] as const,
  available: (search: string, page: number) =>
    ["product-categories", "available", search, page] as const,
};
