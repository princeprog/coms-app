import { z } from "zod";
import { catalogPageSchema } from "@/features/catalogs/schemas/catalog.schema";

export const stockItemSchema = z.object({
  id: z.uuid(),
  stock_item_name: z.string().min(2).max(160),
  category: z.string().min(1).max(80),
  unit: z.string().min(1).max(40),
  is_active: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const stockItemPageSchema = catalogPageSchema(stockItemSchema);

export const createStockItemSchema = z
  .object({
    stock_item_name: z.string().trim().min(2).max(160),
    category: z.string().trim().min(1).max(80),
    unit: z.string().trim().min(1).max(40),
  })
  .strict();

export const updateStockItemSchema = z
  .object({
    stock_item_name: z.string().trim().min(2).max(160).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    unit: z.string().trim().min(1).max(40).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one stock item field to update.",
  });
