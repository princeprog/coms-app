import { z } from "zod";

const nonnegativeDecimalString = z
  .string()
  .max(80)
  .regex(/^\d+(?:\.\d+)?$/);

export const branchProductSchema = z.object({
  branch_id: z.uuid(),
  branch_name: z.string().min(2).max(160).optional(),
  product_id: z.uuid(),
  product_name: z.string().min(2).max(160),
  description: z.string().nullable(),
  product_is_active: z.boolean(),
  price: nonnegativeDecimalString,
  is_available: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
});

export const branchProductPageSchema = z.object({
  items: z.array(branchProductSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export const branchProductCreateSchema = z
  .object({
    product_id: z.uuid(),
    price: nonnegativeDecimalString,
  })
  .strict();

export const branchProductPriceSchema = z
  .object({ price: nonnegativeDecimalString })
  .strict();

export const branchProductAvailabilitySchema = z
  .object({ is_available: z.boolean() })
  .strict();
