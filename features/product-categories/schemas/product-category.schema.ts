import { z } from "zod";
import { catalogPageSchema } from "@/features/catalogs/schemas/catalog.schema";

export const productCategorySchema = z.object({
  id: z.uuid(),
  name: z.string().min(2).max(80),
  is_active: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});
export const productCategoryPageSchema = catalogPageSchema(
  productCategorySchema,
);
export const categoryNameSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters.")
      .max(80, "Use 80 characters or fewer."),
  })
  .strict();
export const categoryQuerySchema = z
  .object({
    page: z.number().int().min(1).max(1_000_000),
    page_size: z.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(80).default(""),
    is_active: z.boolean().optional(),
  })
  .strict();
export type ProductCategory = z.infer<typeof productCategorySchema>;
export type ProductCategoryPage = z.infer<typeof productCategoryPageSchema>;
export type CategoryChoice = Pick<ProductCategory, "id" | "name" | "is_active">;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
