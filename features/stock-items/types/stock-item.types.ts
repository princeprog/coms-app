import type { z } from "zod";
import type {
  createStockItemSchema,
  stockItemPageSchema,
  stockItemSchema,
} from "@/features/stock-items/schemas/stock-item.schema";

export type StockItem = z.infer<typeof stockItemSchema>;
export type StockItemPage = z.infer<typeof stockItemPageSchema>;
export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;
