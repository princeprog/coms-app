export const costKeys = {
  all: ["costs"] as const,
  profit: (from?: string, to?: string) =>
    ["costs", "profit", from, to] as const,
  productProfit: (input: object) => ["costs", "product-profit", input] as const,
  products: (input: object) => ["costs", "products", input] as const,
  stock: (input: object) => ["costs", "stock", input] as const,
};
