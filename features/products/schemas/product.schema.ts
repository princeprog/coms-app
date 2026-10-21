import { z } from "zod";
import {
  serviceTypesSchema,
  menuDecimal,
} from "@/features/menus/schemas/menu.schema";
import { catalogPageSchema } from "@/features/catalogs/schemas/catalog.schema";
const description = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() || null : value),
  z.string().max(1000).nullable().optional(),
);
const branchIds = z
  .array(z.uuid())
  .max(1000)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Select each branch only once.",
  );
export const productSchema = z.object({
  id: z.uuid(),
  product_name: z.string().min(2).max(160),
  category_id: z.uuid(),
  category_name: z.string().min(2).max(80),
  category_is_active: z.boolean(),
  description: z.string().nullable(),
  price: menuDecimal,
  price_revision: z.number().int().positive(),
  setup_revision: z.number().int().positive(),
  service_types: serviceTypesSchema,
  is_active: z.boolean(),
  recipe_line_count: z.number().int().nonnegative().default(0),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});
export const productPageSchema = catalogPageSchema(productSchema);
export const createProductSchema = z
  .object({
    product_name: z.string().trim().min(2, "Enter a product name.").max(160),
    category_id: z.uuid("Select an active category."),
    price: menuDecimal,
    description,
    service_types: serviceTypesSchema,
    branch_ids: branchIds.default([]),
  })
  .strict();
export const updateProductSchema = z
  .object({
    product_name: z.string().trim().min(2).max(160).optional(),
    category_id: z.uuid("Select an active category.").optional(),
    price: menuDecimal.optional(),
    description,
    service_types: serviceTypesSchema.optional(),
    branch_ids: branchIds.optional(),
    expected_product_revision: z.number().int().positive(),
  })
  .strict()
  .refine(
    (input) =>
      Object.keys(input).some((key) => key !== "expected_product_revision"),
    "Provide a product change.",
  );
