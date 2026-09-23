import { z } from "zod";
import { catalogPageSchema } from "@/features/catalogs/schemas/catalog.schema";

const nullableDescription = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim() || null;
}, z.string().max(1000).nullable().optional());

export const productSchema = z.object({
  id: z.uuid(),
  product_name: z.string().min(2).max(160),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const productPageSchema = catalogPageSchema(productSchema);

export const createProductSchema = z
  .object({
    product_name: z.string().trim().min(2).max(160),
    description: nullableDescription,
  })
  .strict();

export const updateProductSchema = z
  .object({
    product_name: z.string().trim().min(2).max(160).optional(),
    description: nullableDescription,
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "Provide at least one product field to update.",
  });
