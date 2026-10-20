import type { PurchaseQuery } from "./schemas/purchase.schema";
export const purchaseKeys = {
  all: ["direct-purchases"] as const,
  list: (query: PurchaseQuery) => ["direct-purchases", "list", query] as const,
  detail: (id: string | null) => ["direct-purchases", "detail", id] as const,
  stock: (search: string, page: number) =>
    ["direct-purchases", "stock", search, page] as const,
};
